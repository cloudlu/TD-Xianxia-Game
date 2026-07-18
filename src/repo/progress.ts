// 玩家进度存取（设计文档 §12 SaveRepo 雏形 / §8.6 星级 / §8.2 解锁）
// 接口 + 本地实现 + 纯函数；联网后换 RemoteSaveRepo，调用方不动。
//
// 层级：
//   progress.ts           — Progression 类型 + SaveRepo 接口 + 持久化 + 默认值
//   progressLevel.ts      — 关卡进度/战斗结果（computeStars / recordResult / isUnlocked 等）
//   progressMeta.ts       — 经济/抽卡/皮肤/天赋（buyEquipment / applyDraw / upgradeVip 等）

import type { Difficulty } from '../types';
import { ChallengeMedal } from '../domain/challenge';

export interface LevelResult { stars: number; }

/** 玩家存档（设计文档 §12）：通关进度 + meta 货币 + 装备 + 天命阶 + 皮肤 */
export interface Progression {
  cleared: Record<string, LevelResult>;
  contribution: number;
  jade: number;
  totalRecharged: number;  // 累计充值总额（VIP 升级依据，不扣减）
  vipLevel: number;
  ownedEquipment: string[];
  equipped: Partial<Record<string, string>>;
  equipLevels: Record<string, number>;
  ownedSkins: string[];
  equippedSkins: Record<string, string>;
  talents: Record<string, number>;
  difficulty: Difficulty;
  endlessBest: { wave: number; score: number; date: string } | null;
  endlessMilestones: number[];
  challengesCompleted: Record<string, number>; // key: `${levelId}:${challengeId}` -> bitmask (bit0=simple, bit1=normal, bit2=hard)
  challengeMedals: Record<string, ChallengeMedal>; // key: `${levelId}:${challengeId}` -> medal data
  soulShards: number;
  destinyScrolls: number;
  equipFragments: number;
  gachaPity: number;
  ownedTreasures: string[];
  treasureLevels: Record<string, number>;
  generatedEquipNames: Record<string, string>;
  generatedEquipData: Record<string, unknown>;
  reincarnationLevel: number;
  soulShopLevels: Record<string, number>;
  // === VIP 领取记录 ===
  vipDailyClaimed: string[];     // 已领取每日奖励的日期 'YYYY-MM-DD'
  vipWeeklyClaimed: string[];    // 已领取每周奖励的周 'YYYY-WW'
  vipOneTimeClaimed: number[];   // 已领取一次性升级礼包的等级
}

export interface SaveRepo {
  load(): Promise<Progression>;
  save(p: Progression): void;
}

const KEY = 'xianxia-td:progress-v2';
const IDB_NAME = 'xianxia-td';
const IDB_STORE = 'progress';

// ---------- IndexedDB 辅助（localStorage 不可用时降级） ----------
let idbPromise: Promise<IDBDatabase> | null = null;
function idbOpen(): Promise<IDBDatabase> {
  if (idbPromise) return idbPromise;
  idbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { idbPromise = null; reject(req.error); };
  });
  return idbPromise;
}

function idbWrite(key: string, json: string): Promise<void> {
  return idbOpen().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(IDB_STORE).put({ id: key, data: json });
  }));
}

function idbRead(key: string): Promise<string | null> {
  return idbOpen().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result?.data ?? null);
    tx.onerror = () => reject(tx.error);
  }));
}

/** 尝试从 IndexedDB 恢复存档（在 localStorage load() 返回空后调用） */
export async function loadFromIdb(key: string): Promise<Progression | null> {
  try {
    const raw = await idbRead(key);
    return raw ? withDefaults(JSON.parse(raw) as Partial<Progression>) : null;
  } catch { return null; }
}

