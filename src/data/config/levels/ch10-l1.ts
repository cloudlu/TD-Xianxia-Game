import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
const P = [[{ x: 0, y: 2 }, { x: 15, y: 2 }], [{ x: 0, y: 5 }, { x: 15, y: 5 }]];
export const CH10_L1: LevelConfig = {
  id: 'ch10-l1', name: '主宰苏醒', startStones: 580, lives: 34, cols: 16, rows: 8,
  paths: P, buildable: buildableFromPaths(16, 8, P), hpMul: 2.0,
  waves: [
    { spawns: [{ enemy: 'sand_scorpion', count: 16, gap: 0.4, delay: 0, path: 0 }, { enemy: 'barbarian', count: 6, gap: 1.5, delay: 0, path: 1 }], clearBonus: 260 },
    { spawns: [{ enemy: 'mist_wraith', count: 12, gap: 0.7, delay: 0, path: 0 }, { enemy: 'shadow_fox', count: 10, gap: 0.8, delay: 0, path: 1 }, { enemy: 'bat', count: 16, gap: 0.3, delay: 1, path: 0 }], clearBonus: 290 },
    { spawns: [{ enemy: 'blood_cultist', count: 8, gap: 1.0, delay: 0, path: 0 }, { enemy: 'magic_puppet', count: 5, gap: 2, delay: 0, path: 1 }, { enemy: 'mist_wraith', count: 10, gap: 0.8, delay: 0, path: 0 }], clearBonus: 320 },
  ],
  story: { intro: { chapter: '第 十 章', title: '主 宰 苏 醒', lines: ['裂隙主宰从沉睡中苏醒，黑色裂隙扩张到了遮天蔽日。', '它的魔气催动了苍茫域所有异族，最后的战争开始了。'], btn: '迎 击 主 宰' },
    outro: { chapter: '劫 后', title: '先 锋 溃 散', lines: ['主宰的先锋军溃散，但它的本体仍未现身。'], btn: '继 续' } },
};
