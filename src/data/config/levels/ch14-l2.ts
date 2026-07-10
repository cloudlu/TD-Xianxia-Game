import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 14 章 第 2 关 · 最后防线（双路径，全面混合）
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH14_L2: LevelConfig = {
  id: 'ch14-l2', name: '最后防线',
  startStones: 740, lives: 38,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.4,
  waves: [
    { spawns: [{ enemy: 'demon_knight', count: 12, gap: 1.0, delay: 0, path: 0 }, { enemy: 'demon_serpent', count: 8, gap: 1.4, delay: 1, path: 1 }], clearBonus: 400 },
    { spawns: [{ enemy: 'shadow_assassin', count: 14, gap: 0.7, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 10, gap: 1.0, delay: 1, path: 1 }], clearBonus: 440 },
    { spawns: [{ enemy: 'demon_knight', count: 14, gap: 0.9, delay: 0, path: 0 }, { enemy: 'magic_puppet', count: 12, gap: 0.9, delay: 1, path: 1 }, { enemy: 'demon_serpent', count: 8, gap: 1.4, delay: 0, path: 0 }], clearBonus: 500 },
  ],
  story: {
    intro: {
      chapter: '第 十 四 章', title: '最 后 防 线',
      lines: [
        '魔帅巢前的最后防线，重兵把守。',
        '双路齐攻，须稳守两端。',
      ],
      btn: '坚 守',
    },
    outro: {
      chapter: '战 报', title: '防 线 破 碎',
      lines: ['防线破碎，魔帅震怒。', '魔帅降临，大战在即。'],
      btn: '继 续',
    },
  },
};
