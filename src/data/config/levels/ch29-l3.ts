import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 29 章 第 3 关 · 道祖之门（三路径，blood_lord 小BOSS）
const P = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH29_L3: LevelConfig = {
  id: 'ch29-l3', name: '道祖之门',
  startStones: 1160, lives: 50,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.9,
  waves: [
    { spawns: [{ enemy: 'chaos_beast', count: 14, gap: 1.0, delay: 0 }, { enemy: 'void_devourer', count: 8, gap: 1.4, delay: 1 }, { enemy: 'law_enforcer', count: 14, gap: 0.8, delay: 0 }, { enemy: 'void_walker', count: 22, gap: 0.4, delay: 2 }], clearBonus: 720 },
    { spawns: [{ enemy: 'celestial_demon', count: 18, gap: 0.7, delay: 0 }, { enemy: 'chaos_larva', count: 32, gap: 0.4, delay: 1 }, { enemy: 'void_devourer', count: 8, gap: 1.4, delay: 2 }, { enemy: 'ghost_cultivator', count: 20, gap: 0.5, delay: 0 }], clearBonus: 760 },
    { spawns: [{ enemy: 'blood_lord', count: 1, gap: 0, delay: 0 }, { enemy: 'chaos_beast', count: 14, gap: 1.0, delay: 1 }, { enemy: 'void_devourer', count: 8, gap: 1.4, delay: 0 }, { enemy: 'law_enforcer', count: 16, gap: 0.7, delay: 2 }, { enemy: 'void_walker', count: 24, gap: 0.4, delay: 1 }], clearBonus: 960 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 九 章', title: '道 祖 之 门',
      lines: ['道祖之门巍然矗立，门前立着一尊血君——它曾是上一任挑战者。', '它没有说话，只是举起了剑。'],
      btn: '叩 道 门',
    },
    outro: {
      chapter: '道 门', title: '门 已 洞 开',
      lines: ['血君化为飞烟，道祖之门缓缓洞开。', '门后，那个名为「道祖魔影」的存在，正以你的面容回望你……'],
      btn: '续 第 三 十 章',
    },
  },
};
