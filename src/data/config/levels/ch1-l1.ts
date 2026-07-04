import type { LevelConfig } from '../../../types';
import { buildableFromPaths } from './buildable';

const PATHS = [[{ x: 0, y: 3 }, { x: 15, y: 3 }]];

// 第 1 章 第 1 关 · 前山门（单路径直线，教学关）
export const CH1_L1: LevelConfig = {
  id: 'ch1-l1', name: '前山门',
  startStones: 300, lives: 20,
  cols: 16, rows: 8,
  maxTowerLevel: 2,   // 本关最高可升至 金丹（教学升级 + 暴击）
  paths: PATHS,
  buildable: buildableFromPaths(16, 8, PATHS),
  waves: [
    { spawns: [{ enemy: 'wolf', count: 8, gap: 0.8, delay: 0 }], clearBonus: 50 },
    { spawns: [{ enemy: 'wolf', count: 12, gap: 0.6, delay: 1 }], clearBonus: 70 },
    { spawns: [{ enemy: 'boar', count: 3, gap: 1.8, delay: 1 }], clearBonus: 90 },
  ],
  story: {
    intro: {
      chapter: '第 一 章', title: '山 门 初 劫',
      lines: [
        '千年封印松动，万妖蠢动。',
        '宗门山门外，妖狼嚎月而来。',
        '长老将护阵大任交予你——新晋弟子，',
        '能否凭一手飞剑，守得住这第一夜？',
      ],
      btn: '领 命 布 阵',
    },
    outro: {
      chapter: '劫 后', title: '首 战 告 捷',
      lines: ['狼潮暂退，山门无恙。', '然松林深处，异响渐起……'],
      btn: '继 续',
    },
  },
};
