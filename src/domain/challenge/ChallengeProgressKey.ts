import { Difficulty } from './Difficulty';

export interface ChallengeProgressKey {
  readonly levelId: string;
  readonly challengeId: string;
  readonly difficulty: Difficulty;
}