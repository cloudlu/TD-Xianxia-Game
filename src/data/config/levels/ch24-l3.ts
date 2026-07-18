import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 24 章 第 3 关 · 最后据点（三路径 + 裂隙之主小BOSS）
const P = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH24_L3: LevelConfig = {
  id: 'ch24-l3', name: '最后据点',
  startStones: 980, lives: 3,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.4,
  waves: [
    { spawns: [{ enemy: 'celestial_demon', count: 22, gap: 0.8, delay: 0, path: 0 }, { enemy: 'void_walker', count: 28, gap: 0.4, delay: 0, path: 1 }], clearBonus: 540 },
    { spawns: [{ enemy: 'chaos_larva', count: 28, gap: 0.4, delay: 0, path: 2 }, { enemy: 'dragon_young', count: 8, gap: 1.4, delay: 1, path: 0 }], clearBonus: 570 },
    { spawns: [{ enemy: 'rift_sovereign', count: 11, gap: 0, delay: 0, path: 1 }, { enemy: 'celestial_demon', count: 20, gap: 0.8, delay: 1, path: 2 }, { enemy: 'void_walker', count: 25, gap: 0.4, delay: 1, path: 0 }], clearBonus: 610 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 四 章', title: '最 后 据 点',
      lines: [
        '联盟退守最后一处据点，身后便是人间界的核心。',
        '三路同时压境，虚空大军如潮水般涌来。',
        '裂隙之主亲自降临，要将此据点连同界域一起撕裂。',
      ],
      btn: '决 死 一 战',
    },
    outro: {
      chapter: '据 点', title: '主 之 陨',
      lines: ['裂隙之主终于倒下，据点得保。', '但九霄之上，天劫的化身已经睁开眼睛。'],
      btn: '继 续',
    },
  },
};
