// 塔战斗系统（设计文档 §1.3）：负责塔攻击 / 弹道 / 伤害 / 光环 / BOSS 技能 / 撞塔
// 拥有 projectiles[], effects[], killStack
// Game 每帧调用 update() 驱动战斗，传入敌人和塔的引用直接修改状态。

import { canHitFlying, resolveHit } from '../pure/combat';
import { targetPriorityKey } from '../pure/targeting';
import type { EnemyR } from '../WaveManager';
import type { TowerR } from '../TowerOperations';
import type { TargetPolicy } from '../../types';
import { towerRange } from './effectiveRange';
import {
  type AttackStrategyRegistry,
  type CombatContext, type CombatEnemy, type CombatTower, type TowerStats,
} from './AttackStrategies';
import {
  applyBossAbilities as applyBossAbilitiesFn,
  applyKnockback as applyKnockbackFn,
  type BossCtx,
} from './BossAbilities';
import { ModifierSet, damageStatsFor } from '../../data/Modifier';
import { visualTier } from '../../data/config/towerVisuals';

const PROJ_SPEED = 14;

interface ProjectileR {
  x: number; y: number;
  targetUid: number;
  dmg: number;
  color: string;
  dead: boolean;
  crit?: boolean;
  slowMul?: number;
  slowDuration?: number;
  school?: string;   // 表现层：流派弹道样式
  tier?: 0 | 1 | 2;  // 表现层：境界档位（拖尾长度/粒子密度）
  fromX?: number;    // 发射点（拖尾方向用）
  fromY?: number;
  faint?: boolean;   // 表现层：次要目标弹道（半透明）
  destX?: number;    // 目标最后已知位置（视觉弹道在目标死亡后继续飞到此点）
  destY?: number;
}

export interface VisEffect {
  kind: 'dmg' | 'poof' | 'shockwave' | 'burst' | 'realmup' | 'hit';
  x: number; y: number;
  text?: string;
  color: string;
  life: number; maxLife: number;
  vy: number;
  crit?: boolean;
  school?: string;   // 表现层流派特效骨架（引擎只透传，不解释）
  tier?: 0 | 1 | 2;  // 境界视觉档位
  style?: string;    // 命中/击杀样式（表现层透传：hit 样式 / poof 变体）
  shake?: number;    // 该特效伴随的震动强度（像素，0=无）
  radius?: number;   // AOE 爆炸半径（格，表现层渲染爆炸圈）
}

export type CombatGameEvent =
  | { type: 'kill'; enemyId: string }
  | { type: 'leak' }
  | { type: 'waveStart'; wave: number }
  | { type: 'win' }
  | { type: 'lose' }
  | { type: 'boss' };

export interface CombatUpdateCtx {
  rng: () => number;
  strategies: AttackStrategyRegistry;
  mods: ModifierSet;
  towerMul: number;
  destinyBoost: number;
  hpMul: number;
  difficultyBountyMul: number;
  elapsed: () => number;
  spawnEnemyAt: (id: string, pathIndex: number, dist: number) => void;
  addStones: (amount: number) => void;
  emit(event: CombatGameEvent): void;
}

export class TowerCombat {
  projectiles: ProjectileR[] = [];
  effects: VisEffect[] = [];
  killStack = 0;

  constructor(private ctx: CombatUpdateCtx) {}

  /** 每帧主入口 */
  update(dt: number, enemies: EnemyR[], towers: TowerR[]): void {
    this.updateBurrowTimers(dt, enemies);
    this.applyKnockback(enemies, towers);
    this.applyBossAbilities(dt, enemies, towers);
    this.updateTowers(dt, enemies, towers);
    this.updateProjectiles(dt, enemies, towers);
    this.updateEffects(dt, enemies);
    this.cleanupProjectiles();
    for (const t of towers) {
      if (t.flashTimer > 0) t.flashTimer = Math.max(0, t.flashTimer - dt);
    }
  }

  // ---------- 外部查询 ----------
  auraBuffFor(uid: number, towers: TowerR[]): { dmgMul: number; rateMul: number } | null {
    const t = towers.find((x) => x.uid === uid);
    return t ? this.auraBuff(t, towers) : null;
  }

