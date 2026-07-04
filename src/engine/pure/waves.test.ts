import { describe, it, expect } from 'vitest';
import { buildSpawnQueue } from './waves';

describe('buildSpawnQueue', () => {
  it('schedules spawns at delay + i*gap', () => {
    const q = buildSpawnQueue([{ enemy: 'wolf', count: 3, gap: 0.8, delay: 1 }]);
    expect(q.map((s) => s.time)).toEqual([1, 1.8, 2.6]);
    expect(q.every((s) => s.enemyId === 'wolf')).toBe(true);
  });

  it('sorts mixed spawns by time', () => {
    const q = buildSpawnQueue([
      { enemy: 'boar', count: 2, gap: 2, delay: 3 },   // 3, 5
      { enemy: 'wolf', count: 2, gap: 1, delay: 0 },    // 0, 1
    ]);
    expect(q.map((s) => s.time)).toEqual([0, 1, 3, 5]);
  });

  it('returns empty queue when count is 0', () => {
    expect(buildSpawnQueue([{ enemy: 'wolf', count: 0, gap: 1, delay: 0 }])).toEqual([]);
  });

  it('propagates the path field for multi-path routing', () => {
    const q = buildSpawnQueue([
      { enemy: 'wolf', count: 2, gap: 1, delay: 0, path: 1 },
      { enemy: 'bat', count: 1, gap: 1, delay: 0 },   // 缺省 path=0
    ]);
    const wolf = q.find((s) => s.enemyId === 'wolf')!;
    const bat = q.find((s) => s.enemyId === 'bat')!;
    expect(wolf.pathIndex).toBe(1);
    expect(bat.pathIndex).toBe(0);
  });
});
