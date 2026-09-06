import { describe, it, expect } from 'vitest';
import { realmCapForChapter, LEVELS } from './index';

describe('realmCapForChapter (v0.86 方案 A)', () => {
  it('caps follow chapter tiers', () => {
    expect(realmCapForChapter('ch1')).toBe(2);
    expect(realmCapForChapter('ch4')).toBe(2);
    expect(realmCapForChapter('ch5')).toBe(3);
    expect(realmCapForChapter('ch9')).toBe(3);
    expect(realmCapForChapter('ch10')).toBe(4);
    expect(realmCapForChapter('ch14')).toBe(4);
    expect(realmCapForChapter('ch15')).toBe(5);
    expect(realmCapForChapter('ch19')).toBe(5);
    expect(realmCapForChapter('ch20')).toBe(6);
    expect(realmCapForChapter('ch24')).toBe(6);
    expect(realmCapForChapter('ch25')).toBe(7);
    expect(realmCapForChapter('ch30')).toBe(7);
  });

  it('all chapter levels have maxTowerLevel injected', () => {
    for (const [id, lvl] of Object.entries(LEVELS)) {
      if (!id.startsWith('ch')) continue;
      expect(lvl.maxTowerLevel, `${id} 缺 maxTowerLevel`).toBeDefined();
      expect(lvl.maxTowerLevel!).toBeGreaterThanOrEqual(2);
      expect(lvl.maxTowerLevel!).toBeLessThanOrEqual(7);
    }
  });

  it('cap grows monotonically with chapter number', () => {
    let prev = 0;
    for (let n = 1; n <= 30; n++) {
      const cap = realmCapForChapter(`ch${n}`);
      expect(cap).toBeGreaterThanOrEqual(prev);
      prev = cap;
    }
  });
});
