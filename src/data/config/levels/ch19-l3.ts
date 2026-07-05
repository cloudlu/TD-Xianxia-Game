import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 19 章 第 3 关 · 最终防线（三路径，everything mixed + demon_general pre-boss）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH19_L3: LevelConfig = {
  id: 'ch19-l3', name: '最终防线',
  startStones: 860, lives: 42,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.9,
  waves: [
    { spawns: [{ enemy: 'dragon_young', count: 14, gap: 0.7, delay: 0 }, { enemy: 'ghost_cultivator', count: 16, gap: 0.5, delay: 1 }, { enemy: 'shadow_assassin', count: 14, gap: 0.6, delay: 0 }], clearBonus: 460 },
    { spawns: [{ enemy: 'blood_cultist', count: 18, gap: 0.5, delay: 0 }, { enemy: 'demon_knight', count: 16, gap: 0.6, delay: 1 }, { enemy: 'splitter', count: 14, gap: 0.7, delay: 0 }], clearBonus: 500 },
    { spawns: [{ enemy: 'demon_general', count: 1, gap: 0, delay: 0 }, { enemy: 'dragon_young', count: 16, gap: 0.6, delay: 1 }, { enemy: 'ghost_cultivator', count: 20, gap: 0.4, delay: 0 }, { enemy: 'blood_cultist', count: 16, gap: 0.6, delay: 2 }], clearBonus: 640 },
  ],
  story: {
    intro: {
      chapter: '第 十 九 章', title: '最 终 防 线',
      lines: [
        '此为天妖蛊王之前的最后一道防线。',
        '魔帅再临，万族背水一战。',
      ],
      btn: '守 最 后 一 线',
    },
    outro: {
      chapter: '劫 后', title: '防 线 未 陷',
      lines: ['魔帅再陨，天妖蛊王的本体终于现身。'],
      btn: '进 入 终 战',
    },
  },
};
