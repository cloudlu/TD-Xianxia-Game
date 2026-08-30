// 屏幕震动（表现层）：确定性相位驱动的偏移计算
// 设计文档 §1.4 红线：不引入 Math.random()，偏移由逻辑时间 elapsed 的正弦相位决定，
// 同一 elapsed 序列 → 同一偏移序列（可复算）。

export interface ShakeState {
  /** 震动强度（像素，0 = 无震动） */
  intensity: number;
  /** 震动结束时间（引擎秒） */
  until: number;
}

export const NO_SHAKE: ShakeState = { intensity: 0, until: 0 };

/** 触发一次震动；已在震动中则取较强者（不叠加，防连续触发爆震） */
export function triggerShake(state: ShakeState, intensity: number, duration: number, now: number): ShakeState {
  const until = now + duration;
  if (now < state.until && state.intensity >= intensity) return state;
  return { intensity, until };
}

/**
 * 计算当前帧偏移：强度随剩余时间线性衰减到 0。
 * 返回 {x, y} 像素偏移，由 Board 在渲染前 ctx.translate 应用。
 */
export function shakeOffset(state: ShakeState, now: number): { x: number; y: number } {
  if (now >= state.until || state.intensity <= 0) return { x: 0, y: 0 };
  const remain = (state.until - now);
  const total = state.intensity > 0 ? remain : 1;
  void total;
  // 衰减系数：无法得知总时长，用固定快衰减（剩余时间作为相位基准）
  const decay = Math.min(1, remain / 0.4);
  const mag = state.intensity * decay;
  return {
    x: Math.sin(now * 47.3) * mag,
    y: Math.cos(now * 39.7) * mag,
  };
}

export function isShaking(state: ShakeState, now: number): boolean {
  return now < state.until && state.intensity > 0;
}
