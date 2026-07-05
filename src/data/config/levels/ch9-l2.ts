import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
const P = [[{ x: 0, y: 1 }, { x: 15, y: 1 }], [{ x: 0, y: 4 }, { x: 15, y: 4 }], [{ x: 0, y: 6 }, { x: 15, y: 6 }]];
export const CH9_L2: LevelConfig = {
  id: 'ch9-l2', name: '裂隙边缘', startStones: 560, lives: 32, cols: 16, rows: 8,
  paths: P, buildable: buildableFromPaths(16, 8, P), hpMul: 1.9,
  waves: [
    { spawns: [{ enemy: 'barbarian', count: 6, gap: 1.5, delay: 0, path: 0 }, { enemy: 'bat', count: 16, gap: 0.3, delay: 0, path: 1 }, { enemy: 'sand_scorpion', count: 10, gap: 0.5, delay: 0, path: 2 }], clearBonus: 240 },
    { spawns: [{ enemy: 'mist_wraith', count: 10, gap: 0.8, delay: 0, path: 0 }, { enemy: 'shadow_fox', count: 10, gap: 0.8, delay: 0, path: 2 }, { enemy: 'splitter', count: 8, gap: 1, delay: 1, path: 1 }], clearBonus: 270 },
    { spawns: [{ enemy: 'rift_lord', count: 1, gap: 1, delay: 2, path: 1 }, { enemy: 'barbarian', count: 6, gap: 1.5, delay: 0, path: 0 }, { enemy: 'mist_wraith', count: 10, gap: 0.8, delay: 0, path: 2 }], clearBonus: 300 },
  ],
  story: { intro: { chapter: '第 九 章', title: '裂 隙 边 缘', lines: ['站在裂隙边缘，你能感受到其中蕴含的毁灭性力量。', '裂隙领主不断涌出，它们只是主宰的先锋。'], btn: '据 守 边 缘' },
    outro: { chapter: '劫 后', title: '先 锋 歼 灭', lines: ['先锋被歼灭，但裂隙主宰即将苏醒。', '决战，就在下一刻。'], btn: '继 续' } },
};
