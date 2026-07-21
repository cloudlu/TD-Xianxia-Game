import { describe, it, expect } from 'vitest';
import { checkChallenge } from './challenge.ts';
import type { ChallengeDef } from '../types';

const speed: ChallengeDef = { id: 'speed1', name: '速通', desc: '60s内通关', kind: 'speed', params: { limit: 60 }, rewardContrib: 30 };
const mono: ChallengeDef = { id: 'mono1', name: '纯剑修', desc: '仅限剑修塔', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 30 };
const noUp: ChallengeDef = { id: 'noup1', name: '禁突破', desc: '不升级任何塔', kind: 'no_upgrade', rewardContrib: 30 };
const noAura: ChallengeDef = { id: 'noaura1', name: '禁光环', desc: '不放置光环塔', kind: 'no_aura', rewardContrib: 30 };
const budget: ChallengeDef = { id: 'budget1', name: '精打细算', desc: '总花费≤800灵石', kind: 'budget', params: { limit: 800 }, rewardContrib: 30 };

const tower = (school: string, behavior: string) => ({ school, behavior });

describe('checkChallenge pure logic', () => {
  it('speed: fails when elapsed >= limit', () => {
    const r = checkChallenge(speed, { elapsed: 65, towers: [], upgraded: false, totalSpent: 0 });
    expect(r.failed).toBe(true);
    expect(r.failedReason).toContain('60');
  });
  it('speed: passes when elapsed < limit', () => {
    const r = checkChallenge(speed, { elapsed: 55, towers: [], upgraded: false, totalSpent: 0 });
    expect(r.failed).toBe(false);
  });

  it('mono_school: fails when tower school not in allowed set', () => {
    const towers = [tower('sword', 'projectile'), tower('talisman', 'pierce')];
    const r = checkChallenge(mono, { elapsed: 10, towers, upgraded: false, totalSpent: 0 });
    expect(r.failed).toBe(true);
    expect(r.failedReason).toContain('talisman');
  });
  it('mono_school: passes when all towers have allowed school', () => {
    const towers = [tower('sword', 'projectile'), tower('sword', 'aura')];
    const r = checkChallenge(mono, { elapsed: 10, towers, upgraded: false, totalSpent: 0 });
    expect(r.failed).toBe(false);
  });
  it('mono_school: passes when no towers placed', () => {
    const r = checkChallenge(mono, { elapsed: 10, towers: [], upgraded: false, totalSpent: 0 });
    expect(r.failed).toBe(false);
  });

  it('no_upgrade: fails when upgraded is true', () => {
    const r = checkChallenge(noUp, { elapsed: 10, towers: [], upgraded: true, totalSpent: 0 });
    expect(r.failed).toBe(true);
    expect(r.failedReason).toContain('升级');
  });
  it('no_upgrade: passes when not upgraded', () => {
    const r = checkChallenge(noUp, { elapsed: 10, towers: [], upgraded: false, totalSpent: 0 });
    expect(r.failed).toBe(false);
  });

  it('no_aura: fails when any tower has aura behavior', () => {
    const towers = [tower('sword', 'projectile'), tower('magic', 'aura')];
    const r = checkChallenge(noAura, { elapsed: 10, towers, upgraded: false, totalSpent: 0 });
    expect(r.failed).toBe(true);
    expect(r.failedReason).toContain('光环');
  });
  it('no_aura: passes when no aura towers', () => {
    const towers = [tower('sword', 'projectile'), tower('talisman', 'aoe')];
    const r = checkChallenge(noAura, { elapsed: 10, towers, upgraded: false, totalSpent: 0 });
    expect(r.failed).toBe(false);
  });

  it('budget: fails when totalSpent > limit', () => {
    const r = checkChallenge(budget, { elapsed: 10, towers: [], upgraded: false, totalSpent: 900 });
    expect(r.failed).toBe(true);
    expect(r.failedReason).toContain('800');
  });
  it('budget: passes when totalSpent <= limit', () => {
    const r = checkChallenge(budget, { elapsed: 10, towers: [], upgraded: false, totalSpent: 700 });
    expect(r.failed).toBe(false);
  });
});
