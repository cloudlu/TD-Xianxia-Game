import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 26 章 第 1 关 · 天外天（L 形单路径，引入混沌古兽 + 执法者）
const P = [[
  { x: 0, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 6 }, { x: 15, y: 6 },
]];

export const CH26_L1: LevelConfig = {
  id: 'ch26-l1', name: '天外天',
  startStones: 1000, lives: 46,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.6,
  waves: [
    { spawns: [{ enemy: 'chaos_larva', count: 18, gap: 0.5, delay: 0 }, { enemy: 'void_walker', count: 6, gap: 1.2, delay: 1 }], clearBonus: 520 },
    { spawns: [{ enemy: 'law_enforcer', count: 5, gap: 1.6, delay: 0 }, { enemy: 'celestial_demon', count: 6, gap: 1.4, delay: 1 }], clearBonus: 560 },
    { spawns: [{ enemy: 'chaos_beast', count: 4, gap: 2.2, delay: 0 }, { enemy: 'law_enforcer', count: 6, gap: 1.4, delay: 1 }, { enemy: 'void_walker', count: 12, gap: 0.6, delay: 0 }], clearBonus: 620 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 六 章', title: '飞 升 篇',
      lines: [
        '突破天道之后，你踏入了「天外天」——混沌的原初之地。',
        '此地没有规则，唯有混沌古兽与执法者在虚无中游荡。',
        '熟悉的小小宗门已远在脚下，而你已无退路。',
      ],
      btn: '踏 入 天 外',
    },
    outro: {
      chapter: '混 沌', title: '古 兽 初 现',
      lines: ['混沌古兽被斩后竟分裂为幼体，规则之力难伤其本源。', '执法者冷眼旁观，似在审判你这个外来者……'],
      btn: '继 续',
    },
  },
};
