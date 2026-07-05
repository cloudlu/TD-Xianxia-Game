// 游戏引擎核心（设计文档 §1）
// 纯逻辑（路径/战斗/经济/波次/目标）已抽到 ./pure，Game 作为协调者调用；
// 后续继续把战斗/波次等拆为独立类（设计文档 §1.3）。
//
// 关键约定（设计文档 §1.4）：
// - 固定步长 update(fixedDt)，主循环用累加器消化实际帧时间
// - 随机走种子化 PRNG，保证确定性（为未来服务端重放校验铺路）

import type { LevelConfig, TowerConfig, EnemyConfig, TargetPolicy } from '../types';
import { mulberry32 } from './PRNG';
import { buildSegments, positionAt, totalLength, type Segment } from './pure/path';
import { WaveDirector } from './WaveDirector';
import { canHitFlying, resolveHit, enrageMul, scaleEnemy, towerMulFrom } from './pure/combat';
import { targetPriorityKey } from './pure/targeting';
import { investedCost, sellRefund as computeSellRefund, nextUpgradeCost } from './pure/economy';
import {
  defaultAttackRegistry, type AttackStrategyRegistry,
  type CombatContext, type CombatEnemy, type CombatTower, type TowerStats,
} from './combat/AttackStrategies';
import { ModifierSet, damageStatsFor } from '../data/Modifier';

const FIXED_DT = 1 / 30;       // 逻辑步长 30Hz
const PROJ_SPEED = 14;         // 弹道速度（格/秒）
const AURA_CAP = 0.80;         // 光环总加成上限（防膨胀，呼应 §9.5 封顶思想）
const PREP_FIRST = 12;         // 首波前的布阵倒计时（秒）
const PREP_BETWEEN = 8;        // 波间倒计时（秒）

export type GameStatus = 'prep' | 'wave' | 'won' | 'lost';

/** 引擎向表现层发出的事件（UI 据此播音效/特效，引擎本身不依赖 UI/音频） */
export type GameEvent =
  | { type: 'kill' }
  | { type: 'leak' }
  | { type: 'waveStart'; wave: number }
  | { type: 'win' }
  | { type: 'lose' };

/** 配置查询接口（P1 由 Registry 实现，依赖注入） */
export interface ConfigLookup {
  enemy(id: string): EnemyConfig | undefined;
  tower(id: string): TowerConfig | undefined;
}

interface EnemyR {
  uid: number;
  def: EnemyConfig;
  hp: number;
  maxHp: number;
  shield: number;       // 护盾层（先破盾再掉血）
  pathIndex: number;    // 走第几条路径
  dist: number;        // 已沿路径走过的距离
  x: number; y: number;
  abilityTimer: number; // BOSS 周期技能倒计时
  speedMul: number;     // 速度倍率（BOSS 狂暴用，默认 1）
  hitFlash: number;     // 受击闪白剩余秒数（战斗打击感）
  bounty: number;       // 运行时赏金（经章节缩放后，死时发放）
  slowFactor: number;   // 减速倍率（1=正常，0.5=半速）
  slowUntil: number;    // 减速到期时间戳（elapsed）
  dead: boolean;
  leaked: boolean;
}

interface TowerR {
  uid: number;
  def: TowerConfig;
  col: number; row: number;
  x: number; y: number;
  level: number;       // 0..levels-1
  cooldown: number;    // 距下次攻击的秒数
  targetPolicy: TargetPolicy;  // 运行时可切换（覆盖配置默认值）
  disabledUntil: number;       // 被撞塔瘫痪到的时刻（elapsed 秒）
  knockImmuneUntil: number;    // 撞塔免疫到的时刻（§5.4 6s 护栏）
}

interface ProjectileR {
  x: number; y: number;
  targetUid: number;
  dmg: number;         // 已含暴击的最终伤害（pierce 视觉弹道为 0）
  color: string;
  dead: boolean;
  slowMul?: number;
  slowDuration?: number;
}

