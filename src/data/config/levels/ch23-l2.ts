import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { FORGE_MAPS } from '../forgeMaps';

// 第 23 章 第 2 关 · 灵气紊乱【异变·经营战】中路合流打怪 + 顶部六炉经营
const FORGE = FORGE_MAPS['ch23-l2'];
const P = [
  [{ x: 0, y: 4 }, { x: 9, y: 4 }, { x: 9, y: 7 }, { x: 15, y: 7 }],
  [{ x: 0, y: 9 }, { x: 9, y: 9 }, { x: 9, y: 7 }, { x: 15, y: 7 }],
];

export const CH23_L2: LevelConfig = {
  id: 'ch23-l2', name: '灵气紊乱·经营',
  startStones: 920, lives: 3,
  cols: 16, rows: 10,
  mode: 'forge',
  forge: FORGE,
  paths: P,
  base: { x: 15, y: 7 },
  buildable: buildableFromPaths(16, 10, P),
  hpMul: 3.3,
  activePaths: [0, 1],
  waves: [
    { spawns: [{ enemy: 'ghost_cultivator', count: 11, gap: 1.0, delay: 0, path: 0 }, { enemy: 'void_walker', count: 14, gap: 0.6, delay: 0, path: 1 }], clearBonus: 480 },
    { spawns: [{ enemy: 'celestial_demon', count: 14, gap: 0.9, delay: 0, path: 0 }, { enemy: 'chaos_larva', count: 17, gap: 0.5, delay: 1, path: 1 }], clearBonus: 510 },
    { spawns: [{ enemy: 'void_walker', count: 22, gap: 0.5, delay: 0, path: 0 }, { enemy: 'celestial_demon', count: 17, gap: 0.8, delay: 0, path: 1 }, { enemy: 'magic_minion', count: 11, gap: 0.7, delay: 1, path: 0 }], clearBonus: 540 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 三 章', title: '聚 灵 为 炉',
      lines: [
        '灵气紊乱反成利势——紊乱的灵气恰好可供丹炉快炼！',
        '顶部六炉齐开：收取符箓强塔，合并升级增产。',
        '两路妖潮合流压境，中路布防勿失。',
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
