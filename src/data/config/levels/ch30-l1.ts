import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 30 章 第 1 关 · 魔影降临（双路径，重混沌古兽 + 虚空吞噬者）
const P = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH30_L1: LevelConfig = {
  id: 'ch30-l1', name: '魔影降临',
  startStones: 1160, lives: 50,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 4.0,
  waves: [
    { spawns: [{ enemy: 'chaos_beast', count: 14, gap: 1.0, delay: 0 }, { enemy: 'void_devourer', count: 8, gap: 1.4, delay: 1 }, { enemy: 'void_walker', count: 24, gap: 0.4, delay: 0 }], clearBonus: 760 },
    { spawns: [{ enemy: 'void_devourer', count: 10, gap: 1.2, delay: 0 }, { enemy: 'chaos_beast', count: 14, gap: 1.0, delay: 1 }, { enemy: 'law_enforcer', count: 14, gap: 0.8, delay: 2 }, { enemy: 'ghost_cultivator', count: 22, gap: 0.5, delay: 0 }], clearBonus: 800 },
    { spawns: [{ enemy: 'chaos_beast', count: 18, gap: 0.8, delay: 0 }, { enemy: 'void_devourer', count: 12, gap: 1.0, delay: 1 }, { enemy: 'celestial_demon', count: 16, gap: 0.7, delay: 0 }, { enemy: 'chaos_larva', count: 30, gap: 0.4, delay: 2 }], clearBonus: 860 },
  ],
  story: {
    intro: {
      chapter: '第 三 十 章', title: '道 祖 魔 影',
      lines: [
        '道祖之门已开，无尽魔影自门后倾泻而出。',
        '太上长老（你）凝神而立，魔影之首——正是「道祖魔影」。',
        '它有你的脸，有你的剑，却没有你的心。',
      ],
      btn: '迎 魔 影',
    },
    outro: {
      chapter: '魔 影', title: '前 锋 已 破',
      lines: ['魔影前锋溃散，但本体仍岿然不动。', '真正的最终之战，仍在最后两阵之中……'],
      btn: '继 续',
    },
  },
};
