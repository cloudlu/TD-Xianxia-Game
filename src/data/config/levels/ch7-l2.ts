import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
const PATHS = [[{ x: 0, y: 2 }, { x: 15, y: 2 }], [{ x: 0, y: 5 }, { x: 15, y: 5 }]];
export const CH7_L2: LevelConfig = {
  id: 'ch7-l2', name: '蛮荒原野', startStones: 480, lives: 3, cols: 16, rows: 8,
  paths: PATHS, buildable: buildableFromPaths(16, 8, PATHS), hpMul: 1.7,
  waves: [
    { spawns: [{ enemy: 'barbarian', count: 5, gap: 2.5, delay: 0, path: 0 }, { enemy: 'sand_scorpion', count: 10, gap: 0.9, delay: 0, path: 1 }], clearBonus: 180 },
    { spawns: [{ enemy: 'shadow_fox', count: 8, gap: 1.2, delay: 0, path: 0 }, { enemy: 'mist_wraith', count: 8, gap: 1.2, delay: 1, path: 1 }], clearBonus: 200 },
    { spawns: [{ enemy: 'barbarian', count: 7, gap: 2, delay: 0, path: 0 }, { enemy: 'bat', count: 21, gap: 0.35, delay: 0, path: 1 }, { enemy: 'sand_scorpion', count: 10, gap: 0.7, delay: 1, path: 0 }], clearBonus: 230 },
  ],
  story: { intro: { chapter: '第 七 章', title: '蛮 荒 原 野', lines: ['蛮荒原野上，域外蛮修成群结队。', '隐身狐妖也混迹其中，须以聚灵阵照破。'], btn: '横 渡 蛮 荒' },
    outro: { chapter: '劫 后', title: '蛮 荒 已 渡', lines: ['蛮修退散，前方传来阵阵裂响——大地在裂开。'], btn: '继 续' } },
};
