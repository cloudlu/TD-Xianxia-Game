// 挑战进度仓储：读写 challengesCompleted / challengeMedals
import { Progression } from '../progress';
import { ChallengeMedal } from '../../domain/challenge';
import { Difficulty } from '../../domain/challenge';
import { CHALLENGE_BIT } from '../../domain/challenge/Difficulty';

function getDifficultyTier(diff: Difficulty): number {
  switch (diff) {
    case 'simple': return 1;
    case 'normal': return 2;
    case 'hard': return 3;
    default: return 0;
  }
}

export interface IChallengeProgressRepo {
  isCompleted(p: Progression, levelId: string, challengeId: string, diff: Difficulty): boolean;
  markCompleted(p: Progression, levelId: string, challengeId: string, diff: Difficulty): Progression;
  getMedal(p: Progression, levelId: string, challengeId: string): ChallengeMedal | undefined;
  upgradeMedal(p: Progression, levelId: string, challengeId: string, diff: Difficulty): Progression;
}

export class ChallengeProgressRepo implements IChallengeProgressRepo {
  private static makeKey(levelId: string, challengeId: string): string {
    return `${levelId}:${challengeId}`;
  }

  isCompleted(p: Progression, levelId: string, challengeId: string, diff: Difficulty): boolean {
    const key = ChallengeProgressRepo.makeKey(levelId, challengeId);
    const bitmask = p.challengesCompleted[key] ?? 0;
    return (bitmask & CHALLENGE_BIT[diff]) !== 0;
  }

  markCompleted(p: Progression, levelId: string, challengeId: string, diff: Difficulty): Progression {
    const key = ChallengeProgressRepo.makeKey(levelId, challengeId);
    const current = p.challengesCompleted[key] ?? 0;
    const newMask = current | CHALLENGE_BIT[diff];
    if (newMask === current) return p;
    return {
      ...p,
      challengesCompleted: { ...p.challengesCompleted, [key]: newMask },
    };
  }

  getMedal(p: Progression, levelId: string, challengeId: string): ChallengeMedal | undefined {
    const key = ChallengeProgressRepo.makeKey(levelId, challengeId);
    return p.challengeMedals[key];
  }

  upgradeMedal(p: Progression, levelId: string, challengeId: string, diff: Difficulty): Progression {
    const key = ChallengeProgressRepo.makeKey(levelId, challengeId);
    const medal = p.challengeMedals[key] ?? { tier: 0, completedAt: {}, reincarnationBest: 0 };
    const newTier = Math.max(medal.tier, getDifficultyTier(diff)) as 0 | 1 | 2 | 3;
    if (newTier === medal.tier && medal.completedAt[diff]) return p;

    return {
      ...p,
      challengeMedals: {
        ...p.challengeMedals,
        [key]: {
          ...medal,
          tier: newTier,
          completedAt: { ...medal.completedAt, [diff]: new Date().toISOString() },
        },
      },
    };
  }
}

export const challengeProgressRepo = new ChallengeProgressRepo();