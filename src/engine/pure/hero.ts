// 御剑守城纯函数（v0.97→v0.98 夜袭纯英雄模式）
// 全部确定性：移动由 targetX（鼠标输入）驱动、塔符自动追踪入体、攻击按冷却逐拍结算；
// 数值与对应塔同语义（见 HERO_ABILITY_SPECS），无随机无时钟。

import type { HeroState, HeroTowerAbility, HeroTowerSchool, TowerSigil } from '../../types';

/** 真人横向移动速度（格/秒） */
export const HERO_SPEED = 6;
/** 塔符拾取半径（格）：塔符自动飞到真人 ≤0.6 即入体 */
export const HERO_PICK_RADIUS = 0.6;
/** 塔符自动飞向真人速度（格/秒） */
export const HERO_SIGIL_FLY_SPEED = 9;
/** 本命飞剑自带（不可卸下、不占能力上限），拾取 sword 符并入升级 */
export const INHERENT_SWORD: HeroTowerSchool = 'sword';
/** 除本命剑外可叠加的塔能力上限 */
export const HERO_ABILITY_CAP = 4;
/** 重复拾取同系的伤害成长（×1.4/级） */
export const ABILITY_LEVEL_MUL = 1.4;

/** 每系塔能力的行为规格（取自对应塔炼气档语义，伤害以敌 maxHp 比例计） */
export interface HeroAbilitySpec {
  dmgPct: number;      // 每击伤害 = maxHp × dmgPct
  rate: number;        // 攻击冷却（秒，= 攻速倒数语义）
  range: number;       // 攻击射程（格）
  kind: 'single' | 'aoe' | 'chain' | 'pierce' | 'arc';
  aoeRadius?: number;  // aoe：溅射半径
  chainCount?: number; // chain：链电目标数（含主目标）
  chainRange?: number; // chain：跳转距离
  slow?: { mul: number; duration: number };  // ice：减速
}

export const HERO_ABILITY_SPECS: Record<HeroTowerSchool, HeroAbilitySpec> = {
  // 本命飞剑：千里剑气——射程横贯全图，命中范围内全体敌（墙线面防守的主战力）
  sword:    { dmgPct: 0.35, rate: 1.0, range: 99, kind: 'arc' },
  talisman: { dmgPct: 0.18, rate: 1.5, range: 3.0, kind: 'single' },
  spear:    { dmgPct: 0.15, rate: 1.0, range: 2.5, kind: 'pierce' },
  fire:     { dmgPct: 0.28, rate: 0.8, range: 2.5, kind: 'aoe', aoeRadius: 1.2 },
  thunder:  { dmgPct: 0.30, rate: 0.7, range: 2.8, kind: 'chain', chainCount: 3, chainRange: 2.0 },
  ice:      { dmgPct: 0.12, rate: 1.2, range: 2.8, kind: 'single', slow: { mul: 0.5, duration: 2 } },
};

/** 塔系展示元数据（表现层/引擎共用） */
export const HERO_SCHOOL_META: Record<HeroTowerSchool, { name: string; icon: string; color: string }> = {
  sword: { name: '飞剑', icon: '🗡️', color: '#7fb3ff' },
  talisman: { name: '符箓', icon: '📜', color: '#b388ff' },
  spear: { name: '长枪', icon: '🔱', color: '#ffd54f' },
  fire: { name: '火法', icon: '🔥', color: '#ff7043' },
  thunder: { name: '雷法', icon: '⚡', color: '#7986cb' },
  ice: { name: '寒冰', icon: '❄️', color: '#4fc3f7' },
};

/** 创建真人：站位城墙战线（wallRow-0.5 行，中列），自带本命飞剑（Lv0） */
export function createHero(cols: number, wallRow: number): HeroState {
  const x = Math.floor(cols / 2) + 0.5;
  return {
    x,
    y: Math.max(0.5, wallRow - 0.5),
    facing: 1,
    targetX: x,
    abilities: [{ school: INHERENT_SWORD, level: 0, cd: 0 }],
    swingAt: -1,
  };
}

