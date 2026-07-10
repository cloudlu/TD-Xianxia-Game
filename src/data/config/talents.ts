import type { Modifier } from '../Modifier';

/** 天赋 op 类型（百分比 or 扁平） */
export type TalentOp = 'mul_pct' | 'add';

/** 单条 meta 天赋（宗门贡献升级的永久加成，走 Modifier 管线） */
export interface TalentConfig {
  id: string;
  name: string;
  desc: string;
  stat: string;        // 命中的 Modifier stat
  op: TalentOp;
  perLevel: number;    // 每级增量
  maxLevel: number;
  baseCost: number;    // 第 1 级的贡献花费（按 1.5^level 增长）
}

export const TALENTS: Record<string, TalentConfig> = {
  sword_mastery:    { id: 'sword_mastery',    name: '剑修精通', desc: '剑修伤害',    stat: 'swordDmg',    op: 'mul_pct', perLevel: 0.05, maxLevel: 5, baseCost: 40 },
  talisman_mastery: { id: 'talisman_mastery', name: '符箓精通', desc: '符箓伤害',    stat: 'talismanDmg', op: 'mul_pct', perLevel: 0.05, maxLevel: 5, baseCost: 40 },
  spear_mastery:    { id: 'spear_mastery',    name: '长枪精通', desc: '长枪伤害',    stat: 'spearDmg',    op: 'mul_pct', perLevel: 0.05, maxLevel: 5, baseCost: 40 },
  fire_mastery:     { id: 'fire_mastery',     name: '火法精通', desc: '火法伤害',    stat: 'fireDmg',     op: 'mul_pct', perLevel: 0.05, maxLevel: 5, baseCost: 40 },
  thunder_mastery:  { id: 'thunder_mastery',  name: '雷法精通', desc: '雷法伤害',    stat: 'thunderDmg',  op: 'mul_pct', perLevel: 0.05, maxLevel: 5, baseCost: 40 },
  ice_mastery:      { id: 'ice_mastery',      name: '冰修精通', desc: '冰修伤害',    stat: 'iceDmg',      op: 'mul_pct', perLevel: 0.05, maxLevel: 5, baseCost: 40 },
  swift:            { id: 'swift',            name: '神速',     desc: '全体攻速',    stat: 'rate',        op: 'mul_pct', perLevel: 0.04, maxLevel: 5, baseCost: 50 },
  bounty_talent:    { id: 'bounty_talent',    name: '厚赏',     desc: '击杀赏金',    stat: 'bountyMul',   op: 'mul_pct', perLevel: 0.05, maxLevel: 5, baseCost: 50 },
  crit_talent:      { id: 'crit_talent',      name: '暴击专精', desc: '暴击率',      stat: 'crit',        op: 'add',     perLevel: 0.05, maxLevel: 4, baseCost: 80 },
  range_talent:     { id: 'range_talent',     name: '灵目',     desc: '射程',        stat: 'range',       op: 'add',     perLevel: 0.3,  maxLevel: 4, baseCost: 70 },
};

export const TALENT_IDS = Object.keys(TALENTS);

/** 升到下一级（currentLevel → currentLevel+1）的贡献花费 */
export function talentCost(t: TalentConfig, currentLevel: number): number {
  return Math.round(t.baseCost * Math.pow(1.5, currentLevel));
}

/** 由天赋状态（id → 等级）产出 Modifier[]：每条 = perLevel × 当前等级 */
export function talentMods(state: Readonly<Record<string, number>>): Modifier[] {
  const mods: Modifier[] = [];
  for (const id of TALENT_IDS) {
    const t = TALENTS[id];
    const lvl = state[id] ?? 0;
    if (lvl > 0) mods.push({ stat: t.stat, op: t.op, value: t.perLevel * lvl });
  }
  return mods;
}
