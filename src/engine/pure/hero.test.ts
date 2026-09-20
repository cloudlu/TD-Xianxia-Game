import { describe, it, expect } from 'vitest';
import {
  createHero, moveHeroX, homeSigils, tryGrantSigils, grantAbility, tickCooldowns, dmgOfSchool,
  planAbilityHit, heroDistTo, HERO_SPEED, HERO_SIGIL_FLY_SPEED, INHERENT_SWORD, HERO_ABILITY_CAP,
  ABILITY_LEVEL_MUL,
} from './hero';
import type { HeroState, HeroTowerSchool, TowerSigil } from '../../types';

const mkHero = (): HeroState => createHero(10, 4);

let uidSeq = 0;
const mkEnemy = (x: number, y: number, over: Partial<{ maxHp: number; uid: number; dead: boolean; leaked: boolean }> = {}) => ({
  uid: ++uidSeq, x, y, maxHp: 100, dead: false, leaked: false, ...over,
});

describe('createHero', () => {
  it('出生在城墙前中央（中列 + wallRow-0.5 行），自带本命飞剑', () => {
    const h = createHero(10, 4);
    expect(h.x).toBe(5.5);
    expect(h.y).toBe(3.5);
    expect(h.targetX).toBe(5.5);
    expect(h.abilities.map((a) => a.school)).toEqual([INHERENT_SWORD]);
    expect(h.abilities[0].level).toBe(0);
    expect(h.abilities[0].cd).toBe(0);
  });
});

describe('moveHeroX', () => {
  it('向 targetX 匀速逼近、不冲过头', () => {
    const h = mkHero();
    h.targetX = 7;
    moveHeroX(h, 1, 10);
    expect(h.x).toBe(7);                          // 1s 内 6 格/s > 目标距离 → 到位不冲过
    h.targetX = 5;
    moveHeroX(h, 0.2, 10);
    expect(h.x).toBeCloseTo(7 - HERO_SPEED * 0.2, 1);   // 反向匀速
    h.targetX = 100;
    moveHeroX(h, 2, 10);
    expect(h.x).toBe(9.5);                        // 钳制 cols-0.5
  });
  it('钳制左右边缘 [0.5, cols-0.5]', () => {
    const h = mkHero();
    h.targetX = -10; moveHeroX(h, 10, 10);
    expect(h.x).toBe(0.5);
    h.targetX = 100; moveHeroX(h, 100, 10);
    expect(h.x).toBe(9.5);
  });
  it('朝向随移动方向翻转', () => {
    const h = mkHero();
    h.targetX = 3; moveHeroX(h, 0.01, 10);
    expect(h.facing).toBe(-1);
    h.targetX = 8; moveHeroX(h, 0.01, 10);
    expect(h.facing).toBe(1);
  });
});

describe('heroDistTo', () => {
  it('欧氏距离', () => {
    const h = mkHero();
    expect(heroDistTo(h, 3.5, 3.5)).toBeCloseTo(2, 1);
  });
});

