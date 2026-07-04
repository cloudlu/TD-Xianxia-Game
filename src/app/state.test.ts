import { describe, it, expect } from 'vitest';
import { app, buildMods } from './state';
import { withDefaults } from '../repo/progress';

describe('buildMods (multi-source merge)', () => {
  it('merges multiple equipment slots additively', () => {
    app.progression = withDefaults({
      equipped: { weapon: 'green_lotus', armor: 'spirit_vest', accessory: 'lucky_charm' },
    });
    const ms = buildMods();
    expect(ms.pctFor('swordDmg')).toBeCloseTo(0.15, 5);   // 青莲剑
    expect(ms.pctFor('rate')).toBeCloseTo(0.10, 5);        // 聚灵法衣
    expect(ms.pctFor('bountyMul')).toBeCloseTo(0.15, 5);   // 招财符
  });

  it('scales each equipped item by its own upgrade level (+15%/级)', () => {
    app.progression = withDefaults({
      equipped: { weapon: 'green_lotus' },
      equipLevels: { green_lotus: 2 },   // scale = 1 + 2*0.15 = 1.3
    });
    const ms = buildMods();
    expect(ms.pctFor('swordDmg')).toBeCloseTo(0.15 * 1.3, 5);  // 0.195
  });

  it('scales slots independently by per-item level', () => {
    app.progression = withDefaults({
      equipped: { weapon: 'green_lotus', armor: 'spirit_vest' },
      equipLevels: { green_lotus: 4, spirit_vest: 0 },   // 剑 +60%, 法衣 +0%
    });
    const ms = buildMods();
    expect(ms.pctFor('swordDmg')).toBeCloseTo(0.15 * 1.6, 5);
    expect(ms.pctFor('rate')).toBeCloseTo(0.10, 5);
  });

  it('includes VIP and talent mods alongside equipment', () => {
    app.progression = withDefaults({
      vipLevel: 1,                                // 天命一阶：bountyMul +0.10
      talents: { sword_mastery: 3 },              // 剑修精通 3 级：swordDmg +0.15
    });
    const ms = buildMods();
    expect(ms.pctFor('bountyMul')).toBeCloseTo(0.10, 5);
    expect(ms.pctFor('swordDmg')).toBeCloseTo(0.15, 5);
  });

  it('returns neutral set when nothing equipped/leveled', () => {
    app.progression = withDefaults({});
    const ms = buildMods();
    expect(ms.damageMul(['dmg'])).toBe(1);
    expect(ms.rateMul()).toBe(1);
  });
});
