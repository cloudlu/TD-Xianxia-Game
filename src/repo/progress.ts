// 玩家进度存取（设计文档 §12 SaveRepo 雏形 / §8.6 星级 / §8.2 解锁）
// 接口 + 本地实现 + 纯函数；联网后换 RemoteSaveRepo，调用方不动。

import type { ManifestEntry, EquipSlot } from '../types';

export interface LevelResult { stars: number; }

/** 玩家存档（设计文档 §12）：通关进度 + meta 货币 + 装备 + 天命阶 + 皮肤 */
export interface Progression {
  cleared: Record<string, LevelResult>;
  contribution: number;        // 宗门贡献（软货币）
  jade: number;                // 仙玉（充值货币）
  vipLevel: number;            // 天命阶
  ownedEquipment: string[];    // 已拥有的装备 id
  equipped: Partial<Record<EquipSlot, string>>;  // 各槽位装备的 id（武器/护甲/饰品）
  equipLevels: Record<string, number>;  // 装备强化等级 id → level
  ownedSkins: string[];        // 已拥有的皮肤 id
  equippedSkins: Record<string, string>; // towerId → skinId
  talents: Record<string, number>;       // talentId → 等级（meta 天赋树）
}

export interface SaveRepo {
  load(): Progression;
  save(p: Progression): void;
}

const KEY = 'xianxia-td:progress-v1';

export function withDefaults(raw: Partial<Progression>): Progression {
  return {
    cleared: raw.cleared ?? {},
    contribution: raw.contribution ?? 0,
    jade: raw.jade ?? 0,
    vipLevel: raw.vipLevel ?? 0,
    ownedEquipment: raw.ownedEquipment ?? [],
    equipped: raw.equipped ?? ((raw as Record<string, unknown>).equippedWeapon ? { weapon: (raw as Record<string, unknown>).equippedWeapon as string } : {}),
    equipLevels: raw.equipLevels ?? {},
    ownedSkins: raw.ownedSkins ?? [],
    equippedSkins: raw.equippedSkins ?? {},
    talents: raw.talents ?? {},
  };
}

export class LocalSaveRepo implements SaveRepo {
  constructor(private readonly key: string = KEY) {}
  load(): Progression {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? withDefaults(JSON.parse(raw) as Partial<Progression>) : withDefaults({});
    } catch {
      return withDefaults({});
    }
  }
  save(p: Progression): void {
    try { localStorage.setItem(this.key, JSON.stringify(p)); } catch { /* 配额禁用等，静默 */ }
  }
}

/** 关卡是否解锁：首关恒解锁，其余需前一关通关 */
export function isUnlocked(
  manifest: ReadonlyArray<ManifestEntry>, index: number, p: Progression,
): boolean {
  if (index <= 0) return true;
  return Object.hasOwn(p.cleared, manifest[index - 1].levelId);
}

/** 通关星级（设计文档 §8.6）：无漏怪 3★ / 剩余≥60% 2★ / 通关 1★ */
export function computeStars(livesRemaining: number, startLives: number): number {
  if (livesRemaining >= startLives) return 3;
  if (livesRemaining / startLives >= 0.6) return 2;
  return 1;
}

/** 记录结果，保留历史最高星（不可回退） */
export function recordResult(p: Progression, levelId: string, stars: number): Progression {
  const prev = p.cleared[levelId]?.stars ?? 0;
  return { ...p, cleared: { ...p.cleared, [levelId]: { stars: Math.max(prev, stars) } } };
}

/** 关卡通关产出宗门贡献：基础 + 星级加成（设计文档 §10.2） */
export function awardContribution(p: Progression, stars: number, base = 20, perStar = 10): Progression {
  return { ...p, contribution: p.contribution + base + stars * perStar };
}

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

/** 充值获得仙玉（设计文档 §10.2，由 IAPRepo 发货后调用） */
export function grantJade(p: Progression, amount: number): Progression {
  return { ...p, jade: p.jade + amount };
}

/** 升级天命阶：扣除仙玉；余额不足或已满级返回 null */
export function upgradeVip(p: Progression, cost: number, maxLevel: number): Progression | null {
  if (p.vipLevel >= maxLevel) return null;
  if (p.jade < cost) return null;
  return { ...p, jade: p.jade - cost, vipLevel: p.vipLevel + 1 };
}

/** 仙玉兑换宗门贡献（付费加速软货币获取） */
export function redeemJade(p: Progression, jadeCost: number, contributionGain: number): Progression | null {
  if (p.jade < jadeCost) return null;
  return { ...p, jade: p.jade - jadeCost, contribution: p.contribution + contributionGain };
}

/** 装备强化：提升一级（mod 数值随之放大）；满级或贡献不足返回 null */
export function upgradeEquip(p: Progression, equipId: string, cost: number, maxLevel: number): Progression | null {
  const cur = p.equipLevels[equipId] ?? 0;
  if (cur >= maxLevel) return null;
  if (p.contribution < cost) return null;
  return { ...p, contribution: p.contribution - cost, equipLevels: { ...p.equipLevels, [equipId]: cur + 1 } };
}

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

/** 升级 meta 天赋：扣除贡献；满级或余额不足返回 null */
export function upgradeTalent(p: Progression, talentId: string, cost: number, maxLevel: number): Progression | null {
  const cur = p.talents[talentId] ?? 0;
  if (cur >= maxLevel) return null;
  if (p.contribution < cost) return null;
  return { ...p, contribution: p.contribution - cost, talents: { ...p.talents, [talentId]: cur + 1 } };
}

