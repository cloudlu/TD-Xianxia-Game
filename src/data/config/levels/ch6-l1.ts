import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 6 章 第 1 关 · 大漠边关（L 形单路径，引入沙蝎 + 域外蛮修）
const PATHS = [[
  { x: 0, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 5 }, { x: 15, y: 5 },
]];

export const CH6_L1: LevelConfig = {
  id: 'ch6-l1', name: '大漠边关',
  startStones: 420, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.6,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 16, gap: 0.6, delay: 0 }, { enemy: 'sand_scorpion', count: 5, gap: 1.6, delay: 1 }], clearBonus: 140 },
    { spawns: [{ enemy: 'sand_scorpion', count: 10, gap: 1.0, delay: 0 }, { enemy: 'boar', count: 4, gap: 2, delay: 1 }], clearBonus: 160 },
    { spawns: [{ enemy: 'barbarian', count: 4, gap: 2.5, delay: 0 }, { enemy: 'wolf', count: 18, gap: 0.5, delay: 0 }], clearBonus: 180 },
    { spawns: [{ enemy: 'sand_scorpion', count: 13, gap: 0.8, delay: 0 }, { enemy: 'barbarian', count: 5, gap: 2, delay: 1 }, { enemy: 'wolf', count: 16, gap: 0.5, delay: 0 }], clearBonus: 210 },
  ],
  story: {
    intro: {
      chapter: '第 六 章', title: '域 外 篇',
      lines: [
        '魔尊虽灭，宗门却探查到魔域裂缝在各方大域四处开启。',
        '太上长老（你）奉命前往苍茫域，调查裂缝源头。',
        '域外黄沙漫天，异族出没——这里不再是宗门的护院，而是真正的战场。',
      ],
      btn: '踏 入 苍 茫',
    },
    outro: {
      chapter: '劫 后', title: '沙 退 蛮 降',
      lines: ['沙蝎退去，蛮修投降。', '前方迷雾深处，传来诡异的低语……'],
      btn: '继 续',
    },
  },
};
