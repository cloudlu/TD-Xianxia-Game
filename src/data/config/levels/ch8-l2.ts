import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
const P = [[{ x: 0, y: 1 }, { x: 15, y: 1 }], [{ x: 0, y: 6 }, { x: 15, y: 6 }]];
export const CH8_L2: LevelConfig = {
  id: 'ch8-l2', name: '雾隐迷阵', startStones: 520, lives: 3, cols: 16, rows: 8,
  paths: P, buildable: buildableFromPaths(16, 8, P), hpMul: 1.8,
  waves: [
    { spawns: [{ enemy: 'shadow_fox', count: 10, gap: 1.0, delay: 0, path: 0 }, { enemy: 'mist_wraith', count: 8, gap: 1.2, delay: 0, path: 1 }], clearBonus: 210 },
    { spawns: [{ enemy: 'splitter', count: 10, gap: 1.0, delay: 0, path: 0 }, { enemy: 'barbarian', count: 5, gap: 2, delay: 1, path: 1 }], clearBonus: 230 },
    { spawns: [{ enemy: 'shadow_fox', count: 13, gap: 0.8, delay: 0, path: 0 }, { enemy: 'mist_wraith', count: 10, gap: 0.9, delay: 0, path: 1 }, { enemy: 'bat', count: 18, gap: 0.35, delay: 1, path: 0 }], clearBonus: 260 },
  ],
  story: { intro: { chapter: '第 八 章', title: '雾 隐 迷 阵', lines: ['域外雾气化为天然迷阵，隐身狐妖与雾妖联手。', '聚灵阵与范围塔缺一不可。'], btn: '破 阵 而 出' },
    outro: { chapter: '劫 后', title: '迷 阵 已 破', lines: ['迷阵破开，前方豁然开朗——裂隙的源头就在眼前。'], btn: '继 续' } },
};
