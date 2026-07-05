import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 11 章 第 1 关 · 联盟前线（L 形单路径，引入魔甲士 + 暗影刺客）
const PATHS = [[
  { x: 0, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 6 }, { x: 15, y: 6 },
]];

export const CH11_L1: LevelConfig = {
  id: 'ch11-l1', name: '联盟前线',
  startStones: 600, lives: 34,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.1,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 16, gap: 0.5, delay: 0 }, { enemy: 'demon_knight', count: 4, gap: 2.2, delay: 1 }], clearBonus: 280 },
    { spawns: [{ enemy: 'shadow_assassin', count: 6, gap: 1.4, delay: 0 }, { enemy: 'sand_scorpion', count: 8, gap: 1.0, delay: 1 }], clearBonus: 300 },
    { spawns: [{ enemy: 'demon_knight', count: 6, gap: 1.8, delay: 0 }, { enemy: 'shadow_assassin', count: 6, gap: 1.2, delay: 1 }, { enemy: 'wolf', count: 14, gap: 0.4, delay: 0 }], clearBonus: 340 },
  ],
  story: {
    intro: {
      chapter: '第 十 一 章', title: '大 陆 联 盟 篇',
      lines: [
        '九大宗门组建联盟，共抗魔域，你被任命为联盟护法。',
        '魔域裂缝处涌出重甲魔兵与隐身刺客，前线告急。',
        '布阵迎敌，稳固联盟首道防线。',
      ],
      btn: '入 阵 迎 敌',
    },
    outro: {
      chapter: '战 报', title: '前 线 稳 住',
      lines: ['魔甲士被阻，刺客现形伏诛。', '前方魔气更浓，联盟军议再起。'],
      btn: '继 续',
    },
  },
};
