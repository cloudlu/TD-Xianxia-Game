import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

// 第 1 章 第 3 关 · 山门关隘（U 形，两段平行路段可被一塔覆盖；章末 小头目 山猪王）
// 路径：(0,2)→(4,2)→(4,5)→(11,5)→(11,2)→(15,2)
const PATHS = [[
  { x: 0, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 5 },
  { x: 11, y: 5 }, { x: 11, y: 2 }, { x: 15, y: 2 },
]];

export const CH1_L3: LevelConfig = {
  id: 'ch1-l3', name: '山门关隘',
  startStones: 320, lives: 25,
  cols: 16, rows: 8,
  maxTowerLevel: 4,   // 章末 BOSS 战：放开到 化神
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  hpMul: 1.0,
  waves: [
    { spawns: [{ enemy: 'wolf', count: 12, gap: 0.7, delay: 0 }], clearBonus: 70 },
    { spawns: [{ enemy: 'wolf', count: 10, gap: 0.6, delay: 0 }, { enemy: 'boar', count: 3, gap: 2, delay: 1 }], clearBonus: 85 },
    { spawns: [{ enemy: 'boar', count: 5, gap: 1.4, delay: 0 }, { enemy: 'wolf', count: 10, gap: 0.6, delay: 1 }], clearBonus: 100 },
    // 末波：山猪王率众来犯
    { spawns: [{ enemy: 'boar', count: 4, gap: 1.6, delay: 0 }, { enemy: 'wolf', count: 12, gap: 0.5, delay: 1 }, { enemy: 'boar_king', count: 1, gap: 1, delay: 4 }], clearBonus: 150 },
  ],
  story: {
    intro: {
      chapter: '第 一 章', title: '山 门 关 隘',
      lines: [
        '此处乃山门最后天险。',
        '妖狼虽退，山猪王却亲率群妖来犯。',
        '守住此地，宗门方能安稳。其身披厚甲，飞剑难入——',
        '当以境界突破之力，或长枪贯之。',
      ],
      btn: '决 战 关 隘',
    },
    outro: {
      chapter: '第 一 章', title: '晨 光 洒 落',
      lines: [
        '山猪王倒下，群妖溃散。',
        '晨光洒落山门，你长舒一口气。',
        '却见远方天际，一道血色冲天而起——',
        '那不是妖狼……那是更可怕的东西，正在苏醒。',
      ],
      btn: '返 回 选 关',
    },
  },
};
