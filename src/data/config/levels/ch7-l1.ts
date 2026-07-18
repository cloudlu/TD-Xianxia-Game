import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
const PATHS = [[{ x: 0, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 6 }, { x: 15, y: 6 }]];
export const CH7_L1: LevelConfig = {
  id: 'ch7-l1', name: '风沙峡谷', startStones: 460, lives: 3, cols: 16, rows: 8,
  paths: PATHS, buildable: buildableFromPaths(16, 8, PATHS), hpMul: 1.7,
  waves: [
    { spawns: [{ enemy: 'sand_scorpion', count: 13, gap: 0.9, delay: 0 }, { enemy: 'wolf', count: 16, gap: 0.5, delay: 1 }], clearBonus: 160 },
    { spawns: [{ enemy: 'mist_wraith', count: 8, gap: 1.2, delay: 0 }, { enemy: 'bat', count: 16, gap: 0.4, delay: 0 }], clearBonus: 180 },
    { spawns: [{ enemy: 'barbarian', count: 5, gap: 2, delay: 0 }, { enemy: 'sand_scorpion', count: 16, gap: 0.6, delay: 0 }, { enemy: 'mist_wraith', count: 5, gap: 1.6, delay: 1 }], clearBonus: 210 },
  ],
  story: { intro: { chapter: '第 七 章', title: '风 沙 峡 谷', lines: ['深入苍茫域，风沙峡谷中裂缝的气息越来越浓。', '域外异族在此盘踞，更有飞行妖兽盘旋上空。'], btn: '穿 越 峡 谷' },
    outro: { chapter: '劫 后', title: '峡 谷 通 行', lines: ['峡谷已通，前方是一片蛮荒之地。'], btn: '继 续' } },
};
