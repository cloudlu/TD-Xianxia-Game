// Board 全屏特效层（v0.87）：灵气光照 / 时段色温 / 漏怪红晕 / 最后一波仪式 / 连杀 zoom
// 纯渲染函数集——由 Board.render 在 vignette 之前统一调用（SRP：Board 不直接承载这些细节）。
// 全部由逻辑帧 elapsed/waveIndex 相位驱动，无渲染随机（确定性红线）。

import { MOOD_LIGHT, type MoodLightKey } from '../data/config/palette';

export interface FxCtx {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  elapsed: number;
}

/** 灵气光照：按战斗状态全屏色温渐变（alpha 极低，只调氛围不抢内容） */
export function drawMoodLight(fx: FxCtx, mood: MoodLightKey, bossAlive: boolean): void {
  const m = bossAlive && mood === 'wave' ? MOOD_LIGHT.boss : MOOD_LIGHT[mood] ?? MOOD_LIGHT.prep;
  const { ctx, w, h } = fx;
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.75);
  g.addColorStop(0, m.color + '00');
  g.addColorStop(1, hexA(m.color, m.alpha));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** 时段色温（保守方案：只调色温不换底图）：波次进度 晨蓝→昼白→暮橙 循环推进 */
export function dayPhaseTint(waveIndex: number, totalWaves: number): { color: string; alpha: number } {
  if (totalWaves <= 1) return { color: '#4fc3f7', alpha: 0.03 };
  const t = Math.min(1, waveIndex / Math.max(1, totalWaves - 1));
  // 三段插值：晨 #4fc3f7(0.04) → 昼 #ffffff(0.00) → 暮 #ff8a65(0.06)
  if (t < 0.5) {
    const f = t / 0.5;
    return { color: lerpHex('#4fc3f7', '#ffffff', f), alpha: lerp(0.04, 0, f) };
  }
  const f = (t - 0.5) / 0.5;
  return { color: lerpHex('#ffffff', '#ff8a65', f), alpha: lerp(0, 0.06, f) };
}

export function drawDayTint(fx: FxCtx, waveIndex: number, totalWaves: number): void {
  const t = dayPhaseTint(waveIndex, totalWaves);
  if (t.alpha <= 0.005) return;
  const { ctx, w, h } = fx;
  ctx.fillStyle = hexA(t.color, t.alpha);
  ctx.fillRect(0, 0, w, h);
}

/** 漏怪红晕：lastLeakAt 后 0.6s 内屏幕边缘红晕脉冲（心痛反馈） */
export function drawLeakVignette(fx: FxCtx, lastLeakAt: number): void {
  const age = fx.elapsed - lastLeakAt;
  if (lastLeakAt < 0 || age < 0 || age > 0.6) return;
  const k = 1 - age / 0.6;                       // 1→0 衰减
  const pulse = 0.7 + 0.3 * Math.sin(age * 25);  // 心跳感脉冲
  const { ctx, w, h } = fx;
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.72);
  g.addColorStop(0, '#e5393500');
  g.addColorStop(1, hexA('#e53935', 0.28 * k * pulse));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** 最后一波仪式：finalWaveAt 后 2s——水墨暗转 + "妖潮将至"大字 */
export function drawFinalWaveRite(fx: FxCtx, finalWaveAt: number, isFinalWave: boolean): void {
  if (!isFinalWave || finalWaveAt < 0) return;
  const age = fx.elapsed - finalWaveAt;
  if (age < 0 || age > 2) return;
  const { ctx, w, h } = fx;
  // 暗转包络：0-0.3s 变暗 → 0.3-1.6s 保持 → 1.6-2s 恢复
  const dark = age < 0.3 ? age / 0.3 : age < 1.6 ? 1 : Math.max(0, (2 - age) / 0.4);
  ctx.fillStyle = hexA('#0d1120', 0.55 * dark);
  ctx.fillRect(0, 0, w, h);
  // 大字（带缓入与描边）
  const textA = Math.min(1, age / 0.4) * dark;
  ctx.save();
  ctx.globalAlpha = textA;
  ctx.font = `bold ${Math.round(w * 0.07)}px "Microsoft YaHei", serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cx = w / 2, cy = h / 2 - Math.min(1, age / 0.4) * 8;
  ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
  ctx.strokeText('妖 潮 将 至', cx, cy);
  ctx.fillStyle = '#ff5252';
  ctx.fillText('妖 潮 将 至', cx, cy);
  ctx.restore();
}

/** 连杀 zoom 脉冲：streakAt 后 0.3s 内 1.05→1.0 缩放（由 Board 变换矩阵应用） */
export function zoomPulseScale(streakAt: number, elapsed: number): number {
  if (streakAt < 0) return 1;
  const age = elapsed - streakAt;
  if (age < 0 || age > 0.3) return 1;
  const k = 1 - age / 0.3;
  return 1 + 0.05 * k * k;
}

// ---------- 颜色工具 ----------

function hexA(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function lerpHex(h1: string, h2: string, t: number): string {
  const r = Math.round(lerp(parseInt(h1.slice(1, 3), 16), parseInt(h2.slice(1, 3), 16), t));
  const g = Math.round(lerp(parseInt(h1.slice(3, 5), 16), parseInt(h2.slice(3, 5), 16), t));
  const b = Math.round(lerp(parseInt(h1.slice(5, 7), 16), parseInt(h2.slice(5, 7), 16), t));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
