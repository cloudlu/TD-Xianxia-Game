// 游戏引擎核心（设计文档 §1）
// 作为协调者（Orchestrator），将职责委派给：
//   WaveManager    — 敌人生命周期（生成/移动/漏怪/清波）
//   TowerOperations — 塔操作（放置/升级/出售/索敌）
//   TowerCombat    — 塔战斗（攻击/弹道/伤害/光环/BOSS/撞塔）

import type { LevelConfig, TowerConfig, TargetPolicy, WaveConfig, ChallengeDef } from '../types';
import { checkChallenge } from '../repo/challenge';
import { mulberry32 } from './PRNG';
import { type AttackStrategyRegistry, defaultAttackRegistry } from './combat/AttackStrategies';
import { ModifierSet } from '../data/Modifier';
import { WaveManager, type EnemyR } from './WaveManager';
import { TowerOperations, type TowerR } from './TowerOperations';
import { TowerCombat, type VisEffect, type CombatUpdateCtx, type CombatGameEvent } from './combat/TowerCombat';
import type { EnemyConfig } from '../types';
import type { TelemetryRepo } from '../repo/telemetry';

const FIXED_DT = 1 / 30;
const PREP_FIRST = 12;
const PREP_BETWEEN = 8;

export type GameStatus = 'prep' | 'wave' | 'won' | 'lost';

export type GameEvent = CombatGameEvent;

export interface ConfigLookup {
  enemy(id: string): EnemyConfig | undefined;
  tower(id: string): TowerConfig | undefined;
}

export type { EnemyR } from './WaveManager';

export interface GameState {
  status: GameStatus;
  stones: number;
  lives: number;
  waveIndex: number;
  totalWaves: number;
  waveActive: boolean;
  nextWaveIn: number;
  elapsed: number;
  enemies: EnemyR[];
  towers: TowerR[];
  projectiles: any[];
  effects: VisEffect[];
  waveSpawned: number;
  waveKilled: number;
  nextWaveSpawns?: ReadonlyArray<{ enemy: string; count: number; path?: number }>;
  msg: string;
  challengeActive: boolean;
  challengeFailed: boolean;
  challengeFailedReason: string;
  challengeId: string | null;
  challengeName: string;
  challengeProgress?: {
    kind: string;
    elapsed?: number;
    limit?: number;
    totalSpent?: number;
    budgetLimit?: number;
    towersPlaced?: number;
    totalTowers?: number;
    auraTowers?: number;
    upgraded?: boolean;
    allowed?: string;
  };
}

export class Game {
  readonly level: LevelConfig;
  readonly waveManager: WaveManager;
  readonly towerOps: TowerOperations;
  readonly towerCombat: TowerCombat;
  private rng: () => number;
  private reg: ConfigLookup;
  private mods: ModifierSet;
  private hpMul: number;
  private towerMul: number;
  private difficultyBountyMul: number;
  private destinyBoost: number;
  private waves: WaveConfig[];

  lives: number;
  status: GameStatus = 'prep';
  private acc = 0;
  nextWaveIn = PREP_FIRST;
  msg = '';
  onEvent?: (e: GameEvent) => void;
  telemetry?: TelemetryRepo;
  private prevStones = 0;

  // —— 挑战玩法状态 ——
  activeChallenge: ChallengeDef | null = null;
  challengeFailed = false;
  challengeFailedReason = '';
  private challengeUpgraded = false;
  private challengeTotalSpent = 0;
  private challengeStartTime = 0;

  setChallenge(levelChallenges: ChallengeDef[] | undefined): void {
    if (!levelChallenges || levelChallenges.length === 0) { this.activeChallenge = null; return; }
    // 在实际 UI 中，玩家会在进关前选择挑战。此处默认取第一个。
    this.activeChallenge = levelChallenges[0];
    this.challengeFailed = false;
    this.challengeFailedReason = '';
    this.challengeUpgraded = false;
    this.challengeTotalSpent = 0;
    this.challengeStartTime = 0;
  }

  /** 兼容测试/外部代码直接读取灵石 */
  get stones(): number { return this.towerOps.stones; }
  set stones(v: number) { this.towerOps.stones = v; }

  private emit(e: GameEvent): void {
    this.onEvent?.(e);
    if (this.telemetry) {
      if (e.type === 'kill') {
        this.telemetry.recordKill({
          levelId: this.level.id, difficulty: 'normal', waveIndex: this.waveManager.waveIndex,
          towerId: 'unknown', enemyId: e.enemyId, bounty: 0,
        });
      }
    }
  }

