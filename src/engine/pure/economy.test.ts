import { describe, it, expect } from 'vitest';
import { investedCost, sellRefund, nextUpgradeCost } from './economy';
import { TOWERS } from '../../data/config';

// 用真实配置（飞剑修士，对应设计文档 §4.3 数值表）做断言
const sword = TOWERS.flying_sword;

describe('investedCost', () => {
  it('equals build cost at level 0 (炼气)', () => {
    expect(investedCost(sword, 0)).toBe(80);
  });

  it('accumulates upgrade costs through 化神', () => {
    // 80 + 60 + 100 + 170 + 280 = 690
    expect(investedCost(sword, 4)).toBe(690);
  });
});

describe('sellRefund', () => {
  it('returns floor(invested × 0.6) for a fresh tower', () => {
    expect(sellRefund(sword, 0)).toBe(Math.floor(80 * 0.6)); // 48
  });

  it('scales refund by total invested after upgrades', () => {
    expect(sellRefund(sword, 4)).toBe(Math.floor(690 * 0.6)); // 414
  });
});

describe('nextUpgradeCost', () => {
  it('returns the next realm cost', () => {
    expect(nextUpgradeCost(sword, 0)).toBe(60); // 筑基
  });

  it('returns null when already at max realm (化神)', () => {
    expect(nextUpgradeCost(sword, 4)).toBeNull();
  });
});
