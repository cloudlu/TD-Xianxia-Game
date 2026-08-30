import { describe, it, expect } from 'vitest';
import { getLevelChallenges } from './challengeConfig';
import { LEVELS } from '../config/levels';
import { ENEMIES } from './enemies';
import { TOWERS } from './towers';
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

  it('speed limits are reachable: >= spawn-only time of the level', () => {
    for (const levelId of Object.keys(LEVELS)) {
      const level = LEVELS[levelId];
      const spawnOnly = level.waves.reduce(
        (sum, w) => sum + Math.max(0, ...w.spawns.map(s => s.delay + (s.count - 1) * s.gap)),
        0,
      );
      for (const c of getLevelChallenges(levelId)) {
        if (c.kind === 'speed') {
          const limit = (c.params as any).limit;
          expect(
            limit,
            `speed limit ${limit}s on ${levelId} is below spawn-only time ${spawnOnly.toFixed(1)}s`,
          ).toBeGreaterThanOrEqual(spawnOnly);
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

  it('no no_aura challenge is offered on levels containing stealth enemies', () => {
    const airSchools = new Set<string>();
    for (const t of Object.values(TOWERS)) if (t.hitsAir) airSchools.add(t.school);
    for (const levelId of Object.keys(LEVELS)) {
      const level = LEVELS[levelId];
      const enemyIds = new Set(level.waves.flatMap(w => w.spawns.map(s => s.enemy)));
      const hasStealth = [...enemyIds].some(id => ENEMIES[id]?.stealth);
      const hasFly = [...enemyIds].some(id => ENEMIES[id]?.fly);
      for (const c of getLevelChallenges(levelId)) {
        if (c.kind === 'no_aura') {
          expect(hasStealth, `no_aura 挑战 ${c.id} 出现在含隐身敌人的关卡 ${levelId}`).toBe(false);
        }
        if (c.kind === 'mono_school') {
          const allowed = (c.params as any).allowed.split(',').map((s: string) => s.trim());
          if (hasFly) {
            expect(
              allowed.some((s: string) => airSchools.has(s)),
              `mono_school 挑战 ${c.id} 在含飞行敌人的关卡 ${levelId} 无对空流派`,
            ).toBe(true);
          }
        }
      }
    }
  });
});
