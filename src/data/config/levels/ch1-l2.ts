import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 1 章 第 2 关 · 松林小径（L 形拐弯，教学"拐角布防 + 升级"）
// 路径：(0,0)→(4,0)→(4,3)→(9,3)→(9,7)→(15,7)
const PATHS = [[
  { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 },
  { x: 9, y: 3 }, { x: 9, y: 7 }, { x: 15, y: 7 },
]];

export const CH1_L2: LevelConfig = {
  id: 'ch1-l2', name: '松林小径',
  startStones: 280, lives: 3,
  cols: 16, rows: 8,
  maxTowerLevel: 3,   // 本关最高可升至 元婴
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.0,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 11, gap: 0.8, delay: 0 }], clearBonus: 60 },
    { spawns: [{ enemy: 'wolf', count: 11, gap: 0.6, delay: 0 }, { enemy: 'boar', count: 22, gap: 2.5, delay: 1 }], clearBonus: 75 },
    { spawns: [{ enemy: 'boar', count: 44, gap: 1.6, delay: 0 }, { enemy: 'wolf', count: 9, gap: 0.7, delay: 1 }], clearBonus: 85 },
    { spawns: [{ enemy: 'wolf', count: 13, gap: 0.5, delay: 0 }, { enemy: 'boar', count: 33, gap: 2, delay: 1 }], clearBonus: 100 },
  ],
  story: {
    intro: {
      chapter: '第 一 章', title: '松 林 小 径',
      lines: ['妖狼暂退，松林深处却传来阵阵低吼。', '此处地势曲折，正可借拐角布阵，以逸待劳。'],
      btn: '进 入 松 林',
    },
    outro: {
      chapter: '劫 后', title: '林 暗 草 惊 风',
      lines: ['林中妖兽尽散。', '前方关隘，便是山门最后一道防线。'],
      btn: '继 续',
    },
  },
};
