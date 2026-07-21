import { describe, it, expect } from 'vitest';
import { withDefaults } from './progress';
import {
  claimVipDaily,
  claimVipWeekly,
  claimVipOneTime,
  upgradeVipTo,
  todayKey,
  weekKey,
} from './progressMeta';
import { VIP_LEVELS } from '../data/config/vip';

function baseProgression(overrides: Partial<ReturnType<typeof withDefaults>> = {}) {
  return withDefaults({
    vipLevel: 3,
    jade: 1000,
    contribution: 1000,
    destinyScrolls: 10,
    soulShards: 10,
    vipDailyClaimed: [],
    vipWeeklyClaimed: [],
    vipOneTimeClaimed: [],
    ...overrides,
  });
}

describe('VIP 领取业务函数', () => {
  describe('claimVipDaily', () => {
    it('当前 VIP 有每日奖励且未领取时成功', () => {
      const p = baseProgression({ vipLevel: 3 });
      const r = claimVipDaily(p);
      expect(r).not.toBeNull();
      expect(r!.contribution).toBe(1000 + 150); // VIP 3 daily: contribution 150
      expect(r!.destinyScrolls).toBe(10 + 1); // VIP 3 daily: destinyScrolls 1
      expect(r!.vipDailyClaimed).toContain(todayKey());
    });

    it('已领取过今天返回 null', () => {
      const p = baseProgression({ vipLevel: 3, vipDailyClaimed: [todayKey()] });
      expect(claimVipDaily(p)).toBeNull();
    });

    it('当前 VIP 无每日奖励返回 null', () => {
      const p = baseProgression({ vipLevel: 0 });
      expect(claimVipDaily(p)).toBeNull();
    });

    it('各类奖励字段都能累加', () => {
      const p = baseProgression({ vipLevel: 5 });
      const r = claimVipDaily(p);
      expect(r!.jade).toBe(1000); // VIP 5 无 jade
      expect(r!.contribution).toBe(1300); // +300
      expect(r!.destinyScrolls).toBe(12); // +2
      expect(r!.soulShards).toBe(15); // +5
    });
  });

  describe('claimVipWeekly', () => {
    it('当前 VIP 有每周奖励且未领取时成功', () => {
      const p = baseProgression({ vipLevel: 3 });
      const r = claimVipWeekly(p);
      expect(r).not.toBeNull();
      expect(r!.contribution).toBe(1000 + 500); // VIP 3 weekly: contribution 500
      expect(r!.vipWeeklyClaimed).toContain(weekKey());
    });

    it('已领取过本周返回 null', () => {
      const p = baseProgression({ vipLevel: 3, vipWeeklyClaimed: [weekKey()] });
      expect(claimVipWeekly(p)).toBeNull();
    });

    it('当前 VIP 无每周奖励返回 null', () => {
      const p = baseProgression({ vipLevel: 1 }); // VIP 1 无 weeklyReward
      expect(claimVipWeekly(p)).toBeNull();
    });
  });

  describe('claimVipOneTime', () => {
    it('等级足够且未领取时成功', () => {
      const p = baseProgression({ vipLevel: 3 });
      const r = claimVipOneTime(p, 3);
      expect(r).not.toBeNull();
      expect(r!.jade).toBe(1000 + 30); // VIP 3 oneTime: jade 30
      expect(r!.vipOneTimeClaimed).toContain(3);
    });

    it('等级不足返回 null', () => {
      const p = baseProgression({ vipLevel: 2 });
      expect(claimVipOneTime(p, 3)).toBeNull();
    });

    it('已领取返回 null', () => {
      const p = baseProgression({ vipLevel: 3, vipOneTimeClaimed: [3] });
      expect(claimVipOneTime(p, 3)).toBeNull();
    });

    it('该等级无一次性奖励返回 null', () => {
      const p = baseProgression({ vipLevel: 1 }); // VIP 1 无 oneTimeReward
      expect(claimVipOneTime(p, 1)).toBeNull();
    });
  });

  describe('upgradeVipTo', () => {
    it('直升成功不扣仙玉', () => {
      const p = baseProgression({ vipLevel: 1, totalRecharged: 500 });
      const r = upgradeVipTo(p, 3);
      expect(r).not.toBeNull();
      expect(r!.vipLevel).toBe(3);
      // upgradeVipTo 不修改 jade / totalRecharged
      expect(r!.totalRecharged).toBe(500);
    });

    it('目标等级 <= 当前等级返回 null', () => {
      const p = baseProgression({ vipLevel: 3 });
      expect(upgradeVipTo(p, 3)).toBeNull();
      expect(upgradeVipTo(p, 2)).toBeNull();
    });

    it('目标等级超过上限返回 null', () => {
      const p = baseProgression({ vipLevel: 14, totalRecharged: 100000 });
      expect(upgradeVipTo(p, 20)).toBeNull();
    });

    it('累计充值不足返回 null', () => {
      const p = baseProgression({ vipLevel: 1, totalRecharged: 100 });
      expect(upgradeVipTo(p, 3)).toBeNull(); // need 240
    });

    it('直升多级正确', () => {
      const p = baseProgression({ vipLevel: 0, totalRecharged: 10000 });
      const r = upgradeVipTo(p, 5);
      expect(r).not.toBeNull();
      expect(r!.vipLevel).toBe(5);
      expect(r!.totalRecharged).toBe(10000);
    });
  });

  describe('todayKey / weekKey', () => {
    it('todayKey 格式 YYYY-MM-DD', () => {
      expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
    it('weekKey 格式 YYYY-WWW', () => {
      expect(weekKey()).toMatch(/^\d{4}-W\d{2}$/);
    });
  });
});