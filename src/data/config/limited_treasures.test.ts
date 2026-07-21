import { describe, it, expect } from 'vitest';
import { LIMITED_TREASURES, LIMITED_TREASURE_IDS } from './limited_treasures';

const EXCLUSIVE_STATS = new Set([
  'doubleAtkChance', 'armorPierce', 'leakToStone', 'waveRefund',
  'densityRate', 'killStackDmg', 'killStackCap', 'bossCooldown',
  'contribBonus', 'extraDestiny', 'enemySlowAura', 'enemyPullBack',
  'elementBonus', 'petSummon',
]);

describe('limited treasure configs', () => {
  it('all 12 treasures are defined', () => {
    expect(LIMITED_TREASURE_IDS.length).toBe(12);
  });

  it('each treasure has required fields', () => {
    for (const t of Object.values(LIMITED_TREASURES)) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.tier).toBe('mythic');
      expect(['weapon', 'armor', 'accessory']).toContain(t.slot);
      expect(t.icon).toBeTruthy();
      expect(t.color).toBeTruthy();
      expect(t.glow).toBe('golden');
      expect(t.desc).toBeTruthy();
      expect(t.lore).toBeTruthy();
      expect(t.upgradeCostMultiplier).toBe(2.0);
    }
  });

  it('each treasure has both mods and uniqueMods, not empty', () => {
    for (const t of Object.values(LIMITED_TREASURES)) {
      expect(t.mods.length).toBeGreaterThanOrEqual(1);
      expect(t.uniqueMods.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('uniqueMods only contain exclusive stats (never in random pool)', () => {
    for (const t of Object.values(LIMITED_TREASURES)) {
      for (const mod of t.uniqueMods) {
        expect(EXCLUSIVE_STATS.has(mod.stat))
          .toBe(true);
      }
    }
  });

  it('mods use only normal stats (exclusive stats not in mods)', () => {
    for (const t of Object.values(LIMITED_TREASURES)) {
      for (const mod of t.mods) {
        expect(EXCLUSIVE_STATS.has(mod.stat)).toBe(false);
      }
    }
  });

  it('all treasure ids are unique', () => {
    expect(new Set(LIMITED_TREASURE_IDS).size).toBe(LIMITED_TREASURE_IDS.length);
  });
});

describe('treasure mod stacking', () => {
  it('buildMods applies both mods and uniqueMods for equipped treasure');
  it('treasure upgrade level scales both mods and uniqueMods');
  it('random equipment never rolls exclusive stats');
});
