// 塔攻击行为：策略模式 + 注册表（设计文档 §4.4 behavior 注册表 / solid OCP）
// 新增一种攻击行为 = 新增一个 Strategy 类 + 注册，不改 Game 主体。
//
// 依赖抽象而非 Game 内部类型：策略只依赖这里定义的最小接口，
// Game 的运行时对象（EnemyR/TowerR）结构兼容即可注入。

import type { TowerBehavior, TowerConfig } from '../../types';

/** 策略需要读到/操作的敌人信息（Game 的 EnemyR 结构兼容） */
export interface CombatEnemy {
  uid: number;
  dist: number;
  x: number; y: number;
  hp: number;
  dead: boolean;
  def: { armor: number; bounty: number };
}
/** 策略需要读到的塔信息 */
export interface CombatTower {
  uid: number;
  x: number; y: number;
  level: number;
  def: TowerConfig;
}

/** 飞行物（Game 的 ProjectileR 结构兼容） */
export interface SpawnedProjectile {
  x: number; y: number;
  targetUid: number;
  dmg: number;
  color: string;
  dead: boolean;
}

/** 塔结算后的有效属性（光环 + 玩家加成合并、封顶后的最终值） */
export interface TowerStats {
  dmgMul: number;     // 伤害乘子（含光环 + 装备）
  rateMul: number;    // 攻速乘子
  rangeAdd: number;   // 射程扁平加成（格）
  critBonus: number;  // 暴击率加成（绝对值）
}

/** 策略执行所需的运行时能力（由 Game 提供，依赖倒置） */
export interface CombatContext {
  rng: () => number;
  effectiveStats: (tower: CombatTower) => TowerStats;
  spawnProjectile: (p: SpawnedProjectile) => void;
  damage: (enemy: CombatEnemy, rawDamage: number) => void;
  enemiesInRange: (tower: CombatTower, range: number) => CombatEnemy[];
  enemiesNearPoint: (x: number, y: number, radius: number) => CombatEnemy[];
}

export interface AttackStrategy {
  execute(tower: CombatTower, primary: CombatEnemy, ctx: CombatContext): void;
}

/** 计算一次命中的最终伤害：base × dmgMul，暴击 ×2 */
export function rollDamage(baseDmg: number, dmgMul: number, critChance: number, rng: () => number): number {
  const dmg = baseDmg * dmgMul;
  return critChance > 0 && rng() < critChance ? dmg * 2 : dmg;
}

/** 暴击率上限（设计文档 §9.5：crit ≤ 0.6） */
export const CRIT_CAP = 0.6;

/** 从范围内选出穿刺命中的目标：必含主目标，按"最靠前"优先，取 n 个 */
export function pickPierceTargets<T extends { uid: number; dist: number }>(
  primary: T,
  inRange: ReadonlyArray<T>,
  n: number,
): T[] {
  const sorted = [...inRange].sort((a, b) => b.dist - a.dist);
  const result: T[] = [primary];
  for (const e of sorted) {
    if (result.length >= n) break;
    if (e.uid !== primary.uid) result.push(e);
  }
  return result.slice(0, n);
}

/** 飞行物单体攻击 */
export class ProjectileStrategy implements AttackStrategy {
  execute(tower: CombatTower, primary: CombatEnemy, ctx: CombatContext): void {
    const lv = tower.def.levels[tower.level];
    const stats = ctx.effectiveStats(tower);
    const critChance = Math.min(CRIT_CAP, (lv.crit ?? 0) + stats.critBonus);
    const dmg = rollDamage(lv.dmg, stats.dmgMul, critChance, ctx.rng);
    ctx.spawnProjectile({
      x: tower.x, y: tower.y, targetUid: primary.uid, dmg, color: tower.def.color, dead: false,
    });
  }
}

