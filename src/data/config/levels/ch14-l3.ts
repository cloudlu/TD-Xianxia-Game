import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 14 章 第 3 关 · 魔帅降临（三路径，全面混合 + 裂隙领主 pre-boss）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH14_L3: LevelConfig = {
  id: 'ch14-l3', name: '魔帅降临',
  startStones: 760, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.4,
  waves: [
    { spawns: [{ enemy: 'demon_knight', count: 16, gap: 1.0, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 16, gap: 0.7, delay: 1, path: 1 }, { enemy: 'wolf', count: 26, gap: 0.3, delay: 0, path: 2 }], clearBonus: 420 },
    { spawns: [{ enemy: 'demon_serpent', count: 13, gap: 1.2, delay: 0, path: 0 }, { enemy: 'magic_puppet', count: 16, gap: 0.9, delay: 1, path: 1 }, { enemy: 'blood_cultist', count: 13, gap: 1.0, delay: 0, path: 2 }], clearBonus: 460 },
    { spawns: [{ enemy: 'rift_sovereign', count: 11, gap: 0, delay: 0, path: 0 }, { enemy: 'demon_knight', count: 18, gap: 0.9, delay: 1, path: 1 }, { enemy: 'shadow_assassin', count: 18, gap: 0.7, delay: 0, path: 2 }], clearBonus: 540 },
  ],
  story: {
    intro: {
      chapter: '第 十 四 章', title: '魔 帅 降 临',
      lines: [
        '魔帅巢穴洞开，裂隙领主为前锋。',
        '三路齐压，决战一触即发。',
      ],
      btn: '决 死',
    },
    outro: {
      chapter: '战 报', title: '魔 帅 现 身',
      lines: ['裂隙领主陨落。', '魔帅缓缓现身，末世气息扑面而来。'],
      btn: '继 续',
    },
  },
};
