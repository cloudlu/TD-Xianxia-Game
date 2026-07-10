import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 17 章 第 2 关 · 鬼域迷踪（双路径，ghost_cultivator + shadow_assassin 隐身闪避组合）
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH17_L2: LevelConfig = {
  id: 'ch17-l2', name: '鬼域迷踪',
  startStones: 760, lives: 40,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.7,
  waves: [
    { spawns: [{ enemy: 'ghost_cultivator', count: 12, gap: 0.7, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 10, gap: 0.8, delay: 1, path: 1 }], clearBonus: 360 },
    { spawns: [{ enemy: 'shadow_assassin', count: 16, gap: 0.5, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 14, gap: 0.7, delay: 1, path: 1 }, { enemy: 'shadow_fox', count: 10, gap: 0.8, delay: 0, path: 0 }], clearBonus: 400 },
    { spawns: [{ enemy: 'ghost_cultivator', count: 18, gap: 0.6, delay: 0, path: 1 }, { enemy: 'shadow_assassin', count: 18, gap: 0.5, delay: 1, path: 0 }, { enemy: 'dragon_young', count: 8, gap: 1.2, delay: 0, path: 1 }], clearBonus: 460 },
  ],
  story: {
    intro: {
      chapter: '第 十 七 章', title: '鬼 域 迷 踪',
      lines: [
        '鬼域迷雾，影修隐现无定，刀光忽至。',
        '虚身与隐身交织，命中成了第一道难题。',
      ],
      btn: '破 迷 而 入',
    },
    outro: {
      chapter: '劫 后', title: '迷 雾 渐 开',
      lines: ['迷雾渐开，百族联军已在前方列阵。'],
      btn: '继 续',
    },
  },
};
