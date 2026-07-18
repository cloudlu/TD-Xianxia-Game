import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 4 章 第 2 关 · 分身谷（双路径，引入 分身妖——死亡分裂，需 AOE/快清）
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH4_L2: LevelConfig = {
  id: 'ch4-l2', name: '分身谷',
  startStones: 400, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.3,
  maxTowerLevel: 6,
  waves: [
    { spawns: [{ enemy: 'splitter', count: 5, gap: 1.8, delay: 0, path: 0 }, { enemy: 'wolf', count: 12, gap: 0.6, delay: 0, path: 1 }], clearBonus: 130 },
    { spawns: [{ enemy: 'splitter', count: 7, gap: 1.4, delay: 0, path: 0 }, { enemy: 'shadow_fox', count: 5, gap: 1.6, delay: 1, path: 1 }], clearBonus: 150 },
    // 末波：大量分身妖（每个死分裂2子体）+ 山猪妖压场
    { spawns: [{ enemy: 'splitter', count: 10, gap: 1.2, delay: 0, path: 0 }, { enemy: 'boar', count: 5, gap: 2, delay: 1, path: 1 }], clearBonus: 180 },
    { spawns: [{ enemy: 'shadow_fox', count: 10, gap: 1, delay: 0, path: 0 }, { enemy: 'splitter', count: 10, gap: 1, delay: 1, path: 1 }], clearBonus: 200 },
  ],
  story: {
    intro: {
      chapter: '第 四 章', title: '分 身 谷',
      lines: ['分身妖杀之不尽——一刀斩落，反裂为二。', '唯有速战速决，或以范围之术席卷之。'],
      btn: '速 战 速 决',
    },
    outro: {
      chapter: '劫 后', title: '谷 深 处',
      lines: ['分身妖尽灭。', '谷地尽头，九尾天狐正等候多时。'],
      btn: '继 续',
    },
  },
};
