import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 3 章 第 1 关 · 破阵前哨（双路径，引入 魔修喽啰 护盾）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH3_L1: LevelConfig = {
  id: 'ch3-l1', name: '破阵前哨',
  startStones: 380, lives: 25,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.2,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 8, gap: 0.7, delay: 0, path: 0 }, { enemy: 'wolf', count: 8, gap: 0.8, delay: 0, path: 1 }], clearBonus: 100 },
    // 魔修喽啰：护体魔气（蓝环），先破盾再掉血
    { spawns: [{ enemy: 'magic_minion', count: 4, gap: 1.4, delay: 0, path: 0 }, { enemy: 'wolf', count: 10, gap: 0.5, delay: 0, path: 1 }], clearBonus: 120 },
    { spawns: [{ enemy: 'magic_minion', count: 5, gap: 1.2, delay: 0, path: 0 }, { enemy: 'magic_minion', count: 4, gap: 1.4, delay: 1, path: 1 }, { enemy: 'boar', count: 2, gap: 2.5, delay: 0, path: 0 }], clearBonus: 150 },
    { spawns: [{ enemy: 'blood_cultist', count: 4, gap: 1.4, delay: 0, path: 0 }, { enemy: 'magic_minion', count: 5, gap: 1.2, delay: 1, path: 1 }], clearBonus: 170 },
  ],
  story: {
    intro: {
      chapter: '第 三 章', title: '魔 修 乱 世',
      lines: [
        '魔修终于现身。',
        '他们身披护体魔气，寻常飞剑竟被挡于门外。',
        '唯有持续轰击、先破其盾，方可伤其根本。',
      ],
      btn: '破 阵 而 入',
    },
    outro: {
      chapter: '劫 后', title: '魔 气 渐 散',
      lines: ['魔修喽啰溃退。', '前方血池，更邪异之物正缓缓浮起……'],
      btn: '继 续',
    },
  },
};
