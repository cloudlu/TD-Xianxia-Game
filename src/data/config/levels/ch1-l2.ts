import type { LevelConfig } from '../../../types';
import { CHAPTER_MAPS } from '../chapterMaps';
import { buildableFromPaths } from './buildable';

const MAP = CHAPTER_MAPS['ch1'];

// 第 1 章 第 2 关 · 松林小径（双路：path[0]+path[1]，新入口出现）
export const CH1_L2: LevelConfig = {
  id: 'ch1-l2', name: '松林小径',
  startStones: 350, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  maxTowerLevel: 3,
  paths: MAP.paths,
  buildable: buildableFromPaths(MAP.cols, MAP.rows, MAP.paths, MAP.blocked),
  base: MAP.base,
  blocked: MAP.blocked,
  backgroundId: MAP.backgroundId,
  activePaths: [0, 1],
  hpMul: 1.0,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 11, gap: 0.8, delay: 0, path: 0 }], clearBonus: 60 },
    { spawns: [{ enemy: 'wolf', count: 11, gap: 0.6, delay: 0, path: 0 }, { enemy: 'boar', count: 22, gap: 2.5, delay: 1, path: 1 }], clearBonus: 75 },
    { spawns: [{ enemy: 'boar', count: 44, gap: 1.6, delay: 0, path: 0 }, { enemy: 'wolf', count: 9, gap: 0.7, delay: 1, path: 1 }], clearBonus: 85 },
    { spawns: [{ enemy: 'wolf', count: 13, gap: 0.5, delay: 0, path: 0 }, { enemy: 'boar', count: 33, gap: 2, delay: 1, path: 1 }], clearBonus: 100 },
  ],
  story: {
    intro: {
      chapter: '第 一 章', title: '松 林 小 径',
      lines: [
        '不出你所料，西南林间果然藏着一条隐蔽山路。',
        '妖狼分兵两路，从西北和西南同时逼近宗门！',
        '好在两路在汇合口前有一段公共区域——',
        '若在那里布下长枪修士，可一次横扫两路之敌。',
      ],
      btn: '分 兵 阻 击',
    },
    outro: {
      chapter: '劫 后', title: '双 路 皆 破',
      lines: ['两条来路都已肃清。', '但前方探子急报——北面崖壁上，似乎还有第三条路！'],
      btn: '继 续',
    },
  },
};
