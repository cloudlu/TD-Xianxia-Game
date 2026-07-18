import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 5 章 第 1 关 · 魔尊前军（三路径，全敌综合，高强度检验）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH5_L1: LevelConfig = {
  id: 'ch5-l1', name: '魔尊前军',
  startStones: 500, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.5,
  maxTowerLevel: 6,
  waves: [
    { spawns: [
      { enemy: 'wolf', count: 14, gap: 0.5, delay: 0, path: 0 },
      { enemy: 'bat', count: 12, gap: 0.4, delay: 1, path: 1 },
      { enemy: 'magic_minion', count: 6, gap: 1.2, delay: 0, path: 2 },
    ], clearBonus: 160 },
    { spawns: [
      { enemy: 'shadow_fox', count: 6, gap: 1.2, delay: 0, path: 0 },
      { enemy: 'bull', count: 11, gap: 1, delay: 1, path: 1 },
      { enemy: 'splitter', count: 7, gap: 1.2, delay: 0, path: 2 },
    ], clearBonus: 190 },
    { spawns: [
      { enemy: 'blood_cultist', count: 6, gap: 1.2, delay: 0, path: 0 },
      { enemy: 'magic_puppet', count: 22, gap: 3, delay: 1, path: 1 },
      { enemy: 'shadow_fox', count: 7, gap: 1, delay: 0, path: 2 },
    ], clearBonus: 220 },
    { spawns: [
      { enemy: 'magic_minion', count: 10, gap: 0.9, delay: 0, path: 0 },
      { enemy: 'bat', count: 17, gap: 0.35, delay: 1, path: 1 },
      { enemy: 'bull', count: 11, gap: 1, delay: 0, path: 2 },
    ], clearBonus: 240 },
    { spawns: [
      { enemy: 'blood_cultist', count: 7, gap: 1, delay: 0, path: 0 },
      { enemy: 'splitter', count: 10, gap: 1, delay: 0, path: 1 },
      { enemy: 'shadow_fox', count: 10, gap: 1, delay: 1, path: 2 },
      { enemy: 'magic_puppet', count: 22, gap: 3, delay: 0, path: 0 },
    ], clearBonus: 270 },
  ],
  story: {
    intro: {
      chapter: '第 五 章', title: '血 煞 魔 尊',
      lines: [
        '血色天幕之下，魔尊血煞立于尸山之上。',
        '他曾是宗门的天才弟子，堕入魔道，誓要血洗修真界。',
        '"师弟……来吧。让我看看，你这些年的修行。"',
      ],
      btn: '迎 击 前 军',
    },
    outro: {
      chapter: '劫 后', title: '魔 军 溃 退',
      lines: ['魔尊前军溃退。', '九幽血池之前，更可怖的气息正在升腾……'],
      btn: '继 续',
    },
  },
};
