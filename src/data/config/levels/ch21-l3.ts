import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 21 章 第 3 关 · 规则扭曲（三路径）
const P = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH21_L3: LevelConfig = {
  id: 'ch21-l3', name: '规则扭曲',
  startStones: 860, lives: 42,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.1,
  waves: [
    { spawns: [{ enemy: 'void_walker', count: 16, gap: 0.6, delay: 0, path: 0 }, { enemy: 'celestial_demon', count: 4, gap: 2, delay: 1, path: 1 }], clearBonus: 440 },
    { spawns: [{ enemy: 'celestial_demon', count: 8, gap: 1.4, delay: 0, path: 2 }, { enemy: 'magic_puppet', count: 8, gap: 0.8, delay: 1, path: 0 }], clearBonus: 470 },
    { spawns: [{ enemy: 'void_walker', count: 18, gap: 0.5, delay: 0, path: 1 }, { enemy: 'celestial_demon', count: 10, gap: 1.0, delay: 0, path: 2 }, { enemy: 'shadow_fox', count: 6, gap: 1.2, delay: 1, path: 0 }], clearBonus: 500 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 一 章', title: '规 则 扭 曲',
      lines: [
        '天裂之下，天地规则开始扭曲——法术时常反噬，符箓自行燃烧。',
        '三路同时告急，太上长老只能分兵拒敌。',
        '此战若败，界域的根基将彻底崩塌。',
      ],
      btn: '逆 规 则 而 行',
    },
    outro: {
      chapter: '初 战', title: '天 道 之 殇',
      lines: ['三路守军苦战得胜，却发现裂痕仍在扩大。', '真正的混乱，还在前方。'],
      btn: '继 续',
    },
  },
};
