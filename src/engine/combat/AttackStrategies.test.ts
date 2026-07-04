import { describe, it, expect } from 'vitest';
import {
  ProjectileStrategy, PierceStrategy, AoeStrategy, ChainStrategy, AttackStrategyRegistry, defaultAttackRegistry,
  rollDamage, pickPierceTargets,
  type AttackStrategy, type CombatContext,
} from './AttackStrategies';
import { TOWERS } from '../../data/config';
import type { CombatEnemy, CombatTower } from './AttackStrategies';

const sword = TOWERS.flying_sword;       // 金丹有 crit 0.20
const spear = TOWERS.spear;              // pierce 行为

function towerOf(id: string, level: number): CombatTower {
  return { uid: 1, x: 5, y: 3, level, def: TOWERS[id] };
}
function enemy(uid: number, dist: number): CombatEnemy {
  return { uid, dist, x: 0, y: 0, hp: 100, dead: false, def: { armor: 0, bounty: 6 } };
}
function ctxWith(opts: Partial<CombatContext> & { rng?: () => number; stats?: { dmgMul?: number; rateMul?: number; rangeAdd?: number; critBonus?: number } } = {}): CombatContext {
  const stats = { dmgMul: 1, rateMul: 1, rangeAdd: 0, critBonus: 0, ...opts.stats };
  return {
    rng: opts.rng ?? (() => 0.99),                 // 默认不暴击
    effectiveStats: opts.effectiveStats ?? (() => stats),
    spawnProjectile: opts.spawnProjectile ?? (() => {}),
    damage: opts.damage ?? (() => {}),
    enemiesInRange: opts.enemiesInRange ?? (() => []),
    enemiesNearPoint: opts.enemiesNearPoint ?? (() => []),
  };
}

describe('rollDamage', () => {
  it('applies the damage multiplier on top of base damage', () => {
    expect(rollDamage(20, 1.5, 0, () => 0.99)).toBeCloseTo(30, 5);
  });

  it('doubles on crit roll', () => {
    expect(rollDamage(80, 1, 0.20, () => 0.01)).toBeCloseTo(160, 5);
  });

  it('stays single when crit roll fails', () => {
    expect(rollDamage(80, 1, 0.20, () => 0.99)).toBeCloseTo(80, 5);
  });
});

describe('pickPierceTargets', () => {
  it('always includes the primary target', () => {
    const primary = enemy(1, 5);
    const hits = pickPierceTargets(primary, [enemy(2, 9), enemy(3, 1)], 2);
    expect(hits.map((h) => h.uid)).toContain(1);
  });

  it('fills up to n, preferring enemies furthest along the path', () => {
    const primary = enemy(1, 5);
    const inRange = [enemy(2, 1), enemy(3, 9), enemy(4, 7)];
    const hits = pickPierceTargets(primary, inRange, 3);
    // 最靠前优先：dist 9,7，加主目标 5 → uid 3,4,1
    expect(hits.map((h) => h.uid).sort((a, b) => a - b)).toEqual([1, 3, 4]);
  });

  it('respects the cap n even when more enemies are in range', () => {
    const primary = enemy(1, 0);
    const inRange = [enemy(2, 1), enemy(3, 2), enemy(4, 3)];
    expect(pickPierceTargets(primary, inRange, 2)).toHaveLength(2);
  });
});

describe('ProjectileStrategy', () => {
  it('spawns one projectile carrying the rolled damage', () => {
    const spawned: number[] = [];
    const ctx = ctxWith({
      spawnProjectile: (p) => { spawned.push(p.dmg); },
      stats: { dmgMul: 1, rateMul: 1, rangeAdd: 0, critBonus: 0 },
      rng: () => 0.5,
    });
    new ProjectileStrategy().execute(towerOf('flying_sword', 0), enemy(7, 5), ctx);
    expect(spawned).toHaveLength(1);
    expect(spawned[0]).toBe(20); // 炼气 dmg，无加成、无暴击
  });
});

