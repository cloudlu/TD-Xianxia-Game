// 关卡进度与战斗结果（从 progress.ts 拆分）
import type { ManifestEntry } from '../types';
import type { Progression } from './progress';
import { clearedKey } from './progress';

/** 某关是否已通关 */
export function isCleared(p: Progression, levelId: string): boolean {
  return Object.hasOwn(p.cleared, clearedKey(levelId));
}

/** 关卡是否解锁：前一关通关（首关始终解锁） */
export function isUnlocked(
  manifest: ReadonlyArray<ManifestEntry>, index: number, p: Progression,
): boolean {
  if (index === 0) return true;
  return isCleared(p, manifest[index - 1].levelId);
}

/** 无尽模式解锁所需通关数 */
export const ENDLESS_UNLOCK_STAGES = 2;

/** 通用塔等级上限阈值表：索引=塔等级(0-7)，值=最小通关数（原 3× 缩放） */
export const TOWER_LEVEL_THRESHOLDS: readonly number[] = [0, 1, 3, 6, 10, 15, 21, 28];

/** 兼容旧引用 */
export const ENDLESS_TOWER_LEVEL_THRESHOLDS = TOWER_LEVEL_THRESHOLDS;

/** 累计通关关卡数 */
export function clearedStageCount(p: Progression): number {
  return Object.keys(p.cleared).length;
}

/** 通用塔等级上限（境界索引 0-7），根据累计通关数查阈值表 */
export function globalTowerLevel(cleared: number): number {
  for (let i = TOWER_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (cleared >= TOWER_LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

/** 无尽模式允许的最高塔等级（境界索引 0-7），兼容旧引用 */
export function endlessMaxTowerLevel(p: Progression): number {
  return globalTowerLevel(clearedStageCount(p));
}

/** 塔类型解锁表：通关数 → 解锁塔 id（原 3× 缩放） */
export const TOWER_UNLOCK_TABLE: { stageCount: number; towerId: string }[] = [
  { stageCount: 0, towerId: 'flying_sword' },
  { stageCount: 0, towerId: 'talisman' },
  { stageCount: 1, towerId: 'spear' },
  { stageCount: 1, towerId: 'aura' },
  { stageCount: 3, towerId: 'ice_mage' },
  { stageCount: 5, towerId: 'fire_mage' },
  { stageCount: 10, towerId: 'thunder_mage' },
  { stageCount: 15, towerId: 'mine_tower' },
];

/** 根据进度返回所有已解锁的塔 id */
export function unlockedTowerIds(p: Progression): string[] {
  const cleared = clearedStageCount(p);
  return TOWER_UNLOCK_TABLE
    .filter((e) => cleared >= e.stageCount)
    .map((e) => e.towerId);
}

/** 无尽模式是否已解锁 */
export function isEndlessUnlocked(p: Progression): boolean {
  return clearedStageCount(p) >= ENDLESS_UNLOCK_STAGES;
}

/** 通关星级（设计文档 §8.6）：无漏怪 3★ / 剩余≥60% 2★ / 通关 1★ */
export function computeStars(livesRemaining: number, startLives: number): number {
  if (livesRemaining >= startLives) return 3;
  if (livesRemaining / startLives >= 0.6) return 2;
  return 1;
}

/** 记录结果，保留历史最高星 */
export function recordResult(p: Progression, levelId: string, stars: number): Progression {
  const key = clearedKey(levelId);
  const prev = p.cleared[key]?.stars ?? 0;
  return { ...p, cleared: { ...p.cleared, [key]: { stars: Math.max(prev, stars) } } };
}

/** 关卡通关产出宗门贡献：基础 + 星级加成（设计文档 §10.2） */
export function awardContribution(p: Progression, stars: number, base = 20, perStar = 10): Progression {
  return { ...p, contribution: p.contribution + base + stars * perStar };
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
