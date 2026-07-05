import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
const P = [[{ x: 0, y: 4 }, { x: 15, y: 4 }]];
export const CH8_L1: LevelConfig = {
  id: 'ch8-l1', name: '幽暗矿脉', startStones: 500, lives: 32, cols: 16, rows: 8,
  paths: P, buildable: buildableFromPaths(16, 8, P), hpMul: 1.8,
  waves: [
    { spawns: [{ enemy: 'magic_puppet', count: 4, gap: 2.5, delay: 0 }, { enemy: 'sand_scorpion', count: 10, gap: 0.6, delay: 1 }], clearBonus: 200 },
    { spawns: [{ enemy: 'mist_wraith', count: 8, gap: 1.0, delay: 0 }, { enemy: 'barbarian', count: 4, gap: 2, delay: 0 }], clearBonus: 220 },
    { spawns: [{ enemy: 'blood_cultist', count: 6, gap: 1.2, delay: 0 }, { enemy: 'magic_puppet', count: 3, gap: 3, delay: 1 }, { enemy: 'mist_wraith', count: 6, gap: 1.2, delay: 0 }], clearBonus: 250 },
  ],
  story: { intro: { chapter: '第 八 章', title: '幽 暗 矿 脉', lines: ['矿脉深处，魔气与域外雾气交织。', '魔甲傀儡与雾妖出没，更有血修潜伏。'], btn: '深 入 矿 脉' },
    outro: { chapter: '劫 后', title: '矿 脉 清 剿', lines: ['矿脉魔气消散，但裂缝的脉动越来越强。'], btn: '继 续' } },
};
