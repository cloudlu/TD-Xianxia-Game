import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 24 章 第 2 关 · 虚空深处（双路径）
const P = [
  [{ x: 0, y: 1 }, { x: 8, y: 1 }, { x: 8, y: 6 }, { x: 15, y: 6 }],
  [{ x: 0, y: 6 }, { x: 8, y: 6 }, { x: 8, y: 1 }, { x: 15, y: 1 }],
];

export const CH24_L2: LevelConfig = {
  id: 'ch24-l2', name: '虚空深处',
  startStones: 960, lives: 46,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.4,
  waves: [
    { spawns: [{ enemy: 'void_walker', count: 16, gap: 0.5, delay: 0, path: 0 }, { enemy: 'celestial_demon', count: 10, gap: 1.0, delay: 1, path: 1 }], clearBonus: 520 },
    { spawns: [{ enemy: 'chaos_larva', count: 18, gap: 0.5, delay: 0, path: 0 }, { enemy: 'celestial_demon', count: 10, gap: 0.9, delay: 1, path: 1 }], clearBonus: 550 },
    { spawns: [{ enemy: 'void_walker', count: 20, gap: 0.4, delay: 0, path: 0 }, { enemy: 'celestial_demon', count: 14, gap: 0.7, delay: 0, path: 1 }, { enemy: 'nine_tails', count: 1, gap: 0, delay: 1, path: 0 }], clearBonus: 580 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 四 章', title: '虚 空 深 处',
      lines: [
        '太上长老率精锐深入虚空深处，欲寻找天劫的源头。',
        '虚空之中没有方向，只有无尽的灰白与低语。',
        '九尾妖狐的幻影在雾中闪现——它也想借天劫之力重生。',
      ],
      btn: '深 入 虚 空',
    },
    outro: {
      chapter: '深 处', title: '幻 影 渐 退',
      lines: ['九尾的幻影被识破，虚空稍稍平静。', '但据点之外，最后一战已在酝酿。'],
      btn: '继 续',
    },
  },
};
