import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { STREAM_MAPS, noBuildable, pureHeroStreamConfig } from '../streamMaps';

// 第 12 章 第 2 关 · 暗影峡谷【异变·夜袭】御剑守城：全屏随机列 + 妖风 + 纯英雄横向守城
const MAP = STREAM_MAPS['ch12-l2'];

export const CH12_L2: LevelConfig = {
  id: 'ch12-l2', name: '暗影峡谷·夜袭',
  startStones: 660, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  mode: 'stream',
  stream: pureHeroStreamConfig(MAP.stream),
  paths: MAP.paths,
  base: MAP.base,
  buildable: noBuildable(MAP.cols, MAP.rows),
  hpMul: 3.3,
  activePaths: MAP.paths.map((_, i) => i),
  waves: [
    { spawns: [{ enemy: 'shadow_assassin', count: 20, gap: 0.9, delay: 0, path: 0 }, { enemy: 'demon_serpent', count: 8, gap: 2.2, delay: 1, path: 1 }, { enemy: 'shadow_assassin', count: 14, gap: 1.1, delay: 2, path: 2 }], clearBonus: 340 },
    { spawns: [{ enemy: 'shadow_assassin', count: 24, gap: 0.8, delay: 0, path: 0 }, { enemy: 'demon_knight', count: 12, gap: 1.8, delay: 1, path: 1 }, { enemy: 'shadow_assassin', count: 15, gap: 1.0, delay: 0, path: 3 }], clearBonus: 380 },
    { spawns: [{ enemy: 'demon_serpent', count: 15, gap: 1.4, delay: 0, path: 0 }, { enemy: 'shadow_assassin', count: 24, gap: 0.8, delay: 1, path: 1 }, { enemy: 'bat', count: 32, gap: 0.3, delay: 0, path: 2 }, { enemy: 'demon_knight', count: 9, gap: 2.0, delay: 2, path: 3 }], clearBonus: 440 },
  ],
  story: {
    intro: {
      chapter: '第 十 二 章', title: '暗 影 夜 行',
      lines: [
        '峡谷异变，暗影刺客弃隘口而夜行——北方全境皆是落点！',
        '无波间喘息，影杀连绵不绝；隐身之敌须以寒冰照破。',
        '御剑真人背靠谷墙独守城头——鼠标移动走位，拾取塔符叠塔力。',
        '火法/雷法/寒冰……越多塔力，城头越稳；点击敌人可集火！',
      ],
      btn: '入 谷 夜 战',
    },
    outro: {
      chapter: '战 报', title: '暗 影 散 去',
      lines: ['刺客尽诛，峡谷寂静。', '魔域军团正向主力逼近。'],
      btn: '继 续',
    },
  },
};
