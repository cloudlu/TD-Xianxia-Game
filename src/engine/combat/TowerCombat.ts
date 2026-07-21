// 塔战斗系统（设计文档 §1.3）：负责塔攻击 / 弹道 / 伤害 / 光环 / BOSS 技能 / 撞塔
// 拥有 projectiles[], effects[], killStack
// Game 每帧调用 update() 驱动战斗，传入敌人和塔的引用直接修改状态。

import { canHitFlying, resolveHit } from '../pure/combat';
import { targetPriorityKey } from '../pure/targeting';
import type { EnemyR } from '../WaveManager';
import type { TowerR } from '../TowerOperations';
import type { TargetPolicy } from '../../types';
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

const PROJ_SPEED = 14;

interface ProjectileR {
  x: number; y: number;
  targetUid: number;
  dmg: number;
  color: string;
  dead: boolean;
  slowMul?: number;
  slowDuration?: number;
}

export interface VisEffect {
  kind: 'dmg' | 'poof' | 'shockwave' | 'burst';
  x: number; y: number;
  text?: string;
  color: string;
  life: number; maxLife: number;
  vy: number;
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
      range: Math.round((lv.range + stats.rangeAdd) * 10) / 10,
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
      const range = lv.range + stats.rangeAdd;
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
    for (const e of enemies) {
      if (!canHitFlying(hitsAir, !!e.def.fly)) continue;
      if (e.def.stealth && !this.isRevealed(e, towers)) continue;
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
    strategy.execute(t, primary, this.combatContext(towers, enemies));
    const doubleAtk = this.ctx.mods.doubleAtkChance();
    if (doubleAtk > 0 && this.ctx.rng() < doubleAtk) {
      const lv = t.def.levels[t.level];
      const stats = this.effectiveStats(t, towers, enemies);
      const range = lv.range + stats.rangeAdd;
      const secondary = this.acquireTarget(t, range, t.targetPolicy, enemies, towers);
      if (secondary && secondary.uid !== primary.uid) {
        strategy.execute(t, secondary, this.combatContext(towers, enemies));
      }
    }
  }

  private combatContext(towers: TowerR[], enemies: EnemyR[]): CombatContext {
    return {
      rng: () => this.ctx.rng(),
      effectiveStats: (t) => this.effectiveStats(t, towers, enemies),
      spawnProjectile: (p: any) => { this.projectiles.push(p); },
      damage: (e, raw) => { this.damage(e, raw, towers, enemies); },
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
    const dmgMul = (1 + aura.dmgMul + killStackBonus) * this.ctx.mods.damageMul(damageStatsFor(school)) * this.ctx.towerMul * this.ctx.destinyBoost * this.ctx.mods.soulShardMul();
    const rateMul = (1 + aura.rateMul) * this.ctx.mods.rateMul() * this.ctx.towerMul;
    return { dmgMul, rateMul, rangeAdd: this.ctx.mods.rangeAdd(), critBonus: this.ctx.mods.critBonus() };
  }

  private enemiesInRange(t: CombatTower, range: number, enemies: EnemyR[], towers: TowerR[]): CombatEnemy[] {
    const hitsAir = !!t.def.hitsAir;
    return enemies.filter((e) => {
      if (!canHitFlying(hitsAir, !!e.def.fly)) return false;
      if (e.def.stealth && !this.isRevealed(e, towers)) return false;
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
      const r = t.def.levels[t.level].range;
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
      const dx = a.x - t.x, dy = a.y - t.y;
      if (dx * dx + dy * dy <= al.range * al.range) {
        dmgMul += al.auraBuff?.dmgMul ?? 0;
        rateMul += al.auraBuff?.rateMul ?? 0;
      }
    }
    return { dmgMul: Math.min(dmgMul, 0.8), rateMul: Math.min(rateMul, 0.8) };
  }

  // ---------- 伤害 ----------
  private damage(e: CombatEnemy, raw: number, towers: TowerR[], enemies: EnemyR[]): void {
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
      enemy.hitFlash = 0.12;
      this.effects.push({ kind: 'dmg', x: enemy.x, y: enemy.y, text: String(Math.round(dealt)), color: '#ffffff', life: 0.7, maxLife: 0.7, vy: -1.4 });
    }
    if (enemy.hp <= 0) {
      enemy.dead = true;
      this.killStack++;
      this.ctx.addStones(enemy.bounty * this.ctx.mods.bountyMul() * this.ctx.difficultyBountyMul);
      this.effects.push({ kind: 'poof', x: enemy.x, y: enemy.y, color: enemy.def.color, life: 0.35, maxLife: 0.35, vy: 0 });
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
      const target = enemies.find((e) => e.uid === p.targetUid && !e.dead);
      if (!target) { p.dead = true; continue; }
      const dx = target.x - p.x, dy = target.y - p.y;
      const dist = Math.hypot(dx, dy);
      const step = PROJ_SPEED * dt;
      if (dist <= step) {
        p.x = target.x; p.y = target.y;
        if (p.dmg > 0) this.damage(target, p.dmg, towers, enemies);
        if (p.slowMul !== undefined && p.slowDuration !== undefined) {
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
