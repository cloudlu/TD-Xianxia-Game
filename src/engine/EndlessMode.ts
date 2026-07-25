// 无尽模式：波次生成 + hpMul 索引增长 + 敌池 + 计分 + 里程碑 + 跳关 + 阵眼 + 加持
import type { WaveConfig, SpawnEntry, FormationTile } from '../types';

// 无尽模式专属地图路径：三路长程交织（32×12 网格）
// 每条路径含 4 段垂直爬升/下降（比原版多一倍），路程延长约 30%
// 三条路径共享中段横线 (6,6)→(12,6)，汇聚点 (24,6)
export const ENDLESS_PATHS = [
  [
    { x: 0, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 6 },
    { x: 12, y: 6 }, { x: 12, y: 11 }, { x: 18, y: 11 },
    { x: 18, y: 6 }, { x: 24, y: 6 }, { x: 24, y: 1 }, { x: 31, y: 1 },
  ],
  [
    { x: 0, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 1 },
    { x: 12, y: 1 }, { x: 12, y: 6 }, { x: 18, y: 6 },
    { x: 18, y: 11 }, { x: 24, y: 11 }, { x: 24, y: 6 }, { x: 31, y: 6 },
  ],
  [
    { x: 0, y: 11 }, { x: 6, y: 11 }, { x: 6, y: 6 },
    { x: 12, y: 6 }, { x: 12, y: 1 }, { x: 18, y: 1 },
    { x: 18, y: 6 }, { x: 24, y: 6 }, { x: 24, y: 11 }, { x: 31, y: 11 },
  ],
];

/** 无尽模式阵眼布局（32×12 网格，三路长程交织） */
export const ENDLESS_FORMATIONS: FormationTile[] = [
  // 风眼：共享横线段两侧（范围加成覆盖全部三路）
  { col: 5, row: 5, type: 'wind' },
  { col: 19, row: 5, type: 'wind' },
  // 雷眼：路径中段拐角（攻速加成）
  { col: 9, row: 0, type: 'thunder' },
  { col: 15, row: 10, type: 'thunder' },
  { col: 27, row: 0, type: 'thunder' },
  // 地眼：出口段（伤害加成）
  { col: 9, row: 10, type: 'earth' },
  { col: 27, row: 10, type: 'earth' },
  // 灵眼：角落
  { col: 1, row: 5, type: 'spirit' },
  { col: 29, row: 5, type: 'spirit' },
];

const PREP_TIME = 6;

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

function enemyPool(wave: number): string[] {
  const result: string[] = [];
  for (const p of POOLS) if (wave >= p.from) result.push(...p.enemies);
  return result;
}

function bossPool(wave: number): string[] {
  const result: string[] = [];
  for (const p of BOSS_POOL) if (wave >= p.from) result.push(...p.enemies);
  return result;
}

/** 生成一波敌人（普通波 or BOSS 波），三路模式 */
export function generateWave(wave: number, seed: number): WaveConfig {
  const isBoss = (wave + 1) % 5 === 0;
  const baseCount = Math.round(3 + wave / 3);
  const gap = Math.max(0.3, 0.8 - wave * 0.01);
  const spawns: SpawnEntry[] = [];
  const pool = enemyPool(wave);

  if (isBoss) {
    const bossId = pick(seed + wave * 100, bossPool(wave));
    spawns.push({ enemy: bossId, count: 1, gap: 1, delay: 1, path: 1 });
    const otherPaths = [0, 2];
    for (let i = 0; i < otherPaths.length; i++) {
      const e = pick(seed * (i + 3) + wave * 7, pool);
      spawns.push({ enemy: e, count: baseCount, gap, delay: i * 0.3, path: otherPaths[i] });
    }
  } else {
    for (let p = 0; p < 3; p++) {
      const idx = seed * (p + 1) + wave * (p + 3);
      spawns.push({ enemy: pick(idx, pool), count: baseCount, gap, delay: p * 0.4, path: p });
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

// ========== 跳关 ==========

/** 标准通关时长（秒），用于跳关节奏判定 */
export function parTime(wave: number): number {
  const enemyCount = Math.round(3 + wave / 3) * 3;
  const spawnGap = Math.max(0.3, 0.8 - wave * 0.01);
  const spawnDuration = enemyCount * spawnGap * 0.5;
  const walkTime = 17; // 路径延长约 30%
  const buffer = 2;
  return spawnDuration + walkTime + buffer;
}

/** 根据实际通关时间和波次计算应跳过的波数 */
export function calcSkip(clearTime: number, wave: number): number {
  const par = parTime(wave);
  const ratio = par / Math.max(clearTime, 0.1);
  if (ratio >= 4) return 3;
  if (ratio >= 2.5) return 2;
  if (ratio >= 1.5) return 1;
  return 0;
}

export const SKIP_MESSAGES: Record<number, string> = {
  1: '乘胜追击！跳过 1 波',
  2: '摧枯拉朽！跳过 2 波',
  3: '势如破竹！跳过 3 波',
};

// ========== 波间加持 ==========

export interface BlessingDef {
  id: string;
  name: string;
  desc: string;
}

export const BLESSINGS: BlessingDef[] = [
  { id: 'sword_fury',   name: '剑意凛然', desc: '飞剑/符箓修士伤害 +25%' },
  { id: 'spear_reach',  name: '枪出如龙', desc: '长枪兵修穿透 +1' },
  { id: 'fire_blaze',   name: '烈焰焚天', desc: '火法溅射半径 +0.5' },
  { id: 'thunder_chain', name: '雷霆万钧', desc: '雷法链跳次数 +2' },
  { id: 'ice_chill',    name: '玄冰刺骨', desc: '寒冰减速效果翻倍' },
  { id: 'aura_bless',   name: '灵气充沛', desc: '聚灵阵光环倍率 +0.1' },
  { id: 'stone_rush',   name: '灵石灌注', desc: '全塔伤害 +15%' },
  { id: 'iron_wall',    name: '铁壁',     desc: '漏怪伤害 -1（最低 1）' },
  { id: 'wind_step',    name: '疾风步',   desc: '全塔攻速 +20%' },
];

/** 从加持池随机选 count 个不同加持 */
export function pickBlessings(seed: number, count: number, exclude: string[] = []): BlessingDef[] {
  const pool = BLESSINGS.filter((b) => !exclude.includes(b.id));
  const shuffled = [...pool].sort((a, b) => {
    const ha = (seed * 31 + a.id.charCodeAt(0)) % 1000;
    const hb = (seed * 31 + b.id.charCodeAt(0)) % 1000;
    return ha - hb;
  });
  return shuffled.slice(0, count);
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