  private recordEconomy(delta: number, reason: string): void {
    if (!this.telemetry) return;
    this.telemetry.recordEconomy({
      levelId: this.level.id, difficulty: 'normal', elapsed: this.waveManager.elapsed,
      stones: this.towerOps.stones, delta, reason,
    });
  }

  /** 由主循环每秒调用：记录塔 DPS 遥测样本 */
  telemetryTowerSample(): void {
    if (!this.telemetry) return;
    for (const t of this.towerOps.towers) {
      const lv = t.def.levels[t.level];
      const dps = Math.round(lv.dmg * lv.rate);
      this.telemetry.recordTowerDps({
        levelId: this.level.id, difficulty: 'normal', elapsed: this.waveManager.elapsed,
        towerId: t.def.id, totalDmg: dps * Math.max(1, this.waveManager.elapsed), kills: 0,
      });
    }
  }

  constructor(
    level: LevelConfig, reg: ConfigLookup, seed = 12345,
    strategies?: AttackStrategyRegistry, mods: ModifierSet = ModifierSet.empty,
    difficultyHpMul = 1, difficultyBountyMul = 1,
    destinyBoost = 1,
  ) {
    this.level = level;
    this.reg = reg;
    this.mods = mods;
    this.rng = mulberry32(seed);
    this.lives = level.lives;
    this.waves = level.waves.slice();
    this.hpMul = (level.hpMul ?? 1) * difficultyHpMul;
    this.towerMul = Math.sqrt(level.hpMul ?? 1);
    this.difficultyBountyMul = difficultyBountyMul;
    this.destinyBoost = destinyBoost;
    this.waveManager = new WaveManager(level, mods);
    this.towerOps = new TowerOperations(level, reg, level.startStones);
    const combatCtx: CombatUpdateCtx = {
      rng: () => this.rng(),
      strategies: strategies ?? defaultAttackRegistry(),
      mods: this.mods,
      towerMul: this.towerMul,
      destinyBoost: this.destinyBoost,
      hpMul: this.hpMul,
      difficultyBountyMul: this.difficultyBountyMul,
      elapsed: () => this.waveManager.elapsed,
      spawnEnemyAt: (id, pathIdx, dist) => {
        const def = this.reg.enemy(id);
        // 无尽模式赏金不随 hpMul 缩放（1.05^wave 指数增长会导致经济爆炸）
        const bountyMul = this.level.id === 'endless' ? 1 : undefined;
        const e = this.waveManager.spawnEnemyAt(id, pathIdx, dist, def, this.hpMul, bountyMul);
        if (e && def?.bossAbility) {
          this.towerCombat.effects.push({
            kind: 'shockwave', x: e.x, y: e.y, color: def.color || '#ff4444',
            life: 0.6, maxLife: 0.6, vy: 0,
          });
          this.emit({ type: 'boss' });
        }
      },
      addStones: (n) => { this.towerOps.stones += n; this.recordEconomy(n, 'bounty'); },
      emit: (e) => this.emit(e),
    };
    this.towerCombat = new TowerCombat(combatCtx);
    this.prevStones = this.towerOps.stones;
    this.msg = `布阵完毕后，点击「开始第 1 波」迎敌。`;
  }

  get waveIndex(): number { return this.waveManager.waveIndex; }

  // ---------- 主循环 ----------
  tick(realDt: number): void {
    if (this.status === 'won' || this.status === 'lost') return;
    this.acc += Math.min(realDt, 0.25);
    while (this.acc >= FIXED_DT) {
      this.update(FIXED_DT);
      this.acc -= FIXED_DT;
    }
  }

  private update(dt: number): void {
    if (this.status === 'prep') {
      if (this.waveManager.waveIndex > 0) {
        this.nextWaveIn -= dt;
        if (this.nextWaveIn <= 0) this.startWave();
      }
    }
    if (this.waveManager.waveActive) {
      const bountyMul = this.level.id === 'endless' ? 1 : undefined;
      const events = this.waveManager.update(dt, this.mods, this.reg, this.hpMul, bountyMul);
      this.processWaveEvents(events);
    }
    this.towerCombat.update(dt, this.waveManager.enemies, this.towerOps.towers);
    this.waveManager.cleanup();
    if (this.lives <= 0 && this.status !== 'lost') {
      this.status = 'lost';
      this.msg = '宗门失守……';
      this.emit({ type: 'lose' });
    }
  }

