import { describe, it, expect } from 'vitest';
import { buildSegments, positionAt, totalLength } from './path';

describe('buildSegments', () => {
  it('builds one segment for a straight 2-point path', () => {
    // 格 (0,3)→(15,3)，中心 (0.5,3.5)→(15.5,3.5)，长 15
    const segs = buildSegments([{ x: 0, y: 3 }, { x: 15, y: 3 }]);
    expect(segs).toHaveLength(1);
    expect(segs[0].len).toBeCloseTo(15, 5);
  });

  it('builds two segments for an L-shaped path', () => {
    const segs = buildSegments([{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }]);
    expect(segs).toHaveLength(2);
    expect(totalLength(segs)).toBeCloseTo(3 + 4, 5);
  });
});

describe('positionAt', () => {
  const segs = buildSegments([{ x: 0, y: 3 }, { x: 15, y: 3 }]);

  it('returns start center at dist 0', () => {
    const p = positionAt(segs, 0);
    expect(p.x).toBeCloseTo(0.5, 5);
    expect(p.y).toBeCloseTo(3.5, 5);
  });

  it('returns end center at full length', () => {
    const p = positionAt(segs, 15);
    expect(p.x).toBeCloseTo(15.5, 5);
    expect(p.y).toBeCloseTo(3.5, 5);
  });

  it('clamps to end when dist exceeds total length', () => {
    const p = positionAt(segs, 999);
    expect(p.x).toBeCloseTo(15.5, 5);
  });

  it('walks the corner correctly on multi-segment paths', () => {
    const L = buildSegments([{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }]);
    const atCorner = positionAt(L, 3);         // 第一段末尾 = 拐点中心
    expect(atCorner.x).toBeCloseTo(3.5, 5);
    expect(atCorner.y).toBeCloseTo(0.5, 5);
    const pastCorner = positionAt(L, 5);        // 拐点后再走 2 格向上
    expect(pastCorner.x).toBeCloseTo(3.5, 5);
    expect(pastCorner.y).toBeCloseTo(2.5, 5);
  });

  it('returns origin for an empty segment list', () => {
    const p = positionAt([], 5);
    expect(p).toEqual({ x: 0, y: 0 });
  });
});
