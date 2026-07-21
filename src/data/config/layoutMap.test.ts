import { describe, it, expect } from 'vitest';
import { LAYOUTS } from './layouts';
import { LAYOUT_MAP } from './layoutMap';
import { LEVELS, MANIFEST } from '../config/levels';

describe('layouts integrity', () => {
  it('all paths have at least 2 waypoints', () => {
    for (const [id, paths] of Object.entries(LAYOUTS)) {
      for (let pi = 0; pi < paths.length; pi++) {
        expect(paths[pi].length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('all waypoints are within 16x8 grid', () => {
    for (const [id, paths] of Object.entries(LAYOUTS)) {
      for (const pts of paths) {
        for (const p of pts) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(15);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(7);
        }
      }
    }
  });

  it('all segments are orthogonal (same x or same y)', () => {
    for (const [id, paths] of Object.entries(LAYOUTS)) {
      for (const pts of paths) {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          expect(a.x === b.x || a.y === b.y).toBe(true);
        }
      }
    }
  });

  it('no consecutive duplicate waypoints', () => {
    for (const [id, paths] of Object.entries(LAYOUTS)) {
      for (const pts of paths) {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          expect(a.x === b.x && a.y === b.y).toBe(false);
        }
      }
    }
  });

  it('layout ID prefix matches path count', () => {
    for (const [id, paths] of Object.entries(LAYOUTS)) {
      const prefix = id[1];
      const expected = prefix === '1' ? 1 : prefix === '2' ? 2 : 3;
      expect(paths.length).toBe(expected);
    }
  });
});

describe('layoutMap integrity', () => {
  it('covers all 90 levels in manifest', () => {
    for (const entry of MANIFEST) {
      expect(LAYOUT_MAP).toHaveProperty(entry.levelId);
    }
  });

  it('all referenced layout IDs exist in LAYOUTS', () => {
    for (const layoutId of Object.values(LAYOUT_MAP)) {
      expect(LAYOUTS).toHaveProperty(layoutId);
    }
  });

  it('no layout is used more than 3 times', () => {
    const counts: Record<string, number> = {};
    for (const layoutId of Object.values(LAYOUT_MAP)) {
      counts[layoutId] = (counts[layoutId] || 0) + 1;
    }
    for (const [id, count] of Object.entries(counts)) {
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  it('every level has correct path count matching its layout', () => {
    for (const entry of MANIFEST) {
      const layoutId = LAYOUT_MAP[entry.levelId];
      const paths = LAYOUTS[layoutId];
      const prefix = layoutId[1];
      const expected = prefix === '1' ? 1 : prefix === '2' ? 2 : 3;
      expect(paths.length).toBe(expected);
    }
  });
});

describe('LEVELS after layout override', () => {
  it('every level has valid paths and buildable grid', () => {
    for (const [id, level] of Object.entries(LEVELS)) {
      expect(level.paths.length).toBeGreaterThan(0);
      expect(level.buildable.length).toBe(8);
      expect(level.buildable[0].length).toBe(16);
    }
  });

  it('all levels have valid waypoints in overridden paths', () => {
    for (const [id, level] of Object.entries(LEVELS)) {
      for (const pts of level.paths) {
        for (const p of pts) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(15);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(7);
        }
      }
    }
  });
});
