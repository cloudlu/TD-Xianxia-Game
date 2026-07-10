import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 11 章 第 2 关 · 魔域前哨（双路径，魔蛇 + 暗影刺客）
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH11_L2: LevelConfig = {
  id: 'ch11-l2', name: '魔域前哨',
  startStones: 620, lives: 34,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.1,
  waves: [
    { spawns: [{ enemy: 'demon_serpent', count: 5, gap: 2.0, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 6, gap: 1.4, delay: 1, path: 1 }], clearBonus: 300 },
    { spawns: [{ enemy: 'demon_knight', count: 6, gap: 1.8, delay: 0, path: 0 }, { enemy: 'bat', count: 14, gap: 0.4, delay: 1, path: 1 }], clearBonus: 320 },
    { spawns: [{ enemy: 'demon_serpent', count: 6, gap: 1.6, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 8, gap: 1.0, delay: 1, path: 1 }, { enemy: 'demon_knight', count: 4, gap: 2.2, delay: 0, path: 0 }], clearBonus: 360 },
  ],
  story: {
    intro: {
      chapter: '第 十 一 章', title: '魔 域 前 哨',
      lines: [
        '深入魔域前哨，双路夹攻之势已成。',
        '魔蛇与刺客潜行而至，须双线兼顾。',
      ],
      btn: '出 征',
    },
    outro: {
      chapter: '战 报', title: '前 哨 夺 下',
      lines: ['前哨易主，魔军退守深处。', '会战将起，联盟集结兵力。'],
      btn: '继 续',
    },
  },
};
