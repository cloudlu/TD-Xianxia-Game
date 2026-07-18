import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 17 章 第 1 关 · 古战场（直路径，ghost_cultivator heavy + dragon_young）
const PATHS = [[
  { x: 0, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 5 },
  { x: 10, y: 5 }, { x: 10, y: 1 }, { x: 15, y: 1 },
]];

export const CH17_L1: LevelConfig = {
  id: 'ch17-l1', name: '古战场',
  startStones: 740, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.7,
  waves: [
    { spawns: [{ enemy: 'ghost_cultivator', count: 17, gap: 0.8, delay: 0 }, { enemy: 'dragon_young', count: 8, gap: 1.4, delay: 1 }], clearBonus: 340 },
    { spawns: [{ enemy: 'ghost_cultivator', count: 22, gap: 0.6, delay: 0 }, { enemy: 'wolf', count: 22, gap: 0.4, delay: 0 }], clearBonus: 380 },
    { spawns: [{ enemy: 'dragon_young', count: 17, gap: 0.9, delay: 0 }, { enemy: 'ghost_cultivator', count: 22, gap: 0.6, delay: 1 }, { enemy: 'demon_knight', count: 11, gap: 1.2, delay: 0 }], clearBonus: 420 },
  ],
  story: {
    intro: {
      chapter: '第 十 七 章', title: '古 战 场',
      lines: [
        '踏入远古战场遗址，怨灵不散，鬼修横行。',
        '龙裔巡空，唯有重击与法阵齐发方可破之。',
      ],
      btn: '入 古 战 场',
    },
    outro: {
      chapter: '劫 后', title: '怨 灵 渐 散',
      lines: ['怨灵暂散，更深的迷雾中似有刺客潜伏。'],
      btn: '继 续',
    },
  },
};
