import { describe, it, expect } from 'vitest';
import { armorMultiplier, applyDamage, canHitFlying, absorbShield, resolveHit, enrageMul } from './combat';

describe('armorMultiplier', () => {
  it('returns 1.0 when armor is 0', () => {
    expect(armorMultiplier(0)).toBeCloseTo(1.0, 5);
  });

  it('reduces damage to ~71% at armor 40 (魔甲傀儡)', () => {
    expect(armorMultiplier(40)).toBeCloseTo(100 / 140, 5);
  });

  it('halves damage at armor 100', () => {
    expect(armorMultiplier(100)).toBeCloseTo(0.5, 5);
  });
});

describe('applyDamage', () => {
  it('subtracts armor-reduced damage from hp', () => {
    // 100 raw vs 0 armor → 100 dmg
    expect(applyDamage(200, 100, 0)).toBeCloseTo(100, 5);
  });

  it('applies armor reduction before subtracting', () => {
    // hp 180, raw 20, armor 8 → dmg = 20 * 100/108 ≈ 18.52 → hp ≈ 161.48
    expect(applyDamage(180, 20, 8)).toBeCloseTo(180 - 20 * (100 / 108), 5);
  });
});

describe('canHitFlying', () => {
  it('ground tower cannot hit flying enemy', () => {
    expect(canHitFlying(false, true)).toBe(false);
  });
  it('air-capable tower can hit flying enemy', () => {
    expect(canHitFlying(true, true)).toBe(true);
  });
  it('any tower can hit ground enemy', () => {
    expect(canHitFlying(false, false)).toBe(true);
    expect(canHitFlying(true, false)).toBe(true);
  });
});

describe('absorbShield', () => {
  it('passes full damage through when there is no shield', () => {
    expect(absorbShield(0, 50)).toEqual({ shield: 0, remain: 50 });
  });
  it('fully absorbs small hits, leaving shield and no remain', () => {
    expect(absorbShield(60, 20)).toEqual({ shield: 40, remain: 0 });
  });
  it('partially absorbs big hits, remainder pierces', () => {
    expect(absorbShield(30, 80)).toEqual({ shield: 0, remain: 50 });
  });
});

describe('resolveHit', () => {
  it('applies armor reduction with no shield/lifesteal', () => {
    const r = resolveHit(200, 200, 0, 100, 0, 0);
    expect(r.hp).toBeCloseTo(100, 5);
    expect(r.shield).toBe(0);
  });

  it('breaks shield first, then armor on the remainder', () => {
    const r = resolveHit(200, 200, 30, 80, 0, 0); // 30 盾吸 30，余 50 穿透
    expect(r.shield).toBe(0);
    expect(r.hp).toBeCloseTo(150, 5);
  });

  it('heals on real damage, rewarding burst over many small hits', () => {
    // 一次 100 命中、回血 10 → 净损 90
    const burst = resolveHit(200, 200, 0, 100, 0, 10);
    expect(burst.hp).toBeCloseTo(110, 5);
    // 五次 20 命中、每次回血 10 → 每次净损 10，五次后仅损 50（远不如爆发）
    let hp = 200;
    for (let i = 0; i < 5; i++) hp = resolveHit(hp, 200, 0, 20, 0, 10).hp;
    expect(hp).toBeCloseTo(150, 5);
  });

  it('does not heal when shield fully absorbs the hit', () => {
    const r = resolveHit(200, 200, 60, 20, 0, 10); // 盾全吸，无血量损失
    expect(r.hp).toBe(200);
    expect(r.shield).toBe(40);
  });
});

describe('enrageMul', () => {
  const enrageBelow = { hpPct: 0.4, speedMul: 1.6 };
  it('returns 1 above the enrage threshold', () => {
    expect(enrageMul(0.8, enrageBelow)).toBe(1);
    expect(enrageMul(0.41, enrageBelow)).toBe(1);
  });
  it('returns the speed multiplier once below the threshold', () => {
    expect(enrageMul(0.39, enrageBelow)).toBeCloseTo(1.6, 5);
    expect(enrageMul(0.1, enrageBelow)).toBeCloseTo(1.6, 5);
  });
  it('returns 1 when no enrage config is present', () => {
    expect(enrageMul(0.1, undefined)).toBe(1);
  });
});
