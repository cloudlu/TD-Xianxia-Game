import { describe, it, expect } from 'vitest';
import { spiritColor, spiritHi, fiendColor, SPIRIT_TIERS } from './palette';
import { dayPhaseTint, zoomPulseScale } from '../../ui/boardFx';

describe('palette', () => {
  it('spiritColor maps tier to color scale and clamps', () => {
    expect(spiritColor(0)).toBe(SPIRIT_TIERS[0]);
    expect(spiritColor(1)).toBe(SPIRIT_TIERS[1]);
    expect(spiritColor(2)).toBe(SPIRIT_TIERS[2]);
    expect(spiritColor(-1)).toBe(SPIRIT_TIERS[0]);   // 钳到首
    expect(spiritColor(9)).toBe(SPIRIT_TIERS[2]);    // 钳到尾
  });

  it('spiritHi mirrors tier scale', () => {
    expect(spiritHi(0)).not.toBe(spiritHi(2));
  });

  it('fiendColor clamps to 3 ranks', () => {
    expect(fiendColor(0)).toMatch(/^#/);
    expect(fiendColor(5)).toBe(fiendColor(2));
  });
});

describe('dayPhaseTint', () => {
  it('single wave level yields morning tint', () => {
    const t = dayPhaseTint(0, 1);
    expect(t.color).toMatch(/^#[0-9a-f]{6}$/);
    expect(t.alpha).toBeGreaterThanOrEqual(0);
  });

  it('progresses morning → noon → dusk across waves', () => {
    const first = dayPhaseTint(0, 5);
    const mid = dayPhaseTint(2, 5);
    const last = dayPhaseTint(4, 5);
    expect(first.alpha).toBeGreaterThan(0);          // 晨蓝
    expect(mid.alpha).toBeCloseTo(0, 3);             // 正午无色温
    expect(last.alpha).toBeGreaterThan(0);           // 暮橙
    expect(last.color).not.toBe(first.color);
  });
});

describe('zoomPulseScale', () => {
  it('returns 1 when idle', () => {
    expect(zoomPulseScale(-1, 10)).toBe(1);
    expect(zoomPulseScale(5, 10)).toBe(1);           // 已过期
  });

  it('peaks just after trigger and decays to 1', () => {
    const peak = zoomPulseScale(10, 10.01);
    expect(peak).toBeGreaterThan(1.001);
    expect(peak).toBeLessThanOrEqual(1.05);
    expect(zoomPulseScale(10, 10.31)).toBe(1);
  });
});
