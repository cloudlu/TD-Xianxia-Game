import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 4 章 第 3 关 · 九尾天狐（单路径宽幅，章末 BOSS 战：魅惑+召唤，§5.4 护栏）
const PATHS = [[{ x: 0, y: 4 }, { x: 15, y: 4 }]];

export const CH4_L3: LevelConfig = {
  id: 'ch4-l3', name: '九尾天狐',
  startStones: 460, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.3,
  maxTowerLevel: 6,
  waves: [
    { spawns: [{ enemy: 'shadow_fox', count: 5, gap: 1.4, delay: 0 }], clearBonus: 140 },
    { spawns: [{ enemy: 'splitter', count: 7, gap: 1.2, delay: 0 }, { enemy: 'shadow_fox', count: 5, gap: 1.4, delay: 1 }], clearBonus: 170 },
    { spawns: [{ enemy: 'shadow_fox', count: 7, gap: 1.2, delay: 0 }, { enemy: 'splitter', count: 10, gap: 1, delay: 1 }], clearBonus: 200 },
    // 末波：九尾天狐降临（周期魅惑+召唤狐妖）+ 杂兵压场
    { spawns: [
      { enemy: 'nine_tails', count: 11, gap: 1, delay: 2 },
      { enemy: 'shadow_fox', count: 5, gap: 1.4, delay: 0 },
      { enemy: 'splitter', count: 5, gap: 1.6, delay: 1 },
    ], clearBonus: 250 },
  ],
  story: {
    intro: {
      chapter: '第 四 章', title: '九 尾 天 狐',
      lines: [
        '九尾天狐盘踞祭坛，九尾如焰。',
        '她能以魅术乱你修士之心，又可凭空召唤狐妖。',
        '阵法（聚灵阵）不受魅惑所制——善用之。',
      ],
      btn: '斗 法 天 狐',
    },
    outro: {
      chapter: '第 四 章', title: '天 狐 之 泣',
      lines: [
        '九尾天狐九尾皆断，化作少女泣跪于地。',
        '"并非我要害人……是它，是它逼我……"',
        '她指向秘境尽头那片血色天幕。',
        '真正的劫难，才刚刚开始。（《血煞魔尊》待续……）',
      ],
      btn: '返 回 选 关',
    },
  },
};
