import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
const P = [[{ x: 0, y: 1 }, { x: 15, y: 1 }], [{ x: 0, y: 4 }, { x: 15, y: 4 }], [{ x: 0, y: 6 }, { x: 15, y: 6 }]];
export const CH10_L2: LevelConfig = {
  id: 'ch10-l2', name: '裂隙腹地', startStones: 600, lives: 34, cols: 16, rows: 8,
  paths: P, buildable: buildableFromPaths(16, 8, P), hpMul: 2.0,
  waves: [
    { spawns: [{ enemy: 'barbarian', count: 8, gap: 1.2, delay: 0, path: 0 }, { enemy: 'bat', count: 18, gap: 0.3, delay: 0, path: 1 }, { enemy: 'sand_scorpion', count: 12, gap: 0.4, delay: 0, path: 2 }], clearBonus: 280 },
    { spawns: [{ enemy: 'mist_wraith', count: 14, gap: 0.6, delay: 0, path: 0 }, { enemy: 'splitter', count: 10, gap: 0.8, delay: 0, path: 2 }, { enemy: 'shadow_fox', count: 10, gap: 0.8, delay: 1, path: 1 }], clearBonus: 310 },
    { spawns: [{ enemy: 'rift_lord', count: 1, gap: 1, delay: 0, path: 1 }, { enemy: 'blood_cultist', count: 10, gap: 0.8, delay: 0, path: 0 }, { enemy: 'barbarian', count: 8, gap: 1.2, delay: 1, path: 2 }], clearBonus: 340 },
  ],
  story: { intro: { chapter: '第 十 章', title: '裂 隙 腹 地', lines: ['深入裂隙腹地，空间扭曲，路径紊乱。', '裂隙领主拦路，必须突破才能直面主宰。'], btn: '突 破 腹 地' },
    outro: { chapter: '劫 后', title: '腹 地 突 破', lines: ['裂隙领主倒下，主宰的身影就在眼前。', '它有 10000 血量、300 护盾，还能不断召唤沙蝎——', '这是域外篇的终极考验。'], btn: '终 极 一 战' } },
};
