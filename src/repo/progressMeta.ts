// Meta 经济与抽卡（从 progress.ts 拆分）
import type { EquipSlot } from '../types';
import type { DrawResult } from '../data/config/gacha';
import { FRAG_COST } from '../data/config/gacha';
import type { Progression } from './progress';
import { VIP_LEVELS, VIP_MAX_LEVEL } from '../data/config/vip';

// —— 装备 ——

/** 购买装备：扣除贡献、加入拥有列表（幂等：已拥有则不扣费） */
export function buyEquipment(p: Progression, equipId: string, price: number): Progression | null {
  if (p.ownedEquipment.includes(equipId)) return p;
  if (p.contribution < price) return null;
  return { ...p, contribution: p.contribution - price, ownedEquipment: [...p.ownedEquipment, equipId] };
}

/** 装备/卸下某槽位的法宝（多槽位，设计文档 §9.2） */
export function equipItem(p: Progression, slot: EquipSlot, equipId: string | null): Progression {
  const equipped = { ...p.equipped };
  if (equipId === null) delete equipped[slot];
  else equipped[slot] = equipId;
  return { ...p, equipped };
}

/** 装备强化：消耗碎片提升一级（mod 数值随之放大）；满级或碎片不足返回 null */
export function upgradeEquip(p: Progression, equipId: string, cost: number, maxLevel: number): Progression | null {
  const cur = p.equipLevels[equipId] ?? 0;
  if (cur >= maxLevel) return null;
  if (p.equipFragments < cost) return null;
  return { ...p, equipFragments: p.equipFragments - cost, equipLevels: { ...p.equipLevels, [equipId]: cur + 1 } };
}

// —— 充值 ——

/** 充值获得仙玉（设计文档 §10.2，由 IAPRepo 发货后调用） */
export function grantJade(p: Progression, amount: number): Progression {
  return { ...p, jade: p.jade + amount, totalRecharged: p.totalRecharged + amount };
}

/** 升级天命阶：累计充值达标即升（不扣仙玉）；已满级返回 null */
export function upgradeVip(p: Progression, threshold: number, maxLevel: number): Progression | null {
  if (p.vipLevel >= maxLevel) return null;
  if (p.totalRecharged < threshold) return null;
  return { ...p, vipLevel: p.vipLevel + 1 };
}

/** 仙玉兑换宗门贡献（付费加速软货币获取） */
export function redeemJade(p: Progression, jadeCost: number, contributionGain: number): Progression | null {
  if (p.jade < jadeCost) return null;
  return { ...p, jade: p.jade - jadeCost, contribution: p.contribution + contributionGain };
}

// —— VIP 领取 ——

/** 当前日期 key：YYYY-MM-DD */
export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 当前周 key：YYYY-WW (ISO 周) */
export function weekKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** 领取 VIP 每日奖励 */
export function claimVipDaily(p: Progression): Progression | null {
  const cur = VIP_LEVELS[p.vipLevel];
  if (!cur?.dailyReward) return null;
  if (p.vipDailyClaimed.includes(todayKey())) return null;
  const next = { ...p, vipDailyClaimed: [...p.vipDailyClaimed, todayKey()] };
  const r = cur.dailyReward;
  if (r.jade) next.jade += r.jade;
  if (r.contribution) next.contribution += r.contribution;
  if (r.destinyScrolls) next.destinyScrolls += r.destinyScrolls;
  if (r.soulShards) next.soulShards += r.soulShards;
  return next;
}

/** 领取 VIP 每周奖励 */
export function claimVipWeekly(p: Progression): Progression | null {
  const cur = VIP_LEVELS[p.vipLevel];
  if (!cur?.weeklyReward) return null;
  if (p.vipWeeklyClaimed.includes(weekKey())) return null;
  const next = { ...p, vipWeeklyClaimed: [...p.vipWeeklyClaimed, weekKey()] };
  const r = cur.weeklyReward;
  if (r.jade) next.jade += r.jade;
  if (r.contribution) next.contribution += r.contribution;
  if (r.destinyScrolls) next.destinyScrolls += r.destinyScrolls;
  if (r.soulShards) next.soulShards += r.soulShards;
  return next;
}

/** 领取 VIP 升级一次性礼包 */
export function claimVipOneTime(p: Progression, level: number): Progression | null {
  if (level > p.vipLevel) return null;
  if (p.vipOneTimeClaimed.includes(level)) return null;
  const cfg = VIP_LEVELS[level]?.oneTimeReward;
  if (!cfg) return null;
  const next = { ...p, vipOneTimeClaimed: [...p.vipOneTimeClaimed, level] };
  if (cfg.jade) next.jade += cfg.jade;
  if (cfg.contribution) next.contribution += cfg.contribution;
  return next;
}

/** VIP 直升到目标等级（用于月卡/终身卡批量升级） */
export function upgradeVipTo(p: Progression, targetLevel: number): Progression | null {
  if (targetLevel <= p.vipLevel || targetLevel > VIP_MAX_LEVEL) return null;
  let need = 0;
  for (let l = p.vipLevel + 1; l <= targetLevel; l++) need = VIP_LEVELS[l].upgradeJade;
  if (p.totalRecharged < need) return null;
  return { ...p, vipLevel: targetLevel };
}

// —— 皮肤 ——

/** 购买皮肤（仙玉）；已拥有则不扣费 */
export function buySkin(p: Progression, skinId: string, price: number): Progression | null {
  if (p.ownedSkins.includes(skinId)) return p;
  if (p.jade < price) return null;
  return { ...p, jade: p.jade - price, ownedSkins: [...p.ownedSkins, skinId] };
}

