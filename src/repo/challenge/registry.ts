import { IChallengeValidator } from '../../domain/challenge';
import { ChallengeKind } from '../../domain/challenge';

const validators = new Map<ChallengeKind, IChallengeValidator>();

export function registerValidator(v: IChallengeValidator): void {
  if (validators.has(v.kind)) {
    throw new Error(`Duplicate validator registered for kind: ${v.kind}`);
  }
  validators.set(v.kind, v);
}

export function getValidator(kind: ChallengeKind): IChallengeValidator {
  const v = validators.get(kind);
  if (!v) {
    throw new Error(`No validator registered for challenge kind: ${kind}`);
  }
  return v;
}

export function getAllValidators(): ReadonlyArray<IChallengeValidator> {
  return Array.from(validators.values());
}

export function hasValidator(kind: ChallengeKind): boolean {
  return validators.has(kind);
}