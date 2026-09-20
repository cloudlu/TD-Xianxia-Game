import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { LANE_MAPS } from '../laneMaps';

// 第 20 章 第 2 关 · 天妖近卫【异变·车道防守】四道（12 行大图）
const MAP = LANE_MAPS['ch20-l2'];

export const CH20_L2: LevelConfig = {
  id: 'ch20-l2', name: '天妖近卫·异变',
  startStones: 900, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  mode: 'lane',
  lane: MAP.lane,
  paths: MAP.paths,
  base: MAP.base,
  buildable: buildableFromPaths(MAP.cols, MAP.rows, MAP.paths),
  hpMul: 3.0,
  activePaths: MAP.laneRows.map((_, i) => i),
  waves: [
    { spawns: [{ enemy: 'dragon_young', count: 22, gap: 0.6, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 25, gap: 0.5, delay: 1, path: 1 }, { enemy: 'demon_knight', count: 20, gap: 0.7, delay: 0, path: 2 }, { enemy: 'splitter', count: 14, gap: 0.9, delay: 1, path: 3 }], clearBonus: 500 },
    { spawns: [{ enemy: 'shadow_assassin', count: 25, gap: 0.5, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 25, gap: 0.5, delay: 1, path: 1 }, { enemy: 'splitter', count: 22, gap: 0.6, delay: 0, path: 2 }, { enemy: 'demon_knight', count: 12, gap: 1.1, delay: 2, path: 3 }], clearBonus: 540 },
    { spawns: [{ enemy: 'dragon_young', count: 28, gap: 0.5, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 31, gap: 0.4, delay: 1, path: 1 }, { enemy: 'demon_serpent', count: 17, gap: 1.0, delay: 0, path: 2 }, { enemy: 'magic_puppet', count: 20, gap: 0.7, delay: 2, path: 3 }], clearBonus: 600 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 章', title: '近 卫 直 撞',
      lines: [
        '天妖近卫舍弃迂回，四道直线撞阵——蛊王催战，近卫疯狂！',
        '横扫符每道一枚，灵晶随波天降，守住五道纵深。',
        '近卫一破，蛊王便再无遮掩。',
      ],
      btn: '破 近 卫',
    },
    outro: {
      chapter: '劫 后', title: '近 卫 已 散',
      lines: ['近卫已散，蛊王咆哮震天而起。'],
      btn: '继 续',
    },
  },
};
