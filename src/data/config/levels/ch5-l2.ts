import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 5 章 第 2 关 · 九幽血池（三路径，血修+傀儡+隐身综合）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH5_L2: LevelConfig = {
  id: 'ch5-l2', name: '九幽血池',
  startStones: 520, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.5,
  maxTowerLevel: 6,
  waves: [
    { spawns: [
      { enemy: 'blood_cultist', count: 7, gap: 1.1, delay: 0, path: 0 },
      { enemy: 'magic_puppet', count: 4, gap: 2.5, delay: 0, path: 1 },
      { enemy: 'shadow_fox', count: 7, gap: 1, delay: 1, path: 2 },
    ], clearBonus: 190 },
    { spawns: [
      { enemy: 'magic_minion', count: 10, gap: 0.9, delay: 0, path: 0 },
      { enemy: 'splitter', count: 10, gap: 1, delay: 0, path: 1 },
      { enemy: 'bat', count: 17, gap: 0.35, delay: 1, path: 2 },
    ], clearBonus: 220 },
    { spawns: [
      { enemy: 'mage_lord', count: 11, gap: 1, delay: 2, path: 1 },
      { enemy: 'blood_cultist', count: 7, gap: 1, delay: 0, path: 0 },
      { enemy: 'magic_puppet', count: 4, gap: 2.5, delay: 1, path: 2 },
    ], clearBonus: 250 },
    { spawns: [
      { enemy: 'shadow_fox', count: 10, gap: 1, delay: 0, path: 0 },
      { enemy: 'splitter', count: 12, gap: 0.9, delay: 0, path: 1 },
      { enemy: 'bull', count: 11, gap: 1, delay: 2, path: 2 },
    ], clearBonus: 270 },
    { spawns: [
      { enemy: 'blood_cultist', count: 10, gap: 0.9, delay: 0, path: 0 },
      { enemy: 'magic_puppet', count: 5, gap: 2, delay: 0, path: 1 },
      { enemy: 'shadow_fox', count: 12, gap: 0.9, delay: 1, path: 2 },
      { enemy: 'mage_lord', count: 11, gap: 1, delay: 3, path: 1 },
    ], clearBonus: 300 },
  ],
  story: {
    intro: {
      chapter: '第 五 章', title: '九 幽 血 池',
      lines: ['九幽血池，血气冲天。', '血修吞吐血气，傀儡铁甲，隐身狐妖——前路所学，缺一不可。'],
      btn: '血 池 决 战',
    },
    outro: {
      chapter: '劫 后', title: '血 池 干 涸',
      lines: ['血池干涸，魔气稍歇。', '登天阶上，魔尊血煞正等你来。'],
      btn: '登 阶 决 战',
    },
  },
};
