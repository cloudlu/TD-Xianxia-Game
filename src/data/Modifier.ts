// Modifier 管线（设计文档 §9.5）：所有玩家加成（装备/皮肤/VIP/meta 天赋）的统一结算。
// 纯函数 + 不可变集合，便于单测；战斗侧通过 effectiveStats 消费。
//
// 运算规范：
// - 两类操作：add（扁平加成）、mul_pct（百分比，同 stat 加法叠加 Σ）
// - 跨 stat：同性质伤害 stat（dmg + 流派Dmg）加法合并为一个有效乘子后再封顶（禁相乘）
// - 按 stat 分级封顶，防膨胀

export type ModOp = 'add' | 'mul_pct';
export interface Modifier {
  stat: string;       // 如 'dmg' / 'swordDmg' / 'rate' / 'bountyMul' / 'crit' / 'range'
  op: ModOp;
  value: number;
}

/** 某流派塔适用的伤害 stat 家族（通用 dmg + 流派专精） */
export function damageStatsFor(school: string): string[] {
  return ['dmg', `${school}Dmg`];
}

/** 封顶配置（设计文档 §9.5 按 stat 分级） */
export const CAPS = {
  damage: 1.5,   // 伤害类合并后 +150%
  rate: 0.6,     // 攻速 +60%
  bounty: 0.8,   // 赏金/经济 +80%
  crit: 0.6,     // 暴击率绝对值 ≤0.6
  range: 2.0,    // 射程扁平加成 ≤2.0 格
  doubleAtk: 1.0,   // 双重攻击概率 ≤100%
  armorPierce: 1.0, // 护甲穿透 ≤100%
  waveRefund: 1.0,  // 清波返还 ≤100%
  densityRate: 3.0, // 密度攻速 ≤+300%
  bossCd: 5.0,      // BOSS 冷却延长 ≤500%
  extraDestiny: 3,  // 额外天命符位 ≤3
} as const;

/** 不可变的修饰器集合：把多件装备/VIP/天赋的 mods 合并查询 */
export class ModifierSet {
  static readonly empty = new ModifierSet([]);

  constructor(private readonly mods: readonly Modifier[]) {}

  /** 合并多个来源的 mods 为一个集合 */
  static merge(sources: ReadonlyArray<ReadonlyArray<Modifier>>): ModifierSet {
    const flat: Modifier[] = [];
    for (const s of sources) for (const m of s) flat.push(m);
    return new ModifierSet(flat);
  }

  /** 该 stat 的百分比加成总和（加法叠加） */
  pctFor(stat: string): number {
    let sum = 0;
    for (const m of this.mods) if (m.stat === stat && m.op === 'mul_pct') sum += m.value;
    return sum;
  }

  /** 该 stat 的扁平加成总和 */
  addFor(stat: string): number {
    let sum = 0;
    for (const m of this.mods) if (m.stat === stat && m.op === 'add') sum += m.value;
    return sum;
  }

  /** 合并的伤害乘子：同性质伤害 stat 加法合并后封顶 → 返回 1+… */
  damageMul(damageStats: readonly string[], cap: number = CAPS.damage): number {
    let sum = 0;
    for (const st of damageStats) sum += this.pctFor(st);
    return 1 + Math.min(sum, cap);
  }

  /** 攻速乘子（1+min(rate, cap)） */
  rateMul(cap: number = CAPS.rate): number { return 1 + Math.min(this.pctFor('rate'), cap); }

  /** 赏金乘子（1+min(bountyMul, cap)） */
  bountyMul(cap: number = CAPS.bounty): number { return 1 + Math.min(this.pctFor('bountyMul'), cap); }

  /** 暴击率加成（绝对值，封顶） */
  critBonus(cap: number = CAPS.crit): number { return Math.min(this.addFor('crit'), cap); }

  /** 射程扁平加成（格，封顶） */
  rangeAdd(cap: number = CAPS.range): number { return Math.min(this.addFor('range'), cap); }

  // —— 限定至宝专用 stat（设计文档 §9.6） ——

  /** 双重攻击概率（绝对值，≤100%） */
  doubleAtkChance(cap: number = CAPS.doubleAtk): number { return Math.min(this.addFor('doubleAtkChance'), cap); }

  /** 护甲穿透比例（+100% = 无视全部护甲） */
  armorPierce(cap: number = CAPS.armorPierce): number { return Math.min(this.pctFor('armorPierce'), cap); }

  /** 灵石清波返还比例 */
  waveRefund(cap: number = CAPS.waveRefund): number { return Math.min(this.pctFor('waveRefund'), cap); }

  /** 漏怪扣灵石量（扁平） */
  leakToStone(): number { return this.addFor('leakToStone'); }

  /** 密度攻速：范围内每多一个敌人 +N% 攻速（mul_pct 累计，封顶） */
  densityRate(cap: number = CAPS.densityRate): number { return Math.min(this.pctFor('densityRate'), cap); }

  /** BOSS 技能冷却延长乘子（1 + 累计百分比，封顶） */
  bossCooldownMul(cap: number = CAPS.bossCd): number { return 1 + Math.min(this.pctFor('bossCooldown'), cap); }

  /** 仙魂独立乘数：1 + sqrt(碎片数) × 0.008（由 state.ts 填入 _soulMul stat） */
  soulShardMul(): number { return 1 + this.pctFor('_soulMul'); }

  /** 贡献收益加成乘子（1 + 累计百分比） */
  contribBonus(): number { return 1 + this.pctFor('contribBonus'); }

  /** 额外天命符位（扁平，封顶） */
  extraDestiny(cap: number = CAPS.extraDestiny): number { return Math.min(this.addFor('extraDestiny'), cap); }

  /** 击杀叠伤成长率（每层 +N%，mul_pct） */
  killStackDmgPer(): number { return this.pctFor('killStackDmg'); }

  /** 击杀叠伤上限层数（从 killStackCap stat 读，add，缺省 0 = 不限制） */
  killStackCap(): number { return this.addFor('killStackCap'); }

  /** 全局敌减速倍率（mul_pct：0.4 = 移速 ×0.6） */
  enemySlowAura(): number { return 1 - Math.min(this.pctFor('enemySlowAura'), 0.8); }

  /** 倒流格数（扁平） */
  enemyPullBack(): number { return this.addFor('enemyPullBack'); }

  /** 五行克制加成（mul_pct，未来元素系统用） */
  elementBonus(): number { return 1 + this.pctFor('elementBonus'); }

  /** 召唤灵兽数量（扁平） */
  petSummonCount(): number { return this.addFor('petSummon'); }
}
