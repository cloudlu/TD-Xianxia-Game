import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 16 章 第 2 关 · 龙裔巢穴（双路径，dragon_young heavy + ghost_cultivator）
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH16_L2: LevelConfig = {
  id: 'ch16-l2', name: '龙裔巢穴',
  startStones: 720, lives: 38,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.6,
  waves: [
    { spawns: [{ enemy: 'dragon_young', count: 8, gap: 1.2, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 5, gap: 1.6, delay: 1, path: 1 }], clearBonus: 320 },
    { spawns: [{ enemy: 'ghost_cultivator', count: 8, gap: 1.0, delay: 0, path: 0 }, { enemy: 'dragon_young', count: 8, gap: 1.0, delay: 1, path: 1 }, { enemy: 'shadow_fox', count: 6, gap: 1.0, delay: 0, path: 0 }], clearBonus: 360 },
    { spawns: [{ enemy: 'dragon_young', count: 12, gap: 0.8, delay: 0, path: 1 }, { enemy: 'ghost_cultivator', count: 10, gap: 0.8, delay: 1, path: 0 }, { enemy: 'demon_knight', count: 6, gap: 1.4, delay: 0, path: 1 }], clearBonus: 400 },
  ],
  story: {
    intro: {
      chapter: '第 十 六 章', title: '龙 裔 巢 穴',
      lines: [
        '龙裔巢穴深处，幼龙盘旋，鬼修隐现。',
        '寻常法术难以命中，需以重击破其虚身。',
      ],
      btn: '入 巢 探 秘',
    },
    outro: {
      chapter: '劫 后', title: '巢 穴 空 寂',
      lines: ['巢穴渐空，远方百族旗帜连绵如林。'],
      btn: '继 续',
    },
  },
};
