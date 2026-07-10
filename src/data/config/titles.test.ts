import { describe, it, expect } from 'vitest';
import { resolveTitle, completedChapters, TITLES } from './titles';
import { withDefaults, recordResult } from '../../repo/progress';
import type { ManifestEntry } from '../../types';

const manifest: ReadonlyArray<ManifestEntry> = [
  { levelId: 'a1', chapterId: 'c1', chapterTitle: '一' },
  { levelId: 'a2', chapterId: 'c1', chapterTitle: '一' },
  { levelId: 'b1', chapterId: 'c2', chapterTitle: '二' },
];

describe('resolveTitle', () => {
  it('starts at 外门弟子 with 0 chapters', () => {
    const t = resolveTitle(0);
    expect(t.title).toBe('外门弟子');
    expect(t.nextTitle).toBe('内门弟子');
    expect(t.nextAt).toBe(1);
  });
  it('promotes one title per completed chapter', () => {
    expect(resolveTitle(1).title).toBe('内门弟子');
    expect(resolveTitle(3).title).toBe('护阵长老');
  });
  it('caps at 太上长老 with null next', () => {
    const t = resolveTitle(99);
    expect(t.title).toBe(TITLES[TITLES.length - 1]);
    expect(t.nextTitle).toBeNull();
    expect(t.nextAt).toBeNull();
  });
});

describe('completedChapters', () => {
  it('counts a chapter only when all its levels cleared (any difficulty)', () => {
    let p = withDefaults({});
    expect(completedChapters(manifest, p)).toBe(0);
    p = recordResult(p, 'a1', 'normal', 3);
    expect(completedChapters(manifest, p)).toBe(0);   // c1 部分通关
    p = recordResult(p, 'a2', 'normal', 3);
    expect(completedChapters(manifest, p)).toBe(1);   // c1 全通关
    p = recordResult(p, 'b1', 'normal', 3);
    expect(completedChapters(manifest, p)).toBe(2);   // c2 全通关
  });
});
