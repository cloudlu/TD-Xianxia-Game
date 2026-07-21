import { IChallengeValidator } from '../../../domain/challenge';
import { Difficulty, CHALLENGE_DIFF_MUL, CHALLENGE_BIT } from '../../../domain/challenge';

export const speedValidator: IChallengeValidator = {
  kind: 'speed',

  validate(ctx) {
    const limit = ctx.budgetLimit ?? 60; // using budgetLimit as limit for speed
    if (ctx.elapsed >= limit) {
      return { failed: true, failedReason: `超时：用时 ${Math.ceil(ctx.elapsed)}s（限制 ${limit}s）` };
    }
    return { failed: false };
  },

  getProgress(ctx) {
    const limit = ctx.budgetLimit ?? 60;
    return {
      kind: 'speed',
      isFailed: ctx.elapsed >= limit,
      failedReason: ctx.elapsed >= limit ? `超时：用时 ${Math.ceil(ctx.elapsed)}s（限制 ${limit}s）` : undefined,
      elapsed: ctx.elapsed,
      limit,
    };
  },

  calculateReward(base, difficulty) {
    return Math.round(base * CHALLENGE_DIFF_MUL[difficulty]);
  },
};