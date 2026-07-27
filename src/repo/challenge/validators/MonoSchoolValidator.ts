import { IChallengeValidator } from '../../../domain/challenge';

function parseAllowed(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export const monoSchoolValidator: IChallengeValidator = {
  kind: 'mono_school',

  validate(ctx) {
    const allowed = parseAllowed(ctx.allowedSchool);
    if (allowed.length === 0) return { failed: false };
    const bad = ctx.towers.find((t) => !allowed.includes(t.school));
    if (bad) return { failed: true, failedReason: `使用了非允许流派塔：${bad.school}` };
    return { failed: false };
  },

  getProgress(ctx) {
    const allowed = parseAllowed(ctx.allowedSchool);
    return {
      kind: 'mono_school',
      isFailed: false,
      allowed: allowed.join(','),
    };
  },

  calculateReward(base, _difficulty) {
    return base;
  },
};
