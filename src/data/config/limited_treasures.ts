import type { Modifier } from '../Modifier';
import type { EquipSlot } from '../../types';

export interface LimitedTreasureConfig {
  id: string;
  name: string;
  tier: 'mythic';
  slot: EquipSlot;
  icon: string;
  color: string;
  glow: 'golden';
  desc: string;
  lore: string;
  mods: Modifier[];
  uniqueMods: Modifier[];
  upgradeCostMultiplier: number;
}

export const LIMITED_TREASURES: Record<string, LimitedTreasureConfig> = {
  chaos_orb: {
    id: 'chaos_orb', name: '混沌灵珠', tier: 'mythic', slot: 'accessory',
    icon: '🔮', color: '#9b59b6', glow: 'golden',
    desc: '太古鸿蒙之气凝结的灵珠，有逆转阴阳之能。',
    lore: '盘古开天时一缕混沌之气所化，蕴含天道至理。',
    mods: [
      { stat: 'dmg', op: 'mul_pct', value: 0.15 },
      { stat: 'rate', op: 'mul_pct', value: 0.08 },
    ],
    uniqueMods: [
      { stat: 'doubleAtkChance', op: 'add', value: 0.20 },
    ],
    upgradeCostMultiplier: 2.0,
  },
  primordial_qi: {
    id: 'primordial_qi', name: '鸿蒙紫气', tier: 'mythic', slot: 'weapon',
    icon: '🟣', color: '#8e44ad', glow: 'golden',
    desc: '天地初开时的第一缕紫气，每击杀 10 敌全塔 +3% 伤害（本关叠加）。',
    lore: '鸿蒙未判，紫气东来。得此气者，越战越强。',
    mods: [
      { stat: 'dmg', op: 'mul_pct', value: 0.12 },
    ],
    uniqueMods: [
      { stat: 'killStackDmg', op: 'mul_pct', value: 0.03 },
      { stat: 'killStackCap', op: 'add', value: 50 },
    ],
    upgradeCostMultiplier: 2.0,
  },
  sky_cleaver: {
    id: 'sky_cleaver', name: '开天斧', tier: 'mythic', slot: 'weapon',
    icon: '🪓', color: '#e67e22', glow: 'golden',
    desc: '相传为盘古开天所用，无视敌人 50% 护甲。',
    lore: '一斧开天，万法破灭。',
    mods: [
      { stat: 'dmg', op: 'mul_pct', value: 0.18 },
    ],
    uniqueMods: [
      { stat: 'armorPierce', op: 'mul_pct', value: 0.50 },
    ],
    upgradeCostMultiplier: 2.0,
  },
  creation_jade: {
    id: 'creation_jade', name: '造化玉蝶', tier: 'mythic', slot: 'armor',
    icon: '💎', color: '#1abc9c', glow: 'golden',
    desc: '记载天地造化的玉蝶，每波清完后返还 20% 已消耗灵石。',
    lore: '造化之道，生生不息。',
    mods: [
      { stat: 'dmg', op: 'mul_pct', value: 0.08 },
      { stat: 'rate', op: 'mul_pct', value: 0.05 },
    ],
    uniqueMods: [
      { stat: 'waveRefund', op: 'mul_pct', value: 0.20 },
    ],
    upgradeCostMultiplier: 2.0,
  },
  immortal_pearl: {
    id: 'immortal_pearl', name: '不灭灵珠', tier: 'mythic', slot: 'armor',
    icon: '🟢', color: '#2ecc71', glow: 'golden',
    desc: '蕴含不灭之力的灵珠，漏怪不扣血改为扣 30 灵石/只。',
    lore: '灵珠不灭，山门不倒。',
    mods: [
      { stat: 'dmg', op: 'mul_pct', value: 0.10 },
    ],
    uniqueMods: [
      { stat: 'leakToStone', op: 'add', value: 30 },
    ],
    upgradeCostMultiplier: 2.0,
  },
  timespace_mirror: {
    id: 'timespace_mirror', name: '时空镜', tier: 'mythic', slot: 'accessory',
    icon: '🪞', color: '#3498db', glow: 'golden',
    desc: '窥探时空之力的古镜，全图敌人减速 40% 并倒流 2 格。',
    lore: '时空交错，因果逆转。',
    mods: [
      { stat: 'rate', op: 'mul_pct', value: 0.12 },
      { stat: 'range', op: 'add', value: 0.8 },
    ],
    uniqueMods: [
      { stat: 'enemySlowAura', op: 'mul_pct', value: 0.40 },
      { stat: 'enemyPullBack', op: 'add', value: 2 },
    ],
    upgradeCostMultiplier: 2.0,
  },
  star_chart: {
    id: 'star_chart', name: '星辰图', tier: 'mythic', slot: 'accessory',
    icon: '⭐', color: '#f1c40f', glow: 'golden',
    desc: '描绘周天星辰的图谱，塔射程内每有 1 敌 +2% 攻速。',
    lore: '星辰运转，道法自然。',
    mods: [
      { stat: 'rate', op: 'mul_pct', value: 0.10 },
    ],
    uniqueMods: [
      { stat: 'densityRate', op: 'mul_pct', value: 0.02 },
    ],
    upgradeCostMultiplier: 2.0,
  },
  five_elements: {
    id: 'five_elements', name: '五行盘', tier: 'mythic', slot: 'armor',
    icon: '🔄', color: '#e74c3c', glow: 'golden',
    desc: '蕴含五行相生之理的阵盘，五行克制效果提升至 1.5 倍。',
    lore: '五行流转，相生相克。',
    mods: [
      { stat: 'dmg', op: 'mul_pct', value: 0.10 },
      { stat: 'swordDmg', op: 'mul_pct', value: 0.08 },
    ],
    uniqueMods: [
      { stat: 'elementBonus', op: 'mul_pct', value: 0.30 },
    ],
    upgradeCostMultiplier: 2.0,
  },
  demon_stele: {
    id: 'demon_stele', name: '镇魔碑', tier: 'mythic', slot: 'weapon',
    icon: '🗿', color: '#34495e', glow: 'golden',
    desc: '刻满镇魔符文的古碑，BOSS 技能冷却时间 +50%。',
    lore: '镇魔碑立，万邪不侵。',
    mods: [
      { stat: 'dmg', op: 'mul_pct', value: 0.12 },
    ],
    uniqueMods: [
      { stat: 'bossCooldown', op: 'mul_pct', value: 0.50 },
    ],
    upgradeCostMultiplier: 2.0,
  },
  beast_tome: {
    id: 'beast_tome', name: '万兽图', tier: 'mythic', slot: 'accessory',
    icon: '🐉', color: '#16a085', glow: 'golden',
    desc: '封印万兽之灵的图卷，召唤 1 只灵兽协助战斗。',
    lore: '万兽朝宗，为我所用。',
    mods: [
      { stat: 'dmg', op: 'mul_pct', value: 0.08 },
    ],
    uniqueMods: [
      { stat: 'petSummon', op: 'add', value: 1 },
    ],
    upgradeCostMultiplier: 2.0,
  },
  merit_wheel: {
    id: 'merit_wheel', name: '功德轮', tier: 'mythic', slot: 'armor',
    icon: '☸️', color: '#f39c12', glow: 'golden',
    desc: '积累功德的无上法器，每次通关额外获得 50% 贡献。',
    lore: '功德无量，福泽绵长。',
    mods: [
      { stat: 'bountyMul', op: 'mul_pct', value: 0.15 },
    ],
    uniqueMods: [
      { stat: 'contribBonus', op: 'mul_pct', value: 0.50 },
    ],
    upgradeCostMultiplier: 2.0,
  },
  heavenly_mandate: {
    id: 'heavenly_mandate', name: '天道令', tier: 'mythic', slot: 'accessory',
    icon: '📜', color: '#c0392b', glow: 'golden',
    desc: '代天行道的至高法令，本局可选择第 4 个天命符效果（+15% 伤害，不消耗天命符）。',
    lore: '天道昭昭，令行如山。',
    mods: [
      { stat: 'dmg', op: 'mul_pct', value: 0.08 },
      { stat: 'rate', op: 'mul_pct', value: 0.05 },
    ],
    uniqueMods: [
      { stat: 'extraDestiny', op: 'add', value: 1 },
    ],
    upgradeCostMultiplier: 2.0,
  },
};

export const LIMITED_TREASURE_IDS = Object.keys(LIMITED_TREASURES);
