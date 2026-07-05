import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 6 章 第 2 关 · 迷雾沼泽（双路径，引入雾妖——高血高甲，逼升级/配装）
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH6_L2: LevelConfig = {
  id: 'ch6-l2', name: '迷雾沼泽',
  startStones: 440, lives: 28,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.6,
  waves: [
    { spawns: [{ enemy: 'mist_wraith', count: 4, gap: 1.8, delay: 0, path: 0 }, { enemy: 'sand_scorpion', count: 6, gap: 1.0, delay: 0, path: 1 }], clearBonus: 160 },
    { spawns: [{ enemy: 'mist_wraith', count: 6, gap: 1.4, delay: 0, path: 0 }, { enemy: 'barbarian', count: 3, gap: 2.5, delay: 1, path: 1 }], clearBonus: 180 },
    { spawns: [{ enemy: 'bat', count: 14, gap: 0.4, delay: 0, path: 1 }, { enemy: 'mist_wraith', count: 5, gap: 1.4, delay: 0, path: 0 }], clearBonus: 200 },
    { spawns: [{ enemy: 'mist_wraith', count: 8, gap: 1.0, delay: 0, path: 0 }, { enemy: 'barbarian', count: 4, gap: 2, delay: 1, path: 1 }, { enemy: 'sand_scorpion', count: 8, gap: 0.8, delay: 0, path: 0 }], clearBonus: 220 },
  ],
  story: {
    intro: {
      chapter: '第 六 章', title: '迷 雾 沼 泽',
      lines: [
        '沼泽深处，雾气弥漫。雾妖潜伏其中，雾气护体，寻常手段难以速胜。',
        '须以升级境界之力，或配装加持，方能破其护体雾气。',
      ],
      btn: '破 雾 前 行',
    },
    outro: {
      chapter: '劫 后', title: '雾 散 路 现',
      lines: ['雾妖尽散，前方裂隙的光芒越来越强。', '裂隙深处，一个庞大的身影若隐若现……'],
      btn: '继 续',
    },
  },
};
