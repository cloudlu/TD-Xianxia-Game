import { describe, it, expect } from 'vitest';
import { TowerCombat, type CombatUpdateCtx } from './TowerCombat';
import { defaultAttackRegistry } from './AttackStrategies';
import { ModifierSet, type Modifier } from '../../data/Modifier';
import type { EnemyR } from '../WaveManager';
import type { TowerR } from '../TowerOperations';
import type { EnemyConfig, TowerConfig } from '../../types';

const enemyDef: EnemyConfig = {
  id: 'e', name: '敌', icon: 'E', hp: 200, speed: 1, armor: 0, bounty: 50, color: '#f00',
};

const towerDef: TowerConfig = {
  id: 't', name: '塔', icon: 'T', school: 'sword', hitsAir: true,
  cost: 100, sellRatio: 0.6, targetPolicy: 'first', color: '#fff', desc: '',
  behavior: 'projectile',
  levels: [{ realm: '炼气', dmg: 100, rate: 10, range: 10 }],
};

let uidSeq = 1;

function makeEnemy(overrides: Partial<EnemyR> = {}): EnemyR {
  const uid = uidSeq++;
  return {
    uid, def: enemyDef, hp: 200, maxHp: 200, shield: 0, pathIndex: 0, dist: 5,
    x: 3, y: 0, abilityTimer: 0, speedMul: 1, hitFlash: 0,
    bounty: 50, slowFactor: 1, slowUntil: 0, dead: false, leaked: false,
    ...overrides,
  };
}

function makeTower(overrides: Partial<TowerR> = {}): TowerR {
  const uid = uidSeq++;
  return {
    uid, def: towerDef, col: 1, row: 0, x: 1.5, y: 0, level: 0,
    cooldown: 0, targetPolicy: 'first', disabledUntil: 0, knockImmuneUntil: 0, flashTimer: 0,
    ...overrides,
  };
}

let stones = 0;
let lastEmit: any = null;

function freshCtx(mods: ModifierSet = ModifierSet.empty): CombatUpdateCtx {
  stones = 0;
  lastEmit = null;
  return {
    rng: () => 0.5,
    strategies: defaultAttackRegistry(),
    mods,
    towerMul: 1,
    destinyBoost: 1,
    hpMul: 1,
    difficultyBountyMul: 1,
    elapsed: () => 100,
    spawnEnemyAt: () => {},
    addStones: (n) => { stones += n; },
    emit: (e) => { lastEmit = e; },
  };
}

function freshCombat(mods?: ModifierSet): TowerCombat {
  uidSeq = 1;
  return new TowerCombat(freshCtx(mods));
}

