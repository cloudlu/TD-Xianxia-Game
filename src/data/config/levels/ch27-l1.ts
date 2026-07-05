import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 27 章 第 1 关 · 原初之地（直路径）
const P = [[
  { x: 0, y: 4 }, { x: 15, y: 4 },
]];

export const CH27_L1: LevelConfig = {
  id: 'ch27-l1', name: '原初之地',
  startStones: 1040, lives: 48,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.7,
  waves: [
    { spawns: [{ enemy: 'chaos_larva', count: 30, gap: 0.4, delay: 0 }, { enemy: 'law_enforcer', count: 6, gap: 1.4, delay: 1 }], clearBonus: 560 },
    { spawns: [{ enemy: 'chaos_beast', count: 8, gap: 1.6, delay: 0 }, { enemy: 'void_walker', count: 14, gap: 0.5, delay: 1 }], clearBonus: 600 },
    { spawns: [{ enemy: 'law_enforcer', count: 10, gap: 1.0, delay: 0 }, { enemy: 'celestial_demon', count: 12, gap: 0.8, delay: 1 }, { enemy: 'chaos_beast', count: 6, gap: 1.8, delay: 2 }], clearBonus: 660 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 七 章', title: '原 初 之 地',
      lines: ['你深入原初之地，脚下没有大地，唯有凝固的规则碎片。', '执法者的低语回荡：「外来者，回头还来得及。」'],
      btn: '不 回 头',
    },
    outro: {
      chapter: '深 行', title: '规 则 碎 片',
      lines: ['规则碎片在脚下崩裂，前方已无路径可循。', '你只能踏虚空而行，逐道而行……'],
      btn: '继 续',
    },
  },
};
