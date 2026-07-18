import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 27 章 第 2 关 · 执法者（双路径）
const P = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH27_L2: LevelConfig = {
  id: 'ch27-l2', name: '执法者',
  startStones: 1060, lives: 3,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.7,
  waves: [
    { spawns: [{ enemy: 'law_enforcer', count: 14, gap: 1.0, delay: 0, path: 0 }, { enemy: 'chaos_larva', count: 34, gap: 0.4, delay: 1, path: 1 }], clearBonus: 580 },
    { spawns: [{ enemy: 'chaos_beast', count: 11, gap: 1.6, delay: 0, path: 0 }, { enemy: 'void_walker', count: 22, gap: 0.5, delay: 1, path: 1 }, { enemy: 'law_enforcer', count: 11, gap: 1.2, delay: 0, path: 0 }], clearBonus: 620 },
    { spawns: [{ enemy: 'celestial_demon', count: 20, gap: 0.8, delay: 0, path: 1 }, { enemy: 'chaos_beast', count: 11, gap: 1.6, delay: 1, path: 0 }, { enemy: 'law_enforcer', count: 17, gap: 0.9, delay: 2, path: 1 }, { enemy: 'ghost_cultivator', count: 25, gap: 0.5, delay: 0, path: 0 }], clearBonus: 680 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 七 章', title: '执 法 者',
      lines: ['执法者终于倾巢而出——他们奉天道之命，诛杀一切逆天之人。', '而你，正是他们眼中最大的「逆」。'],
      btn: '逆 天 而 行',
    },
    outro: {
      chapter: '执 法', title: '群 起 围 攻',
      lines: ['执法者倒下一批，又补上一批。', '他们的「规则」之源，似乎指向同一个存在……'],
      btn: '继 续',
    },
  },
};
