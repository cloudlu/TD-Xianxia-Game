import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 6 章 第 3 关 · 裂隙深处（三路径，章末 BOSS：裂隙领主——召唤沙蝎 + 死亡分裂雾妖）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH6_L3: LevelConfig = {
  id: 'ch6-l3', name: '裂隙深处',
  startStones: 500, lives: 32,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.6,
  waves: [
    { spawns: [
      { enemy: 'sand_scorpion', count: 6, gap: 1.0, delay: 0, path: 0 },
      { enemy: 'mist_wraith', count: 4, gap: 1.6, delay: 0, path: 1 },
      { enemy: 'barbarian', count: 2, gap: 3, delay: 1, path: 2 },
    ], clearBonus: 180 },
    { spawns: [
      { enemy: 'mist_wraith', count: 6, gap: 1.2, delay: 0, path: 0 },
      { enemy: 'barbarian', count: 4, gap: 2, delay: 0, path: 2 },
      { enemy: 'bat', count: 14, gap: 0.4, delay: 1, path: 1 },
    ], clearBonus: 210 },
    { spawns: [
      { enemy: 'sand_scorpion', count: 10, gap: 0.7, delay: 0, path: 0 },
      { enemy: 'mist_wraith', count: 8, gap: 1.0, delay: 0, path: 2 },
      { enemy: 'barbarian', count: 3, gap: 2.5, delay: 1, path: 1 },
    ], clearBonus: 240 },
    // 末波：裂隙领主降临（召唤沙蝎 + 死亡分裂雾妖）+ 三路杂兵
    { spawns: [
      { enemy: 'rift_lord', count: 1, gap: 1, delay: 3, path: 1 },
      { enemy: 'sand_scorpion', count: 8, gap: 0.8, delay: 0, path: 0 },
      { enemy: 'barbarian', count: 4, gap: 2, delay: 1, path: 2 },
      { enemy: 'mist_wraith', count: 6, gap: 1.2, delay: 0, path: 0 },
    ], clearBonus: 300 },
  ],
  story: {
    intro: {
      chapter: '第 六 章', title: '裂 隙 深 处',
      lines: [
        '裂缝的核心，裂隙领主盘踞于此。',
        '它能不断召唤沙蝎，死后更分裂为雾妖——',
        '唯有高爆发（AOE + 单体集火）方能了结它。',
      ],
      btn: '封 印 裂 隙',
    },
    outro: {
      chapter: '第 六 章', title: '裂 隙 初 封',
      lines: [
        '裂隙领主倒下，化作缕缕魔气消散。',
        '你封住了这道裂缝，却感到远处还有更多……',
        '回到宗门，长老会决议：组建大陆联盟，共同应对。',
        '（《大陆联盟》待续……）',
      ],
      btn: '返 回 选 关',
    },
  },
};
