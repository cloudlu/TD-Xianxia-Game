import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 15 章 第 2 关 · 魔帅近卫（三路径，全面混合）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH15_L2: LevelConfig = {
  id: 'ch15-l2', name: '魔帅近卫',
  startStones: 800, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.5,
  waves: [
    { spawns: [{ enemy: 'demon_knight', count: 18, gap: 0.8, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 18, gap: 0.6, delay: 1, path: 1 }, { enemy: 'wolf', count: 29, gap: 0.3, delay: 0, path: 2 }], clearBonus: 460 },
    { spawns: [{ enemy: 'demon_serpent', count: 16, gap: 1.0, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 16, gap: 0.8, delay: 1, path: 1 }, { enemy: 'magic_puppet', count: 16, gap: 0.8, delay: 0, path: 2 }], clearBonus: 500 },
    { spawns: [{ enemy: 'demon_knight', count: 21, gap: 0.8, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 21, gap: 0.6, delay: 1, path: 1 }, { enemy: 'demon_serpent', count: 13, gap: 1.2, delay: 0, path: 2 }], clearBonus: 560 },
  ],
  story: {
    intro: {
      chapter: '第 十 五 章', title: '魔 帅 近 卫',
      lines: [
        '魔帅近卫三路齐出，皆为魔域精锐。',
        '破近卫者，方可直面魔帅。',
      ],
      btn: '鏖 战',
    },
    outro: {
      chapter: '战 报', title: '近 卫 尽 灭',
      lines: ['近卫尽数伏诛。', '魔帅立于巢穴深处，怒视群雄。'],
      btn: '终 局',
    },
  },
};
