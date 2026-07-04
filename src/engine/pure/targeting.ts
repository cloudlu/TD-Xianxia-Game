// 目标选择 AI 的纯函数（设计文档 §4.6①）
import type { TargetPolicy } from '../../types';

/** 目标需要暴露给选择策略的最小信息 */
export interface TargetInfo {
  dist: number;   // 沿路径已走距离（越大越接近出口）
  hp: number;
}

/**
 * 把候选目标映射为"优先级 key"，取最大者即为选定目标。
 * 统一成"越大越优先"，避免外层为每种策略写分支。
 */
export function targetPriorityKey(policy: TargetPolicy, e: TargetInfo): number {
  switch (policy) {
    case 'first':      return e.dist;     // 最接近出口
    case 'last':       return -e.dist;    // 最刚出生
    case 'strongest':  return e.hp;       // 血最多
    case 'nearest':    return -e.dist;    // （近似：路径进度兜底）
  }
}
