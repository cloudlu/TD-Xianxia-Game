import { describe, it, expect } from 'vitest';
import { Game } from './Game';
import type { ConfigLookup } from './Game';
import type { LevelConfig, TowerConfig, EnemyConfig } from '../types';
import { ModifierSet, type Modifier } from '../data/Modifier';

const mod = (stat: string, op: 'add' | 'mul_pct', value: number): Modifier => ({ stat, op, value });

const testTower: TowerConfig = {
  id: 'test_tower', name: '测试塔', icon: 'T', school: 'sword', hitsAir: true,
  cost: 100, sellRatio: 0.5, targetPolicy: 'first', color: '#fff', desc: '测试',
  levels: [{ realm: '炼气', dmg: 5000, rate: 10, range: 10, crit: 0 }],
  behavior: 'projectile',
};

const testEnemy: EnemyConfig = {
  id: 'test_enemy', name: '测试敌', icon: 'E', hp: 200, speed: 1, armor: 0, bounty: 50, color: '#fff',
};

const defaultReg: ConfigLookup = { enemy: () => testEnemy, tower: () => testTower };

const level: LevelConfig = {
  id: 'test', name: '测试关', startStones: 500, lives: 3,
  cols: 4, rows: 2,
  paths: [[{ x: 0, y: 0 }, { x: 3, y: 0 }]],
  buildable: Array.from({ length: 2 }, () => Array(4).fill(true)),
  hpMul: 1, waves: [{ spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0 }], clearBonus: 100 }],
};

const leakLevel: LevelConfig = {
  ...level, id: 'leak',
  paths: [[{ x: 0, y: 0 }, { x: 1, y: 0 }]],
};

function run(g: Game, n: number): void {
  for (let i = 0; i < n; i++) g.tick(1 / 30);
}

describe('Game stat consumption points', () => {
  it('bountyMul increases stone reward', () => {
    const g = new Game(level, defaultReg, 42, undefined, new ModifierSet([mod('bountyMul', 'mul_pct', 1.0)]), 1, 1, 1);
    g.placeTower(0, 0, 'test_tower');
    const before = g.stones;
    g.startWave();
    run(g, 60);
    // bounty 50 × (1 + min(1.0, 0.8cap)) = 50 × 1.8 = 90 + clearBonus 100 = 190
    expect(g.stones).toBe(before + 190);
  });

  it('waveRefund adds bonus on clear', () => {
    const g = new Game(level, defaultReg, 42, undefined, new ModifierSet([mod('waveRefund', 'mul_pct', 0.50)]), 1, 1, 1);
    g.placeTower(0, 0, 'test_tower');
    g.startWave();
    run(g, 60);
    // clearBonus 100 + refund 50
    expect(g.stones).toBe(500 - 100 + 50/*bountyMul cap 0*/ + 100 + 50);
  });

  it('leakToStone costs stones not lives', () => {
    const g = new Game(leakLevel, defaultReg, 42, undefined, new ModifierSet([mod('leakToStone', 'add', 30)]), 1, 1, 1);
    const livesBefore = g.lives;
    const stonesBefore = g.stones;
    g.startWave();
    run(g, 90);
    expect(g.lives).toBe(livesBefore);
    // 500 - 30(leak) + 100(clearBonus) = 570
    expect(g.stones).toBe(stonesBefore - 30 + 100);
  });

  it('rangeAdd extends tower range in effectiveStats', () => {
    const g = new Game(level, defaultReg, 42, undefined, new ModifierSet([mod('range', 'add', 2.0)]), 1, 1, 1);
    g.placeTower(0, 0, 'test_tower');
    const stats = g.getEffectiveStats(1);
    expect(stats?.range).toBe(12);
  });

  it('enemySlowAura reduces movement', () => {
    // buildSegments 会将格坐标 +0.5 转成格中心坐标
    // 无减速 dist=1.0 → x≈1.5；减速 50% dist=0.5 → x≈1.0
    const g = new Game(level, defaultReg, 42, undefined, new ModifierSet([mod('enemySlowAura', 'mul_pct', 0.50)]), 1, 1, 1);
    g.startWave();
    run(g, 30);
    const s = g.snapshot();
    for (const e of s.enemies) {
      // 受减速，dist≈0.5，x≈1.0 < 1.5（无减速时的 x）
      expect(e.x).toBeLessThan(1.3);
    }
  });

  it('no slow => full speed', () => {
    const g = new Game(level, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.startWave();
    run(g, 30);
    const s = g.snapshot();
    for (const e of s.enemies) {
      // 无减速 dist=1.0 → x≈1.5
      expect(e.x).toBeGreaterThan(1.3);
    }
  });
});

describe('Game tower combat integration', () => {
  it('tower kills enemy within 60 ticks', () => {
    const g = new Game(level, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.placeTower(0, 0, 'test_tower');
    g.startWave();
    run(g, 60);
    const s = g.snapshot();
    // cleanup removes dead enemies, so array should be empty = all killed
    expect(s.enemies.length).toBe(0);
    // stones should have bounty from kill + clearBonus
    expect(g.stones).toBeGreaterThan(500);
  });

  it('armorPierce reduces effective armor', () => {
    // 极高护甲使无穿透几乎打不动
    const armored: EnemyConfig = { id: 'armored', name: '高甲', icon: 'A', hp: 5000, speed: 1, armor: 10000, bounty: 50, color: '#fff' };
    const reg: ConfigLookup = { enemy: () => armored, tower: () => testTower };

    // 无穿透：armor 10000 → armorMul≈0.0099 → dmg≈79/枪, 30 ticks=1s ≈ 10枪=790/5000
    const g0 = new Game(level, reg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g0.placeTower(0, 0, 'test_tower');
    g0.startWave();
    run(g0, 30);
    const s0 = g0.snapshot();

    // 100% 穿透：armor=0 → 5000×1.6=8000/枪 → 1 枪秒杀
    const g1 = new Game(level, reg, 42, undefined, new ModifierSet([mod('armorPierce', 'mul_pct', 1.0)]), 1, 1, 1);
    g1.placeTower(0, 0, 'test_tower');
    g1.startWave();
    run(g1, 30);
    const s1 = g1.snapshot();

    // 无穿透几乎没掉血，穿透应全清
    expect(s0.enemies.length).toBeGreaterThan(0);
    expect(s1.enemies.length).toBe(0);
  });
});
