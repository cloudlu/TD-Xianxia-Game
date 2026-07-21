import { describe, it, expect, vi } from 'vitest';
import { validateConfigs } from './ConfigLoader';
import * as config from './config';

describe('ConfigLoader', () => {
  it('validates all current configs without errors', () => {
    const result = validateConfigs();
    if (!result.ok) {
      console.log('配置校验错误:', JSON.stringify(result.errors, null, 2));
      console.log('配置校验警告:', JSON.stringify(result.warnings, null, 2));
    }
    expect(result.ok).toBe(true);
  });

  it('returns warnings array even when ok', () => {
    const result = validateConfigs();
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('detects missing tower id', () => {
    const towerSpy = vi.spyOn(config, 'TOWERS', 'get');
    towerSpy.mockReturnValue({
      bad_tower: { id: '', name: '坏塔', icon: 'X', cost: 100, sellRatio: 0.5, behavior: 'projectile', school: 'sword', targetPolicy: 'first', color: '#fff', desc: '坏', levels: [{ realm: '炼气', dmg: 10, rate: 1, range: 2 }] } as any,
    });
    const r = validateConfigs();
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('id'))).toBe(true);
    towerSpy.mockRestore();
  });

  it('detects invalid behavior', () => {
    const towerSpy = vi.spyOn(config, 'TOWERS', 'get');
    towerSpy.mockReturnValue({
      bad: { id: 'bad', name: '坏', icon: 'X', cost: 100, sellRatio: 0.5, behavior: 'invalid_behavior', school: 'sword', targetPolicy: 'first', color: '#fff', desc: '坏', levels: [{ realm: '炼气', dmg: 10, rate: 1, range: 2 }] } as any,
    });
    const r = validateConfigs();
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('behavior'))).toBe(true);
    towerSpy.mockRestore();
  });

  it('detects enemy split referencing non-existent enemy', () => {
    const enemySpy = vi.spyOn(config, 'ENEMIES', 'get');
    enemySpy.mockReturnValue({
      parent: { id: 'parent', name: '父', icon: 'P', hp: 100, speed: 1, armor: 0, bounty: 10, color: '#fff', split: { child: 'nonexistent_child', count: 2 } },
    });
    const r = validateConfigs();
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('split'))).toBe(true);
    enemySpy.mockRestore();
  });

  it('detects level spawn referencing non-existent enemy', () => {
    const levelSpy = vi.spyOn(config, 'LEVELS', 'get');
    levelSpy.mockReturnValue({
      bad_level: { id: 'bad_level', name: '坏关', startStones: 100, lives: 20, cols: 4, rows: 2, paths: [[{ x: 0, y: 0 }, { x: 3, y: 0 }]], buildable: [[true, true, true, true], [true, true, true, true]], waves: [{ spawns: [{ enemy: 'ghost_enemy', count: 1, gap: 0, delay: 0 }], clearBonus: 10 }] },
    });
    const r = validateConfigs();
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('ghost_enemy'))).toBe(true);
    levelSpy.mockRestore();
  });

  it('detects skin target referencing non-existent tower', () => {
    const skinSpy = vi.spyOn(config, 'SKINS', 'get');
    skinSpy.mockReturnValue({
      bad_skin: { id: 'bad_skin', target: 'ghost_tower', name: '坏皮肤', icon: 'X', color: '#fff', price: 100 },
    });
    const r = validateConfigs();
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('target'))).toBe(true);
    skinSpy.mockRestore();
  });
});
