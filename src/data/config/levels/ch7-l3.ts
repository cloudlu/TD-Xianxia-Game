import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
const PATHS = [[{ x: 0, y: 1 }, { x: 8, y: 1 }, { x: 8, y: 6 }, { x: 15, y: 6 }], [{ x: 0, y: 6 }, { x: 8, y: 6 }, { x: 8, y: 1 }, { x: 15, y: 1 }]];
export const CH7_L3: LevelConfig = {
  id: 'ch7-l3', name: '裂隙交汇', startStones: 500, lives: 3, cols: 16, rows: 8,
  paths: PATHS, buildable: buildableFromPaths(16, 8, PATHS), hpMul: 1.7,
  waves: [
    { spawns: [{ enemy: 'mist_wraith', count: 8, gap: 1.2, delay: 0, path: 0 }, { enemy: 'sand_scorpion', count: 13, gap: 0.6, delay: 0, path: 1 }], clearBonus: 200 },
    { spawns: [{ enemy: 'barbarian', count: 7, gap: 1.8, delay: 0, path: 0 }, { enemy: 'shadow_fox', count: 10, gap: 1, delay: 0, path: 1 }, { enemy: 'bat', count: 16, gap: 0.4, delay: 1, path: 0 }], clearBonus: 230 },
    { spawns: [{ enemy: 'rift_lord', count: 11, gap: 1, delay: 2, path: 0 }, { enemy: 'sand_scorpion', count: 13, gap: 0.6, delay: 0, path: 1 }, { enemy: 'mist_wraith', count: 8, gap: 1.2, delay: 1, path: 0 }], clearBonus: 280 },
  ],
  story: { intro: { chapter: '第 七 章', title: '裂 隙 交 汇', lines: ['两条裂缝在此交汇，裂隙领主再次现身。', '这一次，它的沙蝎群更加凶猛。'], btn: '封 印 交 汇' },
    outro: { chapter: '第 七 章', title: '交 汇 封 印', lines: ['交汇处的裂缝被封，但你知道——源头还在更深处。', '苍茫域的尽头，一个更庞大的存在正在苏醒。'], btn: '继 续' } },
};
