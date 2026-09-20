import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { LANE_MAPS } from '../laneMaps';

// 第 25 章 第 2 关 · 天劫之威【异变·车道防守】五道雷浪（终章异变，最大压迫）
const MAP = LANE_MAPS['ch25-l2'];

export const CH25_L2: LevelConfig = {
  id: 'ch25-l2', name: '天劫之威·异变',
  startStones: 1000, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  mode: 'lane',
  lane: MAP.lane,
  paths: MAP.paths,
  base: MAP.base,
  buildable: buildableFromPaths(MAP.cols, MAP.rows, MAP.paths),
  hpMul: 3.5,
  activePaths: MAP.laneRows.map((_, i) => i),
  waves: [
    { spawns: [{ enemy: 'celestial_demon', count: 25, gap: 0.7, delay: 0, path: 0 }, { enemy: 'void_walker', count: 31, gap: 0.4, delay: 0, path: 1 }, { enemy: 'chaos_larva', count: 20, gap: 0.6, delay: 1, path: 2 }, { enemy: 'ghost_cultivator', count: 10, gap: 1.0, delay: 2, path: 3 }, { enemy: 'celestial_demon', count: 12, gap: 0.9, delay: 1, path: 4 }], clearBonus: 560 },
    { spawns: [{ enemy: 'chaos_larva', count: 34, gap: 0.4, delay: 0, path: 2 }, { enemy: 'celestial_demon', count: 22, gap: 0.7, delay: 1, path: 0 }, { enemy: 'void_walker', count: 18, gap: 0.5, delay: 0, path: 4 }, { enemy: 'ghost_cultivator', count: 12, gap: 1.0, delay: 1, path: 1 }], clearBonus: 590 },
    { spawns: [{ enemy: 'void_walker', count: 36, gap: 0.3, delay: 0, path: 1 }, { enemy: 'celestial_demon', count: 28, gap: 0.6, delay: 0, path: 2 }, { enemy: 'ghost_cultivator', count: 14, gap: 0.9, delay: 1, path: 0 }, { enemy: 'chaos_larva', count: 16, gap: 0.7, delay: 1, path: 3 }, { enemy: 'void_walker', count: 14, gap: 0.6, delay: 2, path: 4 }], clearBonus: 620 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 五 章', title: '雷 浪 五 道',
      lines: [
        '天劫紫雷撕碎地形，化作五道笔直雷浪碾压而来——',
        '这是异变之最：五道齐压，横扫符每道仅一枚。',
        '联盟弟子前赴后继，用生命为太上长老争取布阵的时间。',
        '这一战，已无人能置身事外。',
      ],
      btn: '以 命 抗 劫',
    },
    outro: {
      chapter: '天 威', title: '化 身 将 临',
      lines: ['紫雷终于渐歇，但化身已凝聚成型。', '最后的决战，就在眼前。'],
      btn: '继 续',
    },
  },
};
