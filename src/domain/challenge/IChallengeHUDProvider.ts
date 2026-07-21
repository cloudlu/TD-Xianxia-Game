import { ChallengeProgressSnapshot } from './ChallengeKind';

export interface IChallengeHUDProvider {
  getCurrentChallenge(): ChallengeProgressSnapshot | null;
  getChallengeName(): string | null;
  isChallengeFailed(): boolean;
  getFailedReason(): string | null;
}