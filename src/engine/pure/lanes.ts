// 车道防守模式纯函数（v0.89 Phase 1，设计文档 §4.7 车道玩法）
// 全部为确定性纯函数：随机走注入的 rng（种子化 PRNG），遵守引擎确定性红线。

import type { LaneConfig, PickupStone } from '../../types';

/** 由网格尺寸生成等长横向车道路点（敌从 col=cols-1 侧进入，守 cols-1=宗门侧由调用方定 base） */
export function buildLanePaths(cols: number, rows: number, laneRows: number[]): { x: number; y: number }[][] {
  return laneRows.map((y) => [{ x: 0, y }, { x: cols - 1, y }]);
}

/**
 * 敌人越过横扫符触发线判定。
 * 敌人从右往左走（dist 增大 → x 减小），触发线 col 为其所在车道的横扫符位置。
 * @param enemyX 敌人当前 x（格坐标）
 * @param sweepCol 触发线列
 */
export function shouldTriggerSweep(enemyX: number, sweepCol: number): boolean {
  return enemyX <= sweepCol + 0.5;
}

/**
 * 生成本波灵石拾取时刻表（确定性：同 seed + wave → 同结果）。
 * 时刻在 [waveStart, waveStart + horizonSec) 内均匀期望分布，位置落在随机车道行与可用列。
 * @param laneRows 车道行号列表
 * @param cols 总列数（拾取落在 [2, cols-3] 内部区，避开出入口）
 * @param cfg lane.pickup 配置
 * @param waveStart 引擎 elapsed 起点（通常为当前值）
 * @param horizonSec 计划时长（通常 = 波次预估时长）
 * @param rng 种子化随机函数
 */
export function pickupSchedule(
  laneRows: number[],
  cols: number,
  cfg: LaneConfig['pickup'],
  waveStart: number,
  horizonSec: number,
  rng: () => number,
): { at: number; col: number; row: number }[] {
  if (cfg.maxPerWave <= 0 || horizonSec <= 0 || laneRows.length === 0) return [];
  const out: { at: number; col: number; row: number }[] = [];
  // 期望间隔：intervalSec ±40% 抖动；数量封顶 maxPerWave
  let t = waveStart + cfg.intervalSec * (0.6 + rng() * 0.8);
  while (out.length < cfg.maxPerWave && t < waveStart + horizonSec) {
    out.push({
      at: t,
      col: 2 + Math.floor(rng() * Math.max(1, cols - 4)),
      row: laneRows[Math.floor(rng() * laneRows.length)],
    });
    t += cfg.intervalSec * (0.6 + rng() * 0.8);
  }
  return out;
}

/** 拾取物是否已过期（超时消失，防囤积） */
export function pickupExpired(p: PickupStone, elapsed: number): boolean {
  return elapsed - p.spawnAt > p.lifeSec;
}

/** 建一个拾取物 */
export function makePickup(uidSeq: { n: number }, col: number, row: number, value: number, now: number, lifeSec = 10): PickupStone {
  return { uid: uidSeq.n++, col, row, value, spawnAt: now, lifeSec, collected: false };
}