/**
 * 推进一帧移动：向 targetX 匀速逼近（不冲过头），x 钳制 [0.5, cols-0.5]。
 * 注意：targetX 将被 clamp 到 [0.5, cols-0.5]，与真人实际 x 语义一致。
 */
export function moveHeroX(hero: HeroState, dt: number, cols: number): void {
  const target = Math.min(cols - 0.5, Math.max(0.5, hero.targetX));
  const dx = target - hero.x;
  if (dx !== 0) {
    const step = Math.sign(dx) * Math.min(Math.abs(dx), HERO_SPEED * dt);
    hero.x += step;
    hero.facing = step > 0 ? 1 : -1;
  }
  hero.x = Math.min(cols - 0.5, Math.max(0.5, hero.x));
}

/** 真人与敌人的距离（格） */
export function heroDistTo(hero: HeroState, ex: number, ey: number): number {
  return Math.hypot(ex - hero.x, ey - hero.y);
}

/** 塔符自动追踪：把已激活（elapsed ≥ spawnAt）的塔符均速推向真人；未激活/已到达不动 */
export function homeSigils(hero: HeroState, sigils: TowerSigil[], now: number, dt: number): void {
  for (const s of sigils) {
    if (now < s.spawnAt) continue;                    // 还在从天而降
    const dx = hero.x - s.x, dy = hero.y - s.y;
    const d = Math.hypot(dx, dy);
    if (d <= HERO_PICK_RADIUS) continue;              // 已到真人处，等结算
    const step = Math.min(d, HERO_SIGIL_FLY_SPEED * dt);
    const k = step / d;
    s.x += dx * k;
    s.y += dy * k;
  }
}

/**
 * 塔符入体结算：到达真人（≤PICK_RADIUS）即自动授予；
 * 能力槽满 → 回弹空中（y 抬升 3 格、spawnAt 延后）稍后再飞；过期移除。
 * 返回本拍授予的学校列表（表现层据此提示）。
 */
export function tryGrantSigils(
  hero: HeroState,
  sigils: TowerSigil[],
  now: number,
  rebuffDelay = 2,
  rebuffLift = 3,
): HeroTowerSchool[] {
  const granted: HeroTowerSchool[] = [];
  for (let i = sigils.length - 1; i >= 0; i--) {
    const s = sigils[i];
    if (now >= s.spawnAt + s.lifeSec) {               // 过期消失
      sigils.splice(i, 1);
      continue;
    }
    if (now < s.spawnAt) continue;                    // 未激活
    if (Math.hypot(hero.x - s.x, hero.y - s.y) > HERO_PICK_RADIUS) continue;   // 还没飞到
    if (grantAbility(hero, s.school)) {
      granted.push(s.school);
      sigils.splice(i, 1);
    } else {
      // 能力槽满：符号从真人位置回弹到空中，2s 后再飞（可反复）
      s.y = hero.y - rebuffLift;
      s.spawnAt = now + rebuffDelay;
    }
  }
  return granted;
}

/**
 * 授予一项塔能力（拾取塔符时调用）：
 * - 本命飞剑（sword）：并入既有项升级（不占能力槽）
 * - 其余：已拥有 → 升级；未拥有且未超上限 → 新增；上限满 → 拒绝（返回 false，调用方放回塔符）
 */
export function grantAbility(hero: HeroState, school: HeroTowerSchool): boolean {
  const existing = hero.abilities.find((a) => a.school === school);
  if (existing) {
    existing.level++;
    return true;
  }
  if (hero.abilities.length >= HERO_ABILITY_CAP + 1) return false;  // 含本命剑
  hero.abilities.push({ school, level: 0, cd: 0 });
  return true;
}

/** 推进所有能力冷却 */
export function tickCooldowns(hero: HeroState, dt: number): void {
  for (const a of hero.abilities) {
    if (a.cd > 0) a.cd = Math.max(0, a.cd - dt);
  }
}

/** 主目标选择：集火目标（focusUid）存活且在射程内 优先；否则取射程内最近者。 */
export interface HeroAttackResult {
  targets: Array<{ idx: number; dmg: number }>;
}

