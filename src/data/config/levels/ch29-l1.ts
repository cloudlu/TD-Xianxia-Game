import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 29 章 第 1 关 · 魔影前军（直路径）
const P = [[
  { x: 0, y: 4 }, { x: 15, y: 4 },
]];

export const CH29_L1: LevelConfig = {
  id: 'ch29-l1', name: '魔影前军',
  startStones: 1120, lives: 50,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.9,
  waves: [
    { spawns: [{ enemy: 'chaos_beast', count: 10, gap: 1.4, delay: 0 }, { enemy: 'void_walker', count: 24, gap: 0.4, delay: 1 }, { enemy: 'law_enforcer', count: 8, gap: 1.2, delay: 0 }], clearBonus: 660 },
    { spawns: [{ enemy: 'void_devourer', count: 7, gap: 1.5, delay: 0 }, { enemy: 'celestial_demon', count: 14, gap: 0.8, delay: 1 }, { enemy: 'chaos_larva', count: 30, gap: 0.4, delay: 0 }], clearBonus: 700 },
    { spawns: [{ enemy: 'chaos_beast', count: 12, gap: 1.2, delay: 0 }, { enemy: 'void_devourer', count: 6, gap: 1.6, delay: 1 }, { enemy: 'law_enforcer', count: 12, gap: 0.8, delay: 2 }, { enemy: 'ghost_cultivator', count: 20, gap: 0.5, delay: 0 }], clearBonus: 760 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 九 章', title: '终 极 考 验',
      lines: ['道祖之门已在前方，但门外的「魔影前军」如山如海。', '这是飞升前的最后一程，也是天道最后的阻挡。'],
      btn: '破 前 军',
    },
    outro: {
      chapter: '前 军', title: '魔 影 未 止',
      lines: ['前军溃散，但魔影的源头仍在门后静静等待。', '你能感到——那道目光，来自你自己……'],
      btn: '继 续',
    },
  },
};
