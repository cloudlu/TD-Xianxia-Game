import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 23 章 第 1 关 · 万族联盟（L 形单路径）
const P = [[
  { x: 0, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 6 }, { x: 15, y: 6 },
]];

export const CH23_L1: LevelConfig = {
  id: 'ch23-l1', name: '万族联盟',
  startStones: 900, lives: 44,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.3,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 16, gap: 0.4, delay: 0 }, { enemy: 'void_walker', count: 8, gap: 0.8, delay: 1 }], clearBonus: 460 },
    { spawns: [{ enemy: 'celestial_demon', count: 10, gap: 1.0, delay: 0 }, { enemy: 'bull', count: 5, gap: 1.8, delay: 1 }], clearBonus: 490 },
    { spawns: [{ enemy: 'void_walker', count: 14, gap: 0.5, delay: 0 }, { enemy: 'celestial_demon', count: 10, gap: 0.9, delay: 0 }, { enemy: 'dragon_young', count: 4, gap: 1.8, delay: 1 }], clearBonus: 520 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 三 章', title: '界 域 联 盟',
      lines: [
        '妖族、人族、海族、鬼修……万族放下旧怨，共抗天裂。',
        '太上长老被推举为联盟统帅，调度各族之力。',
        '第一仗必须漂亮——这是联盟凝聚力的试金石。',
      ],
      btn: '执 掌 万 族',
    },
    outro: {
      chapter: '联 盟', title: '首 战 告 捷',
      lines: ['万族联军初战告捷，士气大振。', '但灵气紊乱开始蔓延，连联盟内部都出现了异变……'],
      btn: '继 续',
    },
  },
};
