import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 11 章 第 3 关 · 联盟会战（三路径，全面混合）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH11_L3: LevelConfig = {
  id: 'ch11-l3', name: '联盟会战',
  startStones: 640, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.1,
  waves: [
    { spawns: [{ enemy: 'demon_knight', count: 8, gap: 1.8, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 8, gap: 1.2, delay: 1, path: 1 }, { enemy: 'wolf', count: 18, gap: 0.4, delay: 0, path: 2 }], clearBonus: 320 },
    { spawns: [{ enemy: 'demon_serpent', count: 8, gap: 1.6, delay: 0, path: 0 }, { enemy: 'bat', count: 21, gap: 0.4, delay: 1, path: 1 }, { enemy: 'sand_scorpion', count: 10, gap: 1.0, delay: 0, path: 2 }], clearBonus: 340 },
    { spawns: [{ enemy: 'shadow_assassin', count: 10, gap: 1.0, delay: 0, path: 0 }, { enemy: 'demon_knight', count: 8, gap: 1.8, delay: 1, path: 1 }, { enemy: 'demon_serpent', count: 7, gap: 2.0, delay: 0, path: 2 }], clearBonus: 380 },
  ],
  story: {
    intro: {
      chapter: '第 十 一 章', title: '联 盟 会 战',
      lines: [
        '联盟大军与魔域主力正面相遇，三路告急。',
        '调兵遣将，胜负在此一举。',
      ],
      btn: '决 战',
    },
    outro: {
      chapter: '战 报', title: '魔 军 溃 败',
      lines: ['联盟大胜，魔军退守深处。', '然而魔域深处，魔帅正在苏醒……'],
      btn: '继 续',
    },
  },
};
