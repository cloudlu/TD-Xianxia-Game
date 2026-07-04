import { describe, it, expect } from 'vitest';
import { targetPriorityKey } from './targeting';

describe('targetPriorityKey', () => {
  it('"first" prefers the enemy furthest along the path', () => {
    expect(targetPriorityKey('first', { dist: 10, hp: 50 }))
      .toBeGreaterThan(targetPriorityKey('first', { dist: 2, hp: 99 }));
  });

  it('"last" prefers the enemy nearest the spawn', () => {
    expect(targetPriorityKey('last', { dist: 1, hp: 50 }))
      .toBeGreaterThan(targetPriorityKey('last', { dist: 9, hp: 99 }));
  });

  it('"strongest" prefers higher hp regardless of distance', () => {
    expect(targetPriorityKey('strongest', { dist: 0, hp: 200 }))
      .toBeGreaterThan(targetPriorityKey('strongest', { dist: 99, hp: 50 }));
  });
});
