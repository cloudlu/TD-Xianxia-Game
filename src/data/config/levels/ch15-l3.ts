import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 15 章 第 3 关 · 魔帅（三路径，demon_general BOSS + 援军）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH15_L3: LevelConfig = {
  id: 'ch15-l3', name: '魔帅',
  startStones: 880, lives: 42,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.5,
  waves: [
    { spawns: [{ enemy: 'demon_knight', count: 14, gap: 0.8, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 14, gap: 0.6, delay: 1, path: 1 }, { enemy: 'demon_serpent', count: 10, gap: 1.2, delay: 0, path: 2 }], clearBonus: 480 },
    { spawns: [{ enemy: 'demon_knight', count: 18, gap: 0.7, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 14, gap: 0.8, delay: 1, path: 1 }, { enemy: 'magic_puppet', count: 14, gap: 0.8, delay: 0, path: 2 }], clearBonus: 540 },
    { spawns: [{ enemy: 'demon_general', count: 1, gap: 0, delay: 0, path: 0 }, { enemy: 'demon_knight', count: 16, gap: 0.8, delay: 1, path: 1 }, { enemy: 'shadow_assassin', count: 16, gap: 0.6, delay: 0, path: 2 }, { enemy: 'demon_serpent', count: 10, gap: 1.2, delay: 2, path: 0 }], clearBonus: 800 },
  ],
  story: {
    intro: {
      chapter: '第 十 五 章', title: '魔 帅 之 战',
      lines: [
        '魔帅现身，护盾笼罩，怒吼震天。',
        '万军压境，唯有一战定乾坤。',
        '为大陆苍生，破魔帅！',
      ],
      btn: '诛 魔',
    },
    outro: {
      chapter: '终 章', title: '联 盟 凯 旋',
      lines: [
        '魔帅陨落，魔域崩塌，大陆联盟凯旋。',
        '然而远方山脉间，异族旗帜隐隐浮现。',
        '百族大战的序曲，已然奏响……',
      ],
      btn: '续 篇',
    },
  },
};
