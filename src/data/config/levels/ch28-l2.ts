import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 28 章 第 2 关 · 吞噬者（双路径）
const P = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH28_L2: LevelConfig = {
  id: 'ch28-l2', name: '吞噬者',
  startStones: 1100, lives: 48,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.8,
  waves: [
    { spawns: [{ enemy: 'void_devourer', count: 5, gap: 1.8, delay: 0 }, { enemy: 'void_walker', count: 22, gap: 0.4, delay: 1 }], clearBonus: 620 },
    { spawns: [{ enemy: 'chaos_beast', count: 10, gap: 1.4, delay: 0 }, { enemy: 'law_enforcer', count: 10, gap: 1.0, delay: 1 }, { enemy: 'void_devourer', count: 4, gap: 2.2, delay: 2 }], clearBonus: 660 },
    { spawns: [{ enemy: 'void_devourer', count: 7, gap: 1.6, delay: 0 }, { enemy: 'celestial_demon', count: 14, gap: 0.8, delay: 1 }, { enemy: 'chaos_larva', count: 28, gap: 0.4, delay: 0 }, { enemy: 'void_walker', count: 18, gap: 0.5, delay: 2 }], clearBonus: 720 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 八 章', title: '吞 噬 者',
      lines: ['吞噬者成群浮现，连「规则」本身都在被它们咀嚼。', '你必须步步为营，否则连同记忆都会被吞没。'],
      btn: '战 吞 噬',
    },
    outro: {
      chapter: '深 渊', title: '混 沌 涌 动',
      lines: ['吞噬者退去，深渊中却翻涌起更浓重的混沌。', '那不是虚空——是混沌深渊的呼吸。'],
      btn: '继 续',
    },
  },
};