/** 瞬时视觉特效（飘字伤害 / 死亡消散），由战斗结算产生、Board 渲染 */
export interface VisEffect {
  kind: 'dmg' | 'poof';
  x: number; y: number;
  text?: string;          // dmg 用
  color: string;
  life: number; maxLife: number;
  vy: number;             // dmg 上浮速度
}

export interface GameState {
  status: GameStatus;
  stones: number;
  lives: number;
  waveIndex: number;       // 当前/下一波索引
  totalWaves: number;
  waveActive: boolean;
  nextWaveIn: number;      // 自动开始倒计时（秒），<0 表示非 prep
  elapsed: number;         // 游戏内累计时间（秒）
  enemies: EnemyR[];
  towers: TowerR[];
  projectiles: ProjectileR[];
  effects: VisEffect[];    // 战斗特效（飘字/消散）
  nextWaveSpawns?: ReadonlyArray<{ enemy: string; count: number; path?: number }>;  // 下一波敌人预告
  msg: string;
}

export class Game {
  readonly level: LevelConfig;
  private rng: () => number;
  private reg: ConfigLookup;
  private strategies: AttackStrategyRegistry;
  private mods: ModifierSet;          // 玩家加成（装备/VIP/meta 天赋，设计文档 §9）
  private segs: Segment[][];   // 每条路径的折线段
  private pathLens: number[];  // 每条路径总长
  private hpMul: number;       // 敌人血量缩放（来自关卡配置）
  private towerMul: number;    // 塔伤害/攻速缩放（自动 sqrt(hpMul)）

  private enemies: EnemyR[] = [];
  private towers: TowerR[] = [];
  private projectiles: ProjectileR[] = [];
  private effects: VisEffect[] = [];   // 战斗视觉特效（飘字伤害/死亡消散）

  stones: number;
  lives: number;
  status: GameStatus = 'prep';
  waveIndex = 0;
  private waveActive = false;
  private waveDir = new WaveDirector();
  private acc = 0;
  private uidSeq = 1;
  private elapsed = 0;          // 游戏内累计时间（秒），用于撞塔免疫计时
  nextWaveIn = PREP_FIRST;     // 自动开始的倒计时（prep 阶段递减）
  msg = '';
  onEvent?: (e: GameEvent) => void;

  private emit(e: GameEvent): void { this.onEvent?.(e); }

  constructor(level: LevelConfig, reg: ConfigLookup, seed = 12345, strategies?: AttackStrategyRegistry, mods: ModifierSet = ModifierSet.empty) {
    this.level = level;
    this.reg = reg;
    this.strategies = strategies ?? defaultAttackRegistry();
    this.mods = mods;
    this.rng = mulberry32(seed);
    this.stones = level.startStones;
    this.lives = level.lives;
    this.segs = level.paths.map((p) => buildSegments(p));
    this.pathLens = this.segs.map((s) => totalLength(s));
    this.hpMul = level.hpMul ?? 1;
    this.towerMul = towerMulFrom(this.hpMul);
    this.msg = `布阵完毕后，点击「开始第 1 波」迎敌。`;   // 首波手动开始
  }

  private posAt(pathIndex: number, dist: number): { x: number; y: number } {
    return positionAt(this.segs[pathIndex] ?? [], dist);
  }

  // ---------- 主循环（固定步长） ----------
  tick(realDt: number): void {
    if (this.status === 'won' || this.status === 'lost') return;
    this.acc += Math.min(realDt, 0.25);   // 上限防卡顿后大步长
    while (this.acc >= FIXED_DT) {
      this.update(FIXED_DT);
      this.acc -= FIXED_DT;
    }
  }

  private update(dt: number): void {
    this.elapsed += dt;
    if (this.status === 'prep') {
      // 首波手动开始（给足布阵时间）；后续波自动倒计时
      if (this.waveIndex > 0) {
        this.nextWaveIn -= dt;
        if (this.nextWaveIn <= 0) this.startWave();
      }
    }
    if (this.waveActive) this.updateWave(dt);
    this.applyKnockback();
    this.applyBossAbilities(dt);
    this.updateTowers(dt);
    this.updateProjectiles(dt);
    this.updateEffects(dt);
    this.cleanup();
    if (this.lives <= 0 && this.status !== 'lost') {
      this.status = 'lost';
      this.msg = '宗门失守……';
      this.emit({ type: 'lose' });
    }
  }

