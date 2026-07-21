import { describe, it, expect, beforeEach } from 'vitest';
import { createLocalTelemetryRepo } from './telemetry';

describe('TelemetryRepo', () => {
  let repo: ReturnType<typeof createLocalTelemetryRepo>;

  beforeEach(() => {
    repo = createLocalTelemetryRepo('test_');
    repo.clear();
  });

  it('recordKill stores entry with correct fields', () => {
    repo.recordKill({ levelId: 'l1', difficulty: 'normal', waveIndex: 2, towerId: 'flying_sword', enemyId: 'wolf', bounty: 5 });
    const logs = repo.getSessionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].type).toBe('kill');
    expect(logs[0].levelId).toBe('l1');
    expect(logs[0].data).toMatchObject({ towerId: 'flying_sword', enemyId: 'wolf', bounty: 5, waveIndex: 2 });
  });

  it('recordLeak stores entry', () => {
    repo.recordLeak({ levelId: 'l1', difficulty: 'hard', waveIndex: 0, enemyId: 'wolf', livesLost: 1 });
    const logs = repo.getSessionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].type).toBe('leak');
    expect(logs[0].data).toMatchObject({ enemyId: 'wolf', livesLost: 1 });
  });

  it('recordEconomy stores entry', () => {
    repo.recordEconomy({ levelId: 'l1', difficulty: 'normal', elapsed: 10.5, stones: 120, delta: -70, reason: 'placeTower' });
    const logs = repo.getSessionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].type).toBe('economy');
    expect(logs[0].data).toMatchObject({ delta: -70, reason: 'placeTower', balance: 120 });
  });

  it('recordTowerDps stores entry', () => {
    repo.recordTowerDps({ levelId: 'l1', difficulty: 'simple', elapsed: 30, towerId: 'spear', totalDmg: 500, kills: 3 });
    const logs = repo.getSessionLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].type).toBe('tower_dps');
    expect(logs[0].data).toMatchObject({ towerId: 'spear', totalDmg: 500, kills: 3 });
  });

  it('getSessionLogs returns all entries in insertion order', () => {
    repo.recordKill({ levelId: 'l1', difficulty: 'normal', waveIndex: 0, towerId: 'a', enemyId: 'wolf', bounty: 5 });
    repo.recordLeak({ levelId: 'l1', difficulty: 'normal', waveIndex: 0, enemyId: 'wolf', livesLost: 1 });
    repo.recordKill({ levelId: 'l1', difficulty: 'normal', waveIndex: 1, towerId: 'b', enemyId: 'bear', bounty: 10 });
    const logs = repo.getSessionLogs();
    expect(logs).toHaveLength(3);
    expect(logs[0].type).toBe('kill');
    expect(logs[1].type).toBe('leak');
    expect(logs[2].type).toBe('kill');
  });

  it('clear empties all entries', () => {
    repo.recordKill({ levelId: 'l1', difficulty: 'normal', waveIndex: 0, towerId: 'a', enemyId: 'wolf', bounty: 5 });
    repo.clear();
    expect(repo.getSessionLogs()).toHaveLength(0);
  });

  it('different namespaces do not share data', () => {
    repo.recordKill({ levelId: 'l1', difficulty: 'normal', waveIndex: 0, towerId: 'a', enemyId: 'wolf', bounty: 5 });
    const repo2 = createLocalTelemetryRepo('other_');
    expect(repo2.getSessionLogs()).toHaveLength(0);
    repo2.clear();
  });

  it('entry has monotonic timestamp', () => {
    repo.recordKill({ levelId: 'l1', difficulty: 'normal', waveIndex: 0, towerId: 'a', enemyId: 'wolf', bounty: 5 });
    repo.recordKill({ levelId: 'l1', difficulty: 'normal', waveIndex: 0, towerId: 'a', enemyId: 'bear', bounty: 8 });
    const logs = repo.getSessionLogs();
    expect(logs[1].timestamp).toBeGreaterThanOrEqual(logs[0].timestamp);
  });
});
