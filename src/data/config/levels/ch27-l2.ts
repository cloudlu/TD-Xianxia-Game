import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
import { STREAM_MAPS, noBuildable, pureHeroStreamConfig } from '../streamMaps';

// 第 27 章 第 2 关 · 执法者【异变·夜袭】御剑守城：全屏随机列 + 妖风（1 秒极短波间）
const MAP = STREAM_MAPS['ch27-l2'];

export const CH27_L2: LevelConfig = {
  id: 'ch27-l2', name: '执法者·夜袭',
  startStones: 1060, lives: 3,
  cols: MAP.cols, rows: MAP.rows,
  mode: 'stream',
  stream: pureHeroStreamConfig(MAP.stream),
  paths: MAP.paths,
  base: MAP.base,
  buildable: noBuildable(MAP.cols, MAP.rows),
  hpMul: 5.5,
  activePaths: MAP.paths.map((_, i) => i),
  waves: [
    { spawns: [{ enemy: 'law_enforcer', count: 21, gap: 1.0, delay: 0, path: 0 }, { enemy: 'chaos_larva', count: 51, gap: 0.4, delay: 1, path: 1 }, { enemy: 'law_enforcer', count: 12, gap: 1.2, delay: 1, path: 2 }], clearBonus: 580 },
    { spawns: [{ enemy: 'chaos_beast', count: 17, gap: 1.6, delay: 0, path: 0 }, { enemy: 'void_walker', count: 33, gap: 0.5, delay: 1, path: 1 }, { enemy: 'law_enforcer', count: 17, gap: 1.2, delay: 0, path: 2 }, { enemy: 'ghost_cultivator', count: 21, gap: 0.7, delay: 1, path: 3 }], clearBonus: 620 },
    { spawns: [{ enemy: 'celestial_demon', count: 30, gap: 0.8, delay: 0, path: 1 }, { enemy: 'chaos_beast', count: 17, gap: 1.6, delay: 1, path: 0 }, { enemy: 'law_enforcer', count: 26, gap: 0.9, delay: 2, path: 2 }, { enemy: 'ghost_cultivator', count: 38, gap: 0.5, delay: 0, path: 3 }, { enemy: 'void_walker', count: 21, gap: 0.6, delay: 1, path: 4 }], clearBonus: 680 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 七 章', title: '天 罚 五 柱',
      lines: [
        '执法者倾巢而出——天道罚柱遍布北天，昼夜不息地降下天兵！',
        '波间仅一瞬，妖风频起横移行伍；『规则』本身就是这场夜袭的敌人。',
        '天道罚柱之下，唯有一人之剑可依——城头之上，你在，城就在。',
        '走位拾塔符，塔力叠叠升；集火执法者，这夜就由你逆转！',
      ],
      btn: '逆 天 而 行',
    },
    outro: {
      chapter: '执 法', title: '群 起 围 攻',
      lines: ['执法者倒下一批，又补上一批。', '他们的『规则』之源，似乎指向同一个存在……'],
      btn: '继 续',
    },
  },
};