  getEffectiveStats(uid: number, towers: TowerR[], enemies: EnemyR[]): { dps: number; baseDps: number; buffPct: number; range: number; rate: number; crit: number } | null {
    const t = towers.find((x) => x.uid === uid);
    if (!t) return null;
    const lv = t.def.levels[t.level];
    const stats = this.effectiveStats(t, towers, enemies);
    const baseDps = lv.dmg * lv.rate;
    const totalMul = stats.dmgMul * stats.rateMul;
    return {
      dps: Math.round(baseDps * totalMul),
      baseDps: Math.round(baseDps),
      buffPct: Math.round((totalMul - 1) * 100),
      range: towerRange(lv.range, stats.rangeAdd, t.onFormation),
      rate: Math.round(lv.rate * stats.rateMul * 10) / 10,
      crit: Math.round(Math.min(0.6, (lv.crit ?? 0) + stats.critBonus) * 100),
    };
  }

  // ---------- BOSS 周期技能 ----------
  private applyBossAbilities(dt: number, enemies: EnemyR[], towers: TowerR[]): void {
    const ctx: BossCtx = {
      elapsed: this.ctx.elapsed(),
      dt,
      spawn: (id, pathIdx, dist) => { this.ctx.spawnEnemyAt(id, pathIdx, dist); },
    };
    applyBossAbilitiesFn(enemies, towers as any, ctx, this.ctx.mods.bossCooldownMul());
  }

  // ---------- 撞塔 ----------
  private applyKnockback(enemies: EnemyR[], towers: TowerR[]): void {
    applyKnockbackFn(enemies, towers as any, this.ctx.elapsed());
  }

  // ---------- 塔攻击 ----------
  private countEnemiesInRange(t: CombatTower, range: number, enemies: EnemyR[]): number {
    let count = 0;
    for (const e of enemies) {
      const dx = e.x - t.x, dy = e.y - t.y;
      if (dx * dx + dy * dy <= range * range && !e.dead) count++;
    }
    return count;
  }

  private updateTowers(dt: number, enemies: EnemyR[], towers: TowerR[]): void {
    for (const t of towers) {
      if (t.def.behavior === 'aura') continue;
      if (this.ctx.elapsed() < t.disabledUntil) continue;
      t.cooldown -= dt;
      if (t.cooldown > 0) continue;
      const lv = t.def.levels[t.level];
      const stats = this.effectiveStats(t, towers, enemies);
      const range = towerRange(lv.range, stats.rangeAdd, t.onFormation);
      const densityRate = this.ctx.mods.densityRate();
      const densityBonus = densityRate > 0 ? 1 + densityRate * this.countEnemiesInRange(t, range, enemies) : 1;
      const target = this.acquireTarget(t, range, t.targetPolicy, enemies, towers);
      if (!target) continue;
      t.flashTimer = 0.12;
      this.fire(t, target, towers, enemies);
      t.cooldown = 1 / (lv.rate * stats.rateMul * densityBonus);
    }
  }

  private acquireTarget(t: TowerR, range: number, policy: TargetPolicy, enemies: EnemyR[], towers: TowerR[]): EnemyR | null {
    let best: EnemyR | null = null;
    let bestKey = 0;
    const hitsAir = !!t.def.hitsAir;
    const hitsBurrowed = !!t.def.hitsBurrowed;
    for (const e of enemies) {
      if (!canHitFlying(hitsAir, !!e.def.fly)) continue;
      if (e.def.stealth && !this.isRevealed(e, towers)) continue;
      if (e.burrowed && !hitsBurrowed) continue;
      const dx = e.x - t.x, dy = e.y - t.y;
      if (dx * dx + dy * dy > range * range) continue;
      const key = targetPriorityKey(policy, e);
      if (best === null || key > bestKey) { best = e; bestKey = key; }
    }
    return best;
  }

