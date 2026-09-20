import { describe, it, expect } from 'vitest';
import { randomSpawnCol, windShiftedCol, sweeperColumns, spawnWarnings, colWarningActive } from './stream';
import { mulberry32 } from '../PRNG';

describe('randomSpawnCol', () => {
  it('确定性：同种子同序列', () => {
    const a = Array.from({ length: 10 }, () => randomSpawnCol(16, mulberry32(7)));
    const b = Array.from({ length: 10 }, () => randomSpawnCol(16, mulberry32(7)));
    expect(a).toEqual(b);
  });
  it('范围 [0, cols)', () => {
    for (let i = 0; i < 200; i++) {
      const c = randomSpawnCol(16, mulberry32(i));
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(16);
    }
  });
});

describe('windShiftedCol', () => {
  it('偏移在 ±maxShift 内并钳制边界', () => {
    for (let i = 0; i < 100; i++) {
      const c = windShiftedCol(5, 16, 2, mulberry32(i));
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(16);
      expect(Math.abs(c - 5)).toBeLessThanOrEqual(2);
    }
  });
  it('边界列不出界', () => {
    for (let i = 0; i < 50; i++) {
      expect(windShiftedCol(0, 16, 2, mulberry32(i))).toBeLessThan(16);
      expect(windShiftedCol(15, 16, 2, mulberry32(i))).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('sweeperColumns', () => {
  it('不重复、升序、数量正确、确定性', () => {
    const a = sweeperColumns(16, 4, mulberry32(3));
    const b = sweeperColumns(16, 4, mulberry32(3));
    expect(a).toEqual(b);
    expect(a.length).toBe(4);
    expect(new Set(a).size).toBe(4);
    expect([...a].sort((x, y) => x - y)).toEqual(a);
    for (const c of a) expect(c).toBeLessThan(16);
  });
  it('count 超过 cols 时封顶', () => {
    expect(sweeperColumns(5, 9, mulberry32(1)).length).toBe(5);
  });
});

describe('spawnWarnings', () => {
  it('预警 = 出生时刻 - lead，且不早于 0', () => {
    expect(spawnWarnings([5, 0.5, 12])).toEqual([4, 0, 11]);
  });
  it('预警窗口判定', () => {
    expect(colWarningActive(4, 5, 4.5)).toBe(true);
    expect(colWarningActive(4, 5, 5)).toBe(false);   // 出生瞬间窗口关闭
    expect(colWarningActive(4, 5, 3.9)).toBe(false);
  });
});
