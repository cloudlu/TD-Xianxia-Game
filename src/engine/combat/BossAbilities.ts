// BOSS 周期技能 & 敌人能力（设计文档 §5.4）
// 从 Game.ts 抽离，每项能力为独立纯函数，便于单测和后续扩展。
//
// 扩展指南：新增一项能力 = 在此文件写 handler +
// 在 applyBossAbilities 的 switch(ab.type) 中注册。
// （若能力数量 >10 可升级为正式 registry + 装饰器模式）

import type { EnemyConfig } from '../../types';

// ---------- 能力接口 ----------

/** BOSS 能力上下文：Game 传入的"可写视图"，避免暴露整个引擎 */
export interface BossCtx {
  elapsed: number;
  dt: number;
  spawn: (enemyId: string, pathIndex: number, dist: number) => void;
}

/** 敌人运行时状态（能力 handler 需要读/写的字段） */
export interface BossEnemy {
  uid: number;
  def: EnemyConfig;
  hp: number;
  maxHp: number;
  pathIndex: number;
  dist: number;
  x: number; y: number;
  abilityTimer: number;
  speedMul: number;
}

/** 塔运行时状态（魅惑/撞塔需要读/写的字段） */
export interface BossTower {
  uid: number;
  x: number; y: number;
  def: { behavior: string };
  disabledUntil: number;
  knockImmuneUntil: number;
}

// ---------- 单独能力 handler（纯函数，可单测） ----------

/** 狂暴：血量低于阈值时加速 */
export function applyEnrage(e: BossEnemy): void {
  const ab = e.def.bossAbility?.enrageBelow;
  if (!ab) return;
  e.speedMul = e.hp / e.maxHp < ab.hpPct ? ab.speedMul : 1;
}

/** 魅惑：范围内塔瘫痪（aura 塔免疫） */
export function applyCharm(e: BossEnemy, towers: BossTower[], elapsed: number): void {
  const ab = e.def.bossAbility;
  if (!ab?.charmRadius || !ab.charmDuration) return;
  const R = ab.charmRadius, D = Math.min(3, ab.charmDuration);
  for (const t of towers) {
    if (t.def.behavior === 'aura') continue;
    const dx = t.x - e.x, dy = t.y - e.y;
    if (dx * dx + dy * dy > R * R) continue;
    if (elapsed < t.knockImmuneUntil) continue;
    t.disabledUntil = elapsed + D;
    t.knockImmuneUntil = elapsed + 6;
  }
}

/** 召唤：在 BOSS 位置生成小弟 */
export function applySummon(e: BossEnemy, ctx: BossCtx): void {
  const ab = e.def.bossAbility;
  if (!ab?.summon) return;
  const enraged = ab.enrageBelow && e.hp / e.maxHp < ab.enrageBelow.hpPct;
  const count = enraged ? (ab.enrageBelow?.summonCount ?? ab.summon.count) : ab.summon.count;
  for (let i = 0; i < count; i++) {
    ctx.spawn(ab.summon.enemy, e.pathIndex, e.dist);
  }
}

/** 撞塔（非 BOSS 能力，但结构相同——经过塔时使其瘫痪） */
export function applyKnockback(
  enemies: ReadonlyArray<{ def: EnemyConfig; x: number; y: number }>,
  towers: BossTower[],
  elapsed: number,
): void {
  const REACH = 0.9, DISABLE = 2, IMMUNE = 6;
  for (const e of enemies) {
    if (!e.def.knockback) continue;
    for (const t of towers) {
      if (t.def.behavior === 'aura') continue;
      const dx = e.x - t.x, dy = e.y - t.y;
      if (dx * dx + dy * dy > REACH * REACH) continue;
      if (elapsed < t.knockImmuneUntil) continue;
      t.disabledUntil = elapsed + DISABLE;
      t.knockImmuneUntil = elapsed + IMMUNE;
    }
  }
}

// ---------- 主入口：一帧内为所有 BOSS 执行周期技能 ----------

/** 一帧内对所有 BOSS 执行周期能力（含狂暴/魅惑/召唤） */
export function applyBossAbilities(
  enemies: BossEnemy[],
  towers: BossTower[],
  ctx: BossCtx,
  bossCdMul: number,
): void {
  for (const e of enemies) {
    if (!e.def.bossAbility) continue;

    // 狂暴：每帧刷新
    applyEnrage(e);

    e.abilityTimer -= ctx.dt;
    if (e.abilityTimer > 0) continue;
    e.abilityTimer = e.def.bossAbility.interval * bossCdMul;

    // 魅惑
    applyCharm(e, towers, ctx.elapsed);
    // 召唤
    applySummon(e, ctx);
  }
}
