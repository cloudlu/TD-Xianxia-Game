import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 24 章 第 1 关 · 天劫前兆（直线路径）
const P = [[
  { x: 0, y: 4 }, { x: 15, y: 4 },
]];

export const CH24_L1: LevelConfig = {
  id: 'ch24-l1', name: '天劫前兆',
  startStones: 940, lives: 3,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.4,
  waves: [
    { spawns: [{ enemy: 'void_walker', count: 25, gap: 0.5, delay: 0 }, { enemy: 'celestial_demon', count: 11, gap: 1.2, delay: 1 }], clearBonus: 500 },
    { spawns: [{ enemy: 'celestial_demon', count: 17, gap: 0.9, delay: 0 }, { enemy: 'chaos_larva', count: 20, gap: 0.5, delay: 1 }], clearBonus: 530 },
    { spawns: [{ enemy: 'void_walker', count: 28, gap: 0.4, delay: 0 }, { enemy: 'celestial_demon', count: 17, gap: 0.8, delay: 0 }, { enemy: 'ghost_cultivator', count: 11, gap: 1.0, delay: 1 }], clearBonus: 560 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 四 章', title: '天 劫 前 兆',
      lines: [
        '九霄之上，紫色雷云翻涌——那是传说中的「天劫」将至之兆。',
        '修真界万年来，只闻天劫之名，未见其形。',
        '如今，它真的要降临了。',
      ],
      btn: '观 雷 云 而 阵',
    },
    outro: {
      chapter: '前 兆', title: '紫 雷 不 息',
      lines: ['紫雷未止，反愈炽烈。', '虚空深处，似乎有什么东西在牵引天劫。'],
      btn: '继 续',
    },
  },
};
