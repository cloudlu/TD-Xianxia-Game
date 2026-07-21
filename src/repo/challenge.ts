// 挑战玩法验证逻辑（纯函数） - 重构为策略模式
import type { ChallengeDef, TowerBehavior } from '../types';
import { getValidator, registerValidator, hasValidator } from './challenge/registry';
import { speedValidator } from './challenge/validators/SpeedValidator';
import { monoSchoolValidator } from './challenge/validators/MonoSchoolValidator';
import { noUpgradeValidator } from './challenge/validators/NoUpgradeValidator';
import { noAuraValidator } from './challenge/validators/NoAuraValidator';
import { budgetValidator } from './challenge/validators/BudgetValidator';

registerValidator(speedValidator);
registerValidator(monoSchoolValidator);
registerValidator(noUpgradeValidator);
registerValidator(noAuraValidator);
registerValidator(budgetValidator);

// 注册所有 validator（幂等）
function registerAllValidators(): void {
  if (hasValidator('speed')) return;
  registerValidator(speedValidator);
  registerValidator(monoSchoolValidator);
  registerValidator(noUpgradeValidator);
  registerValidator(noAuraValidator);
  registerValidator(budgetValidator);
}
registerAllValidators();

export interface ChallengeContext {
  elapsed: number;
  towers: ReadonlyArray<{ readonly school: string; readonly behavior: string }>;
  upgraded: boolean;
  totalSpent: number;
  allowedSchool?: string;
  budgetLimit?: number;
}

export interface ChallengeResult {
  failed: boolean;
  failedReason?: string;
}

export interface ChallengeProgressSnapshot {
  kind: string;
  isFailed: boolean;
  failedReason?: string;
  elapsed?: number;
  limit?: number;
  allowed?: string;
  totalSpent?: number;
  budgetLimit?: number;
  auraTowers?: number;
}

export function checkChallenge(challenge: ChallengeDef, ctx: ChallengeContext): ChallengeResult {
  const validator = getValidator(challenge.kind);
  return validator.validate({
    elapsed: ctx.elapsed,
    towers: ctx.towers.map((t) => ({ school: t.school, behavior: t.behavior })),
    upgraded: ctx.upgraded,
    totalSpent: ctx.totalSpent,
    allowedSchool: challenge.params?.allowed as string,
    budgetLimit: challenge.params?.limit as number,
  });
}

export function getChallengeProgress(challenge: ChallengeDef, ctx: ChallengeContext): ChallengeProgressSnapshot {
  const validator = getValidator(challenge.kind);
  return validator.getProgress({
    elapsed: ctx.elapsed,
    towers: ctx.towers.map((t) => ({ school: t.school, behavior: t.behavior })),
    upgraded: ctx.upgraded,
    totalSpent: ctx.totalSpent,
    allowedSchool: challenge.params?.allowed as string,
    budgetLimit: challenge.params?.limit as number,
  });
}

export function calculateChallengeReward(challenge: ChallengeDef, difficulty: string): number {
  const validator = getValidator(challenge.kind);
  return validator.calculateReward(challenge.rewardContrib, difficulty as any);
}