  // ---------- 波次 ----------
  startWave(): void {
    if (this.status !== 'prep') return;
    if (this.waveIndex >= this.level.waves.length) return;
    this.waveDir.start(this.level.waves[this.waveIndex]);
    this.waveActive = true;
    this.status = 'wave';
    this.msg = `第 ${this.waveIndex + 1} 波来袭！`;
    this.emit({ type: 'waveStart', wave: this.waveIndex + 1 });
  }
  private updateWave(dt: number): void {
    this.waveDir.update(dt, (id, pathIndex) => this.spawnEnemy(id, pathIndex));
    for (const e of this.enemies) {
      const slowMul = (this.elapsed < e.slowUntil) ? e.slowFactor : 1;
      e.dist += e.def.speed * e.speedMul * slowMul * dt;
      const pathLen = this.pathLens[e.pathIndex] ?? 0;
      if (e.dist >= pathLen) {
        e.leaked = true;
        this.lives -= 1;
        this.emit({ type: 'leak' });
      } else {
        const p = this.posAt(e.pathIndex, e.dist);
        e.x = p.x; e.y = p.y;
      }
    }
    if (this.waveDir.done && this.enemies.length === 0) {
      const wave = this.level.waves[this.waveIndex];
      this.stones += wave.clearBonus;
      this.waveActive = false;
      this.waveIndex += 1;
      if (this.waveIndex >= this.level.waves.length) {
        this.status = 'won';
        this.msg = '守阵成功！山门无恙。';
        this.emit({ type: 'win' });
      } else {
        this.status = 'prep';
        this.nextWaveIn = PREP_BETWEEN;
        this.msg = `第 ${this.waveIndex + 1} 波已退，清波奖 +${wave.clearBonus} 灵石。下一波 ${PREP_BETWEEN} 秒后袭来。`;
      }
    }
  }

  private spawnEnemy(enemyId: string, pathIndex: number): void {
    this.spawnEnemyAt(enemyId, pathIndex, 0);
  }

  /** 在指定路径的指定进度生成敌人（波次起始 dist=0；分裂/召唤用具体位置） */
  private spawnEnemyAt(enemyId: string, pathIndex: number, dist: number): void {
    const def = this.reg.enemy(enemyId);
    if (!def) return;
    const p = this.posAt(pathIndex, dist);
    const scaled = scaleEnemy(def.hp, def.bounty, this.hpMul);
    this.enemies.push({
      uid: this.uidSeq++, def, hp: scaled.hp, maxHp: scaled.hp,
      shield: (def.shield ?? 0) * this.hpMul, pathIndex, dist,
      x: p.x, y: p.y, abilityTimer: def.bossAbility?.interval ?? 0,
      speedMul: 1, hitFlash: 0, bounty: scaled.bounty, slowFactor: 1, slowUntil: 0,
      dead: false, leaked: false,
    });
  }

  // ---------- 塔战斗 ----------
  private updateTowers(dt: number): void {
    for (const t of this.towers) {
      if (t.def.behavior === 'aura') continue;   // 光环塔不攻击
      if (this.elapsed < t.disabledUntil) continue;   // 被撞塔瘫痪中
      t.cooldown -= dt;
      if (t.cooldown > 0) continue;
      const lv = t.def.levels[t.level];
      const stats = this.effectiveStats(t);
      const target = this.acquireTarget(t, lv.range + stats.rangeAdd, t.targetPolicy);
      if (!target) continue;
      this.fire(t, target);
      t.cooldown = 1 / (lv.rate * stats.rateMul);
    }
  }

