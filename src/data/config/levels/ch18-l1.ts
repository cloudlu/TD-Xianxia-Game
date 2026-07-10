import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 18 章 第 1 关 · 龙脊山脉（L 形路径，dragon_young + demon_knight heavy）
const PATHS = [[
  { x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 2 },
  { x: 13, y: 2 }, { x: 13, y: 5 }, { x: 3, y: 5 },
  { x: 3, y: 7 }, { x: 15, y: 7 },
]];

export const CH18_L1: LevelConfig = {
  id: 'ch18-l1', name: '龙脊山脉',
  startStones: 780, lives: 40,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.8,
  waves: [
    { spawns: [{ enemy: 'dragon_young', count: 10, gap: 1.0, delay: 0 }, { enemy: 'demon_knight', count: 8, gap: 1.0, delay: 1 }], clearBonus: 360 },
    { spawns: [{ enemy: 'demon_knight', count: 14, gap: 0.7, delay: 0 }, { enemy: 'dragon_young', count: 12, gap: 0.8, delay: 1 }, { enemy: 'wolf', count: 16, gap: 0.4, delay: 0 }], clearBonus: 420 },
    { spawns: [{ enemy: 'dragon_young', count: 16, gap: 0.7, delay: 0 }, { enemy: 'demon_knight', count: 16, gap: 0.6, delay: 1 }, { enemy: 'demon_serpent', count: 8, gap: 1.2, delay: 2 }], clearBonus: 480 },
  ],
  story: {
    intro: {
      chapter: '第 十 八 章', title: '龙 脊 山 脉',
      lines: [
        '龙脊山脉险峻难行，龙裔与魔骑共守关隘。',
        '此地一破，百族腹地尽露。',
      ],
      btn: '越 龙 脊',
    },
    outro: {
      chapter: '劫 后', title: '山 脉 已 通',
      lines: ['山脉已通，幽冥古道横于眼前。'],
      btn: '继 续',
    },
  },
};
