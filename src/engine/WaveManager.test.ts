import { describe, it, expect } from 'vitest';
import { WaveManager } from './WaveManager';
import { ModifierSet } from '../data/Modifier';
import type { LevelConfig, EnemyConfig } from '../types';

const testEnemy: EnemyConfig = {
  id: 'test_enemy', name: '测试敌', icon: 'E', hp: 200, speed: 1, armor: 0, bounty: 50, color: '#fff',
};

const level: LevelConfig = {
  id: 'test', name: '测试关', startStones: 500, lives: 3, cols: 4, rows: 2,
  paths: [[{ x: 0, y: 0 }, { x: 3, y: 0 }]],
  buildable: Array.from({ length: 2 }, () => Array(4).fill(true)),
  waves: [{ spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0 }], clearBonus: 100 }],
};

function manager(): WaveManager {
  return new WaveManager(level, ModifierSet.empty);
}

describe('WaveManager', () => {
  it('starts with no enemies', () => {
    const wm = manager();
    expect(wm.enemies).toHaveLength(0);
    expect(wm.waveActive).toBe(false);
    expect(wm.totalWaves).toBe(1);
  });

  it('spawns enemy via startWave + update', () => {
    const wm = manager();
    wm.startWave(level.waves[0]);
    expect(wm.waveActive).toBe(true);
    const ev = wm.update(0.1, ModifierSet.empty, { enemy: () => testEnemy }, 1);
    expect(wm.enemies.length).toBe(1);
    const e = wm.enemies[0];
    expect(e.def.id).toBe('test_enemy');
    expect(e.hp).toBe(200);
    expect(e.pathIndex).toBe(0);
    expect(e.dist).toBeGreaterThan(0);
    expect(ev.leacked).toBe(0);
    expect(ev.waveCleared).toBe(false);
  });

  it('moves enemy along path', () => {
    const wm = manager();
    wm.startWave(level.waves[0]);
    wm.update(1, ModifierSet.empty, { enemy: () => testEnemy }, 1);
    const e = wm.enemies[0];
    expect(e.dist).toBeCloseTo(1, 1);
    expect(e.x).toBeGreaterThan(0);
  });

  it('enemy leaks when reaching path end', () => {
    const short: LevelConfig = {
      id: 'short', name: '短', startStones: 500, lives: 3, cols: 2, rows: 1,
      paths: [[{ x: 0, y: 0 }, { x: 1, y: 0 }]],
      buildable: [[true, true]],
      waves: [{ spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0 }], clearBonus: 10 }],
    };
    const wm = new WaveManager(short, ModifierSet.empty);
    wm.startWave(short.waves[0]);
    wm.update(0.1, ModifierSet.empty, { enemy: () => testEnemy }, 1);
    expect(wm.enemies.length).toBe(1);
    // speed 1 → dist 1 covers 1 grid in 1s → path is 1 grid long → leaks
    const ev = wm.update(0.9, ModifierSet.empty, { enemy: () => testEnemy }, 1);
    const leaked = wm.enemies.filter((e) => e.leaked);
    expect(leaked.length).toBe(1);
    expect(ev.leacked).toBe(1);
  });

  it('signals waveCleared when all enemies gone and spawn done', () => {
    const instant: LevelConfig = {
      id: 'instant', name: '瞬间', startStones: 100, lives: 3, cols: 2, rows: 1,
      paths: [[{ x: 0, y: 0 }, { x: 6, y: 0 }]],
      buildable: [[true, true]],
      waves: [{ spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0 }], clearBonus: 10 }],
    };
    const wm = new WaveManager(instant, ModifierSet.empty);
    wm.startWave(instant.waves[0]);
    wm.update(0.1, ModifierSet.empty, { enemy: () => testEnemy }, 1);
    wm.enemies[0].dead = true;
    wm.cleanup();
    const ev = wm.update(0.1, ModifierSet.empty, { enemy: () => testEnemy }, 1);
    expect(ev.waveCleared).toBe(true);
    expect(wm.waveActive).toBe(false);
  });

  it('leak event counts total leaked enemies', () => {
    const bossEnemy: EnemyConfig = {
      id: 'boss', name: 'BOSS', icon: 'B', hp: 5000, speed: 0.1, armor: 0, bounty: 0, color: '#000',
      elite: true, bossAbility: { interval: 10 },
    };
    const multiLevel: LevelConfig = {
      id: 'multi', name: '混合', startStones: 500, lives: 3, cols: 2, rows: 1,
      paths: [[{ x: 0, y: 0 }, { x: 1, y: 0 }]],
      buildable: [[true, true]],
      waves: [{
        spawns: [
          { enemy: 'boss', count: 1, gap: 0, delay: 0 },
          { enemy: 'boss', count: 1, gap: 0, delay: 0.05 },
        ],
        clearBonus: 10,
      }],
    };
    const lookup = { enemy: () => bossEnemy };
    const wm = new WaveManager(multiLevel, ModifierSet.empty);
    wm.startWave(multiLevel.waves[0]);
    wm.update(0.1, ModifierSet.empty, lookup, 1);
    const ev = wm.update(10, ModifierSet.empty, lookup, 1);
    expect(ev.leacked).toBe(2);
  });

  it('cleanup removes dead and leaked enemies', () => {
    const wm = manager();
    wm.startWave(level.waves[0]);
    wm.update(0.1, ModifierSet.empty, { enemy: () => testEnemy }, 1);
    expect(wm.enemies.length).toBe(1);
    wm.enemies[0].dead = true;
    wm.cleanup();
    expect(wm.enemies.length).toBe(0);
  });

  it('posAt returns correct position', () => {
    const wm = manager();
    const p = wm.posAt(0, 0.5);
    // buildSegments offsets by +0.5: waypoint (0,0) → (0.5,0.5), (3,0) → (3.5,0.5)
    // segment len=3, at dist 0.5 → fraction 1/6 → x=0.5+3/6=1, y=0.5
    expect(p.x).toBe(1);
    expect(p.y).toBe(0.5);
  });

  it('spawnEnemyAt creates enemy at given position', () => {
    const wm = manager();
    const e = wm.spawnEnemyAt('test_enemy', 0, 1.5, testEnemy, 1);
    expect(e).not.toBeNull();
    expect(e!.dist).toBe(1.5);
    expect(e!.x).toBeGreaterThan(0);
  });

  it('peekNextWave returns undefined when no more waves', () => {
    const wm = manager();
    // peekNextWave during prep returns current wave; after starting the only wave,
    // the "next" wave is out of bounds → undefined
    wm.startWave(level.waves[0]);
    wm.update(0.1, ModifierSet.empty, { enemy: () => testEnemy }, 1);
    expect(wm.peekNextWave()).toBeUndefined();
  });
});
