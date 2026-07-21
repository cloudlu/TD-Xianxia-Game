import { Difficulty } from './Difficulty';

export type MedalTier = 0 | 1 | 2 | 3;

export interface ChallengeMedal {
  tier: MedalTier;
  completedAt: Partial<Record<Difficulty, string>>;
  reincarnationBest: number;
}