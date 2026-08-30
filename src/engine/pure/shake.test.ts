import { describe, it, expect } from 'vitest';
import { ShakeState, NO_SHAKE, triggerShake, shakeOffset, isShaking } from './shake';

describe('shake', () => {
  it('no shake when state idle', () => {
    expect(shakeOffset(NO_SHAKE, 10)).toEqual({ x: 0, y: 0 });
    expect(isShaking(NO_SHAKE, 10)).toBe(false);
  });

  it('triggerShake sets intensity and until', () => {
    const s = triggerShake(NO_SHAKE, 6, 0.3, 10);
    expect(s.intensity).toBe(6);
    expect(s.until).toBeCloseTo(10.3);
    expect(isShaking(s, 10)).toBe(true);
    expect(isShaking(s, 10.31)).toBe(false);
  });

  it('stronger trigger overrides weaker active shake', () => {
    let s = triggerShake(NO_SHAKE, 4, 0.3, 10);
    s = triggerShake(s, 8, 0.2, 10.1);
    expect(s.intensity).toBe(8);
  });

  it('weaker trigger does not override stronger active shake', () => {
    let s = triggerShake(NO_SHAKE, 8, 0.3, 10);
    s = triggerShake(s, 4, 0.2, 10.1);
    expect(s.intensity).toBe(8);
  });

  it('offset is deterministic for same elapsed and decays to zero at expiry', () => {
    const s = triggerShake(NO_SHAKE, 5, 0.5, 0);
    const a = shakeOffset(s, 0.1);
    const b = shakeOffset(s, 0.1);
    expect(a).toEqual(b);
    // 过期后归零
    expect(shakeOffset(s, 0.6)).toEqual({ x: 0, y: 0 });
    // 幅度不超过强度
    for (let t = 0; t < 0.5; t += 0.05) {
      const o = shakeOffset(s, t);
      expect(Math.abs(o.x)).toBeLessThanOrEqual(5);
      expect(Math.abs(o.y)).toBeLessThanOrEqual(5);
    }
  });
});
