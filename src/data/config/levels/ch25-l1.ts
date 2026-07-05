import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 25 章 第 1 关 · 天劫降临（双路径）
const P = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH25_L1: LevelConfig = {
  id: 'ch25-l1', name: '天劫降临',
  startStones: 980, lives: 46,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.5,
  waves: [
    { spawns: [{ enemy: 'void_walker', count: 20, gap: 0.4, delay: 0 }, { enemy: 'celestial_demon', count: 12, gap: 0.8, delay: 0 }], clearBonus: 540 },
    { spawns: [{ enemy: 'celestial_demon', count: 16, gap: 0.7, delay: 0 }, { enemy: 'chaos_larva', count: 20, gap: 0.4, delay: 1 }], clearBonus: 570 },
    { spawns: [{ enemy: 'void_walker', count: 24, gap: 0.4, delay: 0 }, { enemy: 'celestial_demon', count: 16, gap: 0.7, delay: 0 }, { enemy: 'blood_lord', count: 1, gap: 0, delay: 1 }], clearBonus: 600 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 五 章', title: '天 劫 降 临',
      lines: [
        '紫雷终于落下，第一道天劫劈开了大地。',
        '天劫的化身——一个由雷光与虚空凝聚的巨人——缓缓从云中走出。',
        '它不是来审判某一人，而是要审判整个界域。',
      ],
      btn: '迎 接 天 劫',
    },
    outro: {
      chapter: '降 临', title: '雷 光 不 绝',
      lines: ['第一波被勉强挡下，但天劫之威远不止于此。', '化身的真身，尚未完全现身。'],
      btn: '继 续',
    },
  },
};
