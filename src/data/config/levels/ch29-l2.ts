import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 29 章 第 2 关 · 终极考验（双路径）
const P = [
  [{ x: 0, y: 1 }, { x: 8, y: 1 }, { x: 8, y: 6 }, { x: 15, y: 6 }],
  [{ x: 0, y: 6 }, { x: 8, y: 6 }, { x: 8, y: 1 }, { x: 15, y: 1 }],
];

export const CH29_L2: LevelConfig = {
  id: 'ch29-l2', name: '终极考验',
  startStones: 1140, lives: 3,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.9,
  waves: [
    { spawns: [{ enemy: 'void_devourer', count: 11, gap: 1.4, delay: 0, path: 0 }, { enemy: 'chaos_beast', count: 17, gap: 1.2, delay: 1, path: 1 }, { enemy: 'void_walker', count: 31, gap: 0.4, delay: 0, path: 0 }], clearBonus: 680 },
    { spawns: [{ enemy: 'law_enforcer', count: 22, gap: 0.7, delay: 0, path: 1 }, { enemy: 'celestial_demon', count: 22, gap: 0.7, delay: 1, path: 0 }, { enemy: 'void_devourer', count: 8, gap: 1.6, delay: 2, path: 1 }], clearBonus: 720 },
    { spawns: [{ enemy: 'chaos_beast', count: 20, gap: 1.0, delay: 0, path: 0 }, { enemy: 'void_devourer', count: 11, gap: 1.4, delay: 1, path: 1 }, { enemy: 'law_enforcer', count: 20, gap: 0.8, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 31, gap: 0.4, delay: 2, path: 1 }], clearBonus: 780 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 九 章', title: '终 极 考 验',
      lines: ['天道以终极之兵相迎——这是它给每一位飞升者设下的最后考题。', '答错了，便化为它的一部分。'],
      btn: '应 考 验',
    },
    outro: {
      chapter: '考 验', title: '通 关 在 望',
      lines: ['终极之兵尽数折损，天道的考题你已答完。', '只剩最后一道门，与门后那个存在……'],
      btn: '继 续',
    },
  },
};
