import type { ForgeConfig } from '../../types';

// 三路经营战地图参数（v0.91 P3，打小人式"两侧经营 + 中路打怪"）
// 关卡本体在各自 l2 文件里：中路 1-2 条蛇形路径 + 两侧锻炉区（4 炉起步，合并腾格）。
// 锻炉格坐标必须在 buildable 区域内（非路径），由 canPlace 拦截建塔。

// 锻炉经济基准（§平衡护栏）：
//  - 10s 出 1 符（0 级），收取 +5%/级（0 级炉 = +5%）；
//  - 合并两级 → 14s 出符但价值翻倍，鼓励"经营深度 vs 数量"取舍；
//  - 全局封顶 +60%（对齐 §9.5 攻速/射程档位以下，不破伤害族天花板）。
export const FORGE_MAPS: Record<string, ForgeConfig> = {
  // ch14-l2：4 炉（左右各 2）
  'ch14-l2': {
    forges: [{ x: 3, y: 8 }, { x: 4, y: 8 }, { x: 11, y: 8 }, { x: 12, y: 8 }],
    forgeSecPerLevel: [10, 14, 18],
    collectDmgPctPerLevel: 0.05,
    maxTotalDmgPct: 0.6,
    mergeEnabled: true,
  },
  // ch23-l2：6 炉（左右各 3）
  'ch23-l2': {
    forges: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 11, y: 0 }, { x: 12, y: 0 }, { x: 13, y: 0 }],
    forgeSecPerLevel: [10, 14, 18],
    collectDmgPctPerLevel: 0.05,
    maxTotalDmgPct: 0.6,
    mergeEnabled: true,
  },
  // ch30-l2：8 炉（左右各 4，终局经营）
  'ch30-l2': {
    forges: [{ x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 }, { x: 13, y: 7 }, { x: 14, y: 7 }],
    forgeSecPerLevel: [9, 12, 16],
    collectDmgPctPerLevel: 0.05,
    maxTotalDmgPct: 0.6,
    mergeEnabled: true,
  },
};