describe('homeSigils / tryGrantSigils（塔符自动入体）', () => {
  const sigil = (uid: number, x: number, y: number, school: HeroTowerSchool = 'thunder', spawnAt = 0): TowerSigil =>
    ({ uid, x, y, school, spawnAt, lifeSec: 30 });

  it('未激活（spawnAt 未来）不飞不结算；到达即自动授予并移除', () => {
    const h = mkHero();   // (5.5, 3.5)
    const future: TowerSigil[] = [sigil(1, 2.5, 0.5, 'thunder', 10)];
    homeSigils(h, future, 1, 1);
    expect(future[0]).toMatchObject({ x: 2.5, y: 0.5 });   // 未激活不动
    expect(tryGrantSigils(h, future, 1)).toEqual([]);
    // 激活后逐拍逼近，最终入体
    const list: TowerSigil[] = [sigil(2, 2.5, 0.5, 'thunder', 0)];
    homeSigils(h, list, 5, 1 / 30);
    expect(list[0].x).toBeGreaterThan(2.5);                // 开始向真人移动
    for (let i = 0; i < 60; i++) homeSigils(h, list, 5, 1 / 30);
    expect(tryGrantSigils(h, list, 6)).toEqual(['thunder']);
    expect(list.length).toBe(0);
  });

  it('满槽回弹：不授予、符保留、延后 spawnAt 抬升 y（稍后再飞）', () => {
    const h = mkHero();
    for (const s of ['fire', 'thunder', 'ice', 'talisman'] as const) expect(grantAbility(h, s)).toBe(true);
    expect(h.abilities.length).toBe(HERO_ABILITY_CAP + 1);
    const list: TowerSigil[] = [sigil(9, h.x, h.y, 'spear', 0)];   // 已贴到真人
    const at = 3;
    expect(tryGrantSigils(h, list, at)).toEqual([]);              // 满槽拒绝
    expect(list.length).toBe(1);                                  // 符仍在场上
    expect(list[0].spawnAt).toBe(at + 2);                         // 延后 2s 再飞
    expect(list[0].y).toBeLessThan(h.y);                          // 抬升到空中
  });

  it('过期消失（超过 spawnAt+lifeSec）', () => {
    const h = mkHero();
    const list: TowerSigil[] = [sigil(7, 2.5, 0.5, 'ice', 0)];
    list[0].lifeSec = 5;
    expect(tryGrantSigils(h, list, 10)).toEqual([]);
    expect(list.length).toBe(0);
  });

  it('飞行速度恒定（HERO_SIGIL_FLY_SPEED）', () => {
    const h = mkHero();
    const list: TowerSigil[] = [sigil(3, h.x - 20, h.y, 'fire', 0)];   // 足够远（1s 飞不完）
    for (let i = 0; i < 10; i++) homeSigils(h, list, 0, 0.1);          // 1s
    const moved = Math.abs(list[0].x - (h.x - 20));
    expect(moved).toBeCloseTo(HERO_SIGIL_FLY_SPEED, 1);
  });
});

describe('grantAbility', () => {
  it('本命剑并入既有项升级（不占槽）', () => {
    const h = mkHero();
    expect(grantAbility(h, INHERENT_SWORD)).toBe(true);
    expect(h.abilities.length).toBe(1);
    expect(h.abilities[0].school).toBe(INHERENT_SWORD);
    expect(h.abilities[0].level).toBe(1);
  });
  it('新系叠加共存；重复升级同一系', () => {
    const h = mkHero();
    grantAbility(h, 'fire');
    grantAbility(h, 'thunder');
    grantAbility(h, 'fire');
    expect(h.abilities.map((a) => `${a.school}${a.level}`)).toEqual(['sword0', 'fire1', 'thunder0']);
  });
  it('上限：除本命剑外至多 HERO_ABILITY_CAP 系，满则拒绝', () => {
    const h = mkHero();
    for (const s of ['fire', 'thunder', 'ice', 'talisman'] as const) expect(grantAbility(h, s)).toBe(true);
    expect(h.abilities.length).toBe(HERO_ABILITY_CAP + 1);
    expect(grantAbility(h, 'spear')).toBe(false);   // 满
    expect(h.abilities.length).toBe(HERO_ABILITY_CAP + 1);
  });
});

describe('tickCooldowns', () => {
  it('推进冷却至 0', () => {
    const h = mkHero();
    const a = h.abilities[0];
    a.cd = 0.8;
    tickCooldowns(h, 0.5);
    expect(a.cd).toBeCloseTo(0.3);
    tickCooldowns(h, 1);
    expect(a.cd).toBe(0);
  });
});

