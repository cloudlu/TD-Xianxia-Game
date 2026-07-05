import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 19 章 第 2 关 · 蛊毒沼泽（双路径，blood_cultist + ghost_cultivator + dragon_young）
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH19_L2: LevelConfig = {
  id: 'ch19-l2', name: '蛊毒沼泽',
  startStones: 840, lives: 42,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.9,
  waves: [
    { spawns: [{ enemy: 'blood_cultist', count: 16, gap: 0.6, delay: 0 }, { enemy: 'ghost_cultivator', count: 14, gap: 0.7, delay: 1 }], clearBonus: 420 },
    { spawns: [{ enemy: 'dragon_young', count: 14, gap: 0.7, delay: 0 }, { enemy: 'blood_cultist', count: 18, gap: 0.5, delay: 1 }, { enemy: 'shadow_fox', count: 12, gap: 0.7, delay: 0 }], clearBonus: 460 },
    { spawns: [{ enemy: 'ghost_cultivator', count: 20, gap: 0.5, delay: 0 }, { enemy: 'dragon_young', count: 16, gap: 0.6, delay: 1 }, { enemy: 'blood_cultist', count: 18, gap: 0.5, delay: 0 }], clearBonus: 520 },
  ],
  story: {
    intro: {
      chapter: '第 十 九 章', title: '蛊 毒 沼 泽',
      lines: [
        '蛊毒沼泽毒雾弥漫，血修吸命，鬼修虚行。',
        '毒雾之中，每一步都需法力相护。',
      ],
      btn: '入 沼 泽',
    },
    outro: {
      chapter: '劫 后', title: '毒 雾 渐 散',
      lines: ['毒雾渐散，最终防线已在脚下。'],
      btn: '继 续',
    },
  },
};
