import type { Modifier } from '../Modifier';

/** 天命阶（VIP）等级配置（设计文档 §9.4）—— mods 为该等级的累计总加成 */
export interface VipLevelConfig {
  level: number;
  name: string;
  upgradeJade: number;   // 从上一级升到本级所需仙玉
  mods: Modifier[];      // 该等级累计加成（走 Modifier 管线）
  perks: string[];       // 文案展示
}

export const VIP_LEVELS: readonly VipLevelConfig[] = [
  { level: 0, name: '凡人', upgradeJade: 0, mods: [], perks: ['无加成'] },
  { level: 1, name: '天命一阶', upgradeJade: 60, mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.10 }],
    perks: ['赏金 +10%'] },
  { level: 2, name: '天命二阶', upgradeJade: 120,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.15 }, { stat: 'rate', op: 'mul_pct', value: 0.05 }],
    perks: ['赏金 +15%', '攻速 +5%'] },
  { level: 3, name: '天命三阶', upgradeJade: 240,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.20 }, { stat: 'rate', op: 'mul_pct', value: 0.08 }, { stat: 'dmg', op: 'mul_pct', value: 0.08 }],
    perks: ['赏金 +20%', '攻速 +8%', '全体伤害 +8%'] },
];

export const VIP_MAX_LEVEL = VIP_LEVELS.length - 1;
