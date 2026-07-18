import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 2 章 第 2 关 · 毒沼泽（双路径，引入蝙蝠空中路——需符箓/法术对空）
const PATHS = [
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],   // 地面路
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],   // 空中路（蝙蝠）
];

export const CH2_L2: LevelConfig = {
  id: 'ch2-l2', name: '飞蝠崖',
  startStones: 320, lives: 3,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.1,
  maxTowerLevel: 5,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 12, gap: 0.7, delay: 0, path: 0 }, { enemy: 'bat', count: 9, gap: 0.5, delay: 1, path: 1 }], clearBonus: 90 },
    { spawns: [{ enemy: 'bat', count: 16, gap: 0.4, delay: 0, path: 1 }, { enemy: 'boar', count: 33, gap: 2, delay: 0, path: 0 }], clearBonus: 110 },
    { spawns: [{ enemy: 'wolf', count: 14, gap: 0.5, delay: 0, path: 0 }, { enemy: 'bat', count: 12, gap: 0.4, delay: 0, path: 1 }], clearBonus: 130 },
    { spawns: [{ enemy: 'bat', count: 18, gap: 0.35, delay: 0, path: 1 }, { enemy: 'boar', count: 5, gap: 1.8, delay: 0, path: 0 }, { enemy: 'wolf', count: 12, gap: 0.6, delay: 1, path: 0 }], clearBonus: 150 },
  ],
  story: {
    intro: {
      chapter: '第 二 章', title: '飞 蝠 崖',
      lines: [
        '崖上蝙蝠蔽天而至，自空中直扑宗门。',
        '飞剑、长枪皆不能及——唯有符箓、法术可击长空。',
      ],
      btn: '布 符 御 空',
    },
    outro: {
      chapter: '劫 后', title: '蝠 散 天 清',
      lines: ['空中蝠群尽散。', '前方古道，双路合一，更需谨慎。'],
      btn: '继 续',
    },
  },
};
