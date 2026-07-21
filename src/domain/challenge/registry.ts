import { IChallengeValidator } from './IChallengeValidator';
import { ChallengeKind } from './ChallengeKind';

const validators = new Map<ChallengeKind, IChallengeValidator>();

export function registerValidator(v: IChallengeValidator): void {
  if (validators.has(v.kind)) {
    throw new Error(`Duplicate validator for challenge kind: ${v.kind}`);
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

export function hasValidator(kind: ChallengeKind): boolean {
  return validators.has(kind);
}

export function getAllValidators(): ReadonlyArray<IChallengeValidator> {
  return Array.from(validators.values());
}