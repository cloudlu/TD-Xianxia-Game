import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';
const P = [[{ x: 0, y: 1 }, { x: 15, y: 1 }], [{ x: 0, y: 4 }, { x: 15, y: 4 }], [{ x: 0, y: 6 }, { x: 15, y: 6 }]];
export const CH10_L3: LevelConfig = {
  id: 'ch10-l3', name: '裂隙主宰', startStones: 680, lives: 36, cols: 16, rows: 8,
  paths: P, buildable: buildableFromPaths(16, 8, P), hpMul: 2.0,
  waves: [
    { spawns: [{ enemy: 'sand_scorpion', count: 14, gap: 0.4, delay: 0, path: 0 }, { enemy: 'mist_wraith', count: 10, gap: 0.7, delay: 0, path: 2 }, { enemy: 'bat', count: 16, gap: 0.3, delay: 1, path: 1 }], clearBonus: 300 },
    { spawns: [{ enemy: 'barbarian', count: 8, gap: 1.2, delay: 0, path: 0 }, { enemy: 'shadow_fox', count: 12, gap: 0.7, delay: 0, path: 2 }, { enemy: 'blood_cultist', count: 8, gap: 1.0, delay: 0, path: 1 }, { enemy: 'magic_puppet', count: 4, gap: 3, delay: 0, path: 0 }], clearBonus: 340 },
    // 终波：裂隙主宰降临（10000血/300盾/召唤沙蝎4/狂暴加速/魅惑）
    { spawns: [
      { enemy: 'rift_sovereign', count: 1, gap: 1, delay: 3, path: 1 },
      { enemy: 'barbarian', count: 6, gap: 1.5, delay: 0, path: 0 },
      { enemy: 'mist_wraith', count: 10, gap: 0.7, delay: 0, path: 2 },
      { enemy: 'sand_scorpion', count: 12, gap: 0.4, delay: 1, path: 0 },
    ], clearBonus: 500 },
  ],
  story: {
    intro: {
      chapter: '第 十 章', title: '裂 隙 主 宰',
      lines: [
        '裂隙主宰悬浮于虚空，周身黑色魔气如潮。',
        '它拥有万点血量、三百护盾，还能不断召唤沙蝎群。',
        '当其血量低于三成时，将狂暴加速、召唤倍增——',
        '务必在此之前尽可能削弱它。',
      ],
      btn: '封 印 主 宰',
    },
    outro: {
      chapter: '终 章', title: '域 外 篇 完',
      lines: [
        '裂隙主宰发出最后一声咆哮，黑色裂隙轰然坍缩。',
        '苍茫域的天空重新放晴，阳光洒落在你疲惫的身上。',
        '你封印了域外裂缝，但宗门传来了新的消息——',
        '大陆各域纷纷告急，魔域裂缝已遍布整片大陆。',
        '长老会决议：组建修真大陆联盟，共抗魔劫。',
        '（《大陆联盟》待续……）',
      ],
      btn: '返 回 选 关',
    },
  },
};
