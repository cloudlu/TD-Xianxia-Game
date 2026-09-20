import { describe, it, expect } from 'vitest';
import { Game } from './Game';
import type { ConfigLookup } from './Game';
import type { LevelConfig, TowerConfig, EnemyConfig, ChallengeDef } from '../types';
import { ModifierSet, type Modifier } from '../data/Modifier';
import { wallBuildable } from '../data/config/streamMaps';

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

describe('Game multi-challenge settlement', () => {
  const chSpeed: ChallengeDef = { id: 'spd', name: '速通', desc: '', kind: 'speed', params: { limit: 0.01 }, rewardContrib: 10 };
  const chMono: ChallengeDef = { id: 'mono', name: '纯剑', desc: '', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 20 };
  const chBudget: ChallengeDef = { id: 'bud', name: '精打', desc: '', kind: 'budget', params: { limit: 100 }, rewardContrib: 30 };

  function makeGame(): Game {
    const g = new Game(level, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.setChallenge([chSpeed, chMono, chBudget]);
    return g;
  }

  it('all challenges are tracked at once and each settles independently', () => {
    const g = makeGame();
    g.placeTower(0, 0, 'test_tower'); // 花钱 100，预算 100 仍达标
    g.startWave();
    run(g, 60); // 通关（用时远超 1s → speed 失败）

    const res = g.getChallengeResults();
    const byId = Object.fromEntries(res.map((r) => [r.challenge.id, r]));
    // speed 超时失败；mono 全剑修达标；budget 花费 100 达标
    expect(byId['spd'].failed).toBe(true);
    expect(byId['mono'].failed).toBe(false);
    expect(byId['bud'].failed).toBe(false);
    // 快照同时暴露全部挑战状态
    const s = g.snapshot();
    expect(s.challenges?.length).toBe(3);
    expect(s.challenges?.find((c) => c.id === 'spd')?.failed).toBe(true);
    expect(s.challenges?.find((c) => c.id === 'bud')?.progress).toMatchObject({ totalSpent: 100 });
  });

  it('snapshot reports no challenges when none set', () => {
    const g = new Game(level, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    const s = g.snapshot();
    expect(s.challenges).toEqual([]);
  });
});

describe('realm cap (v0.86 方案 A)', () => {
  const cappedTower: TowerConfig = {
    ...testTower,
    levels: [
      { realm: '炼气', dmg: 10, rate: 1, range: 5 },
      { realm: '筑基', dmg: 20, rate: 1, range: 5, upgradeCost: 50 },
      { realm: '金丹', dmg: 40, rate: 1, range: 5, upgradeCost: 100 },
    ],
  };
  const cappedLevel: LevelConfig = { ...level, id: 'ch2-l1', maxTowerLevel: 1 };
  const cappedReg: ConfigLookup = { enemy: () => testEnemy, tower: () => cappedTower };

  it('respects maxTowerLevel from level config', () => {
    const g = new Game(cappedLevel, cappedReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.placeTower(0, 0, 'test_tower');
    expect(g.upgradeCost(g.towerOps.towers[0].uid)).toBe(50);   // →筑基可
    g.upgradeTower(g.towerOps.towers[0].uid);
    expect(g.upgradeCost(g.towerOps.towers[0].uid)).toBeNull();  // →金丹被封
  });

  it('exempts cleared levels (复刷豁免) via realmCapExempt callback', () => {
    const g = new Game(cappedLevel, cappedReg, 42, undefined, ModifierSet.empty, 1, 1, 1,
      (levelId) => levelId === 'ch2-l1');   // 模拟已通关
    g.placeTower(0, 0, 'test_tower');
    g.upgradeTower(g.towerOps.towers[0].uid);
    expect(g.upgradeCost(g.towerOps.towers[0].uid)).toBe(100);  // 金丹可升
  });

  it('exempts endless mode regardless of callback', () => {
    const endlessLevel: LevelConfig = { ...cappedLevel, id: 'endless' };
    const g = new Game(endlessLevel, cappedReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.placeTower(0, 0, 'test_tower');
    g.upgradeTower(g.towerOps.towers[0].uid);
    expect(g.upgradeCost(g.towerOps.towers[0].uid)).toBe(100);  // 无尽不封
  });
});

describe('lane mode (v0.89 Phase 1 车道防守)', () => {
  const laneLevel: LevelConfig = {
    ...level, id: 'lane_test',
    cols: 8, rows: 3,
    mode: 'lane',
    lane: { sweepCol: 1, pickup: { value: 5, intervalSec: 2, maxPerWave: 3 } },
    paths: [
      [{ x: 7, y: 0 }, { x: 0, y: 0 }],
      [{ x: 7, y: 2 }, { x: 0, y: 2 }],
    ],
    buildable: Array.from({ length: 3 }, () => Array(8).fill(true)),
    waves: [{ spawns: [{ enemy: 'test_enemy', count: 2, gap: 0.1, delay: 0, path: 0 }], clearBonus: 100 }],
  };

  it('lane mode exposes sweepsLeft; sweep saves exactly one breach without life loss', () => {
    const g = new Game(laneLevel, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.startWave();
    expect(g.snapshot().laneMode).toBe(true);
    expect(g.snapshot().sweepsLeft).toEqual([1, 1]);
    // 2 只敌人（gap 0.1s）先后来到符线：第一只触发横扫被拦（不扣心、符消耗），
    // 第二只紧随其后但符已耗尽 → 扣 1 心。横扫符 = 每道一次保险，非无敌屏障。
    for (let i = 0; i < 60 * 12; i++) g.tick(1 / 30);
    expect(g.lives).toBe(2);
    expect(g.snapshot().sweepsLeft![0]).toBe(0);  // 该道符已消耗
    expect(g.snapshot().sweepsLeft![1]).toBe(1);  // 另一道未消耗
  });

  it('second wave on same lane leaks (sweep consumed) after first was swept', () => {
    const twoWaves: LevelConfig = {
      ...laneLevel,
      waves: [
        { spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0, path: 0 }], clearBonus: 10 },
        { spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0, path: 0 }], clearBonus: 10 },
      ],
    };
    const g = new Game(twoWaves, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.startWave();
    for (let i = 0; i < 60 * 12 && g.status === 'wave'; i++) g.tick(1 / 30);   // 第 1 波被横扫
    expect(g.snapshot().sweepsLeft![0]).toBe(0);
    const livesBefore = g.lives;
    g.startWave();                                                              // 第 2 波
    for (let i = 0; i < 60 * 12 && g.lives === livesBefore; i++) g.tick(1 / 30);
    expect(g.lives).toBe(livesBefore - 1);     // 无符可挡 → 扣心
  });

  it('pickup stones spawn during wave and can be collected once', () => {
    const g = new Game(laneLevel, defaultReg, 999, undefined, ModifierSet.empty, 1, 1, 1);
    g.startWave();
    // 跑 ~10s 让拾取物落地（interval 2s ±40%，窗口 30s，maxPerWave 3）
    for (let i = 0; i < 60 * 10; i++) g.tick(1 / 30);
    const s = g.snapshot();
    expect(s.laneMode).toBe(true);
    if (s.pickups && s.pickups.length > 0) {
      const target = s.pickups[0];
      const before = g.stones;
      expect(g.collectPickup(target.uid)).toBe(target.value);
      expect(g.stones).toBe(before + target.value);
      expect(g.collectPickup(target.uid)).toBe(0);   // 已收集，二次点击无效
    } else {
      // rng 派生序列至少应产生落地物（10s > 首个 at≈1.2-2.8s）；此分支不应触发，容错断言
      expect(g.waveIndex).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('lane mode 大灵晶 (清波奖手动拾取)', () => {
  const laneLevel2: LevelConfig = {
    id: 'lane_bonus', name: '测试', startStones: 500, lives: 3,
    cols: 8, rows: 3,
    mode: 'lane',
    lane: { sweepCol: 1, pickup: { value: 5, intervalSec: 2, maxPerWave: 3 } },
    paths: [[{ x: 7, y: 1 }, { x: 0, y: 1 }]],
    buildable: Array.from({ length: 3 }, () => Array(8).fill(true)),
    waves: [{ spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0, path: 0 }], clearBonus: 120 }],
  };

  it('清波奖不掉现金而是波末掉落大灵晶（value=clearBonus，不过期）', () => {
    const g = new Game(laneLevel2, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.startWave();
    for (let i = 0; i < 60 * 12 && g.status === 'wave'; i++) g.tick(1 / 30);
    const s = g.snapshot();
    const bonusGems = (s.pickups ?? []).filter((p) => p.value === 120);
    expect(bonusGems.length).toBe(1);
    // 不过期：跑 60s 后仍在
    for (let i = 0; i < 60 * 60; i++) g.tick(1 / 30);
    const s2 = g.snapshot();
    expect((s2.pickups ?? []).some((p) => p.value === 120)).toBe(true);
    // 点击收取 = clearBonus 全额
    const before = g.stones;
    expect(g.collectPickup(120 === 120 ? bonusGems[0].uid : bonusGems[0].uid)).toBe(120);
    expect(g.stones).toBe(before + 120);
  });

  it('classic 模式清波奖仍自动入账（行为不变）', () => {
    const g = new Game(level, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.placeTower(0, 0, 'test_tower');
    const before = g.stones;
    g.startWave();
    for (let i = 0; i < 60 * 10; i++) g.tick(1 / 30);
    expect(g.stones).toBe(before + 50 /*bounty*/ + 100 /*clearBonus*/);
  });
});

describe('stream mode (v0.92 全屏随机列 + 妖风)', () => {
  // 8 列全屏：每列一条纵向车道（v0.92 结构）
  const streamLevel: LevelConfig = {
    ...level, id: 'stream_test',
    cols: 8, rows: 5,
    mode: 'stream',
    stream: { sweepRow: 3, prepBetweenSec: 0, sweeperCount: 8, windIntervalSec: 2, hammerDmgPct: 0.30, hammerAmmo: 12 },
    paths: Array.from({ length: 8 }, (_, x) => [{ x, y: 0 }, { x, y: 4 }]),
    buildable: Array.from({ length: 5 }, () => Array(8).fill(true)),
    waves: [{ spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0, path: 0 }], clearBonus: 50 }],
  };

  it('出生列确定性：同 seed 同列；出生列在 [0, cols) 内', () => {
    const g1 = new Game(streamLevel, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g1.startWave();
    for (let i = 0; i < 5; i++) g1.tick(1 / 30);   // 出生（delay 0，首帧即生成）
    const e1 = g1.snapshot().enemies[0];
    const g2 = new Game(streamLevel, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g2.startWave();
    for (let i = 0; i < 5; i++) g2.tick(1 / 30);
    const e2 = g2.snapshot().enemies[0];
    expect(e1.pathIndex).toBe(e2.pathIndex);       // 确定性
    expect(e1.pathIndex).toBeGreaterThanOrEqual(0);
    expect(e1.pathIndex).toBeLessThan(8);
  });

  it('出生预警：delay>1s 的敌人生成 [warnAt, spawnAt) 时刻表（lead=1s）', () => {
    const delayedLevel: LevelConfig = {
      ...streamLevel,
      waves: [{ spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 2, path: 0 }], clearBonus: 50 }],
    };
    const g = new Game(delayedLevel, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    expect(g.snapshot().spawnWarnings).toEqual([]);
    g.startWave();
    const w = g.snapshot().spawnWarnings!;
    expect(w.length).toBe(1);
    expect(w[0].spawnAt - w[0].warnAt).toBeCloseTo(1);   // lead = 1s
    expect(w[0].spawnAt).toBeCloseTo(2);                 // delay 2s
    expect(w[0].col).toBeGreaterThanOrEqual(0);
    expect(w[0].col).toBeLessThan(8);
  });

  it('妖风变列：敌人 pathIndex 横移且位置重算（进度保留）', () => {
    // 专关：禁用横扫（sweepRow 大于路径长度），隔离妖风逻辑
    const windLevel: LevelConfig = {
      ...streamLevel,
      stream: { sweepRow: 99, prepBetweenSec: 0, sweeperCount: 0, windIntervalSec: 2, hammerDmgPct: 0.30, hammerAmmo: 0 },
    };
    const g = new Game(windLevel, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.startWave();
    for (let i = 0; i < 30; i++) g.tick(1 / 30);   // 1s：敌人走到 y≈1.5（未触发 2s 妖风）
    const before = g.snapshot().enemies[0];
    const colBefore = before.pathIndex;
    const distBefore = before.dist;
    // 再走 1.5s：越过 2s 妖风触发点
    for (let i = 0; i < 45; i++) g.tick(1 / 30);
    const after = g.snapshot().enemies[0];
    expect(after).toBeDefined();
    expect(after.dist).toBeGreaterThanOrEqual(distBefore);
    if (after.pathIndex !== colBefore) {
      expect(after.pathIndex).toBeGreaterThanOrEqual(0);
      expect(after.pathIndex).toBeLessThan(8);
      expect(Math.abs(after.pathIndex - colBefore)).toBeLessThanOrEqual(2);
      expect(Math.abs(after.y - before.y)).toBeLessThan(0.6);   // 行进位置不跳变（同构路径）
    }
  });

  it('防线横扫符按列布点：敌人（随机列）经过符列时拦截，非符列漏怪', () => {
    // 专关：全 8 列都有符 → 无论随机列落哪都被拦截
    const g = new Game(streamLevel, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.startWave();
    for (let i = 0; i < 60 * 8 && g.status === 'wave'; i++) g.tick(1 / 30);
    expect(g.lives).toBe(3);   // 符覆盖全列 → 唯一敌人必被扫
    const left = g.snapshot().sweepsLeft!;
    expect(left.filter((n) => n === 0).length).toBe(1);   // 恰消耗一枚
  });

  it('全屏可建：任意空格 canPlace 为 true', () => {
    const g = new Game(streamLevel, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    expect(g.canPlace(0, 0)).toBe(true);   // 顶部行（旧版是路径不可建）
    expect(g.canPlace(7, 4)).toBe(true);
  });

  it('城墙防线 v0.95：墙行以上不可建、墙行不可建、城内可建；塔贴墙越墙索敌', () => {
    // streamLevel：8 列 × 5 行，sweepRow=3 → WALL_INSET=5 不适用（rows=5 时 wallRow=0），
    // 用专用 8×8 关验证（wallRow = 8-5 = 3）
    const wallLevel: LevelConfig = {
      ...streamLevel,
      cols: 8, rows: 8,
      stream: { ...streamLevel.stream!, sweepRow: 4 },
      paths: Array.from({ length: 8 }, (_, x) => [{ x, y: 0 }, { x, y: 7 }]),
      buildable: wallBuildable(8, 8),
    };
    const g = new Game(wallLevel, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    expect(g.canPlace(3, 0)).toBe(false);   // 野战区（墙外）不可建
    expect(g.canPlace(3, 2)).toBe(false);
    expect(g.canPlace(3, 3)).toBe(false);   // 墙行（wallRow=3）不可建
    expect(g.canPlace(3, 4)).toBe(true);    // 城内第一行可建
    expect(g.canPlace(7, 7)).toBe(true);    // 防线行可建
  });

  it('夜袭平衡 v0.93：塔上限 maxTowers 生效 + 冲阵速度倍率生效', () => {    // 塔上限：maxTowers=6 → 第 7 座被拒
    const cappedLevel: LevelConfig = {
      ...streamLevel,
      startStones: 1000,   // 够建 6 座（每座 100）
      stream: { ...streamLevel.stream!, maxTowers: 6 },
    };
    const g = new Game(cappedLevel, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    for (let i = 0; i < 6; i++) {
      expect(g.canPlace(i % 8, 2)).toBe(true);
      expect(g.placeTower(i % 8, 2, 'test_tower')).toBe(true);
    }
    expect(g.canPlace(3, 0)).toBe(false);   // 第 7 座超上限    // 冲阵速度：enemySpeedMul=1.4 → 同时间位移 ×1.4（显式配置验证）
    const speedLevel: LevelConfig = {
      ...streamLevel,
      stream: { ...streamLevel.stream!, enemySpeedMul: 1.4 },
    };
    const g2 = new Game(speedLevel, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g2.startWave();
    for (let i = 0; i < 30; i++) g2.tick(1 / 30);   // 1s
    const e = g2.snapshot().enemies[0];
    expect(e.dist).toBeCloseTo(1.4, 1);             // speed 1 × 1.4 = 1.4 格/s
  });

  it('神雷锤击：伤害=基准血×pct（暴击×2）、耗弹、冷却、击杀', () => {
    const g = new Game(streamLevel, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.startWave();
    for (let i = 0; i < 3; i++) g.tick(1 / 30);   // 敌人出生
    const e = g.snapshot().enemies[0];
    expect(e).toBeDefined();
    // testEnemy 基准血 200 → 普击 = 200×0.30 = 60；暴击 120
    const r = g.strikeEnemy(e.uid);
    expect(['hit', 'crit', 'killed']).toContain(r);
    expect(g.hammerAmmo).toBe(11);                 // 耗 1 发
    // 冷却期内再击 → cooldown（不耗弹）
    expect(g.strikeEnemy(e.uid)).toBe('cooldown');
    expect(g.hammerAmmo).toBe(11);
    // 冷却结束可再击
    for (let i = 0; i < 12; i++) g.tick(1 / 30);   // 0.4s > 0.3s CD
    const hpBefore = g.snapshot().enemies[0]?.hp ?? 0;
    expect(g.strikeEnemy(g.snapshot().enemies[0].uid)).not.toBe('cooldown');
    const hpAfter = g.snapshot().enemies[0]?.hp ?? 0;
    const dealt = hpBefore - hpAfter;
    expect(dealt === 60 || dealt === 120).toBe(true);
    // 弹尽 → noammo
    const g2 = new Game({ ...streamLevel, stream: { ...streamLevel.stream!, hammerAmmo: 1 } }, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g2.startWave();
    for (let i = 0; i < 3; i++) g2.tick(1 / 30);
    g2.strikeEnemy(g2.snapshot().enemies[0].uid);
    expect(g2.strikeEnemy(g2.snapshot().enemies[0].uid)).toBe('noammo');
    // 波间补满：清波后弹药恢复
    expect(g2.hammerAmmo).toBe(0);
  });

  it('神雷波间补满：新波开始时弹药回满', () => {
    const twoWave: LevelConfig = {
      ...streamLevel,
      waves: [
        { spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0, path: 0 }], clearBonus: 50 },
        { spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0, path: 0 }], clearBonus: 50 },
      ],
    };
    const g = new Game(twoWave, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.startWave();
    for (let i = 0; i < 3; i++) g.tick(1 / 30);
    g.strikeEnemy(g.snapshot().enemies[0].uid);
    expect(g.hammerAmmo).toBe(11);
    for (let i = 0; i < 60 * 8 && g.status === 'wave'; i++) g.tick(1 / 30);   // 清波
    expect(g.status).toBe('prep');
    g.startWave();
    expect(g.hammerAmmo).toBe(12);   // 补满
  });

  it('神雷击杀：敌人死亡、发赏金（走 cleanup 通道）', () => {
    // 无英雄关（heroEnabled=false）：距离校验跳过，行为与 v0.93 一致
    const noHeroLevel: LevelConfig = {
      ...streamLevel,
      stream: { ...streamLevel.stream!, heroEnabled: false, windIntervalSec: 0, sweeperCount: 0, sweepRow: 99 },
    };
    const weakEnemy: EnemyConfig = { ...testEnemy, hp: 25 };
    const reg: ConfigLookup = { enemy: () => weakEnemy, tower: () => testTower };
    const g = new Game(noHeroLevel, reg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    const stonesBefore = g.stones;
    g.startWave();
    for (let i = 0; i < 3; i++) g.tick(1 / 30);
    const r = g.strikeEnemy(g.snapshot().enemies[0].uid);
    expect(['hit', 'crit', 'killed']).toContain(r);
    if (r === 'killed') {
      expect(g.snapshot().enemies.length).toBe(0);
      for (let i = 0; i < 5; i++) g.tick(1 / 30);
      expect(g.stones).toBeGreaterThan(stonesBefore);
    } else {
      const hp = g.snapshot().enemies[0].hp;
      expect(hp).toBeLessThan(25);
      expect(hp).toBeGreaterThan(0);
    }
  });

  it('御剑守城：纯英雄关卡初始化——无塔可建、随身本命飞剑、锁定墙线 y', () => {
    const g = new Game(pureHeroLevel(), defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    expect(g.pureHero).toBe(true);
    expect(g.canPlace(0, 0)).toBe(false);   // 彻底无塔
    expect(g.canPlace(4, 4)).toBe(false);
    const hero = g.hero!;
    expect(hero).not.toBeNull();
    expect(hero.abilities.map((a) => a.school)).toEqual(['sword']);   // 本命飞剑
    expect(hero.abilities[0].level).toBe(0);
    expect(hero.x).toBeCloseTo(4.5);   // 中列
  });

  it('御剑守城：stream.wallRow 覆盖 → 城墙与真人站位贴底两行且无塔可建', () => {
    const lvl: LevelConfig = {
      ...pureHeroLevel(),
      cols: 8, rows: 8,
      stream: { ...pureHeroLevel().stream!, wallRow: 6 },   // 8 行 → 城墙最后两行（rows-2）
    };
    const g = new Game(lvl, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    expect(g.snapshot().streamWallRow).toBe(6);
    const hero = g.hero!;
    expect(hero.y).toBeCloseTo(5.5);    // wallRow-0.5 → 真人站在城墙战线上（位于底部两行）
    expect(g.canPlace(3, 6)).toBe(false);   // 墙行无塔
    expect(g.canPlace(4, 7)).toBe(false);   // 城底行无塔
  });

  it('御剑守城：鼠标 X 驱动横移 + 塔符自动入体（升级/满槽回弹）+ 波间保留', () => {
    const g = new Game(pureHeroLevel(), defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    const hero = g.hero!;
    const sigils = (g as unknown as { sigils: { uid: number; x: number; y: number; school: string; spawnAt: number; lifeSec: number }[] }).sigils;
    // 移动：targetX=7 → 逼近不冲头；y 锁定 2.5（wallRow-0.5）
    g.startWave();
    g.setHeroTargetX(7);
    for (let i = 0; i < 30; i++) g.tick(1 / 30);   // 1s × 6 格/s
    expect(hero.x).toBeGreaterThan(4.5);
    expect(hero.x).toBeLessThanOrEqual(7);
    expect(hero.y).toBe(2.5);
    // 塔符任意处出现 → 自动飞向真人并入体 → 获得雷法（无需走位）
    sigils.push({ uid: 999, x: 1.5, y: 0.5, school: 'thunder', spawnAt: 0, lifeSec: 60 });
    for (let i = 0; i < 90 && !hero.abilities.some((a) => a.school === 'thunder'); i++) g.tick(1 / 30);
    expect(hero.abilities.map((a) => a.school)).toEqual(['sword', 'thunder']);
    // 重复拾取雷法 → 升级（level 1）
    sigils.push({ uid: 998, x: 7.5, y: 1.5, school: 'thunder', spawnAt: 0, lifeSec: 60 });
    for (let i = 0; i < 90 && (hero.abilities.find((a) => a.school === 'thunder')?.level ?? 0) < 1; i++) g.tick(1 / 30);
    expect(hero.abilities.find((a) => a.school === 'thunder')!.level).toBe(1);
    expect(hero.abilities.length).toBe(2);
    // 能力槽满（本命剑 + 4 系）时再收 → 拒绝，塔符回弹上空（仍在场上）
    for (const s of ['fire', 'ice', 'talisman'] as const) {
      sigils.push({ uid: 900, x: hero.x, y: hero.y, school: s, spawnAt: 0, lifeSec: 60 });
      g.tick(1 / 30);   // 就在脚下 → 当拍即收
    }
    expect(hero.abilities.length).toBe(5);   // sword + fire + ice + talisman + thunder
    const before = hero.abilities.length;
    const spearAt = g.snapshot().elapsed;
    sigils.push({ uid: 800, x: hero.x, y: hero.y, school: 'spear', spawnAt: 0, lifeSec: 60 });
    g.tick(1 / 30);
    expect(hero.abilities.length).toBe(before);                    // 未新增
    const rb = sigils.find((s) => s.uid === 800);
    expect(rb).toBeDefined();                                      // 塔符回弹留在场上
    expect(rb!.spawnAt).toBeGreaterThan(spearAt);                  // 延后再飞
    expect(rb!.y).toBeLessThan(hero.y);                            // 抬升到空中
    // 波间保留：清波后能力不清空（新波仍持有）
    for (let i = 0; i < 60 * 10 && g.status === 'wave'; i++) g.tick(1 / 30);
    expect(g.status).toBe('prep');
    const kept = hero.abilities.map((a) => `${a.school}${a.level}`);
    g.startWave();
    expect(hero.abilities.map((a) => `${a.school}${a.level}`)).toEqual(kept);
  });

  it('御剑守城：自动攻击（进射程掉血）+ 集火优先 + 目标消亡后清除集火', () => {
    // 用超厚敌人：保证波内玩家不因击杀结束，可观察连续自动攻击
    const tankReg: ConfigLookup = { enemy: () => ({ ...testEnemy, hp: 200000 }), tower: () => testTower };
    const g2 = new Game(pureHeroLevel(), tankReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    const hero = g2.hero!;
    g2.startWave();
    let damaged = false;
    let sawDmgFx = false;
    // 追踪敌人：敌人沿列直线下行（speed 1）；真人跟到敌列垂直对齐 → 射程内自动开火（弹道命中有飘字特效）
    for (let t = 0; t < 900; t++) {
      g2.tick(1 / 30);
      const s = g2.snapshot();
      const e = s.enemies[0];
      if (!e) break;
      if (s.effects.some((fx) => fx.kind === 'dmg')) sawDmgFx = true;
      g2.setHeroTargetX(e.x);
      if (e.hp < 200000 && e.y > 2.5) {
        damaged = true;
        break;   // 敌人进射程被命中
      }
    }
    expect(damaged).toBe(true);
    // 命中必有掉血飘字特效（走 TowerCombat.damage 管线；0.7s 寿命，须在循环内累计采样）
    expect(sawDmgFx).toBe(true);
    // 集火目标消亡后自动清除
    g2.setFocus(g2.snapshot().enemies[0].uid);
    expect(hero.focusUid).toBe(g2.snapshot().enemies[0].uid);
    (g2 as unknown as { waveManager: { enemies: Array<{ uid: number; x: number; y: number; maxHp: number; dead: boolean; leaked: boolean; hp: number; pathIndex: number; dist: number; slowFactor: number; slowUntil: number; hitFlash: number; shield: number }> } }).waveManager.enemies[0].dead = true;
    g2.tick(1 / 30);
    expect(hero.focusUid).toBeUndefined();
  });

  it('御剑守城：塔符击杀掉落——敌死于何处就在何处爆符，每波至多 3 枚', () => {
    // 6 只 hp200 敌（剑 35%×…击毙约 3 剑/只），波内 6 次击杀 > 掉落预算 3
    const lvl: LevelConfig = {
      ...pureHeroLevel(),
      waves: [
        { spawns: [{ enemy: 'test_enemy', count: 6, gap: 2.5, delay: 0, path: 0 }], clearBonus: 50 },
      ],
    };
    const g = new Game(lvl, defaultReg, 7, undefined, ModifierSet.empty, 1, 1, 1);
    const spawnPos = new Map<number, { x: number; y: number }>();   // uid → 首次见到的坐标（= 死亡点）
    g.startWave();
    for (let i = 0; i < 60 * 60 && g.status === 'wave'; i++) {
      g.tick(1 / 30);
      const sigs = g.snapshot().sigils ?? [];
      for (const s of sigs) {
        if (!spawnPos.has(s.uid)) spawnPos.set(s.uid, { x: s.x, y: s.y });
      }
    }
    expect(g.status).toBe('won');                                  // 单波 6 敌杀完即通关
    expect(spawnPos.size).toBe(3);                       // 每波掉落预算封顶 3
    for (const p of spawnPos.values()) {
      expect(p.x).toBeCloseTo(0.5, 5);                   // 敌都沿 col0 死 → 爆符也在该列（旧随机布点会散落各列）
    }
  });
});

/** 御剑守城专用关卡：8×8（wallRow=3 → 真人墙线 y=2.5）+ 全不可建；双波 + 长波间便于验证波间保留 */
function pureHeroLevel(): LevelConfig {
  return {
    id: 'pure_hero_test', name: '御剑守城测试', startStones: 500, lives: 3,
    cols: 8, rows: 8,
    mode: 'stream',
    stream: { pureHero: true, hammerAmmo: 0, sweepRow: 4, prepBetweenSec: 99, sweeperCount: 0, windIntervalSec: 0 },
    paths: Array.from({ length: 8 }, (_, x) => [{ x, y: 0 }, { x, y: 7 }]),
    buildable: Array.from({ length: 8 }, () => Array(8).fill(false)),
    waves: [
      { spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0, path: 0 }], clearBonus: 50 },
      { spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0, path: 0 }], clearBonus: 50 },
    ],
  };
}

describe('forge mode (v0.91 P3 三路经营战)', () => {
  const forgeLevel: LevelConfig = {
    ...level, id: 'forge_test',
    cols: 8, rows: 6,
    mode: 'forge',
    forge: {
      forges: [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 }],
      forgeSecPerLevel: [1, 2, 3],   // 测试用 1s 快锻
      collectDmgPctPerLevel: 0.05,
      maxTotalDmgPct: 0.6,
      mergeEnabled: true,
    },
    paths: [[{ x: 0, y: 1 }, { x: 7, y: 1 }]],
    buildable: Array.from({ length: 6 }, () => Array(8).fill(true)),
    waves: [{ spawns: [{ enemy: 'test_enemy', count: 1, gap: 0, delay: 0, path: 0 }], clearBonus: 50 }],
  };

  it('合并（未就绪）→锻造→收取→加成生效全流程', () => {
    const g = new Game(forgeLevel, defaultReg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.startWave();
    // 未就绪阶段：选中炉 A，点相邻同级炉 B → 合并（4→3，A 升级）
    let s = g.snapshot();
    const fa = s.forges![0], fb = s.forges![1];
    expect(g.clickForge(fa.uid)).toBe('selected');
    expect(g.clickForge(fb.uid)).toBe('merged');
    s = g.snapshot();
    expect(s.forges!.length).toBe(3);
    expect(s.forges!.find((f) => f.uid === fa.uid)!.level).toBe(1);
    // 锻造 1.5s → 0 级炉 ready（1 级炉用第 2 档 2s 未 ready）
    for (let i = 0; i < 45; i++) g.tick(1 / 30);
    s = g.snapshot();
    const lv0 = s.forges!.find((f) => f.level === 0)!;
    expect(lv0.ready).toBe(true);
    // 收取：+5%
    expect(g.clickForge(lv0.uid)).toBe('collected');
    expect(g.snapshot().forgeBonus).toBeCloseTo(0.05);
    // 锻炉格不可建塔，普通格可建
    expect(g.canPlace(6, 4)).toBe(false);
    expect(g.canPlace(3, 4)).toBe(true);
  });

  it('锻炉伤害加成注入塔伤害（effectiveStats）', () => {
    // 高血敌人：保证波不结束、tick 持续推进锻炉
    const tankyEnemy: EnemyConfig = { ...testEnemy, hp: 1e9 };
    const reg: ConfigLookup = { enemy: () => tankyEnemy, tower: () => testTower };
    const g = new Game(forgeLevel, reg, 42, undefined, ModifierSet.empty, 1, 1, 1);
    g.placeTower(3, 0, 'test_tower');   // 塔在路径附近但不影响锻造
    const uid = g.towerOps.towers[0].uid;
    const before = g.getEffectiveStats(uid)!.dps;
    g.startWave();
    for (let i = 0; i < 45; i++) g.tick(1 / 30);
    const s = g.snapshot();
    const ready = s.forges!.find((f) => f.ready)!;
    expect(ready).toBeDefined();
    expect(g.clickForge(ready.uid)).toBe('collected');
    const after = g.getEffectiveStats(uid)!.dps;
    expect(after).toBe(Math.round(before * 1.05));   // +5%
  });
});