/** 按行为规格求伤害（已含升级倍率）：dmgOf(maxHp) */
export function dmgOfSchool(school: HeroTowerSchool, level: number, maxHp: number): number {
  const spec = HERO_ABILITY_SPECS[school];
  return Math.max(1, Math.round(maxHp * spec.dmgPct * Math.pow(ABILITY_LEVEL_MUL, level)));
}

export interface EnemyLike {
  uid?: number;
  x: number; y: number;
  maxHp: number;
  dead: boolean; leaked: boolean;
}

/**
 * 单次能力攻击的目标选择与伤害（纯函数）。
 * ready：调用方需保证该能力 cd ≤ 0。
 * 返回 null 表示无目标。
 */
export function planAbilityHit(
  hero: HeroState,
  a: HeroTowerAbility,
  enemies: ReadonlyArray<EnemyLike>,
): HeroAttackResult | null {
  const spec = HERO_ABILITY_SPECS[a.school];
  const alive: Array<{ idx: number; e: EnemyLike; d: number }> = [];
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.dead || e.leaked) continue;
    const d = heroDistTo(hero, e.x, e.y);
    if (d <= spec.range) alive.push({ idx: i, e, d });
  }
  if (alive.length === 0) return null;

  // 主目标：集火（焦点存活且在射程内时 始终优先，即使不是最近）> 最近
  const focused = hero.focusUid !== undefined
    ? alive.find((x) => x.e.uid === hero.focusUid)
    : undefined;
  let primary: (typeof alive)[number];
  if (focused) {
    primary = focused;
  } else {
    primary = alive[0];
    for (const c of alive) if (c.d < primary.d) primary = c;
  }

  const out: HeroAttackResult = { targets: [] };
  const pIdx = primary.idx;
  out.targets.push({ idx: pIdx, dmg: dmgOfSchool(a.school, a.level, primary.e.maxHp) });

  if (spec.kind === 'arc') {
    // 本命飞剑·剑气横扫：全射程内全体敌人皆受伤害（墙线面防守核心）
    for (const c of alive) {
      if (c.idx === pIdx) continue;
      out.targets.push({ idx: c.idx, dmg: dmgOfSchool(a.school, a.level, c.e.maxHp) });
    }
  } else if (spec.kind === 'aoe') {
    const r = spec.aoeRadius ?? 1.2;
    for (const c of alive) {
      if (c.idx === pIdx) continue;
      if (Math.hypot(c.e.x - primary.e.x, c.e.y - primary.e.y) <= r) {
        out.targets.push({ idx: c.idx, dmg: dmgOfSchool(a.school, a.level, c.e.maxHp) });
      }
    }
  } else if (spec.kind === 'chain') {
    const maxCount = spec.chainCount ?? 3;
    const jump = spec.chainRange ?? 2.0;
    const visited = new Set([pIdx]);
    let prev = primary.e;
    while (visited.size < maxCount) {
      let next: (typeof alive)[number] | undefined;
      let nd = jump;
      for (const c of alive) {
        if (visited.has(c.idx)) continue;
        const d = Math.hypot(c.e.x - prev.x, c.e.y - prev.y);
        if (d < nd) { nd = d; next = c; }
      }
      if (!next) break;
      visited.add(next.idx);
      out.targets.push({ idx: next.idx, dmg: dmgOfSchool(a.school, a.level, next.e.maxHp) });
      prev = next.e;
    }
  } else if (spec.kind === 'pierce') {
    // 横扫：朝 facing 方向、近身带（|ey - hero.y| ≤ 0.6）内至多 3 名
    const band = 0.6;
    const cap = 3;
    const inward = hero.facing > 0
      ? alive.filter((c) => c.e.x >= hero.x && Math.abs(c.e.y - hero.y) <= band)
      : alive.filter((c) => c.e.x <= hero.x && Math.abs(c.e.y - hero.y) <= band);
    inward.sort((a, b) => (hero.facing > 0 ? a.e.x - b.e.x : b.e.x - a.e.x));
    let n = 0;
    for (const c of inward) {
      if (c.idx === pIdx || n >= cap) continue;
      out.targets.push({ idx: c.idx, dmg: dmgOfSchool(a.school, a.level, c.e.maxHp) });
      n++;
    }
  }
  return out;
}