import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { STREAM_MAPS, noBuildable, pureHeroStreamConfig } from '../streamMaps';

// 第 7 章 第 2 关 · 蛮荒原野【异变·夜袭】御剑守城：全屏随机列 + 妖风 + 纯英雄横向守城
// v0.97：彻底无塔；鼠标横向移动主角（自带本命飞剑），走位拾取塔符叠加塔能力
const MAP = STREAM_MAPS['ch7-l2'];

export const CH7_L2: LevelConfig = {
  id: 'ch7-l2', name: '蛮荒原野·夜袭',
  startStones: 480, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  mode: 'stream',
  stream: pureHeroStreamConfig(MAP.stream),
  paths: MAP.paths,
  base: MAP.base,
  buildable: noBuildable(MAP.cols, MAP.rows),
  hpMul: 2.6,
  activePaths: MAP.paths.map((_, i) => i),
  waves: [
    { spawns: [{ enemy: 'barbarian', count: 8, gap: 2.5, delay: 0, path: 0 }, { enemy: 'sand_scorpion', count: 15, gap: 0.9, delay: 0, path: 1 }], clearBonus: 180 },
    { spawns: [{ enemy: 'shadow_fox', count: 12, gap: 1.2, delay: 0, path: 0 }, { enemy: 'mist_wraith', count: 12, gap: 1.2, delay: 0, path: 1 }, { enemy: 'sand_scorpion', count: 9, gap: 1.0, delay: 1, path: 2 }], clearBonus: 200 },
    { spawns: [{ enemy: 'barbarian', count: 11, gap: 2, delay: 0, path: 0 }, { enemy: 'bat', count: 32, gap: 0.35, delay: 0, path: 1 }, { enemy: 'sand_scorpion', count: 15, gap: 0.7, delay: 1, path: 2 }], clearBonus: 230 },
  ],
  story: {
    intro: {
      chapter: '第 七 章', title: '夜 袭 蛮 荒',
      lines: [
        '蛮荒异变！蛮修不再循道而行，从北方全境压下——夜袭开始了。',
        '此阵无波间喘息：一波方退，一波又至；妖潮落点无常，防不胜防。',
        '城墙之下，御剑真人身负宗门本命飞剑独挑大梁——随剑者，不离寸步！',
        '移动鼠标让真人在城头横移，走位拾取塔符（飞剑/符箓/长枪/火法/雷法/寒冰），点击敌人集火！',
      ],
      btn: '迎 击 夜 袭',
    },
    outro: {
      chapter: '劫 后', title: '蛮 荒 已 渡',
      lines: ['蛮修退散，前方传来阵阵裂响——大地在裂开。'],
      btn: '继 续',
    },
  },
};
