import { describe, it, expect } from 'vitest';
import { towerRange, WIND_RANGE_ADD } from './effectiveRange';

describe('towerRange (唯一有效射程计算)', () => {
  it('基础射程 + mods 加成', () => {
    expect(towerRange(2.5, 1.0, null)).toBe(3.5);
    expect(towerRange(2.5, 0, null)).toBe(2.5);
  });

  it('风阵阵眼额外 +1.5', () => {
    expect(towerRange(2.5, 0, 'wind')).toBeCloseTo(2.5 + WIND_RANGE_ADD, 5);
    expect(towerRange(2.5, 1.0, 'wind')).toBeCloseTo(2.5 + 1.0 + WIND_RANGE_ADD, 5);
  });

  it('非风阵眼无加成', () => {
    expect(towerRange(2.5, 0, 'earth')).toBe(2.5);
    expect(towerRange(2.5, 0, undefined)).toBe(2.5);
  });

  it('四舍五入到 0.1', () => {
    expect(towerRange(2.55, 0, null)).toBe(2.6);
  });
});
