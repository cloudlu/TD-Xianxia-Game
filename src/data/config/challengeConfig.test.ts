import { describe, it, expect } from 'vitest';
import { getLevelChallenges } from './challengeConfig';
import { LEVELS } from '../config/levels';
import type { ChallengeKind } from '../../types';

const VALID_KINDS: ChallengeKind[] = ['speed', 'mono_school', 'no_upgrade', 'no_aura', 'budget'];

describe('challengeConfig', () => {
  it('returns empty array for unknown level', () => {
    expect(getLevelChallenges('nonexistent')).toEqual([]);
  });

  it('returns at least 1 challenge for every known level', () => {
    for (const levelId of Object.keys(LEVELS)) {
      const challenges = getLevelChallenges(levelId);
      expect(challenges.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all challenge ids are unique across all levels', () => {
    const ids = new Set<string>();
    const duplicates: string[] = [];
    for (const levelId of Object.keys(LEVELS)) {
      for (const c of getLevelChallenges(levelId)) {
        if (ids.has(c.id)) duplicates.push(c.id);
        ids.add(c.id);
      }
    }
    expect(duplicates).toEqual([]);
  });

  it('all challenge kinds are valid', () => {
    for (const levelId of Object.keys(LEVELS)) {
      for (const c of getLevelChallenges(levelId)) {
        expect(VALID_KINDS).toContain(c.kind);
      }
    }
  });

  it('all challenges have positive rewardContrib', () => {
    for (const levelId of Object.keys(LEVELS)) {
      for (const c of getLevelChallenges(levelId)) {
        expect(c.rewardContrib).toBeGreaterThan(0);
      }
    }
  });

  it('speed challenges have limit param', () => {
    for (const levelId of Object.keys(LEVELS)) {
      for (const c of getLevelChallenges(levelId)) {
        if (c.kind === 'speed') {
          expect(c.params).toBeDefined();
          expect((c.params as any).limit).toBeGreaterThan(0);
        }
      }
    }
  });

  it('mono_school challenges have allowed param', () => {
    for (const levelId of Object.keys(LEVELS)) {
      for (const c of getLevelChallenges(levelId)) {
        if (c.kind === 'mono_school') {
          expect(c.params).toBeDefined();
          expect(typeof (c.params as any).allowed).toBe('string');
        }
      }
    }
  });

  it('budget challenges have limit param', () => {
    for (const levelId of Object.keys(LEVELS)) {
      for (const c of getLevelChallenges(levelId)) {
        if (c.kind === 'budget') {
          expect(c.params).toBeDefined();
          expect((c.params as any).limit).toBeGreaterThan(0);
        }
      }
    }
  });

  it('no_upgrade and no_aura challenges have no params', () => {
    for (const levelId of Object.keys(LEVELS)) {
      for (const c of getLevelChallenges(levelId)) {
        if (c.kind === 'no_upgrade' || c.kind === 'no_aura') {
          expect(c.params).toBeUndefined();
        }
      }
    }
  });

  it('every level has challenges and they are not empty', () => {
    for (const levelId of Object.keys(LEVELS)) {
      const challenges = getLevelChallenges(levelId);
      expect(challenges.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('at least 60 levels have a speed challenge', () => {
    const withSpeed = Object.keys(LEVELS).filter(id =>
      getLevelChallenges(id).some(c => c.kind === 'speed')
    );
    expect(withSpeed.length).toBeGreaterThanOrEqual(60);
  });

  it('challenges of the same level have unique kinds', () => {
    for (const levelId of Object.keys(LEVELS)) {
      const kinds = getLevelChallenges(levelId).map(c => c.kind);
      expect(new Set(kinds).size).toBe(kinds.length);
    }
  });
});
