import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 2 章 第 3 关 · 山腹古道（双路径在末端汇合，火力集中区）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 11, y: 1 }, { x: 11, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 11, y: 6 }, { x: 11, y: 4 }, { x: 15, y: 4 }],
];

export const CH2_L3: LevelConfig = {
  id: 'ch2-l3', name: '山腹古道',
  startStones: 360, lives: 24,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.1,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 12, gap: 0.6, delay: 0, path: 0 }, { enemy: 'bat', count: 8, gap: 0.5, delay: 1, path: 1 }], clearBonus: 100 },
    { spawns: [{ enemy: 'boar', count: 5, gap: 1.6, delay: 0, path: 0 }, { enemy: 'wolf', count: 12, gap: 0.5, delay: 0, path: 1 }], clearBonus: 120 },
    { spawns: [{ enemy: 'bull', count: 1, gap: 1, delay: 1, path: 0 }, { enemy: 'bat', count: 12, gap: 0.4, delay: 0, path: 1 }], clearBonus: 140 },
    { spawns: [{ enemy: 'boar', count: 4, gap: 1.8, delay: 0, path: 1 }, { enemy: 'bat', count: 12, gap: 0.4, delay: 0, path: 0 }], clearBonus: 160 },
    // 末波：蛮牛+蝙蝠+狼三路齐攻
    { spawns: [
      { enemy: 'bull', count: 1, gap: 1, delay: 1, path: 0 },
      { enemy: 'bat', count: 14, gap: 0.4, delay: 0, path: 1 },
      { enemy: 'wolf', count: 12, gap: 0.5, delay: 2, path: 0 },
      { enemy: 'boar', count: 3, gap: 2, delay: 1, path: 1 },
    ], clearBonus: 200 },
  ],
  story: {
    intro: {
      chapter: '第 二 章', title: '山 腹 古 道',
      lines: ['古道双路，末端合一。', '合力之处，正是布阵的死地，也是生门。'],
      btn: '据 险 守 汇',
    },
    outro: {
      chapter: '第 二 章', title: '魔 影 现 身',
      lines: [
        '群妖退去，你正欲喘息。',
        '却见魔修身影自毒瘴深处缓缓走出——',
        '他们身披魔气，寻常飞剑竟刺之不入。',
        '（《魔修乱世》待续……）',
      ],
      btn: '返 回 选 关',
    },
  },
};
