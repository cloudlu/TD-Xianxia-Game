import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 16 章 第 1 关 · 万族遗址（L 形单路径，引入 dragon_young + demon_knight）
const PATHS = [[
  { x: 0, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 6 }, { x: 15, y: 6 },
]];

export const CH16_L1: LevelConfig = {
  id: 'ch16-l1', name: '万族遗址',
  startStones: 700, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.6,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 20, gap: 0.5, delay: 0 }, { enemy: 'demon_knight', count: 6, gap: 1.8, delay: 1 }], clearBonus: 300 },
    { spawns: [{ enemy: 'dragon_young', count: 7, gap: 1.6, delay: 0 }, { enemy: 'demon_knight', count: 8, gap: 1.2, delay: 1 }, { enemy: 'wolf', count: 17, gap: 0.5, delay: 0 }], clearBonus: 340 },
    { spawns: [{ enemy: 'dragon_young', count: 11, gap: 1.2, delay: 0 }, { enemy: 'demon_knight', count: 11, gap: 1.0, delay: 1 }, { enemy: 'boar', count: 8, gap: 1.6, delay: 0 }], clearBonus: 380 },
  ],
  story: {
    intro: {
      chapter: '第 十 六 章', title: '百 族 大 战 篇',
      lines: [
        '裂缝连通万族战场遗址，远古种族纷纷苏醒。',
        '龙族飞行高甲，鬼修闪避如虚——百族大战再起。',
      ],
      btn: '踏 入 遗 址',
    },
    outro: {
      chapter: '劫 后', title: '龙 啸 渐 止',
      lines: ['幼龙哀鸣退去，废墟深处传来更沉重的脚步声。'],
      btn: '继 续',
    },
  },
};
