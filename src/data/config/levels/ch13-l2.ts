import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 13 章 第 2 关 · 魔域要塞（双路径，魔蛇 + 魔偶 + 魔甲士）
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH13_L2: LevelConfig = {
  id: 'ch13-l2', name: '魔域要塞',
  startStones: 700, lives: 38,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.3,
  waves: [
    { spawns: [{ enemy: 'demon_serpent', count: 8, gap: 1.4, delay: 0 }, { enemy: 'magic_puppet', count: 8, gap: 1.2, delay: 1 }], clearBonus: 380 },
    { spawns: [{ enemy: 'demon_knight', count: 10, gap: 1.2, delay: 0 }, { enemy: 'demon_serpent', count: 6, gap: 1.8, delay: 1 }], clearBonus: 420 },
    { spawns: [{ enemy: 'magic_puppet', count: 10, gap: 1.0, delay: 0 }, { enemy: 'demon_knight', count: 10, gap: 1.0, delay: 1 }, { enemy: 'blood_cultist', count: 8, gap: 1.4, delay: 0 }], clearBonus: 480 },
  ],
  story: {
    intro: {
      chapter: '第 十 三 章', title: '魔 域 要 塞',
      lines: [
        '魔域要塞扼守咽喉，魔物密布。',
        '魔蛇与魔偶协同，难以速破。',
      ],
      btn: '攻 城',
    },
    outro: {
      chapter: '战 报', title: '要 塞 易 主',
      lines: ['要塞告破，魔帅震怒。', '联军反攻，号角已响。'],
      btn: '继 续',
    },
  },
};
