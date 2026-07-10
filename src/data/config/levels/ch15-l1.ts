import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 15 章 第 1 关 · 魔帅先锋（双路径，魔甲士 + 暗影刺客）
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH15_L1: LevelConfig = {
  id: 'ch15-l1', name: '魔帅先锋',
  startStones: 760, lives: 40,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.5,
  waves: [
    { spawns: [{ enemy: 'demon_knight', count: 14, gap: 0.9, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 12, gap: 0.7, delay: 1, path: 1 }], clearBonus: 440 },
    { spawns: [{ enemy: 'shadow_assassin', count: 16, gap: 0.6, delay: 0, path: 0 }, { enemy: 'demon_knight', count: 12, gap: 1.0, delay: 1, path: 1 }], clearBonus: 480 },
    { spawns: [{ enemy: 'demon_knight', count: 16, gap: 0.8, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 16, gap: 0.6, delay: 1, path: 1 }, { enemy: 'demon_serpent', count: 8, gap: 1.4, delay: 0, path: 0 }], clearBonus: 540 },
  ],
  story: {
    intro: {
      chapter: '第 十 五 章', title: '魔 帅',
      lines: [
        '联盟大军直逼魔帅巢穴。',
        '魔帅先锋据守双路，死战不退。',
      ],
      btn: '突 进',
    },
    outro: {
      chapter: '战 报', title: '先 锋 歼 灭',
      lines: ['先锋尽灭，魔帅近卫现身。', '终局之战，就在眼前。'],
      btn: '继 续',
    },
  },
};
