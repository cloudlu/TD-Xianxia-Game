// 关卡进度与战斗结果（从 progress.ts 拆分）
import type { ManifestEntry, Difficulty } from '../types';
import { DIFFICULTY_MUL } from '../types';
import type { Progression } from './progress';
import { clearedKey } from './progress';

const DIFFICULTY_ORDER: Difficulty[] = ['simple', 'normal', 'hard'];

/** 某关在某难度下是否已通关 */
export function isClearedOn(p: Progression, levelId: string, difficulty: Difficulty): boolean {
  return Object.hasOwn(p.cleared, clearedKey(levelId, difficulty));
}

/** 某关是否在任意难度下已通关至少一次 */
export function isClearedAny(p: Progression, levelId: string): boolean {
  return Object.keys(p.cleared).some((k) => k.startsWith(`${levelId}:`));
}

/** 关卡是否解锁：同难度下前一关通关 + 当前关更低难度全部通关 */
export function isUnlocked(
  manifest: ReadonlyArray<ManifestEntry>, index: number, p: Progression, difficulty: Difficulty,
): boolean {
  if (index === 0) {
    // 首关：无前一关限制，但仍需低难度通关
    const curLevelId = manifest[0].levelId;
    for (const d of DIFFICULTY_ORDER) {
      if (d === difficulty) break;
      if (!isClearedOn(p, curLevelId, d)) return false;
    }
    return true;
  }
  // 同难度链式推进：前一关必须通关
  if (!isClearedOn(p, manifest[index - 1].levelId, difficulty)) return false;
  // 难度递进：当前关所有更低难度必须通关
  const curLevelId = manifest[index].levelId;
  for (const d of DIFFICULTY_ORDER) {
    if (d === difficulty) break;
    if (!isClearedOn(p, curLevelId, d)) return false;
  }
  return true;
}

/** 无尽模式解锁所需通关数（任意难度，关卡 id 去重） */
export const ENDLESS_UNLOCK_STAGES = 6;

/** 通用塔等级上限阈值表：索引=塔等级(0-7)，值=最小通关数 */
export const TOWER_LEVEL_THRESHOLDS: readonly number[] = [0, 3, 9, 18, 30, 45, 63, 84];

/** 兼容旧引用 */
export const ENDLESS_TOWER_LEVEL_THRESHOLDS = TOWER_LEVEL_THRESHOLDS;

/** 累计通关关卡数（任意难度，按关卡 id 去重） */
export function clearedStageCount(p: Progression): number {
  const seen = new Set<string>();
  for (const key of Object.keys(p.cleared)) {
    seen.add(key.split(':')[0]);
  }
  return seen.size;
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

/** 塔类型解锁表：通关数 → 解锁塔 id */
export const TOWER_UNLOCK_TABLE: { stageCount: number; towerId: string }[] = [
  { stageCount: 0, towerId: 'flying_sword' },
  { stageCount: 0, towerId: 'talisman' },
  { stageCount: 3, towerId: 'spear' },
  { stageCount: 3, towerId: 'aura' },
  { stageCount: 9, towerId: 'ice_mage' },
  { stageCount: 15, towerId: 'fire_mage' },
  { stageCount: 30, towerId: 'thunder_mage' },
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