  private fire(t: TowerR, primary: EnemyR, towers: TowerR[], enemies: EnemyR[]): void {
    const strategy = this.ctx.strategies.get(t.def.behavior);
    if (!strategy) return;
    strategy.execute(t, primary, this.combatContext(towers, enemies, t));
    const doubleAtk = this.ctx.mods.doubleAtkChance();
    if (doubleAtk > 0 && this.ctx.rng() < doubleAtk) {
      const lv = t.def.levels[t.level];
      const stats = this.effectiveStats(t, towers, enemies);
      const range = towerRange(lv.range, stats.rangeAdd, t.onFormation);
      const secondary = this.acquireTarget(t, range, t.targetPolicy, enemies, towers);
      if (secondary && secondary.uid !== primary.uid) {
        strategy.execute(t, secondary, this.combatContext(towers, enemies, t));
      }
    }
  }

  private combatContext(towers: TowerR[], enemies: EnemyR[], source?: TowerR): CombatContext {
    return {
      rng: () => this.ctx.rng(),
      effectiveStats: (t) => this.effectiveStats(t, towers, enemies),
      spawnProjectile: (p: any) => { this.projectiles.push(p); },
      damage: (e, raw, isCrit, visFromStrategy) => {
        const vis = visFromStrategy ?? (source ? { school: source.def.school, tier: visualTier(source.level) as 0 | 1 | 2 } : undefined);
        this.damage(e, raw, towers, enemies, isCrit, vis);
      },
      enemiesInRange: (t, range) => this.enemiesInRange(t, range, enemies, towers),
      enemiesNearPoint: (x, y, radius) => this.enemiesNearPoint(x, y, radius, enemies),
    };
  }

  private enemiesNearPoint(x: number, y: number, radius: number, enemies: EnemyR[]): CombatEnemy[] {
    return enemies.filter((e) => {
      const dx = e.x - x, dy = e.y - y;
      return dx * dx + dy * dy <= radius * radius;
    });
  }

  private effectiveStats(t: CombatTower, towers: TowerR[], enemies: EnemyR[]): TowerStats {
    const aura = this.auraBuff(t, towers);
    const school = t.def.school ?? 'sword';
    const killStackCount = Math.floor(this.killStack / 10);
    const killStackBonus = this.ctx.mods.killStackDmgPer() * Math.min(killStackCount, this.ctx.mods.killStackCap() || Infinity);

    // 阵眼加成
    const ft = towers.find((x) => x.uid === t.uid);
    const fmt = ft?.onFormation;
    let fmtDmgMul = 1, fmtRateMul = 1;
    if (fmt) {
      fmtDmgMul = fmt === 'earth' ? 1.5 : fmt === 'spirit' ? 1.15 : 1;
      fmtRateMul = fmt === 'thunder' ? 1.4 : fmt === 'spirit' ? 1.15 : 1;
    }
    // 灵眼：周围额外阵眼格上的塔提供叠加加成
    let spiritAdjacent = 0;
    if (fmt === 'spirit') {
      for (const o of towers) {
        if (o.uid === t.uid) continue;
        if (o.onFormation && Math.abs(o.col - ft!.col) <= 1 && Math.abs(o.row - ft!.row) <= 1) {
          spiritAdjacent++;
        }
      }
    }
    const spiritMul = 1 + spiritAdjacent * 0.15;

    // v0.86 方案 C：仙魂乘数已并入 damageMul 伤害族（damageStatsFor 含 '_soulMul'），此处不再独立相乘
    const dmgMul = (1 + aura.dmgMul + killStackBonus) * this.ctx.mods.damageMul(damageStatsFor(school)) * this.ctx.towerMul * this.ctx.destinyBoost * fmtDmgMul * spiritMul;
    const rateMul = (1 + aura.rateMul) * this.ctx.mods.rateMul() * this.ctx.towerMul * fmtRateMul;
    const rangeAdd = this.ctx.mods.rangeAdd();
    return { dmgMul, rateMul, rangeAdd, critBonus: this.ctx.mods.critBonus() };
  }