describe('PierceStrategy', () => {
  it('immediately damages all pierced targets and emits a zero-dmg visual', () => {
    const damaged: number[] = [];
    const visuals: number[] = [];
    const inRange = [enemy(2, 1), enemy(3, 9), enemy(4, 7), enemy(5, 3)];
    const ctx = ctxWith({
      stats: { dmgMul: 1, rateMul: 1, rangeAdd: 0, critBonus: 0 },
      rng: () => 0.5,
      damage: (e) => { damaged.push(e.uid); },
      spawnProjectile: (p) => { visuals.push(p.dmg); },
      enemiesInRange: () => inRange,
    });
    // 长枪 炼气 pierce 2
    new PierceStrategy().execute(towerOf('spear', 0), enemy(1, 5), ctx);
    expect(damaged).toHaveLength(2);            // 穿透 2 个
    expect(visuals).toEqual([0]);               // 视觉弹道 dmg=0
  });

  it('applies equipment damage multiplier via effectiveStats', () => {
    const spawned: number[] = [];
    const ctx = ctxWith({
      effectiveStats: () => ({ dmgMul: 1.5, rateMul: 1, rangeAdd: 0, critBonus: 0 }),
      spawnProjectile: (p) => { spawned.push(p.dmg); },
      rng: () => 0.99,
    });
    new ProjectileStrategy().execute(towerOf('flying_sword', 0), enemy(7, 5), ctx);
    expect(spawned[0]).toBeCloseTo(30, 5);      // 20 × 1.5
  });
});

describe('AoeStrategy', () => {
  it('damages the primary and all enemies within splash radius', () => {
    const damaged: number[] = [];
    const ctx = ctxWith({
      stats: { dmgMul: 1, rateMul: 1, rangeAdd: 0, critBonus: 0 },
      rng: () => 0.5,
      damage: (e) => { damaged.push(e.uid); },
      enemiesNearPoint: () => [enemy(1, 5), enemy(2, 5), enemy(3, 5)],
    });
    // 火法 炼气 aoeRadius 1.2
    new AoeStrategy().execute(towerOf('fire_mage', 0), enemy(1, 5), ctx);
    expect(damaged.sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });
});

describe('ChainStrategy', () => {
  it('jumps from primary to nearest enemies up to chainCount', () => {
    const damaged: number[] = [];
    // 主目标 uid=1 at (5,3)；附近 uid=2 在 (5.5,3) 最近，uid=3 在 (6,3) 次近
    const near = (x: number, y: number, r: number) => {
      const all = [
        { ...enemy(1, 5), x: 5, y: 3 },
        { ...enemy(2, 5), x: 5.5, y: 3 },
        { ...enemy(3, 5), x: 6, y: 3 },
        { ...enemy(4, 5), x: 9, y: 9 },   // 超出跳跃范围
      ];
      return all.filter((e) => Math.hypot(e.x - x, e.y - y) <= r);
    };
    const ctx = ctxWith({
      stats: { dmgMul: 1, rateMul: 1, rangeAdd: 0, critBonus: 0 },
      rng: () => 0.5,
      damage: (e) => { damaged.push(e.uid); },
      enemiesNearPoint: near,
    });
    const primary = { ...enemy(1, 5), x: 5, y: 3 };
    // 雷法 炼气 chainCount 3
    new ChainStrategy().execute(towerOf('thunder_mage', 0), primary, ctx);
    // 主(1) → 最近(2) → 次近(3)；uid=4 超出 chainRange 不命中
    expect(damaged.sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });
});

describe('AttackStrategyRegistry', () => {
  it('default registry resolves projectile and pierce', () => {
    const r = defaultAttackRegistry();
    expect(r.get('projectile')).toBeInstanceOf(ProjectileStrategy);
    expect(r.get('pierce')).toBeInstanceOf(PierceStrategy);
  });

  it('default registry also resolves aoe and chain', () => {
    const r = defaultAttackRegistry();
    expect(r.get('aoe')).toBeInstanceOf(AoeStrategy);
    expect(r.get('chain')).toBeInstanceOf(ChainStrategy);
  });

  it('allows registering a new behavior without touching existing ones (OCP)', () => {
    const r = new AttackStrategyRegistry();
    const custom: AttackStrategy = { execute: () => {} };
    r.register('aura', custom);
    expect(r.get('aura')).toBe(custom);
  });
});
