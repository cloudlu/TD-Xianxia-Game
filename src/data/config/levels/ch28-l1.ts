import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 28 章 第 1 关 · 虚空边缘（L 形单路径，引入虚空吞噬者）
const P = [[
  { x: 0, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 6 }, { x: 15, y: 6 },
]];

export const CH28_L1: LevelConfig = {
  id: 'ch28-l1', name: '虚空边缘',
  startStones: 1080, lives: 3,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.8,
  waves: [
    { spawns: [{ enemy: 'void_walker', count: 28, gap: 0.4, delay: 0 }, { enemy: 'chaos_larva', count: 31, gap: 0.4, delay: 1 }], clearBonus: 600 },
    { spawns: [{ enemy: 'void_devourer', count: 4, gap: 2.4, delay: 0 }, { enemy: 'law_enforcer', count: 11, gap: 1.2, delay: 1 }], clearBonus: 640 },
    { spawns: [{ enemy: 'void_devourer', count: 7, gap: 1.8, delay: 0 }, { enemy: 'chaos_beast', count: 11, gap: 1.6, delay: 1 }, { enemy: 'void_walker', count: 25, gap: 0.5, delay: 0 }], clearBonus: 700 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 八 章', title: '虚 空 边 缘',
      lines: ['原初之地的尽头，是无声的虚空——万物到此皆被吞噬。', '虚空吞噬者缓缓浮来，它们以一切存在为食。'],
      btn: '临 虚 空',
    },
    outro: {
      chapter: '吞 噬', title: '虚 无 之 食',
      lines: ['吞噬者的胃囊似连接着另一片世界。', '更深处的深渊，正睁着一只眼……'],
      btn: '继 续',
    },
  },
};