  private enemiesInRange(t: CombatTower, range: number, enemies: EnemyR[], towers: TowerR[]): CombatEnemy[] {
    const hitsAir = !!t.def.hitsAir;
    const hitsBurrowed = !!t.def.hitsBurrowed;
    return enemies.filter((e) => {
      if (!canHitFlying(hitsAir, !!e.def.fly)) return false;
      if (e.def.stealth && !this.isRevealed(e, towers)) return false;
      if (e.burrowed && !hitsBurrowed) return false;
      const dx = e.x - t.x, dy = e.y - t.y;
      return dx * dx + dy * dy <= range * range;
    });
  }

  private isRevealed(e: EnemyR, towers: TowerR[]): boolean {
    if (!e.def.stealth) return true;
    return this.auraCovers(e, towers);
  }

  private auraCovers(e: EnemyR, towers: TowerR[]): boolean {
    for (const t of towers) {
      if (t.def.behavior !== 'aura') continue;
      const lv = t.def.levels[t.level];
      const r = towerRange(lv.range, this.ctx.mods.rangeAdd(), t.onFormation);
      const dx = t.x - e.x, dy = t.y - e.y;
      if (dx * dx + dy * dy <= r * r) return true;
    }
    return false;
  }

  // ---------- 光环 ----------
  private auraBuff(t: CombatTower, towers: TowerR[]): { dmgMul: number; rateMul: number } {
    let dmgMul = 0, rateMul = 0;
    for (const a of towers) {
      if (a.def.behavior !== 'aura' || a === (t as any)) continue;
      const al = a.def.levels[a.level];
      const r = towerRange(al.range, this.ctx.mods.rangeAdd(), a.onFormation);
      const dx = a.x - t.x, dy = a.y - t.y;
      if (dx * dx + dy * dy <= r * r) {
        dmgMul += al.auraBuff?.dmgMul ?? 0;
        rateMul += al.auraBuff?.rateMul ?? 0;
      }
    }
    return { dmgMul: Math.min(dmgMul, 0.8), rateMul: Math.min(rateMul, 0.8) };
  }

  // ---------- 遁地计时 ----------
  private updateBurrowTimers(dt: number, enemies: EnemyR[]): void {
    for (const e of enemies) {
      if (!e.def.burrow) continue;
      e.burrowTimer -= dt;
      if (e.burrowTimer <= 0) {
        e.burrowed = !e.burrowed;
        e.burrowTimer = e.burrowed ? e.def.burrow.interval : e.def.burrow.surfDuration;
      }
    }
  }

  // ---------- 伤害 ----------
  private damage(e: CombatEnemy, raw: number, towers: TowerR[], enemies: EnemyR[], isCrit?: boolean, vis?: { school?: string; tier?: 0 | 1 | 2; radius?: number; shake?: number }): void {
    if (e.dead) return;
    const enemy = e as EnemyR;
    if (enemy.def.dodge && this.ctx.rng() < enemy.def.dodge) return;
    const armorPierce = this.ctx.mods.armorPierce();
    const effectiveArmor = armorPierce > 0 ? Math.max(0, enemy.def.armor * (1 - armorPierce)) : enemy.def.armor;
    const before = enemy.hp + enemy.shield;
    const r = resolveHit(enemy.hp, enemy.maxHp, enemy.shield, raw, effectiveArmor, enemy.def.lifestealHp ?? 0);
    enemy.hp = r.hp;
    enemy.shield = r.shield;
    const dealt = before - (enemy.hp + enemy.shield);
    if (dealt > 0) {
      // 暴击缓滞：受击闪白拉长 1.5×（0.18s），渲染层闪白更强
      enemy.hitFlash = isCrit ? 0.18 : 0.12;
      const color = isCrit ? '#ffd700' : '#ff4444';
      this.effects.push({ kind: 'dmg', x: enemy.x, y: enemy.y, text: String(Math.round(dealt)), color, life: 0.7, maxLife: 0.7, vy: -1.4, crit: isCrit });
      // 命中特效（表现层流派差异化，样式由 Board 按 school 查表渲染）
      if (vis?.school || vis?.radius) {
        this.effects.push({
          kind: 'hit', x: enemy.x, y: enemy.y, color,
          life: 0.22, maxLife: 0.22, vy: 0,
          school: vis?.school, tier: vis?.tier ?? 0, crit: isCrit,
          radius: vis?.radius, shake: vis?.shake,
        });
      }
    }
    if (enemy.hp <= 0) {
      enemy.dead = true;
      this.killStack++;
      this.ctx.addStones(enemy.bounty * this.ctx.mods.bountyMul() * this.ctx.difficultyBountyMul);
      // 击杀反馈：飞行怪羽毛飘落 / BOSS 多层爆散（style 透传给 Board）
      const killStyle = enemy.def.bossAbility ? 'boss' : enemy.def.fly ? 'feather' : enemy.def.elite ? 'elite' : 'normal';
      this.effects.push({
        kind: 'poof', x: enemy.x, y: enemy.y, color: enemy.def.color,
        life: killStyle === 'boss' ? 0.7 : 0.35, maxLife: killStyle === 'boss' ? 0.7 : 0.35, vy: 0,
        style: killStyle, shake: killStyle === 'boss' ? 7 : killStyle === 'elite' ? 3 : 0,
      });
      if (enemy.def.split) {
        for (let i = 0; i < enemy.def.split.count; i++) {
          this.ctx.spawnEnemyAt(enemy.def.split.child, enemy.pathIndex, enemy.dist);
        }
      }
      this.ctx.emit({ type: 'kill', enemyId: enemy.def.id });
    }
  }

