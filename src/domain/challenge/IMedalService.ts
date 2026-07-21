import { Progression } from '../../repo/progress';
import { Difficulty } from './Difficulty';
import { ChallengeMedal, MedalTier } from './IChallengeProgressRepo';

export interface IMedalService {
  getMedal(progression: Progression, levelId: string, challengeId: string): ChallengeMedal | undefined;
  upgradeMedal(progression: Progression, levelId: string, challengeId: string, difficulty: Difficulty): Progression;
  getMedalTier(progression: Progression, levelId: string, challengeId: string): MedalTier;
  getAllMedals(progression: Progression): ReadonlyArray<{ levelId: string; challengeId: string; medal: ChallengeMedal }>;
}