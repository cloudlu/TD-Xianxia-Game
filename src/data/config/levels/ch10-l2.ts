import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { LANE_MAPS } from '../laneMaps';

// 第 10 章 第 2 关 · 裂隙腹地【异变·车道防守】四道血浪压境
const MAP = LANE_MAPS['ch10-l2'];

export const CH10_L2: LevelConfig = {
  id: 'ch10-l2', name: '裂隙腹地·异变', startStones: 600, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  mode: 'lane',
  lane: MAP.lane,
  paths: MAP.paths,
  base: MAP.base,
  buildable: buildableFromPaths(MAP.cols, MAP.rows, MAP.paths),
  hpMul: 2.0,
  activePaths: MAP.laneRows.map((_, i) => i),
  waves: [
    { spawns: [{ enemy: 'barbarian', count: 10, gap: 1.2, delay: 0, path: 0 }, { enemy: 'bat', count: 23, gap: 0.3, delay: 0, path: 1 }, { enemy: 'sand_scorpion', count: 16, gap: 0.4, delay: 0, path: 2 }, { enemy: 'mist_wraith', count: 12, gap: 0.7, delay: 1, path: 3 }], clearBonus: 280 },
    { spawns: [{ enemy: 'mist_wraith', count: 18, gap: 0.6, delay: 0, path: 0 }, { enemy: 'splitter', count: 13, gap: 0.8, delay: 0, path: 2 }, { enemy: 'shadow_fox', count: 13, gap: 0.8, delay: 1, path: 1 }, { enemy: 'barbarian', count: 8, gap: 1.4, delay: 2, path: 3 }], clearBonus: 310 },
    { spawns: [{ enemy: 'rift_lord', count: 11, gap: 1, delay: 0, path: 1 }, { enemy: 'blood_cultist', count: 13, gap: 0.8, delay: 0, path: 0 }, { enemy: 'barbarian', count: 10, gap: 1.2, delay: 1, path: 2 }, { enemy: 'sand_scorpion', count: 14, gap: 0.5, delay: 0, path: 3 }], clearBonus: 340 },
  ],
  story: {
    intro: {
      chapter: '第 十 章', title: '裂 隙 直 入',
      lines: [
        '裂隙腹地空间坍缩，四道裂隙直线贯通——妖潮不再迂回！',
        '每道一枚横扫符，踏线自燃、横扫全道，仅有一次。',
        '灵晶续落，点击拾取。四道齐守，切勿漏空。',
      ],
      btn: '突 破 腹 地',
    },
    outro: {
      chapter: '劫 后', title: '腹 地 突 破',
      lines: ['裂隙领主倒下，主宰的身影就在眼前。', '它有 10000 血量、300 护盾，还能不断召唤沙蝎——', '这是域外篇的终极考验。'],
      btn: '终 极 一 战',
    },
  },
};
