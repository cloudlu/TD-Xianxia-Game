import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 25 章 第 3 关 · 天劫化身（三路径 + 天劫化身终极BOSS）
const P = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH25_L3: LevelConfig = {
  id: 'ch25-l3', name: '天劫化身',
  startStones: 1100, lives: 48,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.5,
  waves: [
    { spawns: [{ enemy: 'void_walker', count: 24, gap: 0.4, delay: 0, path: 0 }, { enemy: 'celestial_demon', count: 18, gap: 0.7, delay: 0, path: 1 }], clearBonus: 600 },
    { spawns: [{ enemy: 'chaos_larva', count: 28, gap: 0.4, delay: 0, path: 2 }, { enemy: 'celestial_demon', count: 20, gap: 0.6, delay: 0, path: 0 }, { enemy: 'dragon_young', count: 6, gap: 1.4, delay: 1, path: 1 }], clearBonus: 640 },
    { spawns: [{ enemy: 'tribulation_avatar', count: 1, gap: 0, delay: 0, path: 2 }, { enemy: 'celestial_demon', count: 18, gap: 0.7, delay: 1, path: 0 }, { enemy: 'void_walker', count: 22, gap: 0.4, delay: 1, path: 1 }], clearBonus: 700 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 五 章', title: '天 劫 化 身',
      lines: [
        '天劫化身终于完全降临——它高逾百丈，雷光为骨，虚空为肉。',
        '它的每一次呼吸都引来紫雷，每一步都让规则崩塌。',
        '太上长老凝视着它，知道此战之后，界域将再不复从前。',
      ],
      btn: '与 天 一 战',
    },
    outro: {
      chapter: '终 章', title: '化 身 封 印',
      lines: [
        '天劫化身终于被斩杀，化为漫天雷光散去。',
        '但天道已裂，界域再难自全。',
        '若要彻底修复，唯有飞升到天外天——那是另一个传说，另一段征途。',
      ],
      btn: '飞 升 天 外',
    },
  },
};