  // ---------- 弹道 ----------
  private updateProjectiles(dt: number, enemies: EnemyR[], towers: TowerR[]): void {
    for (const p of this.projectiles) {
      // 目标查找：活目标优先；视觉弹道（dmg=0）允许飞向已死目标的最后位置
      // （扫射/溅射的视觉弹道 spawn 时伤害已结算，敌人可能同帧已 dead——否则弹道一出生就被清除，看不到轨迹）
      let target = enemies.find((e) => e.uid === p.targetUid && !e.dead);
      if (!target && p.dmg === 0) {
        const corpse = enemies.find((e) => e.uid === p.targetUid);
        if (corpse) {
          target = corpse;
        } else if (p.destX !== undefined && p.destY !== undefined) {
          // 敌人已被 cleanup 移除：飞向记录的最后位置
          const dx = p.destX - p.x, dy = p.destY - p.y;
          const dist = Math.hypot(dx, dy);
          const step = PROJ_SPEED * dt;
          if (dist <= step) p.dead = true;
          else { p.x += (dx / dist) * step; p.y += (dy / dist) * step; }
          continue;
        } else {
          p.dead = true; continue;
        }
      }
      if (!target) { p.dead = true; continue; }
      // 记录目标最后位置（供目标消失后续飞）
      p.destX = target.x; p.destY = target.y;
      const dx = target.x - p.x, dy = target.y - p.y;
      const dist = Math.hypot(dx, dy);
      const step = PROJ_SPEED * dt;
      if (dist <= step) {
        p.x = target.x; p.y = target.y;
        if (p.dmg > 0) {
          const vis = p.school !== undefined ? { school: p.school, tier: (p.tier ?? 0) as 0 | 1 | 2 } : undefined;
          this.damage(target, p.dmg, towers, enemies, p.crit, vis);
        }
        if (p.slowMul !== undefined && p.slowDuration !== undefined && p.dmg > 0) {
          target.slowFactor = p.slowMul;
          target.slowUntil = this.ctx.elapsed() + p.slowDuration;
        }
        p.dead = true;
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
      }
    }
  }

  // ---------- 特效 & 清理 ----------
  private updateEffects(dt: number, enemies: EnemyR[]): void {
    for (const e of enemies) {
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.slowUntil > 0 && this.ctx.elapsed() >= e.slowUntil) e.slowFactor = 1;
    }
    for (const fx of this.effects) { fx.life -= dt; fx.y += fx.vy * dt; }
    this.effects = this.effects.filter((fx) => fx.life > 0);
  }

  private cleanupProjectiles(): void {
    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }
}
