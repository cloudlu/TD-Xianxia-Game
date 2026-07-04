import { describe, it, expect } from 'vitest';
import { ModifierSet, damageStatsFor, CAPS } from './Modifier';
import type { Modifier } from './Modifier';

const mod = (stat: string, op: 'add' | 'mul_pct', value: number): Modifier => ({ stat, op, value });

describe('ModifierSet', () => {
  it('sums mul_pct for the same stat additively', () => {
    const ms = new ModifierSet([mod('dmg', 'mul_pct', 0.15), mod('dmg', 'mul_pct', 0.10)]);
    expect(ms.pctFor('dmg')).toBeCloseTo(0.25, 5);
  });

  it('keeps add and mul_pct separate per stat', () => {
    const ms = new ModifierSet([mod('crit', 'add', 0.1), mod('crit', 'mul_pct', 0.2)]);
    expect(ms.addFor('crit')).toBeCloseTo(0.1, 5);
    expect(ms.pctFor('crit')).toBeCloseTo(0.2, 5);
  });

  it('merges damage family additively across dmg + school stat, then caps', () => {
    // dmg +0.6, swordDmg +1.2 → 合并 1.8，封顶 1.5
    const ms = new ModifierSet([mod('dmg', 'mul_pct', 0.6), mod('swordDmg', 'mul_pct', 1.2)]);
    expect(ms.damageMul(damageStatsFor('sword'))).toBeCloseTo(1 + CAPS.damage, 5);
  });

  it('does NOT multiply across damage stats (cross-stat rule)', () => {
    // 若误用乘法：(1+0.6)*(1+0.2)=1.92；正确为加法合并 1+0.8=1.8
    const ms = new ModifierSet([mod('dmg', 'mul_pct', 0.6), mod('swordDmg', 'mul_pct', 0.2)]);
    expect(ms.damageMul(damageStatsFor('sword'))).toBeCloseTo(1.8, 5);
  });

  it('rateMul / bountyMul apply their own caps', () => {
    const ms = new ModifierSet([mod('rate', 'mul_pct', 1.0), mod('bountyMul', 'mul_pct', 1.0)]);
    expect(ms.rateMul()).toBeCloseTo(1 + CAPS.rate, 5);
    expect(ms.bountyMul()).toBeCloseTo(1 + CAPS.bounty, 5);
  });

  it('critBonus and rangeAdd cap at absolute values', () => {
    const ms = new ModifierSet([mod('crit', 'add', 0.9), mod('range', 'add', 5)]);
    expect(ms.critBonus()).toBeCloseTo(CAPS.crit, 5);
    expect(ms.rangeAdd()).toBeCloseTo(CAPS.range, 5);
  });

  it('merge flattens multiple equipment sources into one set', () => {
    const ms = ModifierSet.merge([
      [mod('dmg', 'mul_pct', 0.10)],
      [mod('dmg', 'mul_pct', 0.15), mod('rate', 'mul_pct', 0.08)],
    ]);
    expect(ms.pctFor('dmg')).toBeCloseTo(0.25, 5);
    expect(ms.pctFor('rate')).toBeCloseTo(0.08, 5);
  });

  it('empty set yields neutral multipliers', () => {
    const ms = ModifierSet.empty;
    expect(ms.damageMul(['dmg'])).toBe(1);
    expect(ms.rateMul()).toBe(1);
    expect(ms.bountyMul()).toBe(1);
    expect(ms.critBonus()).toBe(0);
    expect(ms.rangeAdd()).toBe(0);
  });
});
