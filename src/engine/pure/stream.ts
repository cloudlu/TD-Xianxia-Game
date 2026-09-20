// 连续流夜袭纯函数（v0.92：全屏随机列出怪 + 妖风变列）
// 全部确定性：随机走注入的 rng（种子化 PRNG），遵守引擎确定性红线。

/** 随机出生列：[0, cols) 内均匀取整（外层保证 rng 已按 wave 派生） */
export function randomSpawnCol(cols: number, rng: () => number): number {
  return Math.min(cols - 1, Math.max(0, Math.floor(rng() * cols)));
}

/**
 * 妖风变列：当前列 + 偏移（±maxShift 内，符号由 rng 决定），钳制到边界。
 * @param col 当前列
 * @param cols 总列数
 * @param maxShift 最大横移列数（配置 2 = ±2）
 */
export function windShiftedCol(col: number, cols: number, maxShift: number, rng: () => number): number {
  const dir = rng() < 0.5 ? -1 : 1;
  const mag = 1 + Math.floor(rng() * maxShift);
  return Math.min(cols - 1, Math.max(0, col + dir * mag));
}

/** 防线横扫符布点：cols 中随机取 count 个不重复列（升序返回，种子化） */
export function sweeperColumns(cols: number, count: number, rng: () => number): number[] {
  const n = Math.min(count, cols);
  const pool = Array.from({ length: cols }, (_, i) => i);
  // Fisher–Yates（rng 驱动，确定性）
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).sort((a, b) => a - b);
}

/** 出生预警时刻表：给一批出生时刻生成 [出生时间 - 1s] 的预警时间点 */
export function spawnWarnings(spawnTimes: number[], warnLeadSec = 1): number[] {
  return spawnTimes.map((t) => Math.max(0, t - warnLeadSec));
}

/** 某列是否正处于预警窗口（now ∈ [warnAt, spawnAt)） */
export function colWarningActive(warnAt: number, spawnAt: number, now: number): boolean {
  return now >= warnAt && now < spawnAt;
}
