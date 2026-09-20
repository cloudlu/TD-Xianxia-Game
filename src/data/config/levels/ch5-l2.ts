import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { LANE_MAPS } from '../laneMaps';

// 第 5 章 第 2 关 · 九幽血池【异变·车道防守】
// 妖潮受血池异变影响化作直线血浪，从右侧三道压入；守左端宗门。
// 新机制：每道一枚"横扫符"（漏怪自动清道，一次性）+ 波内灵晶拾取。
const MAP = LANE_MAPS['ch5-l2'];

export const CH5_L2: LevelConfig = {
  id: 'ch5-l2', name: '九幽血池·异变',
  startStones: 520, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  mode: 'lane',
  lane: MAP.lane,
  paths: MAP.paths,
  base: MAP.base,
  buildable: buildableFromPaths(MAP.cols, MAP.rows, MAP.paths),
  hpMul: 1.5,
  maxTowerLevel: 6,
  activePaths: MAP.laneRows.map((_, i) => i),
  waves: [
    { spawns: [
      { enemy: 'blood_cultist', count: 7, gap: 1.1, delay: 0, path: 0 },
      { enemy: 'magic_puppet', count: 4, gap: 2.5, delay: 0, path: 1 },
      { enemy: 'shadow_fox', count: 7, gap: 1, delay: 1, path: 2 },
    ], clearBonus: 190 },
    { spawns: [
      { enemy: 'magic_minion', count: 10, gap: 0.9, delay: 0, path: 0 },
      { enemy: 'splitter', count: 10, gap: 1, delay: 0, path: 1 },
      { enemy: 'bat', count: 17, gap: 0.35, delay: 1, path: 2 },
    ], clearBonus: 220 },
    { spawns: [
      { enemy: 'mage_lord', count: 11, gap: 1, delay: 2, path: 1 },
      { enemy: 'blood_cultist', count: 7, gap: 1, delay: 0, path: 0 },
      { enemy: 'magic_puppet', count: 4, gap: 2.5, delay: 1, path: 2 },
    ], clearBonus: 250 },
    { spawns: [
      { enemy: 'shadow_fox', count: 10, gap: 1, delay: 0, path: 0 },
      { enemy: 'splitter', count: 12, gap: 0.9, delay: 0, path: 1 },
      { enemy: 'bull', count: 11, gap: 1, delay: 2, path: 2 },
    ], clearBonus: 270 },
    { spawns: [
      { enemy: 'blood_cultist', count: 10, gap: 0.9, delay: 0, path: 0 },
      { enemy: 'magic_puppet', count: 5, gap: 2, delay: 0, path: 1 },
      { enemy: 'shadow_fox', count: 12, gap: 0.9, delay: 1, path: 2 },
      { enemy: 'mage_lord', count: 11, gap: 1, delay: 3, path: 1 },
    ], clearBonus: 300 },
  ],
  story: {
    intro: {
      chapter: '第 五 章', title: '血 浪 压 境',
      lines: [
        '九幽血池异变陡生！血气化作笔直血浪，只从右侧三道压来。',
        '宗门阵图早已推演：此种阵势，每道可布一枚"横扫符"——',
        '妖物踏过符线，符箓自燃，横扫全道（每道仅一次，慎用！）。',
        '波内天降灵晶，点击可拾取，作布阵之资。',
      ],
      btn: '血 浪 决 战',
    },
    outro: {
      chapter: '劫 后', title: '血 池 干 涸',
      lines: ['血浪退去，血池干涸，魔气稍歇。', '登天阶上，魔尊血煞正等你来。'],
      btn: '登 阶 决 战',
    },
  },
};
