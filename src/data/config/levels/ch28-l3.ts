import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 28 章 第 3 关 · 混沌深渊（三路径，rift_sovereign 小BOSS）
const P = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH28_L3: LevelConfig = {
  id: 'ch28-l3', name: '混沌深渊',
  startStones: 1120, lives: 48,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.8,
  waves: [
    { spawns: [{ enemy: 'void_devourer', count: 6, gap: 1.6, delay: 0 }, { enemy: 'chaos_beast', count: 10, gap: 1.4, delay: 1 }, { enemy: 'void_walker', count: 20, gap: 0.4, delay: 0 }], clearBonus: 660 },
    { spawns: [{ enemy: 'law_enforcer', count: 14, gap: 0.8, delay: 0 }, { enemy: 'celestial_demon', count: 16, gap: 0.7, delay: 1 }, { enemy: 'void_devourer', count: 5, gap: 1.8, delay: 2 }], clearBonus: 700 },
    { spawns: [{ enemy: 'rift_sovereign', count: 1, gap: 0, delay: 0 }, { enemy: 'void_devourer', count: 8, gap: 1.4, delay: 1 }, { enemy: 'chaos_beast', count: 10, gap: 1.4, delay: 0 }, { enemy: 'law_enforcer', count: 12, gap: 0.9, delay: 2 }, { enemy: 'void_walker', count: 20, gap: 0.5, delay: 1 }], clearBonus: 920 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 八 章', title: '混 沌 深 渊',
      lines: ['混沌深渊之底，一尊裂隙君王正在沉睡。', '你的脚步惊醒了它——无数虚空裂隙在它身后张开。'],
      btn: '战 裂 隙',
    },
    outro: {
      chapter: '裂 隙', title: '君 王 陨 落',
      lines: ['裂隙君王崩塌为无数细小的虚空碎片。', '穿过深渊，你已能看见那扇「道祖之门」……'],
      btn: '续 第 二 十 九 章',
    },
  },
};
