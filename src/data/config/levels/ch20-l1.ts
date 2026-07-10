import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 20 章 第 1 关 · 天妖先锋（双路径，heavy dragon_young + ghost_cultivator）
const PATHS = [[
  { x: 0, y: 3 }, { x: 5, y: 3 }, { x: 5, y: 1 },
  { x: 10, y: 1 }, { x: 10, y: 5 }, { x: 15, y: 5 },
]];

export const CH20_L1: LevelConfig = {
  id: 'ch20-l1', name: '天妖先锋',
  startStones: 860, lives: 42,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 3.0,
  waves: [
    { spawns: [{ enemy: 'dragon_young', count: 16, gap: 0.6, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 16, gap: 0.5, delay: 1, path: 0 }], clearBonus: 460 },
    { spawns: [{ enemy: 'ghost_cultivator', count: 20, gap: 0.4, delay: 0, path: 0 }, { enemy: 'dragon_young', count: 18, gap: 0.5, delay: 1, path: 0 }, { enemy: 'shadow_assassin', count: 16, gap: 0.5, delay: 0, path: 0 }], clearBonus: 500 },
    { spawns: [{ enemy: 'dragon_young', count: 22, gap: 0.5, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 22, gap: 0.4, delay: 1, path: 0 }, { enemy: 'demon_knight', count: 14, gap: 0.7, delay: 0, path: 0 }], clearBonus: 560 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 章', title: '天 妖 蛊 王',
      lines: [
        '天妖蛊王临世，万族生死尽在此战。',
        '其先锋铺天盖地，蛊毒染天。',
      ],
      btn: '迎 战 先 锋',
    },
    outro: {
      chapter: '劫 后', title: '先 锋 已 破',
      lines: ['先锋已破，近卫紧随其后。'],
      btn: '继 续',
    },
  },
};
