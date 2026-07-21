export type ChallengeKind = 
  | 'speed' 
  | 'mono_school' 
  | 'no_upgrade' 
  | 'no_aura' 
  | 'budget';

export const CHALLENGE_KINDS: ChallengeKind[] = ['speed', 'mono_school', 'no_upgrade', 'no_aura', 'budget'];

export interface ChallengeContext {
  readonly elapsed: number;
  readonly towers: ReadonlyArray<{ readonly school: string; readonly behavior: string }>;
  readonly upgraded: boolean;
  readonly totalSpent: number;
  readonly allowedSchool?: string;
  readonly budgetLimit?: number;
}

export interface ChallengeResult {
  readonly failed: boolean;
  readonly failedReason?: string;
}

export interface ChallengeProgressSnapshot {
  readonly kind: ChallengeKind;
  readonly isFailed: boolean;
  readonly failedReason?: string;
  readonly elapsed?: number;
  readonly limit?: number;
  readonly totalSpent?: number;
  readonly budgetLimit?: number;
  readonly allowed?: string;
  readonly auraTowers?: number;
}