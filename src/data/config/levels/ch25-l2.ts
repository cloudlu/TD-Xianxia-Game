import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 25 章 第 2 关 · 天劫之威（三路径）
const P = [
  [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 10, y: 4 }, { x: 10, y: 7 }, { x: 15, y: 7 }],
  [{ x: 0, y: 4 }, { x: 5, y: 4 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 7 }, { x: 5, y: 7 }, { x: 5, y: 4 }, { x: 10, y: 4 }, { x: 10, y: 0 }, { x: 15, y: 0 }],
];

export const CH25_L2: LevelConfig = {
  id: 'ch25-l2', name: '天劫之威',
  startStones: 1000, lives: 3,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.5,
  waves: [
    { spawns: [{ enemy: 'celestial_demon', count: 25, gap: 0.7, delay: 0, path: 0 }, { enemy: 'void_walker', count: 31, gap: 0.4, delay: 0, path: 1 }], clearBonus: 560 },
    { spawns: [{ enemy: 'chaos_larva', count: 34, gap: 0.4, delay: 0, path: 2 }, { enemy: 'celestial_demon', count: 22, gap: 0.7, delay: 1, path: 0 }], clearBonus: 590 },
    { spawns: [{ enemy: 'void_walker', count: 36, gap: 0.3, delay: 0, path: 1 }, { enemy: 'celestial_demon', count: 28, gap: 0.6, delay: 0, path: 2 }, { enemy: 'ghost_cultivator', count: 14, gap: 0.9, delay: 1, path: 0 }], clearBonus: 620 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 五 章', title: '天 劫 之 威',
      lines: [
        '天劫之威横扫三路，紫雷所过，万物化为飞灰。',
        '联盟弟子前赴后继，用生命为太上长老争取布阵的时间。',
        '这一战，已无人能置身事外。',
      ],
      btn: '以 命 抗 劫',
    },
    outro: {
      chapter: '天 威', title: '化 身 将 临',
      lines: ['紫雷终于渐歇，但化身已凝聚成型。', '最后的决战，就在眼前。'],
      btn: '继 续',
    },
  },
};
