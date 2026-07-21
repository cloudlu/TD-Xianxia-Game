import { describe, it, expect } from 'vitest';
import { TowerOperations, type TowerLookup } from './TowerOperations';
import type { LevelConfig, TowerConfig } from '../types';

const testTower: TowerConfig = {
  id: 'test_tower', name: '测试塔', icon: 'T', school: 'sword', hitsAir: true,
  cost: 100, sellRatio: 0.6, targetPolicy: 'first', color: '#fff', desc: '测试',
  behavior: 'projectile',
  levels: [
    { realm: '炼气', dmg: 20, rate: 1, range: 2.5 },
    { realm: '筑基', dmg: 40, rate: 1.2, range: 2.7, upgradeCost: 60 },
    { realm: '金丹', dmg: 80, rate: 1.5, range: 3, upgradeCost: 100, crit: 0.2 },
  ],
};

const multiLevel: TowerConfig = {
  ...testTower, id: 'multi', name: '多级塔',
  cost: 80,
  levels: [
    { realm: '炼气', dmg: 10, rate: 1, range: 2 },
    { realm: '筑基', dmg: 20, rate: 1, range: 2, upgradeCost: 50 },
  ],
};

const noUpgradeTower: TowerConfig = {
  ...testTower, id: 'no_up', name: '不可升级',
  levels: [{ realm: '炼气', dmg: 10, rate: 1, range: 2 }],
};

const level: LevelConfig = {
  id: 'test', name: '测试关', startStones: 500, lives: 20, cols: 4, rows: 2,
  paths: [[{ x: 0, y: 0 }, { x: 3, y: 0 }]],
  buildable: Array.from({ length: 2 }, () => Array(4).fill(true)),
  waves: [{ spawns: [{ enemy: 'test', count: 1, gap: 0, delay: 0 }], clearBonus: 10 }],
};

const blockLevel: LevelConfig = {
  ...level,
  buildable: [[false, false, false, false], [true, true, true, true]],
};

const lookup: TowerLookup = {
  tower: (id) => ({ test_tower: testTower, multi: multiLevel, no_up: noUpgradeTower }[id]),
};

function ops(lvl: LevelConfig = level): TowerOperations {
  return new TowerOperations(lvl, lookup, 500);
}

