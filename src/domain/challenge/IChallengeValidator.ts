import { ChallengeContext, ChallengeResult, ChallengeProgressSnapshot, ChallengeKind } from './ChallengeKind';
import { Difficulty } from './Difficulty';

export interface IChallengeValidator {
  readonly kind: ChallengeKind;
  validate(ctx: ChallengeContext): ChallengeResult;
  getProgress(ctx: ChallengeContext): ChallengeProgressSnapshot;
  calculateReward(base: number, difficulty: Difficulty): number;
}