  private acquireTarget(t: TowerR, range: number, policy: TargetPolicy): EnemyR | null {
    let best: EnemyR | null = null;
    let bestKey = 0;
    const hitsAir = !!t.def.hitsAir;
    for (const e of this.enemies) {
      if (!canHitFlying(hitsAir, !!e.def.fly)) continue;            // 对空过滤
      if (e.def.stealth && !this.isRevealed(e)) continue;            // 隐身：需破隐
      const dx = e.x - t.x, dy = e.y - t.y;
      if (dx * dx + dy * dy > range * range) continue;
      const key = this.targetKey(policy, e);
      if (best === null || key > bestKey) { best = e; bestKey = key; }
    }
    return best;
  }

  private targetKey(policy: TargetPolicy, e: EnemyR): number {
    return targetPriorityKey(policy, e);
  }

  private fire(t: TowerR, primary: EnemyR): void {
    const strategy = this.strategies.get(t.def.behavior);
    if (!strategy) return;
    strategy.execute(t, primary, this.combatContext());
  }

  /** 战斗策略所需的运行时能力（依赖倒置：策略依赖此抽象，不依赖 Game 内部） */
  private combatContext(): CombatContext {
    return {
      rng: () => this.rng(),
      effectiveStats: (t) => this.effectiveStats(t),
      spawnProjectile: (p) => { this.projectiles.push(p); },
      damage: (e, raw) => { this.damage(e, raw); },
      enemiesInRange: (t, range) => this.enemiesInRange(t, range),
      enemiesNearPoint: (x, y, radius) => this.enemiesNearPoint(x, y, radius),
    };
  }

  private enemiesNearPoint(x: number, y: number, radius: number): CombatEnemy[] {
    return this.enemies.filter((e) => {
      const dx = e.x - x, dy = e.y - y;
      return dx * dx + dy * dy <= radius * radius;
    });
  }

  /** 塔的有效属性：光环（位置性）× 玩家加成（全局），各自封顶后相乘 */
  private effectiveStats(t: CombatTower): TowerStats {
    const aura = this.auraBuff(t);
    const school = t.def.school ?? 'sword';
    const dmgMul = (1 + aura.dmgMul) * this.mods.damageMul(damageStatsFor(school)) * this.towerMul;
    const rateMul = (1 + aura.rateMul) * this.mods.rateMul() * this.towerMul;
    return { dmgMul, rateMul, rangeAdd: this.mods.rangeAdd(), critBonus: this.mods.critBonus() };
  }

  private enemiesInRange(t: CombatTower, range: number): CombatEnemy[] {
    const hitsAir = !!t.def.hitsAir;
    return this.enemies.filter((e) => {
      if (!canHitFlying(hitsAir, !!e.def.fly)) return false;   // 对空过滤
      if (e.def.stealth && !this.isRevealed(e as EnemyR)) return false;  // 隐身：需破隐
      const dx = e.x - t.x, dy = e.y - t.y;
      return dx * dx + dy * dy <= range * range;
    });
  }

  /** 隐身敌人是否被破隐：非隐身恒真；隐身则需在某个聚灵阵（光环塔）范围内 */
  private isRevealed(e: EnemyR): boolean {
    if (!e.def.stealth) return true;
    return this.auraCovers(e);
  }

  private auraCovers(e: EnemyR): boolean {
    for (const t of this.towers) {
      if (t.def.behavior !== 'aura') continue;
      const r = t.def.levels[t.level].range;
      const dx = t.x - e.x, dy = t.y - e.y;
      if (dx * dx + dy * dy <= r * r) return true;
    }
    return false;
  }