  private processWaveEvents(events: ReturnType<WaveManager['update']>): void {
    const wave = this.waves[this.waveManager.waveIndex];
    const leakCost = events.leacked > 0 ? this.mods.leakToStone() : 0;
    if (leakCost > 0) {
      this.towerOps.stones = Math.max(0, this.towerOps.stones - leakCost * events.leacked);
    } else if (events.leacked > 0) {
      this.lives -= events.leacked;
    }
    for (let i = 0; i < events.leacked; i++) {
      this.emit({ type: 'leak' });
    }
    if (events.waveCleared) {
      this.waveManager.waveIndex++;
      this.towerOps.stones += wave.clearBonus;
      this.recordEconomy(wave.clearBonus, 'waveClear');
      const refund = this.mods.waveRefund();
      if (refund > 0) { this.towerOps.stones += Math.floor(wave.clearBonus * refund); this.recordEconomy(Math.floor(wave.clearBonus * refund), 'waveRefund'); }
      // 无尽模式永不通关，由 tickEndless 动态加波；普通关卡打完所有波才获胜
      if (this.level.id !== 'endless' && this.waveManager.waveIndex >= this.waves.length) {
        this.status = 'won';
        this.msg = '守阵成功！山门无恙。';
        // 挑战检测（speed/budget 只在通关时最终判断）
        if (this.activeChallenge && !this.challengeFailed) {
          const towers = this.towerOps.towers.map((t) => ({ school: t.def.school, behavior: t.def.behavior }));
          const r = checkChallenge(this.activeChallenge, {
            elapsed: this.waveManager.elapsed,
            towers,
            upgraded: this.challengeUpgraded,
            totalSpent: this.challengeTotalSpent,
          });
          if (r.failed) { this.challengeFailed = true; this.challengeFailedReason = r.failedReason ?? ''; }
        }
        this.emit({ type: 'win' });
      } else {
        this.status = 'prep';
        this.nextWaveIn = PREP_BETWEEN;
        this.msg = `第 ${this.waveManager.waveIndex} 波已退，清波奖 +${wave.clearBonus} 灵石。下一波 ${PREP_BETWEEN} 秒后袭来。`;
      }
    }
  }

  // ---------- 波次 ----------
  startWave(): void {
    if (this.status !== 'prep') return;
    if (this.waveManager.waveIndex >= this.waves.length) return;
    this.waveManager.startWave(this.waves[this.waveManager.waveIndex]);
    this.status = 'wave';
    this.msg = `第 ${this.waveManager.waveIndex + 1} 波来袭！`;
    this.emit({ type: 'waveStart', wave: this.waveManager.waveIndex + 1 });
  }

  // ---------- 玩家操作 ----------
  canPlace(col: number, row: number): boolean {
    return this.towerOps.canPlace(col, row);
  }

  placeTower(col: number, row: number, towerId: string): boolean {
    const def = this.reg.tower(towerId);
    const before = this.towerOps.stones;
    const ok = this.towerOps.placeTower(col, row, towerId);
    this.msg = this.towerOps.msg;
    if (ok && def) {
      this.recordEconomy(this.towerOps.stones - before, 'placeTower');
      const cost = def.cost;
      this.challengeTotalSpent += cost;
      // 实时检测挑战违例
      if (this.activeChallenge && !this.challengeFailed) {
        const towers = this.towerOps.towers.map((t) => ({ school: t.def.school, behavior: t.def.behavior }));
        const r = checkChallenge(this.activeChallenge, {
          elapsed: this.waveManager.elapsed,
          towers,
          upgraded: this.challengeUpgraded,
          totalSpent: this.challengeTotalSpent,
        });
        if (r.failed) { this.challengeFailed = true; this.challengeFailedReason = r.failedReason ?? ''; }
      }
    }
    return ok;
  }

  towerAt(col: number, row: number): TowerR | undefined {
    return this.towerOps.towerAt(col, row);
  }

  cycleTargetPolicy(uid: number): TargetPolicy | null {
    return this.towerOps.cycleTargetPolicy(uid);
  }

  get globalTargetPolicy(): TargetPolicy | null {
    return this.towerOps.globalTargetPolicy;
  }

  setGlobalTargetPolicy(policy: TargetPolicy): void {
    this.towerOps.setGlobalTargetPolicy(policy);
  }

  upgradeCost(uid: number): number | null {
    return this.towerOps.upgradeCost(uid);
  }

  sellRefund(uid: number): number {
    return this.towerOps.sellRefund(uid);
  }

