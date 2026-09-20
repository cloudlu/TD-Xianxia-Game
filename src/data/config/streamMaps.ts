import type { StreamConfig, GridPoint } from '../../types';

// 连续流夜袭地图 v0.92（全屏随机列出怪 + 妖风变列）：
// paths = 每列一条纵向直线车道（敌可从任意列出生，垂直下行）；
// buildable = 全屏（无路径格限制，玩家自由排阵）；
// 横扫符按列随机布点（数量 sweeperCount，种子化由 Game 侧完成）。

export interface StreamMapSpec {
  cols: number;
  rows: number;
  paths: GridPoint[][];     // cols 条纵向车道（pathIndex == 出生列）
  base: GridPoint;          // 防线中央底部
  stream: StreamConfig;
}

/** 全屏夜袭地图：每列一条纵向直线（顶 0 行 → 底 rows-1 行）；神雷锤击 12 发/波、30% 基准血；
    v0.93 平衡：冲阵速度 1.4 + 塔上限 6；v0.96 御剑真人（英雄模式）；
    v0.98 城墙贴底覆盖：wallRow = rows-2（城墙+真人在最后两行） */
export function makeStreamMap(cols: number, rows: number, sweepRow: number, sweeperCount: number, windIntervalSec: number, prepBetweenSec = 0): StreamMapSpec {
  const paths: GridPoint[][] = [];
  for (let x = 0; x < cols; x++) paths.push([{ x, y: 0 }, { x, y: rows - 1 }]);
  return {
    cols, rows,
    paths,
    base: { x: Math.floor(cols / 2), y: rows - 1 },
    stream: { sweepRow, wallRow: rows - 2, prepBetweenSec, sweeperCount, windIntervalSec, hammerDmgPct: 0.30, hammerAmmo: 12, enemySpeedMul: 1.4, maxTowers: 6, heroEnabled: true },
  };
}

// 五个夜袭关：窄长板型（cols 10~12 / rows 16~22）——横屏显示比例舒适，防御纵深更长
// 妖风频率递进：ch7 12s → ch27 8s；防线符 ≈ cols/3（窄板下保底密度）
// sweepRow = rows-3（横扫防线在真人所守城墙前一格；城墙贴底 rows-2）
export const STREAM_MAPS: Record<string, StreamMapSpec> = {
  'ch7-l2': makeStreamMap(10, 16, 13, 3, 12),
  'ch12-l2': makeStreamMap(10, 18, 15, 3, 11),
  'ch17-l2': makeStreamMap(11, 18, 15, 4, 10),
  'ch22-l2': makeStreamMap(11, 20, 17, 4, 9, 1),
  'ch27-l2': makeStreamMap(12, 22, 19, 4, 8, 1),
};

/** 全屏 buildable 矩阵（夜袭关旧行为，保留兼容） */
export function fullBuildable(cols: number, rows: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(true));
}

// —— v0.95 城墙防线 ——
/** 城墙距底部行数：墙行 + 城内 4 行（含防线行） */
export const WALL_INSET = 5;

/** 城墙行号（从 0 计）：rows - WALL_INSET */
export function wallRowOf(rows: number): number {
  return rows - WALL_INSET;
}

/** 城墙 buildable 矩阵（v0.95）：墙行以下（城内，含防线行）可建塔，
 * 墙行（墙体）及以上（野战区）不可建。塔贴墙放，圆形射程越墙索敌（引擎零改动）。
 */
export function wallBuildable(cols: number, rows: number): boolean[][] {
  const wallRow = wallRowOf(rows);
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, () => r >= wallRow + 1),
  );
}

// —— v0.97 御剑守城（纯英雄）——
/** 彻底无建塔区矩阵（御剑守城全部不可建） */
export function noBuildable(cols: number, rows: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(false));
}

/** 御剑守城版 stream 配置：纯英雄开 + 锤击禁 + 塔上限 0 */
export function pureHeroStreamConfig(base: StreamConfig): StreamConfig {
  return { ...base, pureHero: true, hammerAmmo: 0, maxTowers: 0 };
}
