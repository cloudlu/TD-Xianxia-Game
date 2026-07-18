import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
const P = [[{ x: 0, y: 1 }, { x: 15, y: 1 }], [{ x: 0, y: 4 }, { x: 15, y: 4 }], [{ x: 0, y: 6 }, { x: 15, y: 6 }]];
export const CH8_L3: LevelConfig = {
  id: 'ch8-l3', name: '域外战场', startStones: 540, lives: 3, cols: 16, rows: 8,
  paths: P, buildable: buildableFromPaths(16, 8, P), hpMul: 1.8,
  waves: [
    { spawns: [{ enemy: 'barbarian', count: 5, gap: 2, delay: 0, path: 0 }, { enemy: 'sand_scorpion', count: 10, gap: 0.7, delay: 0, path: 1 }, { enemy: 'bat', count: 16, gap: 0.4, delay: 1, path: 2 }], clearBonus: 220 },
    { spawns: [{ enemy: 'mist_wraith', count: 10, gap: 0.9, delay: 0, path: 0 }, { enemy: 'shadow_fox', count: 10, gap: 0.9, delay: 0, path: 2 }, { enemy: 'blood_cultist', count: 7, gap: 1.4, delay: 1, path: 1 }], clearBonus: 250 },
    { spawns: [{ enemy: 'mage_lord', count: 11, gap: 1, delay: 2, path: 1 }, { enemy: 'barbarian', count: 7, gap: 1.8, delay: 0, path: 0 }, { enemy: 'mist_wraith', count: 10, gap: 0.9, delay: 0, path: 2 }, { enemy: 'sand_scorpion', count: 13, gap: 0.5, delay: 1, path: 0 }], clearBonus: 300 },
  ],
  story: { intro: { chapter: '第 八 章', title: '域 外 战 场', lines: ['域外各族集结，魔修统领也率军来犯。', '三路齐攻，这是域外篇最惨烈一战。'], btn: '决 战 域 外' },
    outro: { chapter: '第 八 章', title: '战 场 清 平', lines: ['域外敌军溃散，你终于看到了裂缝的真正源头。', '一个巨大的黑色裂隙悬浮在空中，裂隙主宰正在其中沉睡。'], btn: '继 续' } },
};
