import { describe, it, expect, beforeEach } from 'vitest';
import {
  withDefaults, buyEquipment, equipItem, upgradeEquip, redeemJade, upgradeVip,
  buySkin, equipSkin, upgradeTalent, computeStars, recordResult, isUnlocked, clearedKey, isClearedOn,
} from './progress';
import type { Progression } from './progress';
import type { ManifestEntry } from '../types';

const fresh = (): Progression => withDefaults({});
const manifest: ReadonlyArray<ManifestEntry> = [
  { levelId: 'a', chapterId: 'c', chapterTitle: 't' },
  { levelId: 'b', chapterId: 'c', chapterTitle: 't' },
];

describe('currency & economy (pure)', () => {
  let p: Progression;
  beforeEach(() => { p = { ...fresh(), contribution: 1000, jade: 1000 }; });

  it('buyEquipment deducts contribution and adds to owned; idempotent', () => {
    const a = buyEquipment(p, 'x', 60);
    expect(a?.contribution).toBe(940);
    expect(a?.ownedEquipment).toContain('x');
    const again = buyEquipment(a!, 'x', 60);   // 已拥有不再扣费
    expect(again?.contribution).toBe(940);
  });
  it('buyEquipment returns null when unaffordable', () => {
    expect(buyEquipment({ ...p, contribution: 10 }, 'x', 60)).toBeNull();
  });

  it('redeemJade converts jade → contribution', () => {
    const a = redeemJade(p, 50, 450);
    expect(a?.jade).toBe(950);
    expect(a?.contribution).toBe(1450);
    expect(redeemJade({ ...p, jade: 10 }, 50, 450)).toBeNull();
  });

  it('upgradeVip deducts jade and levels up; null at max or unaffordable', () => {
    const a = upgradeVip(p, 60, 3);
    expect(a?.vipLevel).toBe(1);
    expect(a?.jade).toBe(940);
    expect(upgradeVip({ ...p, vipLevel: 3 }, 60, 3)).toBeNull();
    expect(upgradeVip({ ...p, jade: 10 }, 60, 3)).toBeNull();
  });
});

describe('equipment slots & upgrade (pure)', () => {
  let p: Progression;
  beforeEach(() => { p = { ...fresh(), contribution: 1000 }; });

  it('equipItem places item into its slot and unequip removes it', () => {
    const a = equipItem(p, 'weapon', 'green_lotus');
    expect(a.equipped.weapon).toBe('green_lotus');
    const b = equipItem(a, 'weapon', null);
    expect(b.equipped.weapon).toBeUndefined();
  });
  it('equipping into an occupied slot replaces the previous item', () => {
    const a = equipItem(p, 'armor', 'spirit_vest');
    const b = equipItem(a, 'armor', 'golden_bell');
    expect(b.equipped.armor).toBe('golden_bell');
  });
  it('upgradeEquip levels up and deducts; null at max or unaffordable', () => {
    const a = upgradeEquip(p, 'green_lotus', 60, 5);
    expect(a?.equipLevels.green_lotus).toBe(1);
    expect(a?.contribution).toBe(940);
    expect(upgradeEquip({ ...p, equipLevels: { green_lotus: 5 } }, 'green_lotus', 60, 5)).toBeNull();
    expect(upgradeEquip({ ...p, contribution: 10 }, 'green_lotus', 60, 5)).toBeNull();
  });
  it('upgradeEquip is additive across levels', () => {
    let cur = upgradeEquip(p, 'x', 10, 5)!;
    cur = upgradeEquip(cur, 'x', 10, 5)!;
    expect(cur.equipLevels.x).toBe(2);
  });
});

describe('skins & talents (pure)', () => {
  const p = { ...fresh(), jade: 1000, contribution: 1000 };

  it('buySkin deducts jade; equipSkin binds tower→skin and unequip clears', () => {
    const a = buySkin(p, 's1', 80);
    expect(a?.jade).toBe(920);
    expect(a?.ownedSkins).toContain('s1');
    const b = equipSkin(a!, 'flying_sword', 's1');
    expect(b.equippedSkins.flying_sword).toBe('s1');
    const c = equipSkin(b, 'flying_sword', null);
    expect(c.equippedSkins.flying_sword).toBeUndefined();
  });
  it('upgradeTalent levels up and deducts; null at max', () => {
    const a = upgradeTalent(p, 'swift', 50, 5);
    expect(a?.talents.swift).toBe(1);
    expect(a?.contribution).toBe(950);
    expect(upgradeTalent({ ...p, talents: { swift: 5 } }, 'swift', 50, 5)).toBeNull();
  });
});

describe('level result & unlock (per difficulty)', () => {
  it('computeStars: 3 at full lives, 2 at >=60%, 1 otherwise', () => {
    expect(computeStars(20, 20)).toBe(3);
    expect(computeStars(13, 20)).toBe(2);
    expect(computeStars(5, 20)).toBe(1);
  });
  it('recordResult keys by difficulty, keeps historical max stars', () => {
    let p = fresh();
    p = recordResult(p, 'a', 'simple', 2);
    expect(p.cleared[clearedKey('a', 'simple')].stars).toBe(2);
    p = recordResult(p, 'a', 'simple', 1);
    expect(p.cleared[clearedKey('a', 'simple')].stars).toBe(2);  // 低星不覆盖
    p = recordResult(p, 'a', 'normal', 3);
    expect(p.cleared[clearedKey('a', 'normal')].stars).toBe(3);  // 高星覆盖
    expect(p.cleared[clearedKey('a', 'simple')].stars).toBe(2);  // 不影响简单
  });
  it('isClearedOn checks per-difficulty key', () => {
    const p = recordResult(fresh(), 'a', 'normal', 3);
    expect(isClearedOn(p, 'a', 'normal')).toBe(true);
    expect(isClearedOn(p, 'a', 'simple')).toBe(false);
  });
  it('isUnlocked: chain within difficulty + difficulty gating', () => {
    // 简单：首关恒解锁，链式推进
    expect(isUnlocked(manifest, 0, fresh(), 'simple')).toBe(true);
    expect(isUnlocked(manifest, 1, fresh(), 'simple')).toBe(false);
    const p1 = recordResult(fresh(), 'a', 'simple', 3);
    expect(isUnlocked(manifest, 1, p1, 'simple')).toBe(true);
    // 普通：需要该关简单已通关 + 链式
    expect(isUnlocked(manifest, 0, p1, 'normal')).toBe(true);   // a 简单通关 → a 普通解锁
    expect(isUnlocked(manifest, 1, p1, 'normal')).toBe(false);  // b 简单未通 → b 普通不解锁
    const p2 = recordResult(recordResult(p1, 'a', 'normal', 3), 'b', 'simple', 3);
    expect(isUnlocked(manifest, 1, p2, 'normal')).toBe(true);   // b 简单通 + a 普通通 → b 普通解锁
  });
});
