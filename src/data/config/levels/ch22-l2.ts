import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 22 章 第 2 关 · 天魔先锋（双路径）
const P = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH22_L2: LevelConfig = {
  id: 'ch22-l2', name: '天魔先锋',
  startStones: 880, lives: 44,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.2,
  waves: [
    { spawns: [{ enemy: 'celestial_demon', count: 10, gap: 1.0, delay: 0, path: 0 }, { enemy: 'void_walker', count: 12, gap: 0.6, delay: 0, path: 1 }], clearBonus: 460 },
    { spawns: [{ enemy: 'chaos_larva', count: 12, gap: 0.7, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 5, gap: 1.6, delay: 1, path: 1 }], clearBonus: 490 },
    { spawns: [{ enemy: 'celestial_demon', count: 12, gap: 0.9, delay: 0, path: 0 }, { enemy: 'chaos_larva', count: 14, gap: 0.6, delay: 0, path: 1 }, { enemy: 'mist_wraith', count: 5, gap: 1.4, delay: 1, path: 0 }], clearBonus: 520 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 二 章', title: '天 魔 先 锋',
      lines: [
        '天魔先锋军从虚空中列阵而出，铠甲上刻着古老的天道符文。',
        '这些是曾经的天界守卫，如今被虚空腐化，反噬人间。',
        '太上长老望着昔日同袍的面孔，手中长剑却不能停下。',
      ],
      btn: '挥 剑 斩 旧 识',
    },
    outro: {
      chapter: '先 锋', title: '故 人 已 远',
      lines: ['天魔先锋被击退，太上长老默然不语。', '混沌深处，似乎在酝酿更大的攻势。'],
      btn: '继 续',
    },
  },
};
