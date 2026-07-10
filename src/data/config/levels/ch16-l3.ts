import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 16 章 第 3 关 · 百族混战（三路径，all new + old mixed）
const PATHS = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH16_L3: LevelConfig = {
  id: 'ch16-l3', name: '百族混战',
  startStones: 740, lives: 38,
  cols: 16, rows: 8,
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 2.6,
  waves: [
    { spawns: [{ enemy: 'dragon_young', count: 8, gap: 1.0, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 8, gap: 1.0, delay: 1, path: 1 }, { enemy: 'demon_knight', count: 8, gap: 1.0, delay: 0, path: 2 }], clearBonus: 360 },
    { spawns: [{ enemy: 'shadow_assassin', count: 12, gap: 0.7, delay: 0, path: 0 }, { enemy: 'dragon_young', count: 10, gap: 0.9, delay: 1, path: 1 }, { enemy: 'blood_cultist', count: 10, gap: 0.9, delay: 0, path: 2 }], clearBonus: 400 },
    { spawns: [{ enemy: 'ghost_cultivator', count: 12, gap: 0.8, delay: 0, path: 0 }, { enemy: 'demon_knight', count: 12, gap: 0.8, delay: 1, path: 1 }, { enemy: 'dragon_young', count: 12, gap: 0.8, delay: 0, path: 2 }, { enemy: 'demon_serpent', count: 8, gap: 1.2, delay: 2, path: 0 }], clearBonus: 460 },
  ],
  story: {
    intro: {
      chapter: '第 十 六 章', title: '百 族 混 战',
      lines: [
        '百族联军齐至，龙、鬼、魔三方夹击。',
        '此战之后，万族将知我宗之名。',
      ],
      btn: '迎 战 百 族',
    },
    outro: {
      chapter: '劫 后', title: '百 族 暂 退',
      lines: ['百族暂退，古战场深处更有远古怨灵蠢动。'],
      btn: '继 续',
    },
  },
};
