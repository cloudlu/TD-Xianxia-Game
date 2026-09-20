import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { LANE_MAPS } from '../laneMaps';

// 第 15 章 第 2 关 · 魔帅近卫【异变·车道防守】四道冲锋
const MAP = LANE_MAPS['ch15-l2'];

export const CH15_L2: LevelConfig = {
  id: 'ch15-l2', name: '魔帅近卫·异变',
  startStones: 800, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  mode: 'lane',
  lane: MAP.lane,
  paths: MAP.paths,
  base: MAP.base,
  buildable: buildableFromPaths(MAP.cols, MAP.rows, MAP.paths),
  hpMul: 2.5,
  activePaths: MAP.laneRows.map((_, i) => i),
  waves: [
    { spawns: [{ enemy: 'demon_knight', count: 18, gap: 0.8, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 18, gap: 0.6, delay: 1, path: 1 }, { enemy: 'wolf', count: 29, gap: 0.3, delay: 0, path: 2 }, { enemy: 'demon_serpent', count: 11, gap: 1.1, delay: 1, path: 3 }], clearBonus: 460 },
    { spawns: [{ enemy: 'demon_serpent', count: 16, gap: 1.0, delay: 0, path: 0 }, { enemy: 'blood_cultist', count: 16, gap: 0.8, delay: 1, path: 1 }, { enemy: 'magic_puppet', count: 16, gap: 0.8, delay: 0, path: 2 }, { enemy: 'wolf', count: 22, gap: 0.35, delay: 0, path: 3 }], clearBonus: 500 },
    { spawns: [{ enemy: 'demon_knight', count: 21, gap: 0.8, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 21, gap: 0.6, delay: 1, path: 1 }, { enemy: 'demon_serpent', count: 13, gap: 1.2, delay: 0, path: 2 }, { enemy: 'magic_puppet', count: 8, gap: 1.6, delay: 2, path: 3 }], clearBonus: 560 },
  ],
  story: {
    intro: {
      chapter: '第 十 五 章', title: '近 卫 冲 锋',
      lines: [
        '魔帅近卫弃阵型于不顾，四道直线冲锋——魔域精锐，有进无退！',
        '横扫符每道一枚，灵晶随波天降。',
        '破近卫者，方可直面魔帅。',
      ],
      btn: '鏖 战',
    },
    outro: {
      chapter: '战 报', title: '近 卫 尽 灭',
      lines: ['近卫尽数伏诛。', '魔帅立于巢穴深处，怒视群雄。'],
      btn: '终 局',
    },
  },
};
