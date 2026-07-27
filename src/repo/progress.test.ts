import { describe, it, expect, beforeEach } from 'vitest';
import { withDefaults, clearedKey } from './progress';
import type { Progression } from './progress';
import type { ManifestEntry } from '../types';
import { computeStars, recordResult, isUnlocked, isCleared, clearedStageCount, endlessMaxTowerLevel, isEndlessUnlocked, ENDLESS_UNLOCK_STAGES, ENDLESS_TOWER_LEVEL_THRESHOLDS } from './progressLevel';
import {
  buyEquipment, equipItem, upgradeEquip, redeemJade, upgradeVip,
  buySkin, equipSkin, upgradeTalent, reincarnate,
} from './progressMeta';

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
    const again = buyEquipment(a!, 'x', 60);
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

  it('upgradeVip checks totalRecharged and levels up; null at max or unaffordable', () => {
    const a = upgradeVip({ ...p, totalRecharged: 100 }, 60, 3);
    expect(a?.vipLevel).toBe(1);
    expect(a?.jade).toBe(1000);
    expect(upgradeVip({ ...p, vipLevel: 3, totalRecharged: 100 }, 60, 3)).toBeNull();
    expect(upgradeVip({ ...p, totalRecharged: 10 }, 60, 3)).toBeNull();
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
    const p2 = { ...p, equipFragments: 100 };
    const a = upgradeEquip(p2, 'green_lotus', 60, 5);
    expect(a?.equipLevels.green_lotus).toBe(1);
    expect(a?.equipFragments).toBe(40);
    expect(upgradeEquip({ ...p2, equipLevels: { green_lotus: 5 } }, 'green_lotus', 60, 5)).toBeNull();
    expect(upgradeEquip({ ...p2, equipFragments: 10 }, 'green_lotus', 60, 5)).toBeNull();
  });
  it('upgradeEquip is additive across levels', () => {
    const p2 = { ...p, equipFragments: 100 };
    let cur = upgradeEquip(p2, 'x', 10, 5)!;
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

describe('endless unlock & tower level cap', () => {
  it('clearedStageCount counts unique levelIds (no difficulty suffix)', () => {
    let p = fresh();
    expect(clearedStageCount(p)).toBe(0);
    p = recordResult(p, 'ch1-l1', 3);
    expect(clearedStageCount(p)).toBe(1);
    p = recordResult(p, 'ch1-l1', 3); // 同一关再次通关
    expect(clearedStageCount(p)).toBe(1);
    p = recordResult(p, 'ch1-l2', 1);
    expect(clearedStageCount(p)).toBe(2);
  });

  it('isEndlessUnlocked requires ENDLESS_UNLOCK_STAGES cleared', () => {
    let p = fresh();
    expect(isEndlessUnlocked(p)).toBe(false);
    for (let i = 1; i <= ENDLESS_UNLOCK_STAGES; i++) {
      p = recordResult(p, `level-${i}`, 1);
    }
    expect(isEndlessUnlocked(p)).toBe(true);
  });

  it('endlessMaxTowerLevel maps cleared count to correct level index', () => {
    expect(endlessMaxTowerLevel(fresh())).toBe(0);
    let p = fresh();
    p = recordResult(p, 'l1', 3);
    expect(endlessMaxTowerLevel(p)).toBe(1);  // 1 cleared → level 1 (threshold[1]=1)

    p = recordResult(p, 'l2', 3);
    expect(endlessMaxTowerLevel(p)).toBe(1);  // 2 cleared → still level 1 (threshold[2]=3)

    // 跳过多级
    for (let i = 3; i <= ENDLESS_TOWER_LEVEL_THRESHOLDS[3]; i++) {
      p = recordResult(p, `l${i}`, 1);
    }
    expect(endlessMaxTowerLevel(p)).toBe(3);
  });

  it('endlessMaxTowerLevel returns 7 when all stages cleared', () => {
    let p = fresh();
    for (let i = 1; i <= ENDLESS_TOWER_LEVEL_THRESHOLDS[7]; i++) {
      p = recordResult(p, `l${i}`, 1);
    }
    expect(endlessMaxTowerLevel(p)).toBe(7);
  });
});

describe('level result & unlock (no difficulty)', () => {
  it('computeStars: 3 at full lives, 2 at >=60%, 1 otherwise', () => {
    expect(computeStars(3, 3)).toBe(3);
    expect(computeStars(2, 3)).toBe(2);
    expect(computeStars(1, 3)).toBe(1);
    expect(computeStars(0, 3)).toBe(1);
  });
  it('recordResult keys by levelId, keeps historical max stars', () => {
    let p = fresh();
    p = recordResult(p, 'a', 2);
    expect(p.cleared[clearedKey('a')].stars).toBe(2);
    p = recordResult(p, 'a', 1);
    expect(p.cleared[clearedKey('a')].stars).toBe(2);  // 低星不覆盖
    p = recordResult(p, 'a', 3);
    expect(p.cleared[clearedKey('a')].stars).toBe(3);  // 高星覆盖
  });
  it('isCleared checks cleared record', () => {
    const p = recordResult(fresh(), 'a', 3);
    expect(isCleared(p, 'a')).toBe(true);
    expect(isCleared(p, 'b')).toBe(false);
  });
  it('reincarnate: resets cleared/endless, keeps meta, awards shards', () => {
    let p = fresh();
    p = recordResult(p, 'a', 3);
    p = recordResult(p, 'b', 2);
    p = { ...p, soulShards: 100, contribution: 500, vipLevel: 2, ownedEquipment: ['sword'] };

    const r = reincarnate(p, manifest)!;
    const p2 = r.progression;
    expect(p2.reincarnationLevel).toBe(1);
    expect(Object.keys(p2.cleared)).toHaveLength(0);
    expect(p2.difficulty).toBeUndefined();
    expect(p2.endlessBest).toBeNull();
    expect(r.soulShardsGained).toBeGreaterThan(0);
    expect(p2.soulShards).toBe(100 + r.soulShardsGained);
    expect(p2.contribution).toBe(500);
    expect(p2.vipLevel).toBe(2);
    expect(p2.ownedEquipment).toContain('sword');
    // 总星数 = 3+2 = 5
    // reward = 50 + 0*30 + 5*2 = 60
    expect(r.soulShardsGained).toBe(60);
  });

  it('reincarnate: returns null when levels remain uncleared', () => {
    let p = fresh();
    p = recordResult(p, 'a', 3);
    // b 未打
    expect(reincarnate(p, manifest)).toBeNull();
  });

  it('reincarnate: level increments across multiple reincarnations', () => {
    let p = fresh();
    p = recordResult(p, 'a', 3);
    p = recordResult(p, 'b', 3);
    const r1 = reincarnate(p, manifest)!;
    expect(r1.progression.reincarnationLevel).toBe(1);
    expect(r1.soulShardsGained).toBe(50 + 0 * 30 + 6 * 2);

    // 再次打满后二次转生
    let p2 = r1.progression;
    p2 = recordResult(p2, 'a', 3);
    p2 = recordResult(p2, 'b', 3);
    const r2 = reincarnate(p2, manifest)!;
    expect(r2.progression.reincarnationLevel).toBe(2);
    expect(r2.soulShardsGained).toBe(50 + 1 * 30 + 6 * 2);
  });

  it('reincarnate: allCleared uses ManifestEntry list', () => {
    let p = fresh();
    p = recordResult(p, 'a', 1);
    expect(reincarnate(p, manifest)).toBeNull();
    p = recordResult(p, 'b', 3);
    expect(reincarnate(p, manifest)).not.toBeNull();
  });

  it('isUnlocked: chain-based (no difficulty gating)', () => {
    expect(isUnlocked(manifest, 0, fresh())).toBe(true);
    expect(isUnlocked(manifest, 1, fresh())).toBe(false);
    const p1 = recordResult(fresh(), 'a', 3);
    expect(isUnlocked(manifest, 1, p1)).toBe(true);
  });
});
