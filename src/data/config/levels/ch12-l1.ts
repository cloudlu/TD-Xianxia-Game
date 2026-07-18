import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 12 章 第 1 关 · 焦土战线（单路径，魔甲士为主）
const PATHS = [[
  { x: 0, y: 4 }, { x: 15, y: 4 },
]];

export const CH12_L1: LevelConfig = {
  id: 'ch12-l1', name: '焦土战线',
  startStones: 640, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.2,
  waves: [
    { spawns: [{ enemy: 'demon_knight', count: 10, gap: 1.6, delay: 0 }, { enemy: 'bat', count: 18, gap: 0.4, delay: 1 }], clearBonus: 320 },
    { spawns: [{ enemy: 'demon_knight', count: 13, gap: 1.2, delay: 0 }, { enemy: 'sand_scorpion', count: 10, gap: 1.0, delay: 1 }], clearBonus: 360 },
    { spawns: [{ enemy: 'demon_knight', count: 16, gap: 1.0, delay: 0 }, { enemy: 'demon_serpent', count: 7, gap: 2.0, delay: 1 }, { enemy: 'wolf', count: 21, gap: 0.3, delay: 0 }], clearBonus: 420 },
  ],
  story: {
    intro: {
      chapter: '第 十 二 章', title: '魔 入 侵',
      lines: [
        '魔域反扑加剧，焦土之上魔甲士密集而来。',
        '重甲难破，须以法术与强弓相辅。',
      ],
      btn: '迎 敌',
    },
    outro: {
      chapter: '战 报', title: '焦 土 暂 安',
      lines: ['魔甲士尸体铺满战线。', '暗影峡谷方向，传来刺杀者嘶鸣。'],
      btn: '继 续',
    },
  },
};
