import { describe, it, expect } from 'vitest';
import { initForges, tickForges, forgeAt, forgesAdjacent, mergeForges, capForgeBonus } from './forge';
import type { ForgeConfig } from '../../types';

const cfg: ForgeConfig = {
  forges: [{ x: 2, y: 8 }, { x: 3, y: 8 }, { x: 12, y: 8 }, { x: 13, y: 8 }],
  forgeSecPerLevel: [10, 14, 18],
  collectDmgPctPerLevel: 0.05,
  maxTotalDmgPct: 0.6,
  mergeEnabled: true,
};

describe('initForges', () => {
  it('按配置初始化（0 级/0 进度/未就绪）', () => {
    const seq = { n: 1 };
    const fs = initForges(seq, cfg);
    expect(fs.length).toBe(4);
    expect(fs[0]).toMatchObject({ col: 2, row: 8, level: 0, progress: 0, ready: false });
    expect(fs[3].uid).toBe(4);
  });
});

describe('tickForges', () => {
  it('进度按等级表推进，满则 ready', () => {
    const seq = { n: 1 };
    const fs = initForges(seq, cfg);
    tickForges(fs, 5, cfg);
    expect(fs[0].progress).toBeCloseTo(0.5);
    expect(fs[0].ready).toBe(false);
    tickForges(fs, 5, cfg);
    expect(fs[0].progress).toBe(1);
    expect(fs[0].ready).toBe(true);
  });
  it('高一级锻造时长用第二档', () => {
    const seq = { n: 1 };
    const fs = initForges(seq, cfg);
    fs[0].level = 1;
    tickForges(fs, 10, cfg);
    expect(fs[0].progress).toBeCloseTo(10 / 14);
  });
  it('ready 的炉不再推进', () => {
    const seq = { n: 1 };
    const fs = initForges(seq, cfg);
    fs[0].ready = true;
    tickForges(fs, 100, cfg);
    expect(fs[0].progress).toBe(0);   // 初始即 ready 时 progress 未动
  });
});

describe('合并', () => {
  it('相邻同级可合并：a 升级、b 移除', () => {
    const seq = { n: 1 };
    const fs = initForges(seq, cfg);
    const merged = mergeForges(fs, 1, 2, cfg);
    expect(merged).not.toBeNull();
    expect(merged!.length).toBe(3);
    expect(merged!.find((f) => f.uid === 1)!.level).toBe(1);
    expect(merged!.find((f) => f.uid === 2)).toBeUndefined();
  });
  it('不相邻/不同级不可合并', () => {
    const seq = { n: 1 };
    const fs = initForges(seq, cfg);
    expect(mergeForges(fs, 1, 3, cfg)).toBeNull();       // 不相邻
    fs[1].level = 2;
    expect(mergeForges(fs, 1, 2, cfg)).toBeNull();       // 不同级
  });
  it('mergeEnabled=false 禁用', () => {
    const seq = { n: 1 };
    const fs = initForges(seq, cfg);
    expect(mergeForges(fs, 1, 2, { ...cfg, mergeEnabled: false })).toBeNull();
  });
  it('forgesAdjacent 判定四邻', () => {
    const a = { uid: 1, col: 5, row: 5, level: 0, progress: 0, ready: false, selected: false };
    expect(forgesAdjacent(a, { ...a, uid: 2, col: 6, row: 5 })).toBe(true);
    expect(forgesAdjacent(a, { ...a, uid: 2, col: 5, row: 6 })).toBe(true);
    expect(forgesAdjacent(a, { ...a, uid: 2, col: 6, row: 6 })).toBe(false);
    expect(forgesAdjacent(a, { ...a, uid: 2, col: 7, row: 5 })).toBe(false);
  });
});

describe('capForgeBonus', () => {
  it('累计并封顶', () => {
    expect(capForgeBonus(0, 0.05, cfg)).toBe(0.05);
    expect(capForgeBonus(0.58, 0.05, cfg)).toBe(0.6);
  });
});

describe('forgeAt', () => {
  it('按坐标命中', () => {
    const seq = { n: 1 };
    const fs = initForges(seq, cfg);
    expect(forgeAt(fs, 3, 8)?.uid).toBe(2);
    expect(forgeAt(fs, 9, 9)).toBeUndefined();
  });
});
