import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 12 章 第 3 关 · 魔域军团（三路径，全面混合 + 法尊 mini-boss）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH12_L3: LevelConfig = {
  id: 'ch12-l3', name: '魔域军团',
  startStones: 680, lives: 36,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.2,
  waves: [
    { spawns: [{ enemy: 'demon_knight', count: 8, gap: 1.4, delay: 0 }, { enemy: 'shadow_assassin', count: 8, gap: 1.0, delay: 1 }, { enemy: 'wolf', count: 16, gap: 0.3, delay: 0 }], clearBonus: 360 },
    { spawns: [{ enemy: 'demon_serpent', count: 8, gap: 1.4, delay: 0 }, { enemy: 'bat', count: 18, gap: 0.3, delay: 1 }, { enemy: 'sand_scorpion', count: 10, gap: 0.9, delay: 0 }], clearBonus: 400 },
    { spawns: [{ enemy: 'mage_lord', count: 1, gap: 0, delay: 0 }, { enemy: 'demon_knight', count: 8, gap: 1.4, delay: 1 }, { enemy: 'shadow_assassin', count: 10, gap: 0.9, delay: 0 }], clearBonus: 480 },
  ],
  story: {
    intro: {
      chapter: '第 十 二 章', title: '魔 域 军 团',
      lines: [
        '魔域军团倾巢而出，三路压境。',
        '其后还有被腐化的法尊坐镇指挥。',
      ],
      btn: '决 战',
    },
    outro: {
      chapter: '战 报', title: '军 团 溃 散',
      lines: ['法尊陨落，军团溃散。', '魔域深处，血色原野在召唤。'],
      btn: '继 续',
    },
  },
};
