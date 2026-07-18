import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 22 章 第 1 关 · 混沌前沿（直线路径）
const P = [[
  { x: 0, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 5 },
  { x: 10, y: 5 }, { x: 10, y: 1 }, { x: 15, y: 1 },
]];

export const CH22_L1: LevelConfig = {
  id: 'ch22-l1', name: '混沌前沿',
  startStones: 860, lives: 3,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.2,
  waves: [
    { spawns: [{ enemy: 'void_walker', count: 20, gap: 0.6, delay: 0 }, { enemy: 'chaos_larva', count: 8, gap: 1.2, delay: 1 }], clearBonus: 440 },
    { spawns: [{ enemy: 'celestial_demon', count: 11, gap: 1.2, delay: 0 }, { enemy: 'chaos_larva', count: 11, gap: 0.9, delay: 1 }], clearBonus: 470 },
    { spawns: [{ enemy: 'celestial_demon', count: 14, gap: 1.0, delay: 0 }, { enemy: 'void_walker', count: 22, gap: 0.5, delay: 0 }, { enemy: 'demon_knight', count: 6, gap: 1.8, delay: 1 }], clearBonus: 500 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 二 章', title: '混 沌 前 沿',
      lines: [
        '混沌之力在天裂深处涌动，混沌幼体开始大量繁殖。',
        '它们看似弱小，死后却会分裂出更多幼体。',
        '太上长老率弟子深入混沌前沿，欲斩草除根。',
      ],
      btn: '深 入 混 沌',
    },
    outro: {
      chapter: '前 沿', title: '幼 体 无 尽',
      lines: ['混沌幼体的数量远超预想。', '它们似乎被某种更强大的存在驱使……'],
      btn: '继 续',
    },
  },
};
