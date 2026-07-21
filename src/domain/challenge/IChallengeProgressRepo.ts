import { Progression } from '../../repo/progress';
import { Difficulty } from './Difficulty';
import { ChallengeMedal, MedalTier } from './ChallengeMedal';

export interface ChallengeProgressKey {
  readonly levelId: string;
  readonly challengeId: string;
  readonly difficulty: Difficulty;
}

export type { ChallengeMedal, MedalTier } from './ChallengeMedal';

export interface IChallengeProgressRepo {
  isCompleted(p: Progression, key: ChallengeProgressKey): boolean;
  markCompleted(p: Progression, key: ChallengeProgressKey): Progression;
  getMedal(p: Progression, levelId: string, challengeId: string): ChallengeMedal | undefined;
  upgradeMedal(p: Progression, levelId: string, challengeId: string, tier: MedalTier): Progression;
}