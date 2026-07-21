export enum Difficulty {
  Simple = 'simple',
  Normal = 'normal',
  Hard = 'hard',
}

export const DIFFICULTY_ORDER: Difficulty[] = [Difficulty.Simple, Difficulty.Normal, Difficulty.Hard];

export const CHALLENGE_DIFF_MUL: Record<Difficulty, number> = {
  [Difficulty.Simple]: 1.0,
  [Difficulty.Normal]: 1.5,
  [Difficulty.Hard]: 2.5,
};

export const CHALLENGE_BIT = {
  [Difficulty.Simple]: 1,
  [Difficulty.Normal]: 2,
  [Difficulty.Hard]: 4,
};

export function difficultyTier(diff: Difficulty): number {
  switch (diff) {
    case Difficulty.Simple: return 1;
    case Difficulty.Normal: return 2;
    case Difficulty.Hard: return 3;
  }
}

export function isDifficultyUnlocked(bitmask: number, diff: Difficulty): boolean {
  return (bitmask & (1 << DIFFICULTY_ORDER.indexOf(diff))) !== 0;
}