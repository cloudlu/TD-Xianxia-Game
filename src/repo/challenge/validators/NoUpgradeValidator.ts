import { IChallengeValidator } from '../../../domain/challenge';
import { Difficulty, CHALLENGE_DIFF_MUL } from '../../../domain/challenge';

export const noUpgradeValidator: IChallengeValidator = {
  kind: 'no_upgrade',

  validate(ctx) {
    if (ctx.upgraded) return { failed: true, failedReason: '本关已升级过塔' };
    return { failed: false };
  },

  getProgress(ctx) {
    return {
      kind: 'no_upgrade',
      isFailed: ctx.upgraded,
      failedReason: ctx.upgraded ? '本关已升级过塔' : undefined,
    };
  },

  calculateReward(base, difficulty) {
    return Math.round(base * CHALLENGE_DIFF_MUL[difficulty]);
  },
};