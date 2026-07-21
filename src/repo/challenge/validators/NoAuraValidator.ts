import { IChallengeValidator } from '../../../domain/challenge';
import { Difficulty, CHALLENGE_DIFF_MUL } from '../../../domain/challenge';

export const noAuraValidator: IChallengeValidator = {
  kind: 'no_aura',

  validate(ctx) {
    const badAura = ctx.towers.find((t) => t.behavior === 'aura');
    if (badAura) return { failed: true, failedReason: '放置了光环塔' };
    return { failed: false };
  },

  getProgress(ctx) {
    const auraTowers = ctx.towers.filter((t) => t.behavior === 'aura').length;
    return {
      kind: 'no_aura',
      isFailed: auraTowers > 0,
      failedReason: auraTowers > 0 ? `已放置${auraTowers}个光环塔` : undefined,
      auraTowers,
    };
  },

  calculateReward(base, difficulty) {
    return Math.round(base * CHALLENGE_DIFF_MUL[difficulty]);
  },
};