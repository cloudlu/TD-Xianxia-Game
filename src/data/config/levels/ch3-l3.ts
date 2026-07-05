import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 3 章 第 3 关 · 魔修营地（三路径，章末小头目 魔修统领，全机制综合）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH3_L3: LevelConfig = {
  id: 'ch3-l3', name: '魔修营地',
  startStones: 420, lives: 28,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.2,
  waves: [
    { spawns: [
      { enemy: 'magic_minion', count: 5, gap: 1.2, delay: 0, path: 0 },
      { enemy: 'wolf', count: 8, gap: 0.6, delay: 0, path: 1 },
      { enemy: 'wolf', count: 8, gap: 0.6, delay: 0, path: 2 },
    ], clearBonus: 130 },
    { spawns: [
      { enemy: 'blood_cultist', count: 4, gap: 1.4, delay: 0, path: 0 },
      { enemy: 'magic_puppet', count: 2, gap: 3, delay: 0, path: 1 },
      { enemy: 'magic_minion', count: 5, gap: 1.2, delay: 1, path: 2 },
    ], clearBonus: 160 },
    { spawns: [
      { enemy: 'blood_cultist', count: 5, gap: 1.2, delay: 0, path: 0 },
      { enemy: 'magic_puppet', count: 3, gap: 2.5, delay: 0, path: 2 },
      { enemy: 'magic_minion', count: 6, gap: 1, delay: 1, path: 1 },
    ], clearBonus: 180 },
    // 末波：魔修统领（小头目，厚盾）+ 三路魔修大军
    { spawns: [
      { enemy: 'mage_lord', count: 1, gap: 1, delay: 2, path: 1 },
      { enemy: 'magic_minion', count: 6, gap: 1, delay: 0, path: 0 },
      { enemy: 'blood_cultist', count: 4, gap: 1.4, delay: 1, path: 2 },
      { enemy: 'wolf', count: 10, gap: 0.5, delay: 0, path: 0 },
    ], clearBonus: 220 },
  ],
  story: {
    intro: {
      chapter: '第 三 章', title: '魔 修 营 地',
      lines: [
        '三路魔气冲天，魔修营地在此。',
        '魔修统领坐镇中军，厚盾护体。',
        '护盾、回血、铁甲——前路所学，缺一不可。',
      ],
      btn: '三 路 破 营',
    },
    outro: {
      chapter: '第 三 章', title: '魔 影 不 散',
      lines: [
        '魔修统领倒下，化作一缕黑烟。',
        '他的笑声仍在山谷回荡："你以为……赢的是你？"',
        '大地震颤，秘境的入口，在脚下缓缓裂开。',
        '（《秘境凶兽》待续……）',
      ],
      btn: '返 回 选 关',
    },
  },
};
