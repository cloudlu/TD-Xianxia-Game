import type { LevelConfig } from '../../../types';
import { CHAPTER_MAPS } from '../chapterMaps';
import { buildableFromPaths } from './buildable';

const MAP = CHAPTER_MAPS['ch1'];

// 第 1 章 第 3 关 · 山门关隘（三路围攻：path[0]+path[1]+path[2]，章末 BOSS 战）
export const CH1_L3: LevelConfig = {
  id: 'ch1-l3', name: '山门关隘',
  startStones: 400, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  maxTowerLevel: 4,
  paths: MAP.paths,
  buildable: buildableFromPaths(MAP.cols, MAP.rows, MAP.paths, MAP.blocked),
  base: MAP.base,
  blocked: MAP.blocked,
  backgroundId: MAP.backgroundId,
  activePaths: [0, 1, 2],
  hpMul: 1.0,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 13, gap: 0.7, delay: 0, path: 0 }], clearBonus: 70 },
    { spawns: [{ enemy: 'wolf', count: 11, gap: 0.6, delay: 0, path: 0 }, { enemy: 'boar', count: 33, gap: 2, delay: 1, path: 1 }], clearBonus: 85 },
    { spawns: [{ enemy: 'boar', count: 6, gap: 1.4, delay: 0, path: 1 }, { enemy: 'wolf', count: 11, gap: 0.6, delay: 1, path: 2 }], clearBonus: 100 },
    { spawns: [{ enemy: 'boar', count: 44, gap: 1.6, delay: 0, path: 0 }, { enemy: 'wolf', count: 13, gap: 0.5, delay: 1, path: 1 }, { enemy: 'boar_king', count: 11, gap: 1, delay: 4, path: 2 }], clearBonus: 150 },
  ],
  story: {
    intro: {
      chapter: '第 一 章', title: '山 门 关 隘',
      lines: [
        '三路同时来犯！北崖、西北、西南——',
        '山猪王亲率主力从北崖直扑而下。',
        '你的塔必须同时覆盖三个方向，否则宗门危矣。',
        '记住：岩石障碍会压缩你的布阵空间，精打细算每一格。',
      ],
      btn: '三 面 迎 敌',
    },
    outro: {
      chapter: '第 一 章', title: '晨 光 洒 落',
      lines: [
        '山猪王倒下，群妖溃散。',
        '晨光洒落宗门大殿，你长舒一口气。',
        '却见远方天际一道血色冲天——',
        '那不是妖狼……那是更可怕的东西，正在苏醒。',
      ],
      btn: '返 回 选 关',
    },
  },
};
