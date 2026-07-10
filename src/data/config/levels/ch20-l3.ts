import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 20 章 第 3 关 · 天妖蛊王（三路径，parasite_king BOSS 终战）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH20_L3: LevelConfig = {
  id: 'ch20-l3', name: '天妖蛊王',
  startStones: 1000, lives: 44,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 3.0,
  waves: [
    { spawns: [{ enemy: 'dragon_young', count: 18, gap: 0.5, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 20, gap: 0.4, delay: 1, path: 1 }, { enemy: 'shadow_assassin', count: 18, gap: 0.5, delay: 0, path: 2 }], clearBonus: 540 },
    { spawns: [{ enemy: 'demon_knight', count: 18, gap: 0.6, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 20, gap: 0.5, delay: 1, path: 1 }, { enemy: 'dragon_young', count: 18, gap: 0.5, delay: 0, path: 2 }, { enemy: 'splitter', count: 16, gap: 0.6, delay: 2, path: 0 }], clearBonus: 580 },
    { spawns: [{ enemy: 'parasite_king', count: 1, gap: 0, delay: 0, path: 1 }, { enemy: 'dragon_young', count: 20, gap: 0.5, delay: 1, path: 2 }, { enemy: 'ghost_cultivator', count: 24, gap: 0.4, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 20, gap: 0.5, delay: 2, path: 1 }, { enemy: 'demon_knight', count: 16, gap: 0.6, delay: 3, path: 2 }], clearBonus: 800 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 章', title: '蛊 王 终 战',
      lines: [
        '天妖蛊王本体降临，吸灵召仆，愈战愈狂。',
        '万族命运，悬于此战——破蛊王，定百族！',
      ],
      btn: '诛 蛊 王',
    },
    outro: {
      chapter: '终 章', title: '百 族 大 战 终',
      lines: [
        '蛊王陨落，百族大战落幕，万族俯首。',
        '然而裂缝深处，更古老的气息正在苏醒——',
        '界域之战篇，天魔将醒……',
      ],
      btn: '续 界 域 篇',
    },
  },
};
