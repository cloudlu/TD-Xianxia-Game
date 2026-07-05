import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 5 章 第 3 关 · 血煞魔尊（三路径，终极 BOSS 多阶段：厚盾→狂暴，中路推进+两侧施压）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],   // 北路：侧翼施压
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],   // 中路：魔尊本体
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],   // 南路：侧翼施压
];

export const CH5_L3: LevelConfig = {
  id: 'ch5-l3', name: '血煞魔尊',
  startStones: 600, lives: 35,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.5,
  waves: [
    { spawns: [
      { enemy: 'shadow_fox', count: 5, gap: 1.2, delay: 0, path: 0 },
      { enemy: 'magic_minion', count: 6, gap: 1, delay: 0, path: 2 },
    ], clearBonus: 200 },
    { spawns: [
      { enemy: 'blood_cultist', count: 6, gap: 1, delay: 0, path: 0 },
      { enemy: 'splitter', count: 6, gap: 1.2, delay: 0, path: 2 },
      { enemy: 'bat', count: 12, gap: 0.4, delay: 1, path: 1 },
    ], clearBonus: 230 },
    { spawns: [
      { enemy: 'magic_minion', count: 8, gap: 0.9, delay: 0, path: 0 },
      { enemy: 'splitter', count: 8, gap: 1, delay: 0, path: 2 },
      { enemy: 'bat', count: 14, gap: 0.35, delay: 1, path: 1 },
    ], clearBonus: 260 },
    { spawns: [
      { enemy: 'blood_cultist', count: 8, gap: 0.9, delay: 0, path: 0 },
      { enemy: 'shadow_fox', count: 10, gap: 0.9, delay: 0, path: 2 },
      { enemy: 'magic_puppet', count: 3, gap: 2.5, delay: 1, path: 1 },
    ], clearBonus: 300 },
    // 终波：魔尊血煞降临（多阶段：厚盾→狂暴加速+多召唤血修）+ 两侧持续施压
    { spawns: [
      { enemy: 'blood_lord', count: 1, gap: 1, delay: 3, path: 1 },
      { enemy: 'shadow_fox', count: 6, gap: 1.1, delay: 0, path: 0 },
      { enemy: 'magic_puppet', count: 2, gap: 3, delay: 1, path: 2 },
      { enemy: 'blood_cultist', count: 5, gap: 1.2, delay: 2, path: 0 },
    ], clearBonus: 400 },
  ],
  story: {
    intro: {
      chapter: '第 五 章', title: '血 煞 魔 尊',
      lines: [
        '魔尊血煞缓步而来，魔气滔天。',
        '其一阶段护体血盾极厚——须先破盾。',
        '血气将竭时，他将狂暴加速、大举召唤——务必在此前了结他。',
      ],
      btn: '终 极 一 战',
    },
    outro: {
      chapter: '终 章', title: '魔 尊 释 然',
      lines: [
        '魔尊力竭，跪倒于你剑下。他忽然笑了，笑得释然：',
        '"……谢谢你，师弟。"',
        '黑烟散尽，天地重归清明。你收剑入鞘，望向远方——',
        '修真之路漫漫，而你的宗门，今日真正立起来了。',
        '（全篇完）',
      ],
      btn: '返 回 选 关',
    },
  },
};
