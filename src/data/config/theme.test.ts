import { describe, it, expect } from 'vitest';
import { toon, hexToHsl, hslToHex } from './theme';

describe('toon（卡通色阶映射）', () => {
  it('brightens dark colors while preserving hue (ch1 深蓝 → 亮蓝紫)', () => {
    const src = '#0d0d1e';
    const out = toon(src);
    const before = hexToHsl(src);
    const after = hexToHsl(out);
    expect(after.l).toBeGreaterThan(before.l);          // 提亮
    expect(Math.abs(after.h - before.h)).toBeLessThan(15); // 色相保持（蓝紫域）
    expect(out).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('ch4 deep green → bright grass green (抹茶绿)', () => {
    const after = hexToHsl(toon('#0a140a'));
    expect(after.h).toBeGreaterThan(90);    // 绿色域
    expect(after.h).toBeLessThan(160);
    expect(after.l).toBeGreaterThanOrEqual(0.44);
  });

  it('clamps lightness into 0.45-0.70 band for mid/dark colors', () => {
    for (const hex of ['#0d0d1e', '#1a1a30', '#2a1440', '#334455']) {
      const { l } = hexToHsl(toon(hex));
      expect(l).toBeGreaterThanOrEqual(0.44);
      expect(l).toBeLessThanOrEqual(0.71);
    }
  });

  it('boosts saturation (max 0.85) for washed colors', () => {
    const out = hexToHsl(toon('#8a8a7a'));
    expect(out.s).toBeGreaterThan(0.05);
    expect(out.s).toBeLessThanOrEqual(0.86);
  });

  it('passes through non-6-hex inputs untouched (特效带透明度色)', () => {
    expect(toon('#ffd70055')).toBe('#ffd70055');
    expect(toon('rgba(1,2,3,0.5)')).toBe('rgba(1,2,3,0.5)');
  });

  it('hex/hsl roundtrip is stable', () => {
    const hex = '#66bb6a';
    const hsl = hexToHsl(hex);
    const back = hexToHsl(hslToHex(hsl.h, hsl.s, hsl.l));
    expect(back.h).toBeCloseTo(hsl.h, 0);
    expect(back.s).toBeCloseTo(hsl.s, 2);
    expect(back.l).toBeCloseTo(hsl.l, 2);
  });
});
