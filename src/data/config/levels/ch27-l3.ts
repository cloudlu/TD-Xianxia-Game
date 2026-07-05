import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 27 章 第 3 关 · 天道守卫（三路径，parasite_king + demon_general 双小BOSS）
const P = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH27_L3: LevelConfig = {
  id: 'ch27-l3', name: '天道守卫',
  startStones: 1080, lives: 48,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.7,
  waves: [
    { spawns: [{ enemy: 'law_enforcer', count: 14, gap: 0.8, delay: 0 }, { enemy: 'chaos_beast', count: 8, gap: 1.6, delay: 1 }, { enemy: 'void_walker', count: 18, gap: 0.5, delay: 0 }], clearBonus: 620 },
    { spawns: [{ enemy: 'celestial_demon', count: 16, gap: 0.7, delay: 0 }, { enemy: 'chaos_larva', count: 30, gap: 0.4, delay: 1 }, { enemy: 'law_enforcer', count: 12, gap: 1.0, delay: 2 }], clearBonus: 660 },
    { spawns: [{ enemy: 'parasite_king', count: 1, gap: 0, delay: 0 }, { enemy: 'demon_general', count: 1, gap: 0, delay: 1 }, { enemy: 'chaos_beast', count: 10, gap: 1.4, delay: 1 }, { enemy: 'law_enforcer', count: 14, gap: 0.8, delay: 0 }, { enemy: 'void_walker', count: 18, gap: 0.5, delay: 2 }], clearBonus: 900 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 七 章', title: '天 道 守 卫',
      lines: ['天道终于派出它最忠实的守卫——蛊王与魔将并肩降临。', '这是飞升以来，最险的一战。'],
      btn: '斩 守 卫',
    },
    outro: {
      chapter: '守 卫', title: '双 王 俱 陨',
      lines: ['蛊王与魔将同陨，天道的爪牙已尽数折损。', '然而前方的虚空，开始无声地塌陷……'],
      btn: '续 第 二 十 八 章',
    },
  },
};
