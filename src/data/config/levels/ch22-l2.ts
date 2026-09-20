import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { STREAM_MAPS, noBuildable, pureHeroStreamConfig } from '../streamMaps';

// 第 22 章 第 2 关 · 天魔先锋【异变·夜袭】御剑守城：全屏随机列 + 妖风（1 秒极短波间）
const MAP = STREAM_MAPS['ch22-l2'];

export const CH22_L2: LevelConfig = {
  id: 'ch22-l2', name: '天魔先锋·夜袭',
  startStones: 880, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  mode: 'stream',
  stream: pureHeroStreamConfig(MAP.stream),
  paths: MAP.paths,
  base: MAP.base,
  buildable: noBuildable(MAP.cols, MAP.rows),
  hpMul: 4.8,
  activePaths: MAP.paths.map((_, i) => i),
  waves: [
    { spawns: [{ enemy: 'celestial_demon', count: 21, gap: 1.0, delay: 0, path: 0 }, { enemy: 'void_walker', count: 26, gap: 0.6, delay: 0, path: 1 }, { enemy: 'chaos_larva', count: 18, gap: 0.8, delay: 1, path: 2 }], clearBonus: 460 },
    { spawns: [{ enemy: 'chaos_larva', count: 26, gap: 0.7, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 11, gap: 1.6, delay: 1, path: 1 }, { enemy: 'celestial_demon', count: 15, gap: 1.0, delay: 0, path: 3 }], clearBonus: 490 },
    { spawns: [{ enemy: 'celestial_demon', count: 26, gap: 0.9, delay: 0, path: 0 }, { enemy: 'chaos_larva', count: 30, gap: 0.6, delay: 0, path: 1 }, { enemy: 'mist_wraith', count: 11, gap: 1.4, delay: 1, path: 2 }, { enemy: 'void_walker', count: 18, gap: 0.7, delay: 1, path: 3 }], clearBonus: 520 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 二 章', title: '先 锋 夜 临',
      lines: [
        '虚空天隙遍布北天——天魔先锋军昼夜不停，自任意处压落！',
        '波与波之间仅有一瞬喘息；妖风横移行伍，落点愈发难测。',
        '天隙尽头，御剑真人是界墙前最后的屏障——你没有退路。',
        '鼠标走位守城头，拾塔符叠塔力；妖潮压境时，点击集火最强敌！',
      ],
      btn: '挥 剑 斩 旧 识',
    },
    outro: {
      chapter: '先 锋', title: '故 人 已 远',
      lines: ['天魔先锋被击退，太上长老默然不语。', '混沌深处，似乎在酝酿更大的攻势。'],
      btn: '继 续',
    },
  },
};
