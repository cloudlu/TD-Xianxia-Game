import { IChallengeValidator } from '../../../domain/challenge';
import { Difficulty, CHALLENGE_DIFF_MUL } from '../../../domain/challenge';

export const budgetValidator: IChallengeValidator = {
  kind: 'budget',

  validate(ctx) {
    const limit = ctx.budgetLimit ?? 800;
    if (ctx.totalSpent > limit) {
      return { failed: true, failedReason: `总花费 ${ctx.totalSpent}灵石（限制 ${limit}灵石）` };
    }
    return { failed: false };
  },

  getProgress(ctx) {
    const limit = ctx.budgetLimit ?? 800;
    return {
      kind: 'budget',
      isFailed: ctx.totalSpent > limit,
      failedReason: ctx.totalSpent > limit ? `总花费 ${ctx.totalSpent}灵石（限制 ${limit}灵石）` : undefined,
      totalSpent: ctx.totalSpent,
      budgetLimit: limit,
    };
  },

  calculateReward(base, difficulty) {
    return Math.round(base * CHALLENGE_DIFF_MUL[difficulty]);
  },
};