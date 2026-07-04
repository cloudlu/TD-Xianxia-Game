// 经济结算的纯函数（设计文档 §4.3 升级费 / §6.2 出售返还）
import type { TowerConfig } from '../../types';

/** 已投入总灵石 = 建造费 + 历次升级费 */
export function investedCost(def: TowerConfig, level: number): number {
  let sum = def.cost;
  for (let i = 1; i <= level; i++) sum += def.levels[i].upgradeCost ?? 0;
  return sum;
}

/** 出售返还 = floor(已投入 × sellRatio) */
export function sellRefund(def: TowerConfig, level: number): number {
  return Math.floor(investedCost(def, level) * def.sellRatio);
}

/** 升到下一境界的费用；已满级返回 null */
export function nextUpgradeCost(def: TowerConfig, level: number): number | null {
  if (level >= def.levels.length - 1) return null;
  return def.levels[level + 1].upgradeCost ?? null;
}
