import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
const P = [[{ x: 0, y: 2 }, { x: 15, y: 2 }], [{ x: 0, y: 5 }, { x: 15, y: 5 }]];
export const CH9_L1: LevelConfig = {
  id: 'ch9-l1', name: '源初荒漠', startStones: 540, lives: 3, cols: 16, rows: 8,
  paths: P, buildable: buildableFromPaths(16, 8, P), hpMul: 1.9,
  waves: [
    { spawns: [{ enemy: 'sand_scorpion', count: 18, gap: 0.5, delay: 0, path: 0 }, { enemy: 'barbarian', count: 7, gap: 1.8, delay: 0, path: 1 }], clearBonus: 220 },
    { spawns: [{ enemy: 'mist_wraith', count: 13, gap: 0.8, delay: 0, path: 0 }, { enemy: 'shadow_fox', count: 13, gap: 0.8, delay: 0, path: 1 }], clearBonus: 250 },
    { spawns: [{ enemy: 'blood_cultist', count: 10, gap: 1.0, delay: 0, path: 0 }, { enemy: 'magic_puppet', count: 5, gap: 2.5, delay: 0, path: 1 }, { enemy: 'mist_wraith', count: 10, gap: 0.9, delay: 1, path: 0 }], clearBonus: 280 },
  ],
  story: { intro: { chapter: '第 九 章', title: '源 初 荒 漠', lines: ['裂缝源头所在的荒漠，空气中弥漫着令人窒息的魔气。', '所有域外异族都在向这里聚集——它们被某种意志驱使。'], btn: '踏 入 源 头' },
    outro: { chapter: '劫 后', title: '荒 漠 突 围', lines: ['荒漠敌潮暂退，但黑色裂隙的光芒越来越刺眼。'], btn: '继 续' } },
};
