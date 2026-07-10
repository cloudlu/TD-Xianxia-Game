import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 21 章 第 2 关 · 虚空入侵（双路径）
const P = [
  [{ x: 0, y: 2 }, { x: 15, y: 2 }],
  [{ x: 0, y: 5 }, { x: 15, y: 5 }],
];

export const CH21_L2: LevelConfig = {
  id: 'ch21-l2', name: '虚空入侵',
  startStones: 840, lives: 42,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.1,
  waves: [
    { spawns: [{ enemy: 'void_walker', count: 12, gap: 0.7, delay: 0, path: 0 }, { enemy: 'bat', count: 10, gap: 0.4, delay: 0, path: 1 }], clearBonus: 420 },
    { spawns: [{ enemy: 'celestial_demon', count: 5, gap: 1.8, delay: 0, path: 0 }, { enemy: 'void_walker', count: 10, gap: 0.8, delay: 1, path: 1 }], clearBonus: 450 },
    { spawns: [{ enemy: 'celestial_demon', count: 8, gap: 1.4, delay: 0, path: 0 }, { enemy: 'void_walker', count: 14, gap: 0.5, delay: 0, path: 1 }, { enemy: 'blood_cultist', count: 5, gap: 1.2, delay: 1, path: 0 }], clearBonus: 480 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 一 章', title: '虚 空 入 侵',
      lines: [
        '虚空大军分两路涌入人间界，所过之处灵气枯竭。',
        '宗门弟子布阵抵抗，却发现法术在天魔面前威力大减。',
        '必须守住两条通道，否则后方便是生灵涂炭。',
      ],
      btn: '列 阵 迎 敌',
    },
    outro: {
      chapter: '苦 战', title: '规 则 扭 曲',
      lines: ['双路勉强守住，但弟子伤亡惨重。', '虚空之中，似乎还有更可怕的存在在窥视……'],
      btn: '继 续',
    },
  },
};
