import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 13 章 第 3 关 · 联军反攻（三路径，全面混合 + 裂隙之主 mini-boss）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH13_L3: LevelConfig = {
  id: 'ch13-l3', name: '联军反攻',
  startStones: 720, lives: 38,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.3,
  waves: [
    { spawns: [{ enemy: 'demon_knight', count: 10, gap: 1.0, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 10, gap: 0.8, delay: 1, path: 1 }, { enemy: 'wolf', count: 18, gap: 0.3, delay: 0, path: 2 }], clearBonus: 400 },
    { spawns: [{ enemy: 'demon_serpent', count: 10, gap: 1.2, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 10, gap: 1.0, delay: 1, path: 1 }, { enemy: 'magic_puppet', count: 10, gap: 1.0, delay: 0, path: 2 }], clearBonus: 440 },
    { spawns: [{ enemy: 'rift_lord', count: 1, gap: 0, delay: 0, path: 0 }, { enemy: 'demon_knight', count: 10, gap: 1.2, delay: 1, path: 1 }, { enemy: 'shadow_assassin', count: 12, gap: 0.8, delay: 0, path: 2 }], clearBonus: 500 },
  ],
  story: {
    intro: {
      chapter: '第 十 三 章', title: '联 军 反 攻',
      lines: [
        '联军全面反攻，魔域节节败退。',
        '裂隙之主降临阻挡，三路决战。',
      ],
      btn: '反 攻',
    },
    outro: {
      chapter: '战 报', title: '裂 隙 封 镇',
      lines: ['裂隙之主伏诛。', '魔帅巢穴，仅余最后屏障。'],
      btn: '继 续',
    },
  },
};
