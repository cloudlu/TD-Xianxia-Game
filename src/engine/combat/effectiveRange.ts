import type { FormationType } from '../../types';

/** 风阵阵眼提供的射程加成（格） */
export const WIND_RANGE_ADD = 1.5;

/** 塔最终射程：基础 + 全局射程加成（mods）+ 风阵阵眼加成。唯一计算有效射程的地方，攻击/破隐/光环/UI 全部复用，防止不一致。 */
export function towerRange(baseRange: number, modsRangeAdd: number, onFormation?: FormationType | null): number {
  const fmtAdd = onFormation === 'wind' ? WIND_RANGE_ADD : 0;
  return Math.round((baseRange + modsRangeAdd + fmtAdd) * 10) / 10;
}
