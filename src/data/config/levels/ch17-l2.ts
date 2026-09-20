import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { STREAM_MAPS, noBuildable, pureHeroStreamConfig } from '../streamMaps';

// 第 17 章 第 2 关 · 鬼域迷踪【异变·夜袭】御剑守城：全屏随机列 + 妖风 + 纯英雄横向守城
const MAP = STREAM_MAPS['ch17-l2'];

export const CH17_L2: LevelConfig = {
  id: 'ch17-l2', name: '鬼域迷踪·夜袭',
  startStones: 760, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  mode: 'stream',
  stream: pureHeroStreamConfig(MAP.stream),
  paths: MAP.paths,
  base: MAP.base,
  buildable: noBuildable(MAP.cols, MAP.rows),
  hpMul: 4,
  activePaths: MAP.paths.map((_, i) => i),
  waves: [
    { spawns: [{ enemy: 'ghost_cultivator', count: 26, gap: 0.7, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 21, gap: 0.8, delay: 1, path: 1 }, { enemy: 'ghost_cultivator', count: 15, gap: 0.9, delay: 1, path: 2 }], clearBonus: 360 },
    { spawns: [{ enemy: 'shadow_assassin', count: 33, gap: 0.5, delay: 0, path: 0 }, { enemy: 'ghost_cultivator', count: 30, gap: 0.7, delay: 1, path: 1 }, { enemy: 'shadow_fox', count: 21, gap: 0.8, delay: 0, path: 2 }, { enemy: 'shadow_assassin', count: 15, gap: 0.9, delay: 2, path: 3 }], clearBonus: 400 },
    { spawns: [{ enemy: 'ghost_cultivator', count: 38, gap: 0.6, delay: 0, path: 1 }, { enemy: 'shadow_assassin', count: 38, gap: 0.5, delay: 1, path: 0 }, { enemy: 'dragon_young', count: 17, gap: 1.2, delay: 0, path: 2 }, { enemy: 'ghost_cultivator', count: 18, gap: 0.8, delay: 1, path: 3 }], clearBonus: 460 },
  ],
  story: {
    intro: {
      chapter: '第 十 七 章', title: '鬼 影 夜 降',
      lines: [
        '鬼域异变，迷雾化作漫天鬼径——鬼修影修从北天任意处而降！',
        '虚身隐身交织，波间又无喘息，命中与走位皆是考验。',
        '御剑真人在镇魂墙头独守——鼠标移动走位，拾塔符叠塔力。',
        '寒冰冻影、雷法清潮……城头战力越叠越强，点击敌人可集火！',
      ],
      btn: '破 迷 夜 战',
    },
    outro: {
      chapter: '劫 后', title: '迷 雾 渐 开',
      lines: ['迷雾渐开，百族联军已在前方列阵。'],
      btn: '继 续',
    },
  },
};
