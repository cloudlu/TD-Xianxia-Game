// 玩家进度存取（设计文档 §12 SaveRepo 雏形 / §8.6 星级 / §8.2 解锁）
// 接口 + 本地实现 + 纯函数；联网后换 RemoteSaveRepo，调用方不动。

import type { ManifestEntry, EquipSlot, Difficulty } from '../types';
import { DIFFICULTY_MUL } from '../types';
import type { DrawResult } from '../data/config/gacha';
import { FRAG_COST } from '../data/config/gacha';

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
  difficulty: Difficulty;               // 难度模式（默认 normal）
  endlessBest: { wave: number; score: number; date: string } | null;   // 无尽模式最高分
  endlessMilestones: number[];           // 已达成的无尽里程碑波次
  // —— 寻仙抽卡 ——
  soulShards: number;        // 仙魂碎片（每5个 +1% 全体伤害，走 Modifier）
  destinyScrolls: number;    // 天命符（下次进关 consume 1 = +15% 伤害）
  equipFragments: number;    // 装备碎片（集满30合成随机限定法宝）
  gachaPity: number;         // 抽卡保底计数（10=必出稀有）
}

export interface SaveRepo {
  load(): Progression;
  save(p: Progression): void;
}

const KEY = 'xianxia-td:progress-v1';

export function withDefaults(raw: Partial<Progression>): Progression {
  // 迁移旧的单 key 存档（无难度维度）→ key:normal
  const rawCleared: Record<string, { stars: number }> = raw.cleared ?? ({} as Record<string, { stars: number }>);
  const migrated: Record<string, { stars: number }> = {};
  for (const k of Object.keys(rawCleared)) {
    if (k.includes(':')) { migrated[k] = rawCleared[k]; }
    else { migrated[clearedKey(k, 'normal')] = rawCleared[k]; }
  }
  return {
    cleared: migrated,
    contribution: raw.contribution ?? 0,
    jade: raw.jade ?? 0,
    vipLevel: raw.vipLevel ?? 0,
    ownedEquipment: raw.ownedEquipment ?? [],
    equipped: raw.equipped ?? ((raw as Record<string, unknown>).equippedWeapon ? { weapon: (raw as Record<string, unknown>).equippedWeapon as string } : {}),
    equipLevels: raw.equipLevels ?? {},
    ownedSkins: raw.ownedSkins ?? [],
    equippedSkins: raw.equippedSkins ?? {},
    talents: raw.talents ?? {},
    difficulty: (raw as Record<string, unknown>).difficulty as Difficulty ?? 'normal',
    endlessBest: (raw as Record<string, unknown>).endlessBest as Progression['endlessBest'] ?? null,
    endlessMilestones: (raw as Record<string, unknown>).endlessMilestones as number[] ?? [],
    soulShards: (raw as Record<string, unknown>).soulShards as number ?? 0,
    destinyScrolls: (raw as Record<string, unknown>).destinyScrolls as number ?? 0,
    equipFragments: (raw as Record<string, unknown>).equipFragments as number ?? 0,
    gachaPity: (raw as Record<string, unknown>).gachaPity as number ?? 0,
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

const DIFFICULTY_ORDER: readonly Difficulty[] = ['simple', 'normal', 'hard'];
function prevDifficulty(d: Difficulty): Difficulty | null {
  const i = DIFFICULTY_ORDER.indexOf(d);
  return i > 0 ? DIFFICULTY_ORDER[i - 1] : null;
}

/** 按难度组成 cleared key */
export function clearedKey(levelId: string, difficulty: Difficulty): string {
  return `${levelId}:${difficulty}`;
}

/** 某关在某难度下是否已通关 */
export function isClearedOn(p: Progression, levelId: string, difficulty: Difficulty): boolean {
  return Object.hasOwn(p.cleared, clearedKey(levelId, difficulty));
}

/** 关卡是否解锁（按难度）：链式推进 + 难度递进 */
export function isUnlocked(
  manifest: ReadonlyArray<ManifestEntry>, index: number, p: Progression, difficulty: Difficulty,
): boolean {
  const prevDiff = prevDifficulty(difficulty);
  // 链式：前一级需要同难度已通关
  if (index > 0 && !isClearedOn(p, manifest[index - 1].levelId, difficulty)) return false;
  // 难度递进：当前关需要在上一级难度已通关
  if (prevDiff && !isClearedOn(p, manifest[index].levelId, prevDiff)) return false;
  return true;
}

/** 通关星级（设计文档 §8.6）：无漏怪 3★ / 剩余≥60% 2★ / 通关 1★ */
export function computeStars(livesRemaining: number, startLives: number): number {
  if (livesRemaining >= startLives) return 3;
  if (livesRemaining / startLives >= 0.6) return 2;
  return 1;
}

/** 记录结果（按难度独立），保留历史最高星 */
export function recordResult(p: Progression, levelId: string, difficulty: Difficulty, stars: number): Progression {
  const key = clearedKey(levelId, difficulty);
  const prev = p.cleared[key]?.stars ?? 0;
  return { ...p, cleared: { ...p.cleared, [key]: { stars: Math.max(prev, stars) } } };
}

/** 关卡通关产出宗门贡献：基础 + 星级加成（设计文档 §10.2） */
export function awardContribution(p: Progression, stars: number, base = 20, perStar = 10): Progression {
  return { ...p, contribution: p.contribution + base + stars * perStar };
}

/** 设置难度模式 */
export function setDifficulty(p: Progression, difficulty: Difficulty): Progression {
  return { ...p, difficulty };
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

/** 记录无尽模式最高分（取历史最高）；返回是否新纪录 */
export function recordEndless(p: Progression, wave: number, score: number): { progression: Progression; isNewBest: boolean } {
  const date = new Date().toISOString().slice(0, 10);
  const isNewBest = !p.endlessBest || score > p.endlessBest.score;
  const best = isNewBest ? { wave, score, date } : p.endlessBest!;
  return { progression: { ...p, endlessBest: best }, isNewBest };
}

/** 记录无尽模式里程碑（首次达成），返回新达成的波次列表 */
export function awardMilestones(p: Progression, wave: number): { progression: Progression; newMilestones: number[] } {
  const existing = new Set(p.endlessMilestones);
  const newOnes: number[] = [];
  for (const m of [20, 40, 60, 80]) {
    if (wave >= m && !existing.has(m)) newOnes.push(m);
  }
  if (newOnes.length === 0) return { progression: p, newMilestones: [] };
  return {
    progression: { ...p, endlessMilestones: [...p.endlessMilestones, ...newOnes] },
    newMilestones: newOnes,
  };
}

// —— 寻仙抽卡 ——

/** 应用抽奖结果：扣除贡献 + 累加奖励 + 更新保底 */
export function applyDraw(p: Progression, cost: number, result: DrawResult, newPity: number): Progression | null {
  if (p.contribution < cost) return null;
  return {
    ...p,
    contribution: p.contribution - cost + result.contributionGain,
    soulShards: p.soulShards + result.soulShards,
    destinyScrolls: p.destinyScrolls + result.destinyScrolls,
    equipFragments: p.equipFragments + result.frags,
    gachaPity: newPity,
  };
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

