import { describe, it, expect } from 'vitest';
import { VIP_LEVELS, VIP_MAX_LEVEL, validateVipConfig } from './vip';

describe('VIP 配置校验', () => {
  it('VIP_MAX_LEVEL 与数组长度一致', () => {
    expect(VIP_MAX_LEVEL).toBe(VIP_LEVELS.length - 1);
  });

  it('等级连续且从 0 开始', () => {
    for (let i = 0; i <= VIP_MAX_LEVEL; i++) {
      expect(VIP_LEVELS[i].level).toBe(i);
    }
  });

  it('upgradeJade 非负且递增（累计充值额度）', () => {
    let prev = 0;
    for (const v of VIP_LEVELS) {
      expect(v.upgradeJade).toBeGreaterThanOrEqual(prev);
      prev = v.upgradeJade;
    }
  });

  it('mods 仅包含合法 op 与数值', () => {
    for (const v of VIP_LEVELS) {
      for (const m of v.mods) {
        expect(['add', 'mul_pct']).toContain(m.op);
        expect(typeof m.value).toBe('number');
        expect(isFinite(m.value)).toBe(true);
      }
    }
  });

  it('extraDestinySlots 在 0-3 范围内', () => {
    for (const v of VIP_LEVELS) {
      if (v.extraDestinySlots !== undefined) {
        expect(v.extraDestinySlots).toBeGreaterThanOrEqual(0);
        expect(v.extraDestinySlots).toBeLessThanOrEqual(3);
      }
    }
  });

  it('每级必填字段完整', () => {
    for (const v of VIP_LEVELS) {
      expect(v.name).toBeTruthy();
      expect(Array.isArray(v.perks)).toBe(true);
      expect(typeof v.upgradeJade).toBe('number');
      expect(Array.isArray(v.mods)).toBe(true);
    }
  });

  it('validateVipConfig 不抛错', () => {
    expect(() => validateVipConfig()).not.toThrow();
  });

  it('奖励字段类型正确', () => {
    for (const v of VIP_LEVELS) {
      if (v.dailyReward) {
        expect(typeof v.dailyReward).toBe('object');
      }
      if (v.weeklyReward) {
        expect(typeof v.weeklyReward).toBe('object');
      }
      if (v.oneTimeReward) {
        expect(typeof v.oneTimeReward).toBe('object');
      }
    }
  });

  it('功能解锁标识合法', () => {
    const validFeatures = ['autoBattle2x', 'skipWave', 'offlineIdle', 'extraDestinySlot'];
    for (const v of VIP_LEVELS) {
      if (v.unlockFeatures) {
        for (const f of v.unlockFeatures) {
          expect(validFeatures).toContain(f);
        }
      }
    }
  });

  it('VIP 15 级封顶数值不突破 Modifier 管线上限（伤害+150%、经济+80%、攻速+60%、暴击≤0.6、射程≤2.0）', () => {
    const max = VIP_LEVELS[VIP_MAX_LEVEL];
    let dmgSum = 0, bountySum = 0, rateSum = 0, critSum = 0, rangeSum = 0;
    for (const m of max.mods) {
      if (m.op === 'mul_pct') {
        if (m.stat === 'dmg' || m.stat.endsWith('Dmg')) dmgSum += m.value;
        if (m.stat === 'bountyMul') bountySum += m.value;
        if (m.stat === 'rate') rateSum += m.value;
      }
      if (m.op === 'add') {
        if (m.stat === 'crit') critSum += m.value;
        if (m.stat === 'range') rangeSum += m.value;
      }
    }
    expect(dmgSum).toBeLessThanOrEqual(1.5);
    expect(bountySum).toBeLessThanOrEqual(0.8);
    expect(rateSum).toBeLessThanOrEqual(0.6);
    expect(critSum).toBeLessThanOrEqual(0.6);
    expect(rangeSum).toBeLessThanOrEqual(2.0);
  });
});