import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 18 章 第 3 关 · 万族围攻（三路径，everything mixed + rift_lord mini-boss）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH18_L3: LevelConfig = {
  id: 'ch18-l3', name: '万族围攻',
  startStones: 820, lives: 40,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.8,
  waves: [
    { spawns: [{ enemy: 'dragon_young', count: 12, gap: 0.8, delay: 0 }, { enemy: 'ghost_cultivator', count: 14, gap: 0.6, delay: 1 }, { enemy: 'demon_knight', count: 12, gap: 0.8, delay: 0 }], clearBonus: 440 },
    { spawns: [{ enemy: 'shadow_assassin', count: 16, gap: 0.5, delay: 0 }, { enemy: 'blood_cultist', count: 14, gap: 0.7, delay: 1 }, { enemy: 'splitter', count: 14, gap: 0.7, delay: 0 }], clearBonus: 480 },
    { spawns: [{ enemy: 'rift_lord', count: 1, gap: 0, delay: 0 }, { enemy: 'dragon_young', count: 14, gap: 0.7, delay: 1 }, { enemy: 'ghost_cultivator', count: 18, gap: 0.5, delay: 0 }, { enemy: 'demon_knight', count: 14, gap: 0.7, delay: 2 }], clearBonus: 600 },
  ],
  story: {
    intro: {
      chapter: '第 十 八 章', title: '万 族 围 攻',
      lines: [
        '万族围攻中央，裂缝之主携裂体之力降临。',
        '裂体与召唤齐至，需速断其源。',
      ],
      btn: '破 围 而 出',
    },
    outro: {
      chapter: '劫 后', title: '围 攻 已 解',
      lines: ['裂缝之主被封，前方是天妖前哨的阴影。'],
      btn: '继 续',
    },
  },
};
