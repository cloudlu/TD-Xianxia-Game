import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 13 章 第 1 关 · 血色原野（L 形单路径，血祭者 + 魔甲士）
const PATHS = [[
  { x: 0, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 6 }, { x: 15, y: 6 },
]];

export const CH13_L1: LevelConfig = {
  id: 'ch13-l1', name: '血色原野',
  startStones: 680, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.3,
  waves: [
    { spawns: [{ enemy: 'blood_cultist', count: 10, gap: 1.6, delay: 0 }, { enemy: 'wolf', count: 21, gap: 0.3, delay: 1 }], clearBonus: 360 },
    { spawns: [{ enemy: 'demon_knight', count: 13, gap: 1.2, delay: 0 }, { enemy: 'blood_cultist', count: 10, gap: 1.4, delay: 1 }], clearBonus: 400 },
    { spawns: [{ enemy: 'demon_knight', count: 16, gap: 1.0, delay: 0 }, { enemy: 'blood_cultist', count: 13, gap: 1.0, delay: 1 }, { enemy: 'bat', count: 23, gap: 0.3, delay: 0 }], clearBonus: 460 },
  ],
  story: {
    intro: {
      chapter: '第 十 三 章', title: '血 色 原 野',
      lines: [
        '深入魔域腹地，原野被鲜血染红。',
        '血祭者与魔甲士盘踞其间，杀气冲天。',
      ],
      btn: '踏 血',
    },
    outro: {
      chapter: '战 报', title: '原 野 染 霜',
      lines: ['血祭者尽灭，原野暂宁。', '前方魔域要塞，魔军重兵把守。'],
      btn: '继 续',
    },
  },
};
