// 无尽模式：波次生成 + hpMul 索引增长 + 敌池 + 计分 + 里程碑
import type { WaveConfig, SpawnEntry } from '../types';

// 无尽模式专属地图路径：三路锯齿布局，中间建塔带可覆盖多路
export const ENDLESS_PATHS = [
  [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 10, y: 4 }, { x: 10, y: 7 }, { x: 15, y: 7 }],
  [{ x: 0, y: 4 }, { x: 5, y: 4 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 7 }, { x: 5, y: 7 }, { x: 5, y: 4 }, { x: 10, y: 4 }, { x: 10, y: 0 }, { x: 15, y: 0 }],
];

const PREP_TIME = 6;  // 波间倒计时（秒）

// 敌池：按波次范围解锁
const POOLS: ReadonlyArray<{ from: number; enemies: string[] }> = [
  { from: 0,  enemies: ['wolf', 'boar', 'bat', 'bull', 'magic_minion', 'blood_cultist'] },
  { from: 5,  enemies: ['shadow_fox', 'splitter', 'sand_scorpion', 'barbarian', 'mist_wraith'] },
  { from: 10, enemies: ['magic_puppet', 'demon_knight', 'shadow_assassin', 'demon_serpent'] },
  { from: 15, enemies: ['dragon_young', 'ghost_cultivator', 'void_walker', 'celestial_demon'] },
  { from: 20, enemies: ['chaos_larva', 'chaos_beast', 'law_enforcer', 'void_devourer'] },
];

// BOSS 敌池
const BOSS_POOL: ReadonlyArray<{ from: number; enemies: string[] }> = [
  { from: 0,  enemies: ['boar_king'] },
  { from: 5,  enemies: ['mage_lord', 'rift_lord'] },
  { from: 10, enemies: ['nine_tails', 'demon_general'] },
  { from: 15, enemies: ['parasite_king', 'rift_sovereign'] },
  { from: 20, enemies: ['blood_lord', 'tribulation_avatar'] },
  { from: 30, enemies: ['dao_ancestor'] },
];

function pick(seed: number, arr: ReadonlyArray<string>): string {
  return arr[seed % arr.length];
}

/** 根据波次号获取可用敌池（普通敌人） */
function enemyPool(wave: number): string[] {
  const result: string[] = [];
  for (const p of POOLS) if (wave >= p.from) result.push(...p.enemies);
  return result;
}

/** 根据波次号获取可用 BOSS 池 */
function bossPool(wave: number): string[] {
  const result: string[] = [];
  for (const p of BOSS_POOL) if (wave >= p.from) result.push(...p.enemies);
  return result;
}

/** 生成一波敌人（普通波 or BOSS 波） */
export function generateWave(wave: number, seed: number): WaveConfig {
  const isBoss = (wave + 1) % 5 === 0;
  const count = Math.round(3 + wave / 3);
  const gap = Math.max(0.3, 0.8 - wave * 0.01);
  const spawns: SpawnEntry[] = [];

  if (isBoss) {
    const bossId = pick(seed + wave * 100, bossPool(wave));
    spawns.push({ enemy: bossId, count: 1, gap: 1, delay: 1, path: 1 });
    // 杂兵护航
    const pool = enemyPool(wave);
    const e1 = pick(seed + wave, pool);
    const e2 = pick(seed * 3 + wave * 7, pool);
    spawns.push({ enemy: e1, count: count, gap, delay: 0, path: 0 });
    spawns.push({ enemy: e2, count: count, gap, delay: 0, path: 2 });
  } else {
    const pool = enemyPool(wave);
    for (let p = 0; p < 3; p++) {
      const idx = seed * (p + 1) + wave * (p + 3);
      spawns.push({ enemy: pick(idx, pool), count: Math.round(count / 2), gap, delay: p * 0.5, path: p });
    }
  }

  return { spawns, clearBonus: 100 + wave * 15 };
}

/** 无尽模式 hpMul 指数曲线 */
export function endlessHpMul(wave: number): number {
  return 1.05 ** wave;
}

/** 波间倒计时（秒），随波次微降 */
export function prepTime(wave: number): number {
  return Math.max(3, PREP_TIME - wave * 0.05);
}

/** 无尽模式得分 → 宗门贡献（封顶 500） */
export function endlessContrib(score: number): number {
  return Math.min(Math.round(Math.sqrt(score)), 500);
}

/** 里程碑检测：首次达到该波次 → 返回奖励 */
export interface MilestoneReward { contrib: number; title?: string }
export const MILESTONES: ReadonlyMap<number, MilestoneReward> = new Map([
  [20, { contrib: 150 }],
  [40, { contrib: 300 }],
  [60, { contrib: 500, title: '无尽行者' }],
  [80, { contrib: 1000, title: '永恒巡行者' }],
]);
