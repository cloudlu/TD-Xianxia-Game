import type { Modifier } from '../Modifier';
import type { EquipSlot } from '../../types';

export interface EquipmentConfig {
  id: string;
  name: string;
  desc: string;
  slot: EquipSlot;        // 装备槽位（设计文档 §9.2）
  price: number;          // 宗门贡献价格
  mods: Modifier[];
}

export const SLOTS: ReadonlyArray<{ key: EquipSlot; label: string }> = [
  { key: 'weapon', label: '本命法宝' },
  { key: 'armor', label: '护体法衣' },
  { key: 'accessory', label: '随身灵物' },
];

// 法宝（设计文档 §9.2 / 装备与皮肤设计.md）—— 三槽位，流派/通用/经济混合
export const EQUIPMENT: Record<string, EquipmentConfig> = {
  // —— 本命法宝（武器槽：流派伤害）——
  green_lotus: {
    id: 'green_lotus', name: '青莲剑', desc: '剑修伤害 +15%', slot: 'weapon',
    price: 60, mods: [{ stat: 'swordDmg', op: 'mul_pct', value: 0.15 } as Modifier],
  },
  talisman_jade: {
    id: 'talisman_jade', name: '符玉', desc: '符箓伤害 +15%', slot: 'weapon',
    price: 60, mods: [{ stat: 'talismanDmg', op: 'mul_pct', value: 0.15 } as Modifier],
  },
  spear_halberd: {
    id: 'spear_halberd', name: '方天画戟', desc: '长枪伤害 +15%', slot: 'weapon',
    price: 60, mods: [{ stat: 'spearDmg', op: 'mul_pct', value: 0.15 } as Modifier],
  },
  spirit_flame: {
    id: 'spirit_flame', name: '灵火珠', desc: '法术伤害 +15%（火法/雷法）', slot: 'weapon',
    price: 70, mods: [{ stat: 'magicDmg', op: 'mul_pct', value: 0.15 } as Modifier],
  },
  // —— 通用法宝（增幅全塔，适合混搭流）——
  hunyuan_pearl: {
    id: 'hunyuan_pearl', name: '混元珠', desc: '全体伤害 +10%（全流派通用）', slot: 'weapon',
    price: 100, mods: [{ stat: 'dmg', op: 'mul_pct', value: 0.10 } as Modifier],
  },
  qiankun_mirror: {
    id: 'qiankun_mirror', name: '乾坤镜', desc: '全体射程 +0.5，暴击 +5%', slot: 'weapon',
    price: 150, mods: [
      { stat: 'range', op: 'add', value: 0.5 } as Modifier,
      { stat: 'crit', op: 'add', value: 0.05 } as Modifier,
    ],
  },
  xuantian_blade: {
    id: 'xuantian_blade', name: '玄天剑', desc: '全体伤害 +8%，攻速 +5%（通用混合）', slot: 'weapon',
    price: 180, mods: [
      { stat: 'dmg', op: 'mul_pct', value: 0.08 } as Modifier,
      { stat: 'rate', op: 'mul_pct', value: 0.05 } as Modifier,
    ],
  },
  // —— 护体法衣（护甲槽：通用生存/输出）——
  spirit_vest: {
    id: 'spirit_vest', name: '聚灵法衣', desc: '全体攻速 +10%', slot: 'armor',
    price: 110, mods: [{ stat: 'rate', op: 'mul_pct', value: 0.10 } as Modifier],
  },
  golden_bell: {
    id: 'golden_bell', name: '金钟罩', desc: '全体伤害 +10%', slot: 'armor',
    price: 130, mods: [{ stat: 'dmg', op: 'mul_pct', value: 0.10 } as Modifier],
  },
  // —— 随身灵物（饰品槽：经济/全能）——
  lucky_charm: {
    id: 'lucky_charm', name: '招财符', desc: '赏金 +15%', slot: 'accessory',
    price: 90, mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.15 } as Modifier],
  },
  heaven_seal: {
    id: 'heaven_seal', name: '天命玉玺', desc: '全体伤害 +12%，赏金 +10%', slot: 'accessory',
    price: 220, mods: [
      { stat: 'dmg', op: 'mul_pct', value: 0.12 } as Modifier,
      { stat: 'bountyMul', op: 'mul_pct', value: 0.10 } as Modifier,
    ],
  },
};

export const EQUIPMENT_IDS = Object.keys(EQUIPMENT);
