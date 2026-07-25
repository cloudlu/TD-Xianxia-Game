import type { LevelConfig } from '../../../types';
import { CHAPTER_MAPS } from '../chapterMaps';
import { buildableFromPaths } from './buildable';

const MAP = CHAPTER_MAPS['ch1'];

// 第 1 章 第 1 关 · 前山门（单路教学，只用 path[0] 左上入口）
export const CH1_L1: LevelConfig = {
  id: 'ch1-l1', name: '前山门',
  startStones: 300, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  maxTowerLevel: 2,
  paths: MAP.paths,
  buildable: buildableFromPaths(MAP.cols, MAP.rows, MAP.paths, MAP.blocked),
  base: MAP.base,
  blocked: MAP.blocked,
  backgroundId: MAP.backgroundId,
  activePaths: [0],
  hpMul: 1.0,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 9, gap: 0.8, delay: 0, path: 0 }], clearBonus: 50 },
    { spawns: [{ enemy: 'wolf', count: 11, gap: 0.6, delay: 1, path: 0 }], clearBonus: 60 },
    { spawns: [{ enemy: 'boar', count: 33, gap: 1.8, delay: 1, path: 0 }], clearBonus: 70 },
    { spawns: [{ enemy: 'wolf', count: 11, gap: 0.5, delay: 0, path: 0 }, { enemy: 'boar', count: 22, gap: 2.5, delay: 1, path: 0 }], clearBonus: 90 },
  ],
  story: {
    intro: {
      chapter: '第 一 章', title: '山 门 初 劫',
      lines: [
        '千年封印松动，妖狼从西北山道涌来。',
        '宗门大殿在月下泛着金光——',
        '那是你此生要守护的地方。',
        '山道曲折，还有巨石挡路，务必利用有利地形布阵。',
      ],
      btn: '领 命 布 阵',
    },
    outro: {
      chapter: '劫 后', title: '首 战 告 捷',
      lines: ['狼潮暂退，但西南林间又起骚动。', '那里似乎还有一条隐蔽的山路……'],
      btn: '继 续',
    },
  },
};
