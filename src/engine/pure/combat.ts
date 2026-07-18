// 战斗结算的纯函数（设计文档 §5.1 护甲减伤 / §5.4 飞行对空 / 护盾）
// 从 Game 抽离以便单测，Game 通过此模块调用（DRY）。

/** 护甲减伤系数：实际伤害 = 攻击力 × armorMultiplier(护甲) */
export function armorMultiplier(armor: number): number {
  return 100 / (100 + armor);
}

/** 应用一次攻击：返回扣减后的血量（不修改入参） */
export function applyDamage(hp: number, rawDamage: number, armor: number): number {
  return hp - rawDamage * armorMultiplier(armor);
}

/** 该塔能否命中该敌人（飞行怪需对空塔）—— 设计文档 §5.4 fly */
export function canHitFlying(towerHitsAir: boolean, enemyFlies: boolean): boolean {
  return !enemyFlies || towerHitsAir;
}

/** 暴击率上限（设计文档 §9.5：crit ≤ 0.6）—— 也用于 BOSS 狂暴判定阈值约定 */
export const CRIT_CAP_PURE = 0.6;

/** BOSS 狂暴：血量比例低于阈值时返回加速倍率，否则 1 */
export function enrageMul(
  hpRatio: number,
  enrageBelow?: { hpPct: number; speedMul: number },
): number {
  return enrageBelow && hpRatio < enrageBelow.hpPct ? enrageBelow.speedMul : 1;
}

/** 章节缩放：敌人 HP × hpMul，赏金 × bountyMul（经济适度跟上，缺省 sqrt(hpMul)） */
export function scaleEnemy(baseHp: number, baseBounty: number, hpMul: number, bountyMul?: number): { hp: number; bounty: number } {
  const bMul = bountyMul ?? Math.sqrt(hpMul);
  return { hp: Math.round(baseHp * hpMul), bounty: Math.round(baseBounty * bMul) };
}

/** 塔位缩放：自动从 hpMul 推导为 sqrt(hpMul)，与赏金同步保证经济-战力平衡 */
export function towerMulFrom(hpMul: number): number {
  return Math.sqrt(hpMul);
}
export function absorbShield(shield: number, rawDamage: number): { shield: number; remain: number } {
  if (shield <= 0) return { shield: 0, remain: Math.max(0, rawDamage) };
  const absorbed = Math.min(shield, rawDamage);
  return { shield: shield - absorbed, remain: rawDamage - absorbed };
}

/**
 * 一次命中的完整结算：破盾 → 护甲减伤 → 受击回血。
 * 回血仅在"确有血量损失"时触发（net>0），鼓励玩家用爆发伤害而非高频小伤。
 * 返回新的 hp 与 shield（不修改入参；死亡判定 hp<=0 由调用方做）。
 */
export function resolveHit(
  hp: number, maxHp: number, shield: number, rawDamage: number, armor: number, lifestealHp: number,
): { hp: number; shield: number } {
  const { shield: newShield, remain } = absorbShield(shield, rawDamage);
  const net = remain * armorMultiplier(armor);
  let newHp = hp - net;
  if (net > 0 && lifestealHp > 0) newHp = Math.min(maxHp, newHp + lifestealHp);
  return { hp: newHp, shield: newShield };
}


