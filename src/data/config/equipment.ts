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
    id: 'spirit_flame', name: '灵火珠', desc: '火法伤害 +15%', slot: 'weapon',
    price: 70, mods: [{ stat: 'fireDmg', op: 'mul_pct', value: 0.15 } as Modifier],
  },
  thunder_orb: {
    id: 'thunder_orb', name: '雷灵珠', desc: '雷法伤害 +15%', slot: 'weapon',
    price: 70, mods: [{ stat: 'thunderDmg', op: 'mul_pct', value: 0.15 } as Modifier],
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

// —— 随机法宝生成（设计文档：seed/slot/stats/name 均随机，定后不变）——

export const RANDOM_STAT_POOL = ['dmg', 'swordDmg', 'rate', 'range', 'crit', 'bountyMul'] as const;

const NAME_PREFIXES = ['玄铁', '精钢', '赤铜', '寒铁', '陨星', '天外', '紫金', '青玄', '元磁', '太极'];
const NAME_BASES: Record<EquipSlot, string[]> = {
  weapon: ['剑', '刀', '戟', '斧', '枪', '棍', '锤'],
  armor: ['法衣', '道袍', '金甲', '玄甲', '法袍'],
  accessory: ['珠', '环', '镜', '印', '铃', '幡', '佩'],
};
const NAME_SUFFIXES = ['精锐', '良工', '极品', '完美', '超凡', '卓越', '无双'];

const STAT_COUNT_WEIGHTS = [0.10, 0.40, 0.35, 0.15];

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function weightedPick(weights: number[], rng: () => number): number {
  const roll = rng();
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (roll < acc) return i;
  }
  return weights.length - 1;
}

function randomName(slot: EquipSlot, rng: () => number): string {
  const prefix = pick(NAME_PREFIXES, rng);
  const base = pick(NAME_BASES[slot], rng);
  const suffix = pick(NAME_SUFFIXES, rng);
  return `${prefix}${base}·${suffix}`;
}

function modValueRange(statCount: number): { min: number; max: number } {
  return statCount < 4 ? { min: 0.06, max: 0.14 } : { min: 0.04, max: 0.10 };
}

function randomModValue(min: number, max: number, rng: () => number): number {
  return Math.round((min + rng() * (max - min)) * 100) / 100;
}

function pickSlot(rng: () => number): EquipSlot {
  const slots: EquipSlot[] = ['weapon', 'armor', 'accessory'];
  return pick(slots, rng);
}

function generateEquipId(existingIds: Set<string>, rng: () => number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let attempt = 0; attempt < 100; attempt++) {
    let id = 'gen_';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(rng() * chars.length)];
    if (!existingIds.has(id)) return id;
  }
  return `gen_${Date.now()}`;
}

export function generateRandomEquip(
  existingIds: Set<string>,
  rng: () => number,
): { config: EquipmentConfig; generatedName: string } {
  const id = generateEquipId(existingIds, rng);
  const slot = pickSlot(rng);
  const name = randomName(slot, rng);
  const statCount = weightedPick(STAT_COUNT_WEIGHTS, rng) + 1;
  const { min, max } = modValueRange(statCount);

  const pool = [...RANDOM_STAT_POOL];
  const chosenStats: string[] = [];
  for (let i = 0; i < statCount; i++) {
    const idx = Math.floor(rng() * pool.length);
    chosenStats.push(pool[idx]);
    pool.splice(idx, 1);
  }

  const mods: Modifier[] = chosenStats.map((stat) => {
    const value = randomModValue(min, max, rng);
    const op: 'mul_pct' | 'add' = (stat === 'range' || stat === 'crit') ? 'add' : 'mul_pct';
    return { stat, op, value };
  });

  const desc = mods.map((m) => {
    const label: Record<string, string> = { dmg: '全体伤害', swordDmg: '剑修伤害', rate: '攻速', range: '射程', crit: '暴击', bountyMul: '赏金' };
    const v = m.op === 'add' ? `+${m.value}` : `+${Math.round(m.value * 100)}%`;
    return `${label[m.stat] ?? m.stat} ${v}`;
  }).join('，');

  return {
    config: { id, name, desc, slot, price: 0, mods },
    generatedName: name,
  };
}
