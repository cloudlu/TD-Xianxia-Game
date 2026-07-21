import { describe, it, expect } from 'vitest';
import { applyEnrage, applyCharm, applySummon, applyKnockback, applyBossAbilities } from './BossAbilities';
import type { BossEnemy, BossTower, BossCtx } from './BossAbilities';
import type { EnemyConfig } from '../../types';

const bossCfg: EnemyConfig = {
  id: 'boss', name: 'BOSS', icon: 'B', hp: 100, speed: 1, armor: 0, bounty: 0, color: '#f00',
  bossAbility: {
    interval: 10,
    charmRadius: 3,
    charmDuration: 2,
    summon: { enemy: 'minion', count: 2 },
    enrageBelow: { hpPct: 0.3, speedMul: 2.0, summonCount: 4 },
  },
};

const noBossCfg: EnemyConfig = {
  id: 'normal', name: '普通', icon: 'N', hp: 50, speed: 1, armor: 0, bounty: 10, color: '#fff',
  knockback: true,
};

function makeEnemy(overrides: Partial<BossEnemy> = {}): BossEnemy {
  return {
    uid: 1, def: bossCfg, hp: 100, maxHp: 100, pathIndex: 0, dist: 0,
    x: 0, y: 0, abilityTimer: 0, speedMul: 1, ...overrides,
  };
}

function makeTower(overrides: Partial<BossTower> = {}): BossTower {
  return {
    uid: 10, x: 0, y: 1, def: { behavior: 'projectile' },
    disabledUntil: 0, knockImmuneUntil: 0, ...overrides,
  };
}

describe('applyEnrage', () => {
  it('accelerates when hp below threshold', () => {
    const e = makeEnemy({ hp: 20, maxHp: 100 });
    applyEnrage(e);
    expect(e.speedMul).toBe(2.0);
  });

  it('does nothing above threshold', () => {
    const e = makeEnemy({ hp: 50, maxHp: 100 });
    applyEnrage(e);
    expect(e.speedMul).toBe(1);
  });

  it('does nothing if no enrageBelow config', () => {
    const e = makeEnemy({ def: noBossCfg, hp: 1, maxHp: 100 });
    applyEnrage(e);
    expect(e.speedMul).toBe(1);
  });
});

describe('applyCharm', () => {
  it('disables towers within radius', () => {
    const e = makeEnemy({ x: 0, y: 0 });
    const tower = makeTower({ x: 2, y: 0 });  // dist=2 < R=3
    applyCharm(e, [tower], 5);
    expect(tower.disabledUntil).toBe(5 + 2);   // charmDuration=2
    expect(tower.knockImmuneUntil).toBe(5 + 6);
  });

  it('skips aura towers', () => {
    const e = makeEnemy({ x: 0, y: 0 });
    const tower = makeTower({ x: 2, y: 0, def: { behavior: 'aura' } });
    applyCharm(e, [tower], 5);
    expect(tower.disabledUntil).toBe(0);  // unchanged
  });

  it('skips towers outside radius', () => {
    const e = makeEnemy({ x: 0, y: 0 });
    const tower = makeTower({ x: 5, y: 0 });  // dist=5 > R=3
    applyCharm(e, [tower], 5);
    expect(tower.disabledUntil).toBe(0);
  });

  it('respects immune window', () => {
    const e = makeEnemy({ x: 0, y: 0 });
    const tower = makeTower({ x: 2, y: 0, knockImmuneUntil: 10 });  // immune
    applyCharm(e, [tower], 5);
    expect(tower.disabledUntil).toBe(0);  // not charmed
  });

  it('caps charm duration at 3s', () => {
    const cfg: EnemyConfig = {
      ...bossCfg, bossAbility: { ...bossCfg.bossAbility!, charmDuration: 5 },
    };
    const e = makeEnemy({ def: cfg, x: 0, y: 0 });
    const tower = makeTower({ x: 2, y: 0 });
    applyCharm(e, [tower], 5);
    expect(tower.disabledUntil).toBe(5 + 3);  // capped at 3
  });
});

describe('applySummon', () => {
  it('spawns configured count', () => {
    const e = makeEnemy({ x: 0, y: 0, dist: 1.5, pathIndex: 0 });
    let spawned = 0;
    const ctx: BossCtx = {
      elapsed: 0, dt: 1 / 30,
      spawn: (id, pathIdx, dist) => { spawned++; expect(id).toBe('minion'); },
    };
    applySummon(e, ctx);
    expect(spawned).toBe(2);
  });

  it('spawns extra when enraged', () => {
    const e = makeEnemy({ hp: 20, maxHp: 100, x: 0, y: 0, dist: 1.5, pathIndex: 0 });
    let spawned = 0;
    const ctx: BossCtx = { elapsed: 0, dt: 1 / 30, spawn: () => spawned++ };
    applySummon(e, ctx);
    expect(spawned).toBe(4);  // enrageBelow.summonCount
  });
});

describe('applyKnockback', () => {
  it('disables tower when enemy is close', () => {
    const enemy = { def: noBossCfg, x: 0, y: 0.5 };  // dist≈0.5 < 0.9
    const tower = makeTower({ x: 0, y: 0 });
    applyKnockback([enemy], [tower], 5);
    expect(tower.disabledUntil).toBe(5 + 2);
    expect(tower.knockImmuneUntil).toBe(5 + 6);
  });
});

describe('applyBossAbilities', () => {
  it('full orchestration: enrage + timer + charm + summon', () => {
    const e = makeEnemy({ hp: 20, maxHp: 100, x: 0, y: 0, abilityTimer: 0 });
    const tower = makeTower({ x: 2, y: 0 });
    let spawnCount = 0;
    const ctx: BossCtx = {
      elapsed: 5, dt: 1 / 30,
      spawn: () => spawnCount++,
    };
    applyBossAbilities([e], [tower], ctx, 1);
    // 狂暴激活
    expect(e.speedMul).toBe(2.0);
    // 魅惑激活
    expect(tower.disabledUntil).toBe(5 + 2);
    // 召唤激活
    expect(spawnCount).toBe(4);  // enrage bonus
    // 计时器重置
    expect(e.abilityTimer).toBe(10);  // interval * mul
  });
});
