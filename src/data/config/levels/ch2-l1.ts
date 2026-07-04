import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 2 章 第 1 关 · 北隘口（双路径并行，教学多路分流 + 蛮牛）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],   // 北路
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],   // 南路
];

export const CH2_L1: LevelConfig = {
  id: 'ch2-l1', name: '北隘口',
  startStones: 350, lives: 25,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  waves: [
    { spawns: [{ enemy: 'wolf', count: 10, gap: 0.8, delay: 0, path: 0 }, { enemy: 'wolf', count: 8, gap: 0.9, delay: 0, path: 1 }], clearBonus: 80 },
    { spawns: [{ enemy: 'wolf', count: 12, gap: 0.6, delay: 0, path: 0 }, { enemy: 'boar', count: 3, gap: 2, delay: 1, path: 1 }], clearBonus: 100 },
    // 末波：南北各一头蛮牛，撞塔逼玩家分散布防
    { spawns: [{ enemy: 'bull', count: 1, gap: 1, delay: 1, path: 0 }, { enemy: 'wolf', count: 10, gap: 0.6, delay: 0, path: 1 }, { enemy: 'bull', count: 1, gap: 1, delay: 3, path: 1 }], clearBonus: 140 },
  ],
  story: {
    intro: {
      chapter: '第 二 章', title: '万 妖 攻 山',
      lines: [
        '妖狼只是先遣。真正的大军已至山脚——',
        '蛮牛踏地而来，地动山摇。',
        '山门有南北两处缺口，你必须同时守住两条路。',
      ],
      btn: '分 兵 拒 敌',
    },
    outro: {
      chapter: '劫 后', title: '双 隘 暂 安',
      lines: ['南北两路皆安。', '然毒瘴深处，魔影绰绰……'],
      btn: '继 续',
    },
  },
};
