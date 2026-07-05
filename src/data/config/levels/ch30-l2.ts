import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 30 章 第 2 关 · 最终之敌（三路径，万物混杂）
const P = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH30_L2: LevelConfig = {
  id: 'ch30-l2', name: '最终之敌',
  startStones: 1200, lives: 50,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 4.0,
  waves: [
    { spawns: [{ enemy: 'chaos_beast', count: 16, gap: 0.9, delay: 0 }, { enemy: 'void_devourer', count: 10, gap: 1.2, delay: 1 }, { enemy: 'law_enforcer', count: 14, gap: 0.8, delay: 0 }, { enemy: 'void_walker', count: 24, gap: 0.4, delay: 2 }], clearBonus: 820 },
    { spawns: [{ enemy: 'celestial_demon', count: 18, gap: 0.7, delay: 0 }, { enemy: 'chaos_larva', count: 36, gap: 0.4, delay: 1 }, { enemy: 'chaos_beast', count: 14, gap: 1.0, delay: 2 }, { enemy: 'ghost_cultivator', count: 22, gap: 0.5, delay: 0 }], clearBonus: 860 },
    { spawns: [{ enemy: 'void_devourer', count: 12, gap: 1.0, delay: 0 }, { enemy: 'chaos_beast', count: 16, gap: 0.9, delay: 1 }, { enemy: 'law_enforcer', count: 16, gap: 0.7, delay: 0 }, { enemy: 'void_walker', count: 26, gap: 0.4, delay: 2 }, { enemy: 'celestial_demon', count: 16, gap: 0.7, delay: 1 }], clearBonus: 920 },
  ],
  story: {
    intro: {
      chapter: '第 三 十 章', title: '最 终 之 敌',
      lines: ['万物杂糅，万敌齐至——这是道祖魔影的「万象之阵」。', '破此阵者，方有资格直面道祖。'],
      btn: '破 万 象',
    },
    outro: {
      chapter: '万 象', title: '阵 破 门 现',
      lines: ['万象之阵崩解，前路豁然开朗。', '道祖魔影的本体，正盘膝坐于天外天的尽头……'],
      btn: '继 续',
    },
  },
};
