import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 23 章 第 2 关 · 灵气紊乱（双路径）
const P = [
  [{ x: 0, y: 1 }, { x: 9, y: 1 }, { x: 9, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 9, y: 6 }, { x: 9, y: 4 }, { x: 15, y: 4 }],
];

export const CH23_L2: LevelConfig = {
  id: 'ch23-l2', name: '灵气紊乱',
  startStones: 920, lives: 44,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.3,
  waves: [
    { spawns: [{ enemy: 'ghost_cultivator', count: 8, gap: 1.0, delay: 0, path: 0 }, { enemy: 'void_walker', count: 10, gap: 0.6, delay: 0, path: 1 }], clearBonus: 480 },
    { spawns: [{ enemy: 'celestial_demon', count: 10, gap: 0.9, delay: 0, path: 0 }, { enemy: 'chaos_larva', count: 12, gap: 0.5, delay: 1, path: 1 }], clearBonus: 510 },
    { spawns: [{ enemy: 'void_walker', count: 16, gap: 0.5, delay: 0, path: 0 }, { enemy: 'celestial_demon', count: 12, gap: 0.8, delay: 0, path: 1 }, { enemy: 'magic_minion', count: 8, gap: 0.7, delay: 1, path: 0 }], clearBonus: 540 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 三 章', title: '灵 气 紊 乱',
      lines: [
        '天裂之下，灵气开始紊乱——同一种功法，今日灵验明日失灵。',
        '修士们苦不堪言，妖族也变得躁动不安。',
        '必须在灵气彻底失控前，击退这一波进攻。',
      ],
      btn: '稳 住 灵 脉',
    },
    outro: {
      chapter: '紊 乱', title: '反 攻 在 即',
      lines: ['灵气紊乱稍缓，联盟终于能喘一口气。', '是时候组织联合反击了。'],
      btn: '继 续',
    },
  },
};
