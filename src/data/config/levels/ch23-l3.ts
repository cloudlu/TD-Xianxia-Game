import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 23 章 第 3 关 · 联合反击（三路径 + 魔将小BOSS）
const P = [
  [{ x: 0, y: 1 }, { x: 15, y: 1 }],
  [{ x: 0, y: 4 }, { x: 15, y: 4 }],
  [{ x: 0, y: 6 }, { x: 15, y: 6 }],
];

export const CH23_L3: LevelConfig = {
  id: 'ch23-l3', name: '联合反击',
  startStones: 940, lives: 3,
  cols: 16, rows: 8,
  paths: P,
  buildable: buildableFromPaths(16, 8, P),
  hpMul: 3.3,
  waves: [
    { spawns: [{ enemy: 'celestial_demon', count: 20, gap: 0.8, delay: 0, path: 0 }, { enemy: 'void_walker', count: 22, gap: 0.5, delay: 0, path: 1 }], clearBonus: 500 },
    { spawns: [{ enemy: 'chaos_larva', count: 25, gap: 0.5, delay: 0, path: 2 }, { enemy: 'dragon_young', count: 7, gap: 1.6, delay: 1, path: 0 }], clearBonus: 530 },
    { spawns: [{ enemy: 'demon_general', count: 11, gap: 0, delay: 0, path: 1 }, { enemy: 'celestial_demon', count: 17, gap: 0.9, delay: 1, path: 2 }, { enemy: 'shadow_assassin', count: 8, gap: 1.4, delay: 1, path: 0 }], clearBonus: 570 },
  ],
  story: {
    intro: {
      chapter: '第 二 十 三 章', title: '联 合 反 击',
      lines: [
        '万族联军集结完毕，向天裂发起反击。',
        '人族布阵，妖族冲锋，鬼修袭扰，海族控水——配合天衣无缝。',
        '但魔将率残部死守不退，誓要为天劫降临拖延时间。',
      ],
      btn: '全 军 出 击',
    },
    outro: {
      chapter: '反 击', title: '魔 将 陨 落',
      lines: ['魔将被斩于阵前，联军士气如虹。', '然而天劫之兆，已显于苍穹之上。'],
      btn: '继 续',
    },
  },
};
