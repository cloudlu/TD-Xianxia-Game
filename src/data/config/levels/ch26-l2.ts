import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 26 章 第 2 关 · 混沌原初（双路径）
const P = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH26_L2: LevelConfig = {
  id: 'ch26-l2', name: '混沌原初',
  startStones: 1020, lives: 46,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.6,
  waves: [
    { spawns: [{ enemy: 'chaos_larva', count: 24, gap: 0.4, delay: 0, path: 0 }, { enemy: 'law_enforcer', count: 4, gap: 1.8, delay: 1, path: 1 }], clearBonus: 540 },
    { spawns: [{ enemy: 'chaos_beast', count: 5, gap: 2.0, delay: 0, path: 0 }, { enemy: 'void_walker', count: 14, gap: 0.5, delay: 1, path: 1 }, { enemy: 'celestial_demon', count: 8, gap: 1.0, delay: 0, path: 0 }], clearBonus: 580 },
    { spawns: [{ enemy: 'law_enforcer', count: 8, gap: 1.2, delay: 0, path: 1 }, { enemy: 'chaos_beast', count: 6, gap: 1.8, delay: 1, path: 0 }, { enemy: 'ghost_cultivator', count: 16, gap: 0.5, delay: 0, path: 1 }], clearBonus: 640 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 六 章', title: '混 沌 原 初',
      lines: ['原初之地无日无月，唯余混沌潮汐一涨一落。', '执法者开始成群结队地巡视，警觉于你的存在。'],
      btn: '深 入 原 初',
    },
    outro: {
      chapter: '审 判', title: '执 法 警 觉',
      lines: ['执法者虽破，规则余威仍在割裂虚空。', '更深处，传来混沌古兽的低吼……'],
      btn: '继 续',
    },
  },
};
