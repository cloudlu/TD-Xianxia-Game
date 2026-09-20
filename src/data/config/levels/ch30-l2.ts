import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { FORGE_MAPS } from '../forgeMaps';

// 第 30 章 第 2 关 · 最终之敌【异变·经营战】中路边路打怪 + 双侧八炉终局经营
// 三路等长：13/13/13（中路梳齿折返补齐，等长铁律 ≤10%）
const FORGE = FORGE_MAPS['ch30-l2'];
const P = [
  [{ x: 5, y: 0 }, { x: 5, y: 3 }, { x: 15, y: 3 }],
  [{ x: 0, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 10, y: 4 }],
  [{ x: 5, y: 9 }, { x: 5, y: 6 }, { x: 15, y: 6 }],
];

export const CH30_L2: LevelConfig = {
  id: 'ch30-l2', name: '最终之敌·经营',
  startStones: 1200, lives: 3,
  cols: 16, rows: 10,
  mode: 'forge',
  forge: FORGE,
  paths: P,
  base: { x: 15, y: 4 },
  buildable: buildableFromPaths(16, 10, P),
  hpMul: 4.0,
  activePaths: [0, 1, 2],
  waves: [
    { spawns: [{ enemy: 'chaos_beast', count: 22, gap: 0.9, delay: 0, path: 0 }, { enemy: 'void_devourer', count: 14, gap: 1.2, delay: 1, path: 1 }, { enemy: 'law_enforcer', count: 20, gap: 0.8, delay: 0, path: 2 }, { enemy: 'void_walker', count: 34, gap: 0.4, delay: 2, path: 0 }], clearBonus: 820 },
    { spawns: [{ enemy: 'celestial_demon', count: 25, gap: 0.7, delay: 0, path: 1 }, { enemy: 'chaos_larva', count: 50, gap: 0.4, delay: 1, path: 2 }, { enemy: 'chaos_beast', count: 20, gap: 1.0, delay: 2, path: 0 }, { enemy: 'ghost_cultivator', count: 31, gap: 0.5, delay: 0, path: 1 }], clearBonus: 860 },
    { spawns: [{ enemy: 'void_devourer', count: 17, gap: 1.0, delay: 0, path: 2 }, { enemy: 'chaos_beast', count: 22, gap: 0.9, delay: 1, path: 0 }, { enemy: 'law_enforcer', count: 22, gap: 0.7, delay: 0, path: 1 }, { enemy: 'void_walker', count: 36, gap: 0.4, delay: 2, path: 2 }, { enemy: 'celestial_demon', count: 22, gap: 0.7, delay: 1, path: 0 }], clearBonus: 920 },
  ],
  story: {
    intro: {
      chapter: '第 三 十 章', title: '万 象 炉 阵',
      lines: [
        '道祖『万象之阵』笼罩天地——而联军最后的底牌，是八座太古丹炉。',
        '边战边炼：收取符箓、合并升级，把炉火烧成破阵的利刃。',
        '三路妖潮齐压，此战之后，便是道祖本体。',
      ],
      btn: '破 万 象',
    },
    outro: {
      chapter: '万 象', title: '阵 破 门 现',
      lines: ['万象之阵崩解，前路豁然开朗。', '道祖魔影的本体，正盘膝坐于天外天的尽头……'],
      btn: '继 续',
    },
  },
};
