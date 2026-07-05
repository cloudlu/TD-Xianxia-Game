import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 4 章 第 1 关 · 幻雾林（双路径，引入 隐身狐妖——需聚灵阵破隐）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH4_L1: LevelConfig = {
  id: 'ch4-l1', name: '幻雾林',
  startStones: 400, lives: 25,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.3,
  waves: [
    { spawns: [{ enemy: 'shadow_fox', count: 4, gap: 1.6, delay: 0, path: 0 }, { enemy: 'wolf', count: 10, gap: 0.6, delay: 0, path: 1 }], clearBonus: 120 },
    { spawns: [{ enemy: 'shadow_fox', count: 6, gap: 1.3, delay: 0, path: 0 }, { enemy: 'splitter', count: 3, gap: 2, delay: 1, path: 1 }], clearBonus: 140 },
    { spawns: [{ enemy: 'shadow_fox', count: 5, gap: 1.2, delay: 0, path: 0 }, { enemy: 'wolf', count: 12, gap: 0.5, delay: 0, path: 1 }], clearBonus: 170 },
    { spawns: [{ enemy: 'splitter', count: 8, gap: 1.2, delay: 0, path: 0 }, { enemy: 'shadow_fox', count: 6, gap: 1.2, delay: 1, path: 1 }], clearBonus: 190 },
  ],
  story: {
    intro: {
      chapter: '第 四 章', title: '秘 境 凶 兽',
      lines: [
        '你踏入妖兽秘境。灵气浓郁，亦凶险万分。',
        '隐身狐妖潜伏雾中，寻常法眼难寻其踪——',
        '唯有聚灵阵之光，可照破其隐身。',
      ],
      btn: '布 阵 破 隐',
    },
    outro: {
      chapter: '劫 后', title: '雾 散 狐 退',
      lines: ['雾中狐妖尽散。', '前方谷地，分身妖越杀越多……'],
      btn: '继 续',
    },
  },
};
