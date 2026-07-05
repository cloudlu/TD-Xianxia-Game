import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 22 章 第 3 关 · 界域防线（三路径 + 寄生之王小BOSS）
const P = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH22_L3: LevelConfig = {
  id: 'ch22-l3', name: '界域防线',
  startStones: 900, lives: 44,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.2,
  waves: [
    { spawns: [{ enemy: 'celestial_demon', count: 12, gap: 0.9, delay: 0 }, { enemy: 'void_walker', count: 16, gap: 0.5, delay: 0 }], clearBonus: 480 },
    { spawns: [{ enemy: 'chaos_larva', count: 16, gap: 0.5, delay: 0 }, { enemy: 'demon_serpent', count: 6, gap: 1.4, delay: 1 }], clearBonus: 510 },
    { spawns: [{ enemy: 'parasite_king', count: 1, gap: 0, delay: 0 }, { enemy: 'celestial_demon', count: 10, gap: 1.0, delay: 1 }, { enemy: 'chaos_larva', count: 12, gap: 0.6, delay: 1 }], clearBonus: 550 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 二 章', title: '界 域 防 线',
      lines: [
        '界域联军在天裂之下筑起最后一道防线。',
        '三路同时告破，弟子们用血肉之躯填补缺口。',
        '寄生之王从地底钻出，它要将所有守军变为它的子嗣。',
      ],
      btn: '死 守 防 线',
    },
    outro: {
      chapter: '防 线', title: '一 时 安 宁',
      lines: ['寄生之王被斩杀，防线暂保。', '但天裂未止，更大的威胁正在凝聚……'],
      btn: '继 续',
    },
  },
};
