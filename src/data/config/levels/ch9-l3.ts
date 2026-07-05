import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
const P = [[{ x: 0, y: 1 }, { x: 15, y: 1 }], [{ x: 0, y: 4 }, { x: 15, y: 4 }], [{ x: 0, y: 6 }, { x: 15, y: 6 }]];
export const CH9_L3: LevelConfig = {
  id: 'ch9-l3', name: '决战前夕', startStones: 580, lives: 34, cols: 16, rows: 8,
  paths: P, buildable: buildableFromPaths(16, 8, P), hpMul: 1.9,
  waves: [
    { spawns: [{ enemy: 'sand_scorpion', count: 12, gap: 0.5, delay: 0, path: 0 }, { enemy: 'shadow_fox', count: 8, gap: 0.9, delay: 0, path: 1 }, { enemy: 'bat', count: 14, gap: 0.35, delay: 1, path: 2 }], clearBonus: 250 },
    { spawns: [{ enemy: 'mist_wraith', count: 12, gap: 0.7, delay: 0, path: 0 }, { enemy: 'barbarian', count: 6, gap: 1.5, delay: 0, path: 2 }, { enemy: 'blood_cultist', count: 8, gap: 1.0, delay: 0, path: 1 }], clearBonus: 280 },
    { spawns: [{ enemy: 'magic_puppet', count: 5, gap: 2, delay: 0, path: 1 }, { enemy: 'mist_wraith', count: 12, gap: 0.7, delay: 0, path: 0 }, { enemy: 'barbarian', count: 6, gap: 1.5, delay: 1, path: 2 }, { enemy: 'sand_scorpion', count: 12, gap: 0.4, delay: 0, path: 0 }], clearBonus: 320 },
  ],
  story: { intro: { chapter: '第 九 章', title: '决 战 前 夕', lines: ['裂隙主宰即将完全苏醒，这是最后的准备时间。', '域外所有残存异族发起了最后的疯狂冲锋。', '守住这一波，便是决战。'], btn: '坚 守 到 底' },
    outro: { chapter: '第 九 章', title: '夜 尽 天 明', lines: ['最后的冲锋被击退。', '你抬头望向黑色裂隙——裂隙主宰的双眼已经睁开。'], btn: '决 战' } },
};
