import { describe, it, expect } from 'vitest';
import { WaveDirector } from './WaveDirector';
import type { WaveConfig } from '../types';

const wave = (spawns: WaveConfig['spawns']): WaveConfig => ({ spawns, clearBonus: 0 });

describe('WaveDirector', () => {
  it('spawns enemies as their scheduled time arrives', () => {
    const d = new WaveDirector();
    const spawned: string[] = [];
    d.start(wave([{ enemy: 'wolf', count: 2, gap: 1, delay: 0 }])); // t=0, t=1
    d.update(0, (id) => spawned.push(id));      // t=0 → 1 只
    expect(spawned).toEqual(['wolf']);
    d.update(0.5, (id) => spawned.push(id));    // t=0.5 → 还没到 1
    expect(spawned).toEqual(['wolf']);
    d.update(0.5, (id) => spawned.push(id));    // t=1 → 第 2 只
    expect(spawned).toEqual(['wolf', 'wolf']);
  });

  it('reports done only after every scheduled spawn is emitted', () => {
    const d = new WaveDirector();
    d.start(wave([{ enemy: 'wolf', count: 3, gap: 0.5, delay: 0 }]));
    d.update(2, () => {});                       // 一次推进过所有时间点
    expect(d.done).toBe(true);
  });

  it('calls spawn with the correct enemy id per entry', () => {
    const d = new WaveDirector();
    const spawned: string[] = [];
    d.start(wave([{ enemy: 'boar', count: 1, gap: 1, delay: 0 }]));
    d.update(0, (id) => spawned.push(id));
    expect(spawned).toEqual(['boar']);
  });
});
