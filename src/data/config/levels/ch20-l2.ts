import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 20 章 第 2 关 · 天妖近卫（三路径，everything mixed）
const PATHS = [
  [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 10, y: 4 }, { x: 10, y: 7 }, { x: 15, y: 7 }],
  [{ x: 0, y: 4 }, { x: 5, y: 4 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 7 }, { x: 5, y: 7 }, { x: 5, y: 4 }, { x: 10, y: 4 }, { x: 10, y: 0 }, { x: 15, y: 0 }],
];

export const CH20_L2: LevelConfig = {
  id: 'ch20-l2', name: '天妖近卫',
  startStones: 900, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 3.0,
  waves: [
    { spawns: [{ enemy: 'dragon_young', count: 22, gap: 0.6, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 25, gap: 0.5, delay: 1, path: 1 }, { enemy: 'demon_knight', count: 20, gap: 0.7, delay: 0, path: 2 }], clearBonus: 500 },
    { spawns: [{ enemy: 'shadow_assassin', count: 25, gap: 0.5, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 25, gap: 0.5, delay: 1, path: 1 }, { enemy: 'splitter', count: 22, gap: 0.6, delay: 0, path: 2 }], clearBonus: 540 },
    { spawns: [{ enemy: 'dragon_young', count: 28, gap: 0.5, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 31, gap: 0.4, delay: 1, path: 1 }, { enemy: 'demon_serpent', count: 17, gap: 1.0, delay: 0, path: 2 }, { enemy: 'magic_puppet', count: 20, gap: 0.7, delay: 2, path: 0 }], clearBonus: 600 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 章', title: '天 妖 近 卫',
      lines: [
        '天妖近卫护持蛊王本体，万族齐出。',
        '近卫一破，蛊王便再无遮掩。',
      ],
      btn: '破 近 卫',
    },
    outro: {
      chapter: '劫 后', title: '近 卫 已 散',
      lines: ['近卫已散，蛊王咆哮震天而起。'],
      btn: '继 续',
    },
  },
};
