import { describe, it, expect } from 'vitest';
import { generateRandomEquip, RANDOM_STAT_POOL, EQUIPMENT, EQUIPMENT_IDS } from './equipment';

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

describe('generateRandomEquip', () => {
  it('generates valid equipment with all required fields', () => {
    const existing = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      const { config } = generateRandomEquip(existing, seededRng(seed));
      expect(config.id).toBeTruthy();
      expect(config.name).toBeTruthy();
      expect(config.desc).toBeTruthy();
      expect(['weapon', 'armor', 'accessory']).toContain(config.slot);
      expect(config.price).toBe(0);
      expect(config.mods.length).toBeGreaterThanOrEqual(1);
      expect(config.mods.length).toBeLessThanOrEqual(4);
      existing.add(config.id);
    }
  });

  it('generates unique IDs (no collision)', () => {
    const existing = new Set<string>();
    const ids = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const { config } = generateRandomEquip(existing, seededRng(i * 7777 + 31));
      expect(ids.has(config.id)).toBe(false);
      ids.add(config.id);
      existing.add(config.id);
    }
  });

  it('does not collide with fixed EQUIPMENT ids', () => {
    const existing = new Set(Object.keys(EQUIPMENT));
    for (let i = 0; i < 200; i++) {
      const { config } = generateRandomEquip(existing, seededRng(i * 9999 + 42));
      expect(EQUIPMENT[config.id]).toBeUndefined();
    }
  });

  it('stat count distribution matches weights approximately', () => {
    const WEIGHTS = [0.10, 0.40, 0.35, 0.15];
    const TRIALS = 2000;
    const counts = [0, 0, 0, 0];
    const existing = new Set<string>();
    for (let i = 0; i < TRIALS; i++) {
      const { config } = generateRandomEquip(existing, seededRng(i * 5555 + 99));
      counts[config.mods.length - 1]++;
      existing.add(config.id);
    }
    for (let i = 0; i < 4; i++) {
      const observed = counts[i] / TRIALS;
      const expected = WEIGHTS[i];
      expect(Math.abs(observed - expected)).toBeLessThan(0.05);
    }
  });

  it('only rolls stats from RANDOM_STAT_POOL', () => {
    const pool: readonly string[] = RANDOM_STAT_POOL;
    const existing = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const { config } = generateRandomEquip(existing, seededRng(i * 3333 + 11));
      for (const mod of config.mods) {
        expect(pool.includes(mod.stat)).toBe(true);
      }
    }
  });

  it('no duplicate stats on same item', () => {
    const existing = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const { config } = generateRandomEquip(existing, seededRng(i * 4444 + 55));
      const stats = config.mods.map((m) => m.stat);
      expect(new Set(stats).size).toBe(stats.length);
    }
  });

  it('mod value range shrinks for 4-stat items', () => {
    const existing = new Set<string>();
    let found = false;
    for (let i = 0; i < 500; i++) {
      const { config } = generateRandomEquip(existing, seededRng(i * 6666 + 77));
      if (config.mods.length === 4) {
        found = true;
        for (const mod of config.mods) {
          expect(mod.value).toBeGreaterThanOrEqual(0.04);
          expect(mod.value).toBeLessThanOrEqual(0.10);
        }
      }
    }
    expect(found, 'no 4-stat item generated in 500 trials').toBe(true);
  });

  it('range/crit use add op, others use mul_pct', () => {
    const existing = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const { config } = generateRandomEquip(existing, seededRng(i * 2222 + 33));
      for (const mod of config.mods) {
        const isAdd = mod.stat === 'range' || mod.stat === 'crit';
        expect(mod.op).toBe(isAdd ? 'add' : 'mul_pct');
      }
    }
  });

  it('returns generatedName matching name in config', () => {
    const existing = new Set<string>();
    const { config, generatedName } = generateRandomEquip(existing, seededRng(42));
    expect(generatedName).toBe(config.name);
  });
});

describe('fixed EQUIPMENT pool integrity', () => {
  it('all equipment ids are unique', () => {
    expect(new Set(EQUIPMENT_IDS).size).toBe(EQUIPMENT_IDS.length);
  });

  it('each equipment has valid slot', () => {
    for (const eq of Object.values(EQUIPMENT)) {
      expect(['weapon', 'armor', 'accessory']).toContain(eq.slot);
    }
  });

  it('each equipment has at least one mod', () => {
    for (const eq of Object.values(EQUIPMENT)) {
      expect(eq.mods.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('generated equip data persistence', () => {
  it('config round-trips through generic object store', () => {
    const existing = new Set(Object.keys(EQUIPMENT));
    const { config } = generateRandomEquip(existing, seededRng(42));
    // 模拟存档/读档（通过 Record<string, unknown>）
    const stored: Record<string, unknown> = {};
    stored[config.id] = config;
    const loaded = stored[config.id] as typeof config;
    expect(loaded).toEqual(config);
    expect(loaded.id).toBe(config.id);
    expect(loaded.name).toBe(config.name);
    expect(loaded.slot).toBe(config.slot);
    expect(loaded.mods.length).toBe(config.mods.length);
    for (let i = 0; i < loaded.mods.length; i++) {
      expect(loaded.mods[i].stat).toBe(config.mods[i].stat);
      expect(loaded.mods[i].op).toBe(config.mods[i].op);
      expect(loaded.mods[i].value).toBe(config.mods[i].value);
    }
  });
});
