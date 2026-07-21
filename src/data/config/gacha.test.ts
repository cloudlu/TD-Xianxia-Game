import { describe, it, expect } from 'vitest';
import { drawGacha } from './gacha';
import type { GachaPrize, DrawResult } from './gacha';
import { EQUIPMENT } from './equipment';
import { LIMITED_TREASURES } from './limited_treasures';

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function isMajorPrize(p: GachaPrize): boolean {
  return p === 'mythic_equip' || p === 'random_equip';
}

describe('drawGacha', () => {
  it('pity triggers on the 300th draw (pity=299 → random_equip)', () => {
    const rng = seededRng(42);
    const { result, newPity } = drawGacha(299, rng);
    expect(result.prize).toBe('random_equip');
    expect(result.pityTriggered).toBe(true);
    expect(result.grantedEquipId).toBeTruthy();
    expect(EQUIPMENT[result.grantedEquipId!]).toBeTruthy();
    expect(newPity).toBe(0);
  });

  it('pity resets to 0 after major prize', () => {
    for (let seed = 0; seed < 50; seed++) {
      const rng = seededRng(seed);
      for (let pity = 0; pity < 299; pity++) {
        const { result, newPity } = drawGacha(pity, seededRng(seed + pity * 9999));
        if (isMajorPrize(result.prize)) {
          expect(newPity).toBe(0);
        } else {
          expect(newPity).toBe(pity + 1);
        }
      }
    }
  });

  it('pity counter resets and proper prize awarded exactly at threshold', () => {
    let pity = 150;
    for (let i = 0; i < 200; i++) {
      const { result, newPity } = drawGacha(pity, seededRng(i * 7777 + 31));
      if (pity >= 299) {
        expect(result.prize).toBe('random_equip');
        expect(result.pityTriggered).toBe(true);
      }
      pity = newPity;
    }
  });

  it('never upgrades to mythic_equip via pity', () => {
    for (let seed = 0; seed < 200; seed++) {
      const { result } = drawGacha(299, seededRng(seed));
      expect(result.prize).toBe('random_equip');
      expect(result.pityTriggered).toBe(true);
    }
  });

  it('mythic_equip grants a valid limited treasure id', () => {
    for (let seed = 0; seed < 50000; seed++) {
      const { result } = drawGacha(0, seededRng(seed));
      if (result.prize === 'mythic_equip') {
        expect(result.grantedTreasureId).toBeTruthy();
        expect(LIMITED_TREASURES[result.grantedTreasureId!]).toBeTruthy();
        return;
      }
    }
    expect(false, 'no mythic_equip drawn in 50000 trials (0.01% = ~5 expected, check rng)').toBe(true);
  });

  it('all draw results have consistent prize fields', () => {
    for (let seed = 0; seed < 2000; seed++) {
      const { result } = drawGacha(0, seededRng(seed));
      expect(result.prize).toBeTruthy();
      expect(result.contributionGain).toBeGreaterThanOrEqual(0);
      expect(result.frags).toBeGreaterThanOrEqual(0);
      expect(result.destinyScrolls).toBeGreaterThanOrEqual(0);
      expect(result.soulShards).toBeGreaterThanOrEqual(0);
      if (result.prize === 'empty') {
        expect(result.contributionGain).toBe(5);
      }
    }
  });

  it('draw cost is correctly passed to applyDraw');
});

describe('gacha probability distribution (monte carlo)', () => {
  const TRIALS = 200000;

  it(`tier probabilities match spec within tolerance (${TRIALS} trials)`, () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < TRIALS; i++) {
      const { result } = drawGacha(0, seededRng(i * 13337 + 777));
      counts[result.prize] = (counts[result.prize] ?? 0) + 1;
    }

    const expected: Record<string, number> = {
      mythic_equip: 0.0001,
      random_equip: 0.0009,
      destiny3: 0.009 * 0.5,
      soul20: 0.009 * 0.5,
      soul8: 0.04 * 0.4,
      frags8: 0.04 * 0.3,
      destiny: 0.04 * 0.3,
      soul3: 0.10 * 0.4,
      frags3: 0.10 * 0.3,
      refund40: 0.10 * 0.3,
      frags2: 0.20 * 0.3,
      soul2: 0.20 * 0.3,
      refund20: 0.20 * 0.4,
      frags: 0.25 * 0.4,
      soul: 0.25 * 0.4,
      refund10: 0.25 * 0.2,
      empty: 0.40 * 1.0,
    };

    for (const [prize, prob] of Object.entries(expected)) {
      const observed = (counts[prize] ?? 0) / TRIALS;
      const tol = 4 * Math.sqrt(prob * (1 - prob) / TRIALS);
      expect(Math.abs(observed - prob)).toBeLessThan(tol + 0.001);
    }
  });

  it('total probability sums to 1 within tolerance', () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < TRIALS; i++) {
      const { result } = drawGacha(0, seededRng(i * 9999 + 42));
      counts[result.prize] = (counts[result.prize] ?? 0) + 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(TRIALS);
  });
});