  private damage(e: CombatEnemy, raw: number): void {
    if (e.dead) return;
    const enemy = e as EnemyR;
    const before = enemy.hp + enemy.shield;
    const r = resolveHit(enemy.hp, enemy.maxHp, enemy.shield, raw, enemy.def.armor, enemy.def.lifestealHp ?? 0);
    enemy.hp = r.hp;
    enemy.shield = r.shield;
    const dealt = before - (enemy.hp + enemy.shield);   // 实际造成的总损耗（盾+血）
    if (dealt > 0) {
      enemy.hitFlash = 0.12;                              // 受击闪白
      this.effects.push({ kind: 'dmg', x: enemy.x, y: enemy.y, text: String(Math.round(dealt)), color: '#ffffff', life: 0.7, maxLife: 0.7, vy: -1.4 });
    }
    if (enemy.hp <= 0) {
      enemy.dead = true;
      this.stones += enemy.bounty * this.mods.bountyMul();   // 赏金走玩家经济加成（bounty 已含章节缩放）
      this.effects.push({ kind: 'poof', x: enemy.x, y: enemy.y, color: enemy.def.color, life: 0.35, maxLife: 0.35, vy: 0 });
      if (enemy.def.split) {                                      // 死亡分裂：生崽（子体赏金 0）
        for (let i = 0; i < enemy.def.split.count; i++) {
          this.spawnEnemyAt(enemy.def.split.child, enemy.pathIndex, enemy.dist);
        }
      }
      this.emit({ type: 'kill' });
    }
  }

  private updateProjectiles(dt: number): void {
    for (const p of this.projectiles) {
      const target = this.enemies.find((e) => e.uid === p.targetUid && !e.dead);
      if (!target) { p.dead = true; continue; }
      const dx = target.x - p.x, dy = target.y - p.y;
      const dist = Math.hypot(dx, dy);
      const step = PROJ_SPEED * dt;
      if (dist <= step) {
        p.x = target.x; p.y = target.y;
        if (p.dmg > 0) this.damage(target, p.dmg);
        if (p.slowMul !== undefined && p.slowDuration !== undefined) {
          target.slowFactor = p.slowMul;
          target.slowUntil = this.elapsed + p.slowDuration;
        }
        p.dead = true;
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
      }
    }
  }

  // ---------- BOSS 周期技能（§5.4 护栏：范围受限/时长上限/同塔免疫/对策存在） ----------
  private applyBossAbilities(dt: number): void {
    for (const e of this.enemies) {
      const ab = e.def.bossAbility;
      if (!ab) continue;
      // 狂暴：血量低于阈值时加速（每帧刷新，稳定）
      if (ab.enrageBelow) {
        e.speedMul = enrageMul(e.hp / e.maxHp, ab.enrageBelow);
      }
      e.abilityTimer -= dt;
      if (e.abilityTimer > 0) continue;
      e.abilityTimer = ab.interval;
      // 魅惑：范围内塔短暂瘫痪（复用 knockImmuneUntil 作通用瘫痪免疫护栏）
      if (ab.charmRadius && ab.charmDuration) {
        const R = ab.charmRadius, D = Math.min(3, ab.charmDuration);
        for (const t of this.towers) {
          if (t.def.behavior === 'aura') continue;        // 阵法不受影响（对策存在）
          const dx = t.x - e.x, dy = t.y - e.y;
          if (dx * dx + dy * dy > R * R) continue;
          if (this.elapsed < t.knockImmuneUntil) continue;
          t.disabledUntil = this.elapsed + D;
          t.knockImmuneUntil = this.elapsed + 6;          // 6s 免疫护栏
        }
      }
      // 召唤：狂暴时数量提升
      if (ab.summon) {
        const enraged = ab.enrageBelow && e.hp / e.maxHp < ab.enrageBelow.hpPct;
        const count = enraged ? (ab.enrageBelow?.summonCount ?? ab.summon.count) : ab.summon.count;
        for (let i = 0; i < count; i++) {
          this.spawnEnemyAt(ab.summon.enemy, e.pathIndex, e.dist);
        }
      }
    }
  }