/** 即时穿透攻击：主目标 + 范围内最近若干敌人 */
export class PierceStrategy implements AttackStrategy {
  execute(tower: CombatTower, primary: CombatEnemy, ctx: CombatContext): void {
    const lv = tower.def.levels[tower.level];
    const stats = ctx.effectiveStats(tower);
    const critChance = Math.min(CRIT_CAP, (lv.crit ?? 0) + stats.critBonus);
    const dmg = rollDamage(lv.dmg, stats.dmgMul, critChance, ctx.rng);
    const range = lv.range + stats.rangeAdd;
    const hits = pickPierceTargets(primary, ctx.enemiesInRange(tower, range), lv.pierce ?? 1);
    for (const e of hits) ctx.damage(e, dmg);
    // 视觉弹道（伤害已即时结算，dmg=0）
    ctx.spawnProjectile({
      x: tower.x, y: tower.y, targetUid: primary.uid, dmg: 0, color: tower.def.color, dead: false,
    });
  }
}

/** 范围溅射攻击：主目标 + 其周围 aoeRadius 内全部敌人（克虫群/分裂） */
export class AoeStrategy implements AttackStrategy {
  execute(tower: CombatTower, primary: CombatEnemy, ctx: CombatContext): void {
    const lv = tower.def.levels[tower.level];
    const stats = ctx.effectiveStats(tower);
    const critChance = Math.min(CRIT_CAP, (lv.crit ?? 0) + stats.critBonus);
    const dmg = rollDamage(lv.dmg, stats.dmgMul, critChance, ctx.rng);
    const radius = lv.aoeRadius ?? 0;
    const hits = radius > 0 ? ctx.enemiesNearPoint(primary.x, primary.y, radius) : [primary];
    for (const e of hits) ctx.damage(e, dmg);
    ctx.spawnProjectile({ x: tower.x, y: tower.y, targetUid: primary.uid, dmg: 0, color: tower.def.color, dead: false });
  }
}

/** 链电攻击：主目标 → 范围内最近敌人 → 再最近，跳 chainCount 次 */
export class ChainStrategy implements AttackStrategy {
  execute(tower: CombatTower, primary: CombatEnemy, ctx: CombatContext): void {
    const lv = tower.def.levels[tower.level];
    const stats = ctx.effectiveStats(tower);
    const critChance = Math.min(CRIT_CAP, (lv.crit ?? 0) + stats.critBonus);
    const dmg = rollDamage(lv.dmg, stats.dmgMul, critChance, ctx.rng);
    const range = lv.chainRange ?? 0;
    const count = lv.chainCount ?? 1;
    const hit = new Set<number>([primary.uid]);
    ctx.damage(primary, dmg);
    let cur = primary;
    for (let i = 1; i < count; i++) {
      const nearby = ctx.enemiesNearPoint(cur.x, cur.y, range).filter((e) => !hit.has(e.uid));
      if (nearby.length === 0) break;
      nearby.sort((a, b) => distSq(a, cur) - distSq(b, cur));
      cur = nearby[0];
      hit.add(cur.uid);
      ctx.damage(cur, dmg);
    }
    ctx.spawnProjectile({ x: tower.x, y: tower.y, targetUid: primary.uid, dmg: 0, color: tower.def.color, dead: false });
  }
}

function distSq(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** 行为 → 策略 注册表（可注入，便于测试与扩展） */
export class AttackStrategyRegistry {
  private map = new Map<TowerBehavior, AttackStrategy>();
  register(behavior: TowerBehavior, strategy: AttackStrategy): void { this.map.set(behavior, strategy); }
  get(behavior: TowerBehavior): AttackStrategy | undefined { return this.map.get(behavior); }
}

/** 默认注册表：装填 projectile / pierce / aoe / chain */
export function defaultAttackRegistry(): AttackStrategyRegistry {
  const r = new AttackStrategyRegistry();
  r.register('projectile', new ProjectileStrategy());
  r.register('pierce', new PierceStrategy());
  r.register('aoe', new AoeStrategy());
  r.register('chain', new ChainStrategy());
  return r;
}