  upgradeTower(uid: number): boolean {
    const before = this.towerOps.stones;
    const ok = this.towerOps.upgradeTower(uid);
    this.msg = this.towerOps.msg;
    if (ok) {
      const delta = this.towerOps.stones - before;
      this.recordEconomy(delta, 'upgrade');
      this.challengeUpgraded = true;
      this.challengeTotalSpent -= delta;  // delta is negative, so this adds the cost
      // 实时检测 no_upgrade
      if (this.activeChallenge && !this.challengeFailed) {
        const towers = this.towerOps.towers.map((t) => ({ school: t.def.school, behavior: t.def.behavior }));
        const r = checkChallenge(this.activeChallenge, {
          elapsed: this.waveManager.elapsed,
          towers,
          upgraded: this.challengeUpgraded,
          totalSpent: this.challengeTotalSpent,
        });
        if (r.failed) { this.challengeFailed = true; this.challengeFailedReason = r.failedReason ?? ''; }
      }
      const t = this.towerOps.towers.find((x) => x.uid === uid);
      if (t) {
        this.towerCombat.effects.push({
          kind: 'burst', x: t.x, y: t.y, color: '#ffd700',
          life: 0.5, maxLife: 0.5, vy: 0,
        });
      }
    }
    return ok;
  }

  sellTower(uid: number): boolean {
    const before = this.towerOps.stones;
    const ok = this.towerOps.sellTower(uid);
    this.msg = this.towerOps.msg;
    if (ok) this.recordEconomy(this.towerOps.stones - before, 'sell');
    return ok;
  }

  auraBuffFor(uid: number): { dmgMul: number; rateMul: number } | null {
    return this.towerCombat.auraBuffFor(uid, this.towerOps.towers);
  }

  getEffectiveStats(uid: number): { dps: number; baseDps: number; buffPct: number; range: number; rate: number; crit: number } | null {
    return this.towerCombat.getEffectiveStats(uid, this.towerOps.towers, this.waveManager.enemies);
  }

  // ---------- 无尽模式 ----------
  setHpMul(hpMul: number): void { this.hpMul = hpMul; }
  addWave(wave: WaveConfig): void { this.waves.push(wave); }
  get clearedWaves(): number { return this.waveManager.waveIndex; }
  get endlessScore(): number {
    return this.waveManager.waveIndex * 100 + this.clearedWaves * 100 + Math.floor(this.towerOps.stones / 10);
  }

  // ---------- 挑战 ----------
  get challengeSucceeded(): boolean {
    return this.activeChallenge !== null && !this.challengeFailed;
  }

  // ---------- 快照 ----------
  snapshot(): GameState {
    const state = {
      status: this.status,
      stones: Math.floor(this.towerOps.stones),
      lives: this.lives,
      waveIndex: this.waveManager.waveIndex,
      totalWaves: this.waveManager.totalWaves,
      waveActive: this.waveManager.waveActive,
      nextWaveIn: (this.status === 'prep' && this.waveManager.waveIndex > 0) ? Math.max(0, this.nextWaveIn) : -1,
      elapsed: this.waveManager.elapsed,
      enemies: this.waveManager.enemies.map((e) => ({ ...e })),
      towers: this.towerOps.towers.map((t) => ({ ...t })),
      projectiles: this.towerCombat.projectiles.map((p) => ({ ...p })),
      effects: this.towerCombat.effects.map((fx) => ({ ...fx })),
      waveSpawned: this.waveManager.waveTotalSpawned,
      waveKilled: this.waveManager.waveKilled,
      nextWaveSpawns: this.waveManager.peekNextWave(),
      msg: this.msg,
      challengeActive: this.activeChallenge !== null,
      challengeFailed: this.challengeFailed,
      challengeFailedReason: this.challengeFailedReason,
      challengeId: this.activeChallenge?.id ?? null,
      challengeName: this.activeChallenge?.name ?? '',
    };

    // 挑战进度
    if (this.activeChallenge) {
      const ch = this.activeChallenge;
      const towers = this.towerOps.towers;
      let progress: GameState['challengeProgress'];
      switch (ch.kind) {
        case 'speed':
          progress = { kind: 'speed', elapsed: this.waveManager.elapsed, limit: (ch.params?.limit as number) ?? 60 };
          break;
        case 'mono_school':
          const allowed = ch.params?.allowed as string;
          progress = { kind: 'mono_school', towersPlaced: towers.length, totalTowers: towers.length, allowed };
          break;
        case 'no_upgrade':
          progress = { kind: 'no_upgrade', upgraded: this.challengeUpgraded };
          break;
        case 'no_aura':
          const auraTowers = towers.filter((t) => t.def.behavior === 'aura').length;
          progress = { kind: 'no_aura', auraTowers, totalTowers: towers.length };
          break;
        case 'budget':
          progress = { kind: 'budget', totalSpent: this.challengeTotalSpent, budgetLimit: (ch.params?.limit as number) ?? 800 };
          break;
        default:
          progress = { kind: ch.kind };
      }
      return { ...state, challengeProgress: progress };
    }

    return state;
  }
}
