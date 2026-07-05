import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 19 章 第 1 关 · 天妖前哨（直路径，parasite_king 的先锋部队）
const PATHS = [[
  { x: 0, y: 4 }, { x: 15, y: 4 },
]];

export const CH19_L1: LevelConfig = {
  id: 'ch19-l1', name: '天妖前哨',
  startStones: 820, lives: 42,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.9,
  waves: [
    { spawns: [{ enemy: 'dragon_young', count: 14, gap: 0.8, delay: 0 }, { enemy: 'ghost_cultivator', count: 12, gap: 0.7, delay: 1 }], clearBonus: 400 },
    { spawns: [{ enemy: 'blood_cultist', count: 16, gap: 0.6, delay: 0 }, { enemy: 'demon_knight', count: 12, gap: 0.8, delay: 1 }, { enemy: 'shadow_assassin', count: 14, gap: 0.6, delay: 0 }], clearBonus: 440 },
    { spawns: [{ enemy: 'dragon_young', count: 18, gap: 0.6, delay: 0 }, { enemy: 'ghost_cultivator', count: 18, gap: 0.5, delay: 1 }, { enemy: 'magic_puppet', count: 12, gap: 0.8, delay: 0 }], clearBonus: 500 },
  ],
  story: {
    intro: {
      chapter: '第 十 九 章', title: '天 妖 前 哨',
      lines: [
        '天妖蛊王先锋已至，百族腹地沦陷在即。',
        '此地若失，大陆无险可守。',
      ],
      btn: '守 前 哨',
    },
    outro: {
      chapter: '劫 后', title: '前 哨 已 守',
      lines: ['前哨勉强守住，蛊毒沼泽横在前方。'],
      btn: '继 续',
    },
  },
};