  // ---------- 撞塔（蛮牛 knockback） ----------
  private applyKnockback(): void {
    const REACH = 0.9;          // 触发距离（格）
    const DISABLE = 2;          // 瘫痪时长（秒）
    const IMMUNE = 6;           // 同塔免疫时长（秒，§5.4 护栏）
    for (const e of this.enemies) {
      if (!e.def.knockback) continue;
      for (const t of this.towers) {
        if (t.def.behavior === 'aura') continue;       // 阵法不受影响
        const dx = e.x - t.x, dy = e.y - t.y;
        if (dx * dx + dy * dy > REACH * REACH) continue;
        if (this.elapsed < t.knockImmuneUntil) continue;   // 免疫期内
        t.disabledUntil = this.elapsed + DISABLE;
        t.knockImmuneUntil = this.elapsed + IMMUNE;
      }
    }
  }

  // ---------- 光环（聚灵阵） ----------
  private auraBuff(t: CombatTower): { dmgMul: number; rateMul: number } {
    let dmgMul = 0, rateMul = 0;
    for (const a of this.towers) {
      if (a.def.behavior !== 'aura' || a === t) continue;
      const al = a.def.levels[a.level];
      const dx = a.x - t.x, dy = a.y - t.y;
      if (dx * dx + dy * dy <= al.range * al.range) {
        dmgMul += al.auraBuff?.dmgMul ?? 0;
        rateMul += al.auraBuff?.rateMul ?? 0;
      }
    }
    return {
      dmgMul: Math.min(dmgMul, AURA_CAP),
      rateMul: Math.min(rateMul, AURA_CAP),
    };
  }

  /** UI 用于显示某塔当前光环加成 */
  auraBuffFor(uid: number): { dmgMul: number; rateMul: number } | null {
    const t = this.towers.find((x) => x.uid === uid);
    return t ? this.auraBuff(t) : null;
  }

  /** UI 用于显示某塔有效属性（含装备/天赋/VIP/光环/章节缩放后的实际数值） */
  getEffectiveStats(uid: number): { dps: number; baseDps: number; buffPct: number; range: number; rate: number; crit: number } | null {
    const t = this.towers.find((x) => x.uid === uid);
    if (!t) return null;
    const lv = t.def.levels[t.level];
    const stats = this.effectiveStats(t);
    const baseDps = lv.dmg * lv.rate;
    const totalMul = stats.dmgMul * stats.rateMul;
    return {
      dps: Math.round(baseDps * totalMul),
      baseDps: Math.round(baseDps),
      buffPct: Math.round((totalMul - 1) * 100),
      range: Math.round((lv.range + stats.rangeAdd) * 10) / 10,
      rate: Math.round(lv.rate * stats.rateMul * 10) / 10,
      crit: Math.round(Math.min(0.6, (lv.crit ?? 0) + stats.critBonus) * 100),
    };
  }

  // ---------- 玩家操作 ----------
  canPlace(col: number, row: number): boolean {
    if (col < 0 || row < 0 || col >= this.level.cols || row >= this.level.rows) return false;
    if (!this.level.buildable[row][col]) return false;
    return !this.towers.some((t) => t.col === col && t.row === row);
  }

  placeTower(col: number, row: number, towerId: string): boolean {
    const def = this.reg.tower(towerId);
    if (!def || !this.canPlace(col, row)) return false;
    if (this.stones < def.cost) { this.msg = '灵石不足！'; return false; }
    this.stones -= def.cost;
    this.towers.push({
      uid: this.uidSeq++, def, col, row,
      x: col + 0.5, y: row + 0.5, level: 0, cooldown: 0,
      targetPolicy: def.targetPolicy, disabledUntil: 0, knockImmuneUntil: 0,
    });
    this.msg = `布置 ${def.name}。`;
    return true;
  }

  towerAt(col: number, row: number): TowerR | undefined {
    return this.towers.find((t) => t.col === col && t.row === row);
  }

  private static POLICIES: TargetPolicy[] = ['first', 'last', 'strongest', 'nearest'];

  /** 切换某塔的目标选择策略，返回新策略 */
  cycleTargetPolicy(uid: number): TargetPolicy | null {
    const t = this.towers.find((x) => x.uid === uid);
    if (!t) return null;
    const i = Game.POLICIES.indexOf(t.targetPolicy);
    t.targetPolicy = Game.POLICIES[(i + 1) % Game.POLICIES.length];
    return t.targetPolicy;
  }

