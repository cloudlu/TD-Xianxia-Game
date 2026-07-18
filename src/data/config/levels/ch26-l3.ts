import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 26 章 第 3 关 · 混沌古兽（三路径，tribulation_avatar 小BOSS）
const P = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH26_L3: LevelConfig = {
  id: 'ch26-l3', name: '混沌古兽',
  startStones: 1040, lives: 3,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.6,
  waves: [
    { spawns: [{ enemy: 'chaos_beast', count: 8, gap: 1.8, delay: 0, path: 0 }, { enemy: 'chaos_larva', count: 39, gap: 0.4, delay: 1, path: 1 }, { enemy: 'law_enforcer', count: 8, gap: 1.4, delay: 0, path: 2 }], clearBonus: 580 },
    { spawns: [{ enemy: 'void_walker', count: 25, gap: 0.5, delay: 0, path: 0 }, { enemy: 'celestial_demon', count: 14, gap: 1.0, delay: 1, path: 1 }, { enemy: 'chaos_beast', count: 8, gap: 1.8, delay: 2, path: 2 }], clearBonus: 620 },
    { spawns: [{ enemy: 'tribulation_avatar', count: 11, gap: 0, delay: 0, path: 0 }, { enemy: 'chaos_beast', count: 11, gap: 1.6, delay: 1, path: 1 }, { enemy: 'law_enforcer', count: 14, gap: 1.0, delay: 0, path: 2 }, { enemy: 'void_walker', count: 22, gap: 0.5, delay: 2, path: 0 }], clearBonus: 800 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 六 章', title: '混 沌 古 兽',
      lines: ['混沌潮汐中浮现一尊雷劫化身，似是天道留下的爪牙。', '它身后，群兽齐出，原初的混沌翻涌如怒海。'],
      btn: '战 雷 劫',
    },
    outro: {
      chapter: '雷 劫', title: '化 身 陨 落',
      lines: ['雷劫化身化为飞灰，但你知道，这只是天道的眼目。', '真正的执法者，正在更深处集结……'],
      btn: '续 第 二 十 七 章',
    },
  },
};
