import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 30 章 第 3 关 · 道祖魔影（三路径，dao_ancestor 终极BOSS · 全篇终战）
const P = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH30_L3: LevelConfig = {
  id: 'ch30-l3', name: '道祖魔影',
  startStones: 1500, lives: 55,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 4.0,
  waves: [
    { spawns: [{ enemy: 'chaos_beast', count: 18, gap: 0.8, delay: 0 }, { enemy: 'void_devourer', count: 12, gap: 1.0, delay: 1 }, { enemy: 'law_enforcer', count: 16, gap: 0.7, delay: 0 }, { enemy: 'void_walker', count: 28, gap: 0.4, delay: 2 }], clearBonus: 900 },
    { spawns: [{ enemy: 'celestial_demon', count: 20, gap: 0.6, delay: 0 }, { enemy: 'chaos_larva', count: 40, gap: 0.3, delay: 1 }, { enemy: 'chaos_beast', count: 18, gap: 0.8, delay: 2 }, { enemy: 'void_devourer', count: 12, gap: 1.0, delay: 0 }, { enemy: 'ghost_cultivator', count: 24, gap: 0.4, delay: 1 }], clearBonus: 950 },
    { spawns: [{ enemy: 'dao_ancestor', count: 1, gap: 0, delay: 0 }, { enemy: 'chaos_beast', count: 20, gap: 0.8, delay: 1 }, { enemy: 'void_devourer', count: 14, gap: 1.0, delay: 1 }, { enemy: 'law_enforcer', count: 18, gap: 0.6, delay: 0 }, { enemy: 'celestial_demon', count: 18, gap: 0.7, delay: 2 }, { enemy: 'void_walker', count: 30, gap: 0.4, delay: 1 }], clearBonus: 1000 },
  ],
  story: {
    intro: {
      chapter: '第 三 十 章', title: '道 祖 魔 影',
      lines: [
        '天外天的尽头，道祖魔影盘膝而坐，睁眼的瞬间，万道俯首。',
        '它是天道的人格，是上一任飞升者留下的影子，是你必须超越的自己。',
        '此战之后，要么你取代它，要么你成为它。',
      ],
      btn: '诛 道 祖',
    },
    outro: {
      chapter: '全 篇 终', title: '飞 升 之 后',
      lines: [
        '道祖魔影消散，天外天归于宁静。',
        '回望修真界——那个你从外门弟子开始守护的小小宗门。',
        '天道问：「你愿意成为新的天道吗？」',
        '全篇完。',
      ],
      btn: '飞 升',
    },
  },
};