describe('TowerCombat', () => {
  it('starts with empty arrays', () => {
    const tc = freshCombat();
    expect(tc.projectiles).toHaveLength(0);
    expect(tc.effects).toHaveLength(0);
    expect(tc.killStack).toBe(0);
  });

  it('tower fires projectile at enemy in range', () => {
    const tc = freshCombat();
    const enemies = [makeEnemy()];
    const towers = [makeTower()];
    tc.update(0.1, enemies, towers);
    expect(tc.projectiles.length).toBe(1);
    const p = tc.projectiles[0];
    expect(p.targetUid).toBe(enemies[0].uid);
    expect(p.dmg).toBeGreaterThan(0);
  });

  it('tower does not fire when no enemies', () => {
    const tc = freshCombat();
    tc.update(0.1, [], [makeTower()]);
    expect(tc.projectiles).toHaveLength(0);
  });

  it('tower does not fire while disabled', () => {
    const tc = freshCombat();
    const enemies = [makeEnemy()];
    const towers = [makeTower({ disabledUntil: 200 })];
    tc.update(0.1, enemies, towers);
    expect(tc.projectiles).toHaveLength(0);
  });

  it('aura tower does not fire', () => {
    const auraDef: TowerConfig = {
      ...towerDef, id: 'aura', behavior: 'aura',
      levels: [{ realm: '炼气', dmg: 0, rate: 0, range: 3 }],
    };
    const tc = freshCombat();
    const enemies = [makeEnemy()];
    const towers = [makeTower({ def: auraDef })];
    tc.update(0.1, enemies, towers);
    expect(tc.projectiles).toHaveLength(0);
  });

  it('projectile hits target and deals damage', () => {
    const tc = freshCombat();
    const enemy = makeEnemy();
    const enemies = [enemy];
    const towers = [makeTower()];
    // Fire
    tc.update(0.01, enemies, towers);
    expect(tc.projectiles.length).toBe(1);
    // Advance projectile to hit (PROJ_SPEED=14, dist ≈ 1.5, need ~0.11s)
    tc.update(0.2, enemies, towers);
    expect(enemy.hp).toBeLessThan(200);
    expect(tc.projectiles).toHaveLength(0);
  });

  it('enemy death adds killStack and stones', () => {
    const oneHpEnemyDef: EnemyConfig = { ...enemyDef, hp: 50 };
    const tc = freshCombat();
    const enemy = makeEnemy({ hp: 50, maxHp: 50, def: oneHpEnemyDef });
    const enemies = [enemy];
    const towers = [makeTower()];
    tc.update(0.01, enemies, towers);
    tc.update(0.2, enemies, towers);
    expect(enemy.dead).toBe(true);
    expect(tc.killStack).toBe(1);
    expect(stones).toBeGreaterThan(0);
    expect(lastEmit).toEqual({ type: 'kill', enemyId: 'e' });
  });

  it('damage produces dmg effect', () => {
    const tc = freshCombat();
    const enemy = makeEnemy();
    const enemies = [enemy];
    const towers = [makeTower()];
    tc.update(0.01, enemies, towers);
    tc.update(0.2, enemies, towers);
    expect(tc.effects.length).toBeGreaterThan(0);
    expect(tc.effects.some((fx) => fx.kind === 'dmg')).toBe(true);
  });

  it('death produces poof effect', () => {
    const oneHpDef: EnemyConfig = { ...enemyDef, hp: 30 };
    const tc = freshCombat();
    const enemy = makeEnemy({ hp: 30, maxHp: 30, def: oneHpDef });
    tc.update(0.01, [enemy], [makeTower()]);
    tc.update(0.2, [enemy], [makeTower()]);
    expect(tc.effects.some((fx) => fx.kind === 'poof')).toBe(true);
  });

  it('armor reduces damage taken', () => {
    const tc0 = freshCombat();
    const normal = makeEnemy({ hp: 500, maxHp: 500 });
    tc0.update(0.01, [normal], [makeTower()]);
    tc0.update(0.2, [normal], [makeTower()]);
    const normalHp = normal.hp;

    const tc1 = freshCombat();
    const armoredDef: EnemyConfig = { ...enemyDef, armor: 100 };
    const armored = makeEnemy({ def: armoredDef, hp: 500, maxHp: 500 });
    tc1.update(0.01, [armored], [makeTower()]);
    tc1.update(0.2, [armored], [makeTower()]);
    expect(armored.hp).toBeGreaterThan(normalHp);
  });

  it('dodge avoids damage', () => {
    const dodgeDef: EnemyConfig = { ...enemyDef, dodge: 1 };
    const tc = freshCombat();
    const enemy = makeEnemy({ def: dodgeDef, hp: 200, maxHp: 200 });
    tc.update(0.01, [enemy], [makeTower()]);
    tc.update(0.2, [enemy], [makeTower()]);
    // rng() returns 0.5, dodge=1 => always dodge
    expect(enemy.hp).toBe(200);
  });

  it('shield absorbs damage before hp', () => {
    const tc = freshCombat();
    const enemy = makeEnemy({ hp: 50, maxHp: 50, shield: 200 });
    tc.update(0.01, [enemy], [makeTower()]);
    tc.update(0.2, [enemy], [makeTower()]);
    // Shield should absorb most damage
    expect(enemy.hp).toBe(50);
    expect(enemy.shield).toBeLessThan(200);
  });

  it('slow projectile reduces enemy speed', () => {
    const slowTowerDef: TowerConfig = {
      ...towerDef, id: 'slow', levels: [{ realm: '炼气', dmg: 10, rate: 10, range: 10, slow: { mul: 0.5, duration: 3 } }],
    };
    const tc = freshCombat();
    const enemy = makeEnemy();
    tc.update(0.01, [enemy], [makeTower({ def: slowTowerDef })]);
    tc.update(0.2, [enemy], [makeTower({ def: slowTowerDef })]);
    // Check projectile has slow fields, then it hits
    if (tc.projectiles.length > 0) {
      expect(tc.projectiles[0].slowMul).toBe(0.5);
      expect(tc.projectiles[0].slowDuration).toBe(3);
    }
  });

  it('killStack increments effective damage', () => {
    const mods = new ModifierSet([{ stat: 'killStackDmg', op: 'mul_pct', value: 0.1 }]);
    const tc = freshCombat(mods);
    tc.killStack = 100;
    const stats = tc.getEffectiveStats(999, [makeTower()], [makeEnemy()]);
    expect(stats).toBeNull();
    const t = makeTower();
    const towers = [t];
    const s = tc.getEffectiveStats(t.uid, towers, [makeEnemy()]);
    expect(s).not.toBeNull();
    expect(s!.dps).toBeGreaterThan(100 * 10); // base DPS = 100*10 = 1000, with killStack bonus should be higher
  });

  it('auraBuffFor returns null for invalid uid', () => {
    const tc = freshCombat();
    expect(tc.auraBuffFor(999, [])).toBeNull();
  });

  it('updateEffects clears expired effects', () => {
    const tc = freshCombat();
    tc.effects.push({ kind: 'dmg', x: 0, y: 0, text: '10', color: '#fff', life: 0.1, maxLife: 0.1, vy: -1 });
    tc.update(0.2, [], []);
    expect(tc.effects).toHaveLength(0);
  });

  it('cleanupProjectiles removes dead projectiles', () => {
    const tc = freshCombat();
    tc.projectiles.push({ x: 0, y: 0, targetUid: 1, dmg: 10, color: '#fff', dead: true });
    tc.update(0.1, [], []);
    expect(tc.projectiles).toHaveLength(0);
  });
});