describe('dmgOfSchool', () => {
  it('伤害 = maxHp × dmgPct × 1.4^level，最少 1', () => {
    expect(dmgOfSchool('sword', 0, 100)).toBe(35);
    expect(dmgOfSchool('sword', 1, 100)).toBe(Math.round(35 * ABILITY_LEVEL_MUL));
    expect(dmgOfSchool('ice', 0, 5)).toBe(1);
  });
});

describe('planAbilityHit', () => {
  const h = mkHero();
  const es = [mkEnemy(6, 3.5), mkEnemy(7.5, 3.5), mkEnemy(9, 9)];
  it('范围内单体（talisman）：取最近；忽略死亡/漏怪；射程外无目标', () => {
    const alive = [mkEnemy(6, 3.5), mkEnemy(7.5, 3.5, { dead: true }), mkEnemy(9, 9, { leaked: true })];
    const r = planAbilityHit(h, { school: 'talisman', level: 0, cd: 0 }, alive);
    expect(r?.targets.map((x) => x.idx)).toEqual([0]);
    const none = planAbilityHit(h, { school: 'talisman', level: 0, cd: 0 }, [mkEnemy(9.05, 3.5)]);
    expect(none).toBeNull();
  });
  it('arc（本命飞剑）：千里剑气——全场（含远处/上空）敌人皆受伤害', () => {
    const es5 = [mkEnemy(6, 3.5), mkEnemy(7.3, 3.5), mkEnemy(8.6, 3.5), mkEnemy(9.05, 3.5), mkEnemy(6, 1.5)];
    const r = planAbilityHit(h, { school: 'sword', level: 0, cd: 0 }, es5);
    const idxs = r?.targets.map((x) => x.idx).sort((a, b) => a - b) ?? [];
    // 射程 99：远处（9.05）与上空（6,1.5）也全吃剑气
    expect(idxs).toEqual([0, 1, 2, 3, 4]);
  });
  it('集火优先：focusUid 命中范围内（即使更远）', () => {
    const h2 = mkHero();
    h2.focusUid = es[1].uid;
    const r = planAbilityHit(h2, { school: 'sword', level: 0, cd: 0 }, es);
    expect(r?.targets[0].idx).toBe(1);
  });
  it('aoe：主目标周围半径内溅射', () => {
    const es2 = [mkEnemy(6, 3.5), mkEnemy(5.2, 3.2), mkEnemy(9, 9)];   // 25 距主目标 0.83（<aoeRadius 1.2）
    const r = planAbilityHit(h, { school: 'fire', level: 0, cd: 0 }, es2);
    expect(r?.targets.map((x) => x.idx).sort()).toEqual([0, 1]);
  });
  it('chain：链电至多 chainCount，距离 chainRange 内', () => {
    const es3 = [mkEnemy(6, 3.5), mkEnemy(7.3, 3.5), mkEnemy(7.6, 4.5), mkEnemy(12, 3.5)];
    const r = planAbilityHit(h, { school: 'thunder', level: 0, cd: 0 }, es3);
    expect(r?.targets.map((x) => x.idx).sort()).toEqual([0, 1, 2]);
  });
  it('pierce：皇朝横扫（toward facing 近身带内至多 3）', () => {
    h.facing = 1;
    const es4 = [mkEnemy(6.5, 3.5), mkEnemy(6.5, 3.0), mkEnemy(6.5, 4.2), mkEnemy(6.5, 2.2)];
    const r = planAbilityHit(h, { school: 'spear', level: 0, cd: 0 }, es4);
    const idxs = r?.targets.map((x) => x.idx) ?? [];
    expect(idxs.length).toBeGreaterThanOrEqual(2);   // 近身带内 2~3 名（0.6 带上 3.5/3.0/4.2 xor 2.2）
    expect(idxs.length).toBeLessThanOrEqual(3);
  });
  it('射程内无目标 → 空放 null（以短程 talisman 验证射程门）', () => {
    expect(planAbilityHit(h, { school: 'talisman', level: 0, cd: 0 }, [mkEnemy(9.05, 3.5)])).toBeNull();
  });
});