describe('TowerOperations', () => {
  describe('canPlace', () => {
    it('returns true for empty buildable cell', () => {
      expect(ops().canPlace(0, 0)).toBe(true);
    });

    it('returns false for cell out of bounds', () => {
      expect(ops().canPlace(-1, 0)).toBe(false);
      expect(ops().canPlace(0, -1)).toBe(false);
      expect(ops().canPlace(10, 0)).toBe(false);
      expect(ops().canPlace(0, 10)).toBe(false);
    });

    it('returns false for non-buildable cell', () => {
      expect(ops(blockLevel).canPlace(0, 0)).toBe(false);
    });

    it('returns false if tower already placed there', () => {
      const o = ops();
      o.placeTower(0, 0, 'test_tower');
      expect(o.canPlace(0, 0)).toBe(false);
    });
  });

  describe('placeTower', () => {
    it('places tower and deducts stones', () => {
      const o = ops();
      const ok = o.placeTower(1, 0, 'test_tower');
      expect(ok).toBe(true);
      expect(o.towers).toHaveLength(1);
      expect(o.stones).toBe(400);
      expect(o.towers[0].col).toBe(1);
      expect(o.towers[0].row).toBe(0);
      expect(o.towers[0].x).toBe(1.5);
    });

    it('returns false if insufficient stones', () => {
      const o = ops();
      o.stones = 50;
      expect(o.placeTower(0, 0, 'test_tower')).toBe(false);
      expect(o.towers).toHaveLength(0);
    });

    it('returns false for invalid tower id', () => {
      expect(ops().placeTower(0, 0, 'nonexistent')).toBe(false);
    });
  });

  describe('towerAt', () => {
    it('finds tower by grid position', () => {
      const o = ops();
      o.placeTower(2, 0, 'test_tower');
      expect(o.towerAt(2, 0)).toBeDefined();
      expect(o.towerAt(3, 0)).toBeUndefined();
    });
  });

  describe('upgradeCost', () => {
    it('returns cost for next level', () => {
      const o = ops();
      o.placeTower(0, 0, 'multi');
      expect(o.upgradeCost(o.towers[0].uid)).toBe(50);
    });

    it('returns null for max level', () => {
      const o = ops();
      o.placeTower(0, 0, 'no_up');
      expect(o.upgradeCost(o.towers[0].uid)).toBeNull();
    });

    it('returns null for invalid uid', () => {
      expect(ops().upgradeCost(999)).toBeNull();
    });
  });

  describe('sellRefund', () => {
    it('returns refund for placed tower', () => {
      const o = ops();
      o.placeTower(0, 0, 'test_tower');
      const refund = o.sellRefund(o.towers[0].uid);
      expect(refund).toBeGreaterThan(0);
      expect(refund).toBeLessThanOrEqual(100 * 0.6);
    });

    it('returns 0 for invalid uid', () => {
      expect(ops().sellRefund(999)).toBe(0);
    });
  });

  describe('upgradeTower', () => {
    it('upgrades tower to next level and deducts cost', () => {
      const o = ops();
      o.placeTower(0, 0, 'multi');
      const uid = o.towers[0].uid;
      const prevStones = o.stones;
      const ok = o.upgradeTower(uid);
      expect(ok).toBe(true);
      expect(o.towers[0].level).toBe(1);
      expect(o.stones).toBe(prevStones - 50);
    });

    it('returns false at max level', () => {
      const o = ops();
      o.placeTower(0, 0, 'no_up');
      expect(o.upgradeTower(o.towers[0].uid)).toBe(false);
    });

    it('returns false if insufficient stones', () => {
      const o = ops();
      o.placeTower(0, 0, 'multi');
      o.stones = 10;
      expect(o.upgradeTower(o.towers[0].uid)).toBe(false);
      expect(o.towers[0].level).toBe(0);
    });
  });

  describe('sellTower', () => {
    it('removes tower and refunds stones', () => {
      const o = ops();
      o.placeTower(0, 0, 'test_tower');
      const uid = o.towers[0].uid;
      const prevStones = o.stones;
      const ok = o.sellTower(uid);
      expect(ok).toBe(true);
      expect(o.towers).toHaveLength(0);
      expect(o.stones).toBeGreaterThan(prevStones);
    });

    it('returns false for invalid uid', () => {
      expect(ops().sellTower(999)).toBe(false);
    });
  });

  describe('cycleTargetPolicy', () => {
    it('cycles through policies', () => {
      const o = ops();
      o.placeTower(0, 0, 'test_tower');
      const uid = o.towers[0].uid;
      expect(o.towers[0].targetPolicy).toBe('first');
      o.cycleTargetPolicy(uid);
      expect(o.towers[0].targetPolicy).toBe('last');
      o.cycleTargetPolicy(uid);
      expect(o.towers[0].targetPolicy).toBe('strongest');
      o.cycleTargetPolicy(uid);
      expect(o.towers[0].targetPolicy).toBe('nearest');
      o.cycleTargetPolicy(uid);
      expect(o.towers[0].targetPolicy).toBe('first');
    });

    it('returns null for invalid uid', () => {
      expect(ops().cycleTargetPolicy(999)).toBeNull();
    });
  });

  it('msg is set on operations', () => {
    const o = ops();
    o.placeTower(0, 0, 'test_tower');
    expect(o.msg).toContain('测试塔');
    o.stones = 0;
    o.upgradeTower(o.towers[0].uid);
    expect(o.msg).toContain('灵石不足');
    o.sellTower(o.towers[0].uid);
    expect(o.msg).toContain('出售');
  });
});