/** 装备/卸下某塔的皮肤 */
export function equipSkin(p: Progression, towerId: string, skinId: string | null): Progression {
  const equippedSkins = { ...p.equippedSkins };
  if (skinId === null) delete equippedSkins[towerId];
  else equippedSkins[towerId] = skinId;
  return { ...p, equippedSkins };
}

// —— 天赋 ——

/** 升级 meta 天赋：扣除贡献；满级或余额不足返回 null */
export function upgradeTalent(p: Progression, talentId: string, cost: number, maxLevel: number): Progression | null {
  const cur = p.talents[talentId] ?? 0;
  if (cur >= maxLevel) return null;
  if (p.contribution < cost) return null;
  return { ...p, contribution: p.contribution - cost, talents: { ...p.talents, [talentId]: cur + 1 } };
}

// —— 抽卡 ——

/** 应用抽奖结果：扣除贡献 + 累加奖励 + 更新保底 + 至宝/装备授予 */
export function applyDraw(p: Progression, cost: number, result: DrawResult, newPity: number): Progression | null {
  if (p.contribution < cost) return null;
  let next = {
    ...p,
    contribution: p.contribution - cost + result.contributionGain,
    soulShards: p.soulShards + result.soulShards,
    destinyScrolls: p.destinyScrolls + result.destinyScrolls,
    equipFragments: p.equipFragments + result.frags,
    gachaPity: newPity,
  };
  if (result.grantedTreasureId) {
    next = grantTreasure(next, result.grantedTreasureId);
  }
  if (result.grantedEquipId) {
    if (!next.ownedEquipment.includes(result.grantedEquipId)) {
      next = { ...next, ownedEquipment: [...next.ownedEquipment, result.grantedEquipId] };
    } else {
      // 重复装备 → 转化为 5 碎片
      next = { ...next, equipFragments: next.equipFragments + 5 };
    }
  }
  return next;
}

/** 消耗碎片合成随机装备（消耗后 remaining 碎片可继续集） */
export function craftEquip(p: Progression, newEquipId: string): Progression | null {
  if (p.equipFragments < FRAG_COST) return null;
  const owned = p.ownedEquipment.includes(newEquipId) ? p.ownedEquipment : [...p.ownedEquipment, newEquipId];
  return { ...p, equipFragments: p.equipFragments - FRAG_COST, ownedEquipment: owned };
}

/** 消耗 1 张天命符（关卡开始前），返回是否成功 */
export function consumeDestiny(p: Progression): { progression: Progression; boosted: boolean } {
  if (p.destinyScrolls <= 0) return { progression: p, boosted: false };
  return { progression: { ...p, destinyScrolls: p.destinyScrolls - 1 }, boosted: true };
}

/** 授予至宝（抽奖获得，幂等） */
export function grantTreasure(p: Progression, treasureId: string): Progression {
  if (p.ownedTreasures.includes(treasureId)) return p;
  return { ...p, ownedTreasures: [...p.ownedTreasures, treasureId] };
}

/** 至宝强化：提升一级；满级或碎片不足返回 null */
export function upgradeTreasure(p: Progression, treasureId: string, cost: number, maxLevel: number): Progression | null {
  const cur = p.treasureLevels[treasureId] ?? 0;
  if (cur >= maxLevel) return null;
  if (p.equipFragments < cost) return null;
  return { ...p, equipFragments: p.equipFragments - cost, treasureLevels: { ...p.treasureLevels, [treasureId]: cur + 1 } };
}

/** 随机法宝改名（新生成的随机法宝存入其生成名） */
export function setGeneratedName(p: Progression, equipId: string, name: string): Progression {
  return { ...p, generatedEquipNames: { ...p.generatedEquipNames, [equipId]: name } };
}

// —— 转生 ——

import type { ManifestEntry } from '../types';

type NoInfer<T> = [T][T extends any ? 0 : never];

/** 判断是否所有关卡均已通关（至少任意难度一次） */
function allLevelsCleared(cleared: Record<string, unknown>, manifest: ReadonlyArray<ManifestEntry>): boolean {
  for (const entry of manifest) {
    const hasAny = Object.keys(cleared).some((k) => k.startsWith(`${entry.levelId}:`));
    if (!hasAny) return false;
  }
  return true;
}

/** 统计全部关卡总星数（所有难度合计） */
function totalStars(cleared: Record<string, { stars: number }>): number {
  let sum = 0;
  for (const k of Object.keys(cleared)) {
    sum += cleared[k].stars;
  }
  return sum;
}

/** 转生：需所有关卡至少通关一次 → 重置关卡进度，保留勋章，奖励仙魂碎片 */
export function reincarnate(
  p: Progression,
  manifest: ReadonlyArray<ManifestEntry>,
): { progression: Progression; soulShardsGained: number } | null {
  if (!allLevelsCleared(p.cleared, manifest)) return null;

  const level = (p.reincarnationLevel ?? 0) + 1;
  const stars = totalStars(p.cleared);
  const soulShardsGained = Math.floor(50 + (level - 1) * 30 + stars * 2);

  // 保留勋章，重置关卡进度和挑战完成度
  const preservedMedals = p.challengeMedals ?? {};

  return {
    progression: {
      ...p,
      reincarnationLevel: level,
      cleared: {},
      difficulty: 'simple' as const,
      endlessBest: null,
      endlessMilestones: [],
      challengesCompleted: {},
      challengeMedals: preservedMedals,
      soulShards: p.soulShards + soulShardsGained,
    },
    soulShardsGained,
  };
}