export function withDefaults(raw: Partial<Progression>): Progression {
  const rawCleared: Record<string, { stars: number }> = raw.cleared ?? ({} as Record<string, { stars: number }>);
  const migrated: Record<string, { stars: number }> = {};
  for (const k of Object.keys(rawCleared)) {
    if (k.includes(':')) { migrated[k] = rawCleared[k]; }
    else { migrated[clearedKey(k, 'normal')] = rawCleared[k]; }
  }

  // 迁移旧格式 challengesCompleted: Record<string, number> -> 新格式 Record<string, number> (bitmask)
  // 旧 key: challengeId, 新 key: `${levelId}:${challengeId}`
  const oldChallenges = raw.challengesCompleted ?? {};
  const migratedChallenges: Record<string, number> = {};
  for (const [oldKey, val] of Object.entries(oldChallenges)) {
    if (typeof val === 'number') {
      // 尝试反查 levelId
      const levelId = findLevelIdByChallengeId(oldKey);
      if (levelId) {
        migratedChallenges[`${levelId}:${oldKey}`] = 2; // 默认归入 normal (bit1)
      } else {
        console.warn(`[migrate] Orphan challenge key: ${oldKey}`);
        migratedChallenges[`orphan:${oldKey}`] = val;
      }
    }
  }

  return {
    cleared: migrated,
    contribution: raw.contribution ?? 0,
    jade: raw.jade ?? 0,
    totalRecharged: raw.totalRecharged ?? 0,
    vipLevel: raw.vipLevel ?? 0,
    ownedEquipment: raw.ownedEquipment ?? [],
    equipped: raw.equipped ?? {},
    equipLevels: raw.equipLevels ?? {},
    ownedSkins: raw.ownedSkins ?? [],
    equippedSkins: raw.equippedSkins ?? {},
    talents: raw.talents ?? {},
    difficulty: raw.difficulty ?? 'normal',
    endlessBest: raw.endlessBest ?? null,
    endlessMilestones: raw.endlessMilestones ?? [],
    challengesCompleted: migratedChallenges,
    challengeMedals: raw.challengeMedals ?? {},
    soulShards: raw.soulShards ?? 0,
    destinyScrolls: raw.destinyScrolls ?? 0,
    equipFragments: raw.equipFragments ?? 0,
    gachaPity: raw.gachaPity ?? 0,
    ownedTreasures: raw.ownedTreasures ?? [],
    treasureLevels: raw.treasureLevels ?? {},
    generatedEquipNames: raw.generatedEquipNames ?? {},
    generatedEquipData: raw.generatedEquipData ?? {},
    reincarnationLevel: raw.reincarnationLevel ?? 0,
    soulShopLevels: raw.soulShopLevels ?? {},
    // VIP 领取记录默认值
    vipDailyClaimed: raw.vipDailyClaimed ?? [],
    vipWeeklyClaimed: raw.vipWeeklyClaimed ?? [],
    vipOneTimeClaimed: raw.vipOneTimeClaimed ?? [],
  };
}

function findLevelIdByChallengeId(challengeId: string): string | null {
  // 这里需要从 manifest 反查，暂时返回 null 让迁移标记为 orphan
  // 实际项目中应该在游戏启动时预建立索引
  return null;
}

export class LocalSaveRepo implements SaveRepo {
  constructor(readonly key: string = KEY) {}
  load(): Promise<Progression> {
    try {
      const raw = localStorage.getItem(this.key);
      return Promise.resolve(raw ? withDefaults(JSON.parse(raw) as Partial<Progression>) : withDefaults({}));
    } catch (e) {
      console.error('存档读取失败，已重置为默认进度:', e);
      return Promise.resolve(withDefaults({}));
    }
  }
  save(p: Progression): void {
    const tryLS = (data: Progression, tag: string): boolean => {
      try {
        localStorage.setItem(this.key, JSON.stringify(data));
        return true;
      } catch { return false; }
    };

    // 第 1 级：清理 generatedEquipData 只保留 ownedEquipment 中的条目
    const owned = new Set(p.ownedEquipment ?? []);
    const equipData: Record<string, unknown> = {};
    const equipNames: Record<string, string> = {};
    if (p.generatedEquipData) {
      for (const key of Object.keys(p.generatedEquipData)) if (owned.has(key)) equipData[key] = p.generatedEquipData[key];
    }
    if (p.generatedEquipNames) {
      for (const key of Object.keys(p.generatedEquipNames)) if (owned.has(key)) equipNames[key] = p.generatedEquipNames[key];
    }
    const lvl1: Progression = { ...p, generatedEquipData: equipData, generatedEquipNames: equipNames };
    if (tryLS(lvl1, 'lvl1')) return;

    // 第 2 级：丢弃所有生成法宝数据
    const lvl2: Progression = { ...lvl1, generatedEquipData: {}, generatedEquipNames: {} };
    if (tryLS(lvl2, 'lvl2')) return;

    // 第 3 级：只保留核心进度
    const lvl3: Progression = {
      cleared: p.cleared, contribution: p.contribution, jade: p.jade,
      totalRecharged: p.totalRecharged,
      vipLevel: p.vipLevel, difficulty: p.difficulty,
      ownedEquipment: p.ownedEquipment, equipped: p.equipped, equipLevels: p.equipLevels,
      talents: p.talents, soulShards: p.soulShards,
      ownedTreasures: p.ownedTreasures, treasureLevels: p.treasureLevels,
      destinyScrolls: p.destinyScrolls, equipFragments: p.equipFragments,
      gachaPity: p.gachaPity, reincarnationLevel: p.reincarnationLevel,
      soulShopLevels: p.soulShopLevels,
      endlessBest: p.endlessBest, endlessMilestones: p.endlessMilestones,
      challengesCompleted: p.challengesCompleted, challengeMedals: p.challengeMedals,
      ownedSkins: p.ownedSkins, equippedSkins: p.equippedSkins,
      generatedEquipData: {}, generatedEquipNames: {},
      vipDailyClaimed: [], vipWeeklyClaimed: [], vipOneTimeClaimed: [],
    };
    if (tryLS(lvl3, 'lvl3')) return;

    // 所有 localStorage 压缩失败 → 降级到 IndexedDB
    const json = JSON.stringify(lvl3);
    console.warn(`[save] localStorage 不可用，降级到 IndexedDB (${json.length}B)`);
    idbWrite(this.key, json).catch((e) => console.error('IndexedDB 写入失败:', e));
  }
}

/** 按难度组成 cleared key */
export function clearedKey(levelId: string, difficulty: Difficulty): string {
  return `${levelId}:${difficulty}`;
}
