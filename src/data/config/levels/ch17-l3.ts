import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 17 章 第 3 关 · 百族联军（三路径，mixed + mage_lord mini-boss）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH17_L3: LevelConfig = {
  id: 'ch17-l3', name: '百族联军',
  startStones: 780, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.7,
  waves: [
    { spawns: [{ enemy: 'dragon_young', count: 14, gap: 0.9, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 17, gap: 0.7, delay: 1, path: 1 }, { enemy: 'demon_knight', count: 14, gap: 0.9, delay: 0, path: 2 }], clearBonus: 400 },
    { spawns: [{ enemy: 'shadow_assassin', count: 20, gap: 0.6, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 17, gap: 0.8, delay: 1, path: 1 }, { enemy: 'magic_puppet', count: 17, gap: 0.8, delay: 0, path: 2 }], clearBonus: 440 },
    { spawns: [{ enemy: 'mage_lord', count: 11, gap: 0, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 22, gap: 0.6, delay: 1, path: 1 }, { enemy: 'dragon_young', count: 17, gap: 0.8, delay: 0, path: 2 }, { enemy: 'shadow_assassin', count: 20, gap: 0.6, delay: 2, path: 0 }], clearBonus: 560 },
  ],
  story: {
    intro: {
      chapter: '第 十 七 章', title: '百 族 联 军',
      lines: [
        '百族联军压境，法师之主亲自督战。',
        '万军之前，唯决死一战。',
      ],
      btn: '决 死 一 战',
    },
    outro: {
      chapter: '劫 后', title: '联 军 溃 散',
      lines: ['法师之主陨落，联军溃散，龙脊山脉横亘前方。'],
      btn: '继 续',
    },
  },
};
