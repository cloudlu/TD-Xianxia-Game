import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 21 章 第 1 关 · 天道裂痕（L 形单路径，引入虚空行者 + 天魔）
const P = [[
  { x: 0, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 6 }, { x: 15, y: 6 },
]];

export const CH21_L1: LevelConfig = {
  id: 'ch21-l1', name: '天道裂痕',
  startStones: 820, lives: 3,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.1,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 20, gap: 0.5, delay: 0 }, { enemy: 'void_walker', count: 6, gap: 1.6, delay: 1 }], clearBonus: 400 },
    { spawns: [{ enemy: 'void_walker', count: 11, gap: 1.0, delay: 0 }, { enemy: 'celestial_demon', count: 4, gap: 2, delay: 1 }], clearBonus: 430 },
    { spawns: [{ enemy: 'celestial_demon', count: 8, gap: 1.6, delay: 0 }, { enemy: 'void_walker', count: 14, gap: 0.7, delay: 0 }, { enemy: 'magic_minion', count: 8, gap: 0.8, delay: 1 }], clearBonus: 460 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 一 章', title: '界 域 之 战 篇',
      lines: [
        '天道裂痕初现于九霄之上，虚空之力从裂隙中倾泻而下。',
        '太上长老（你）仰望苍穹，感知到熟悉的规则正在崩坏。',
        '虚空行者与天魔自裂缝中走出——这是「界域之战」的开始。',
      ],
      btn: '仰 望 天 裂',
    },
    outro: {
      chapter: '裂 痕', title: '虚 空 不 止',
      lines: ['初波退去，但裂痕并未缩小。', '天魔的铠甲层远比想象中坚硬……'],
      btn: '继 续',
    },
  },
};
