import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 18 章 第 2 关 · 幽冥古道（双路径，ghost_cultivator + splitter + shadow_fox）
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH18_L2: LevelConfig = {
  id: 'ch18-l2', name: '幽冥古道',
  startStones: 800, lives: 40,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.8,
  waves: [
    { spawns: [{ enemy: 'ghost_cultivator', count: 14, gap: 0.7, delay: 0 }, { enemy: 'splitter', count: 10, gap: 1.0, delay: 1 }], clearBonus: 380 },
    { spawns: [{ enemy: 'shadow_fox', count: 14, gap: 0.6, delay: 0 }, { enemy: 'ghost_cultivator', count: 14, gap: 0.7, delay: 1 }, { enemy: 'splitter', count: 12, gap: 0.8, delay: 0 }], clearBonus: 420 },
    { spawns: [{ enemy: 'splitter', count: 16, gap: 0.6, delay: 0 }, { enemy: 'ghost_cultivator', count: 18, gap: 0.5, delay: 1 }, { enemy: 'dragon_young', count: 10, gap: 1.0, delay: 0 }], clearBonus: 480 },
  ],
  story: {
    intro: {
      chapter: '第 十 八 章', title: '幽 冥 古 道',
      lines: [
        '幽冥古道雾气弥漫，鬼修与裂体怪横行。',
        '一击之下，裂体怪分裂更速，需谨慎应对。',
      ],
      btn: '步 入 古 道',
    },
    outro: {
      chapter: '劫 后', title: '古 道 已 清',
      lines: ['古道已清，万族大军围向中央。'],
      btn: '继 续',
    },
  },
};
