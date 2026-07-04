import { describe, it, expect, beforeEach } from 'vitest';
import {
  withDefaults, buyEquipment, equipItem, upgradeEquip, redeemJade, upgradeVip,
  buySkin, equipSkin, upgradeTalent, computeStars, recordResult, isUnlocked,
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

describe('level result & unlock (pure)', () => {
  it('computeStars: 3 at full lives, 2 at >=60%, 1 otherwise', () => {
    expect(computeStars(20, 20)).toBe(3);
    expect(computeStars(13, 20)).toBe(2);   // 65%
    expect(computeStars(5, 20)).toBe(1);
  });
  it('recordResult keeps the historical max stars', () => {
    let p = fresh();
    p = recordResult(p, 'a', 2);
    p = recordResult(p, 'a', 1);            // 更低星不覆盖
    expect(p.cleared.a.stars).toBe(2);
    p = recordResult(p, 'a', 3);            // 更高星覆盖
    expect(p.cleared.a.stars).toBe(3);
  });
  it('isUnlocked: first always, rest needs previous cleared', () => {
    expect(isUnlocked(manifest, 0, fresh())).toBe(true);
    expect(isUnlocked(manifest, 1, fresh())).toBe(false);
    expect(isUnlocked(manifest, 1, recordResult(fresh(), 'a', 3))).toBe(true);
  });
});
