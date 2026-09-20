import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { FORGE_MAPS } from '../forgeMaps';

// 第 14 章 第 2 关 · 最后防线【异变·经营战】中路双道打怪 + 两侧锻炉经营
// 玩法：丹炉产"伤害符"，点击收取 → 全塔伤害加成（封顶 +60%）；相邻同级炉点击两下可合并升级
const FORGE = FORGE_MAPS['ch14-l2'];
const PATHS = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH14_L2: LevelConfig = {
  id: 'ch14-l2', name: '最后防线·经营',
  startStones: 740, lives: 3,
  cols: 16, rows: 10,
  mode: 'forge',
  forge: FORGE,
  paths: PATHS,
  base: { x: 15, y: 3 },
  buildable: buildableFromPaths(16, 10, PATHS),
  hpMul: 2.4,
  activePaths: [0, 1],
  waves: [
    { spawns: [{ enemy: 'demon_knight', count: 16, gap: 1.0, delay: 0, path: 0 }, { enemy: 'demon_serpent', count: 10, gap: 1.4, delay: 1, path: 1 }], clearBonus: 400 },
    { spawns: [{ enemy: 'shadow_assassin', count: 18, gap: 0.7, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 13, gap: 1.0, delay: 1, path: 1 }], clearBonus: 440 },
    { spawns: [{ enemy: 'demon_knight', count: 18, gap: 0.9, delay: 0, path: 0 }, { enemy: 'magic_puppet', count: 16, gap: 0.9, delay: 1, path: 1 }, { enemy: 'demon_serpent', count: 10, gap: 1.4, delay: 0, path: 0 }], clearBonus: 500 },
  ],
  story: {
    intro: {
      chapter: '第 十 四 章', title: '丹 火 燎 原',
      lines: [
        '魔帅巢前，联军布下丹炉阵——边打边炼，以丹符助战！',
        '点击就绪的丹炉收取符箓：全塔伤害提升（可叠加，封顶 60%）。',
        '相邻同级丹炉：点第一炉选中，再点第二炉合而为一，炉升一等、出符更厚。',
        '炉区不可建塔——经营与布防，取舍在你。',
      ],
      btn: '开 炉 备 战',
    },
    outro: {
      chapter: '战 报', title: '防 线 破 碎',
      lines: ['防线破碎，魔帅震怒。', '魔帅降临，大战在即。'],
      btn: '继 续',
    },
  },
};
