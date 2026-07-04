import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 3 章 第 2 关 · 血池（双路径，引入 血修受击回血 + 魔甲傀儡高甲）
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH3_L2: LevelConfig = {
  id: 'ch3-l2', name: '血池',
  startStones: 380, lives: 25,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  waves: [
    { spawns: [{ enemy: 'magic_minion', count: 4, gap: 1.4, delay: 0, path: 0 }, { enemy: 'wolf', count: 10, gap: 0.5, delay: 0, path: 1 }], clearBonus: 110 },
    // 血修：受击回血，零星之伤反为其补——须以长枪贯穿/暴击一鼓作气
    { spawns: [{ enemy: 'blood_cultist', count: 3, gap: 1.6, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 3, gap: 1.8, delay: 1, path: 1 }], clearBonus: 130 },
    // 魔甲傀儡：40 甲，物理刮痧，需堆暴击/数量
    { spawns: [{ enemy: 'magic_puppet', count: 2, gap: 3, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 4, gap: 1.4, delay: 1, path: 1 }, { enemy: 'wolf', count: 10, gap: 0.5, delay: 0, path: 0 }], clearBonus: 160 },
  ],
  story: {
    intro: {
      chapter: '第 三 章', title: '血 池',
      lines: [
        '血池之上，血修吞吐血气。',
        '零星之伤反为其补——唯有重击贯穿，方能一鼓作气。',
        '（长枪穿透、暴击爆发为佳）',
      ],
      btn: '以 重 击 破 之',
    },
    outro: {
      chapter: '劫 后', title: '血 气 消 散',
      lines: ['血修尽灭，血池干涸。', '魔修营地之前，三路魔气冲天而起。'],
      btn: '继 续',
    },
  },
};