  /** 本关允许的塔最高境界索引（关卡 maxTowerLevel 与塔自身上限取小） */
  private maxTowerLevelFor(def: TowerConfig): number {
    const towerMax = def.levels.length - 1;
    const levelCap = this.level.maxTowerLevel ?? towerMax;
    return Math.min(levelCap, towerMax);
  }

  /** 下一境界升级费；已达本关上限或满级返回 null */
  upgradeCost(uid: number): number | null {
    const t = this.towers.find((x) => x.uid === uid);
    if (!t || t.level >= this.maxTowerLevelFor(t.def)) return null;
    return t.def.levels[t.level + 1].upgradeCost ?? null;
  }

  /** 出售返还的灵石 */
  sellRefund(uid: number): number {
    const t = this.towers.find((x) => x.uid === uid);
    return t ? computeSellRefund(t.def, t.level) : 0;
  }

  upgradeTower(uid: number): boolean {
    const t = this.towers.find((x) => x.uid === uid);
    if (!t) return false;
    const cap = this.maxTowerLevelFor(t.def);
    if (t.level >= cap) {
      this.msg = t.level >= t.def.levels.length - 1 ? '已达化神，无可突破。' : '已达本关境界上限。';
      return false;
    }
    const nextLv = t.def.levels[t.level + 1];
    if (nextLv.upgradeCost === undefined) return false;
    if (this.stones < nextLv.upgradeCost) { this.msg = '灵石不足，无法突破！'; return false; }
    this.stones -= nextLv.upgradeCost;
    t.level += 1;
    this.msg = `${t.def.name} 突破至 ${nextLv.realm}！`;
    return true;
  }

  sellTower(uid: number): boolean {
    const idx = this.towers.findIndex((x) => x.uid === uid);
    if (idx < 0) return false;
    const t = this.towers[idx];
    const refund = Math.floor(this.invested(t) * t.def.sellRatio);
    this.stones += refund;
    this.towers.splice(idx, 1);
    this.msg = `出售 ${t.def.name}，返还 ${refund} 灵石。`;
    return true;
  }

  private invested(t: TowerR): number {
    return investedCost(t.def, t.level);
  }

  /** 给 UI 读取的只读快照 */
  snapshot(): GameState {
    return {
      status: this.status, stones: Math.floor(this.stones), lives: this.lives,
      waveIndex: this.waveIndex, totalWaves: this.level.waves.length,
      waveActive: this.waveActive,
      nextWaveIn: (this.status === 'prep' && this.waveIndex > 0) ? Math.max(0, this.nextWaveIn) : -1,
      elapsed: this.elapsed,
      enemies: this.enemies.map((e) => ({ ...e })),
      towers: this.towers.map((t) => ({ ...t })),
      projectiles: this.projectiles.map((p) => ({ ...p })),
      effects: this.effects.map((fx) => ({ ...fx })),
      nextWaveSpawns: this.peekNextWave(),
      msg: this.msg,
    };
  }

  /** 下一波敌人配置（prep 时为当前波，wave 时为再下一波）；无则 undefined */
  private peekNextWave(): ReadonlyArray<{ enemy: string; count: number; path?: number }> | undefined {
    const idx = this.waveActive ? this.waveIndex + 1 : this.waveIndex;
    if (idx >= this.level.waves.length) return undefined;
    return this.level.waves[idx].spawns;
  }

  /** 推进战斗特效（飘字上浮/衰减、闪白衰减） */
  private updateEffects(dt: number): void {
    for (const e of this.enemies) {
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.slowUntil > 0 && this.elapsed >= e.slowUntil) e.slowFactor = 1;  // 减速到期恢复
    }
    for (const fx of this.effects) { fx.life -= dt; fx.y += fx.vy * dt; }
    this.effects = this.effects.filter((fx) => fx.life > 0);
  }

  private cleanup(): void {
    this.enemies = this.enemies.filter((e) => !e.dead && !e.leaked);
    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }
}
