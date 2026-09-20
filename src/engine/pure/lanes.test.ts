import { describe, it, expect } from 'vitest';
import { buildLanePaths, shouldTriggerSweep, pickupSchedule, pickupExpired, makePickup } from './lanes';
import { mulberry32 } from '../PRNG';
import type { LaneConfig } from '../../types';

describe('buildLanePaths', () => {
  it('生成等长横向车道（路点 2 个，横贯全图）', () => {
    const paths = buildLanePaths(32, 12, [2, 6, 9]);
    expect(paths.length).toBe(3);
    for (const p of paths) {
      expect(p.length).toBe(2);
      expect(p[0].x).toBe(0);
      expect(p[1].x).toBe(31);
      expect(p[0].y).toBe(p[1].y);
    }
    expect(paths[0][0].y).toBe(2);
    expect(paths[1][0].y).toBe(6);
    expect(paths[2][0].y).toBe(9);
  });
});

describe('shouldTriggerSweep', () => {
  it('敌人到达触发线（含半格中心容差）触发', () => {
    expect(shouldTriggerSweep(4.2, 4)).toBe(true);
    expect(shouldTriggerSweep(4.5, 4)).toBe(true);  // 格中心
    expect(shouldTriggerSweep(4.6, 4)).toBe(false);
    expect(shouldTriggerSweep(2, 4)).toBe(true);    // 越过更触发
  });
});

describe('pickupSchedule', () => {
  const cfg: LaneConfig['pickup'] = { value: 8, intervalSec: 6, maxPerWave: 4 };
  it('确定性：同 seed 同结果', () => {
    const a = pickupSchedule([2, 6, 9], 32, cfg, 100, 40, mulberry32(42));
    const b = pickupSchedule([2, 6, 9], 32, cfg, 100, 40, mulberry32(42));
    expect(a).toEqual(b);
  });
  it('数量封顶 maxPerWave，时刻在窗口内，行列合法', () => {
    const list = pickupSchedule([2, 6, 9], 32, cfg, 100, 40, mulberry32(7));
    expect(list.length).toBeLessThanOrEqual(4);
    expect(list.length).toBeGreaterThan(0);
    for (const p of list) {
      expect(p.at).toBeGreaterThanOrEqual(100);
      expect(p.at).toBeLessThan(140);
      expect(p.col).toBeGreaterThanOrEqual(2);
      expect(p.col).toBeLessThanOrEqual(27);
      expect([2, 6, 9]).toContain(p.row);
    }
  });
  it('maxPerWave=0 或窗口过短返回空', () => {
    expect(pickupSchedule([2], 32, cfg, 0, 0, mulberry32(1))).toEqual([]);
    expect(pickupSchedule([2], 32, { ...cfg, maxPerWave: 0 }, 0, 40, mulberry32(1))).toEqual([]);
  });
});

describe('pickup 生命周期', () => {
  it('过期判定：超过 lifeSec 消失', () => {
    const seq = { n: 1 };
    const p = makePickup(seq, 5, 6, 8, 10, 10);
    expect(p.uid).toBe(1);
    expect(pickupExpired(p, 19)).toBe(false);
    expect(pickupExpired(p, 21)).toBe(true);
  });
  it('uid 序列自增', () => {
    const seq = { n: 100 };
    const a = makePickup(seq, 1, 1, 1, 0);
    const b = makePickup(seq, 2, 2, 2, 0);
    expect(b.uid).toBe(a.uid + 1);
  });
});
