import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 12 章 第 2 关 · 暗影峡谷（双路径，暗影刺客 + 魔蛇）
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH12_L2: LevelConfig = {
  id: 'ch12-l2', name: '暗影峡谷',
  startStones: 660, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.2,
  waves: [
    { spawns: [{ enemy: 'shadow_assassin', count: 13, gap: 0.9, delay: 0, path: 0 }, { enemy: 'demon_serpent', count: 5, gap: 2.2, delay: 1, path: 1 }], clearBonus: 340 },
    { spawns: [{ enemy: 'shadow_assassin', count: 16, gap: 0.8, delay: 0, path: 0 }, { enemy: 'demon_knight', count: 8, gap: 1.8, delay: 1, path: 1 }], clearBonus: 380 },
    { spawns: [{ enemy: 'demon_serpent', count: 10, gap: 1.4, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 16, gap: 0.8, delay: 1, path: 1 }, { enemy: 'bat', count: 21, gap: 0.3, delay: 0, path: 0 }], clearBonus: 440 },
  ],
  story: {
    intro: {
      chapter: '第 十 二 章', title: '暗 影 峡 谷',
      lines: [
        '峡谷幽深，暗影刺客成群出没。',
        '魔蛇盘踞隘口，难以正面突破。',
      ],
      btn: '入 谷',
    },
    outro: {
      chapter: '战 报', title: '暗 影 散 去',
      lines: ['刺客尽诛，峡谷寂静。', '魔域军团正向主力逼近。'],
      btn: '继 续',
    },
  },
};
