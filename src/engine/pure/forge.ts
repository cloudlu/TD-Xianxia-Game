// 三路经营战（锻炉）纯函数（v0.91 P3，打小人式"两侧经营 + 中路打怪"）
// 全部确定性：无随机、无时间源，进度推进由引擎注入 dt。

import type { ForgeConfig, ForgeState } from '../../types';

/** 由配置初始化锻炉状态 */
export function initForges(uidSeq: { n: number }, cfg: ForgeConfig): ForgeState[] {
  return cfg.forges.map((g) => ({
    uid: uidSeq.n++, col: g.x, row: g.y,
    level: 0, progress: 0, ready: false, selected: false,
  }));
}

/** 推进一帧：未就绪的炉累计进度（同级锻造更快用高级表），满则 ready */
export function tickForges(forges: ForgeState[], dt: number, cfg: ForgeConfig): void {
  for (const f of forges) {
    if (f.ready) continue;
    const idx = Math.min(f.level, cfg.forgeSecPerLevel.length - 1);
    const total = cfg.forgeSecPerLevel[idx];
    f.progress += dt / total;
    if (f.progress >= 1) {
      f.progress = 1;
      f.ready = true;
    }
  }
}

/**
 * 当前伤害符加成（增量累计制）：Game 侧每次收取时按炉等级累计 pct，
 * 本函数做封顶截断。
 */
export function capForgeBonus(currentBonus: number, addPct: number, cfg: ForgeConfig): number {
  return Math.min(currentBonus + addPct, cfg.maxTotalDmgPct);
}

/** 锻炉格是否与坐标匹配（点击命中） */
export function forgeAt(forges: ForgeState[], col: number, row: number): ForgeState | undefined {
  return forges.find((f) => f.col === col && f.row === row);
}

/** 相邻（上下左右）判定：合并操作用 */
export function forgesAdjacent(a: ForgeState, b: ForgeState): boolean {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;
}

/**
 * 合并两炉：b 并入 a → a.level+1、清进度；b 移除（格子释放）。
 * 前置：相邻 + 同级 + mergeEnabled。返回 null 表示不可合并。
 */
export function mergeForges(forges: ForgeState[], aUid: number, bUid: number, cfg: ForgeConfig): ForgeState[] | null {
  if (!cfg.mergeEnabled) return null;
  const a = forges.find((f) => f.uid === aUid);
  const b = forges.find((f) => f.uid === bUid);
  if (!a || !b || a.uid === b.uid) return null;
  if (a.level !== b.level) return null;
  if (!forgesAdjacent(a, b)) return null;
  return forges
    .filter((f) => f.uid !== b.uid)
    .map((f) => (f.uid === a.uid ? { ...f, level: f.level + 1, progress: 0, ready: false, selected: false } : { ...f, selected: false }));
}
