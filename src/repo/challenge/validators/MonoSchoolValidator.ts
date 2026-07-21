import { IChallengeValidator } from '../../../domain/challenge';
import { Difficulty, CHALLENGE_DIFF_MUL } from '../../../domain/challenge';

export const monoSchoolValidator: IChallengeValidator = {
  kind: 'mono_school',

  validate(ctx) {
    const allowed = ctx.allowedSchool;
    if (!allowed) return { failed: false };
    const bad = ctx.towers.find((t) => t.school !== allowed);
    if (bad) return { failed: true, failedReason: `使用了非${allowed}流派塔：${bad.school}` };
    return { failed: false };
  },

  getProgress(ctx) {
    const allowed = ctx.allowedSchool;
    return {
      kind: 'mono_school',
      isFailed: false,
      allowed,
    };
  },

  calculateReward(base, difficulty) {
    return Math.round(base * CHALLENGE_DIFF_MUL[difficulty]);
  },
};