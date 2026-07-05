import { describe, it, expect } from 'vitest';
import { investedCost, sellRefund, nextUpgradeCost } from './economy';
import { TOWERS } from '../../data/config';

// 用真实配置（飞剑修士，v0.6 平衡调整后数值）做断言
const sword = TOWERS.flying_sword;

describe('investedCost', () => {
  it('equals build cost at level 0 (炼气)', () => {
    expect(investedCost(sword, 0)).toBe(70);
  });

  it('accumulates upgrade costs through 化神', () => {
    // 70 + 60 + 100 + 170 + 280 = 680
    expect(investedCost(sword, 4)).toBe(680);
  });
});

describe('sellRefund', () => {
  it('returns floor(invested × 0.6) for a fresh tower', () => {
    expect(sellRefund(sword, 0)).toBe(Math.floor(70 * 0.6)); // 42
  });

  it('scales refund by total invested after upgrades', () => {
    expect(sellRefund(sword, 4)).toBe(Math.floor(680 * 0.6)); // 408
  });
});

describe('nextUpgradeCost', () => {
  it('returns the next realm cost', () => {
    expect(nextUpgradeCost(sword, 0)).toBe(60); // 筑基
  });

  it('returns null when already at max realm (渡劫)', () => {
    expect(nextUpgradeCost(sword, 5)).toBeNull();
  });
});
