import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 14 章 第 1 关 · 决战前夜（单路径，全面混合）
const PATHS = [[
  { x: 0, y: 4 }, { x: 15, y: 4 },
]];

export const CH14_L1: LevelConfig = {
  id: 'ch14-l1', name: '决战前夜',
  startStones: 720, lives: 38,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.4,
  waves: [
    { spawns: [{ enemy: 'demon_knight', count: 10, gap: 1.2, delay: 0 }, { enemy: 'shadow_assassin', count: 10, gap: 0.8, delay: 1 }], clearBonus: 380 },
    { spawns: [{ enemy: 'demon_serpent', count: 8, gap: 1.4, delay: 0 }, { enemy: 'blood_cultist', count: 10, gap: 1.0, delay: 1 }], clearBonus: 420 },
    { spawns: [{ enemy: 'magic_puppet', count: 12, gap: 0.9, delay: 0 }, { enemy: 'demon_knight', count: 12, gap: 0.9, delay: 1 }, { enemy: 'bat', count: 20, gap: 0.3, delay: 0 }], clearBonus: 480 },
  ],
  story: {
    intro: {
      chapter: '第 十 四 章', title: '决 战 前 夜',
      lines: [
        '决战将至，魔军最后挣扎。',
        '诸魔齐出，蓄势待发。',
      ],
      btn: '备 战',
    },
    outro: {
      chapter: '战 报', title: '前 夜 已 过',
      lines: ['魔军消耗殆尽。', '最后防线就在眼前。'],
      btn: '继 续',
    },
  },
};
