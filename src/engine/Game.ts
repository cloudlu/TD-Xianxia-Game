// 游戏引擎核心（设计文档 §1）
// 作为协调者（Orchestrator），将职责委派给：
//   WaveManager    — 敌人生命周期（生成/移动/漏怪/清波）
//   TowerOperations — 塔操作（放置/升级/出售/索敌）
//   TowerCombat    — 塔战斗（攻击/弹道/伤害/光环/BOSS/撞塔）

import type { LevelConfig, TowerConfig, TargetPolicy, WaveConfig, ChallengeDef, FormationTile, FormationType, WaveSnapshot, BattleReport, TowerSummary, PickupStone } from '../types';
import { checkChallenge } from '../repo/challenge';
import { mulberry32 } from './PRNG';
import { type AttackStrategyRegistry, defaultAttackRegistry } from './combat/AttackStrategies';
import { ModifierSet } from '../data/Modifier';
import { WaveManager, type EnemyR } from './WaveManager';
import { TowerOperations, type TowerR } from './TowerOperations';
import { TowerCombat, type VisEffect, type CombatUpdateCtx, type CombatGameEvent } from './combat/TowerCombat';
import { visualTier } from '../data/config/towerVisuals';
import { triggerShake } from './pure/shake';
import { shouldTriggerSweep, pickupSchedule, makePickup, pickupExpired } from './pure/lanes';
import { initForges, tickForges, forgeAt as forgeAtCell, mergeForges, capForgeBonus } from './pure/forge';
import { randomSpawnCol, windShiftedCol, sweeperColumns, spawnWarnings } from './pure/stream';
import { wallRowOf } from '../data/config/streamMaps';
import {
  createHero, moveHeroX, homeSigils, tryGrantSigils, tickCooldowns, planAbilityHit,
  heroDistTo, HERO_ABILITY_SPECS, HERO_SCHOOL_META,
} from './pure/hero';
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
  /** 当前波开始时间（表现层：波次开场演出用） */
  waveStartTime: number;
  enemies: EnemyR[];
  towers: TowerR[];
  projectiles: any[];
  effects: VisEffect[];
  /** 屏幕震动状态（表现层读 snapshot 渲染，确定性相位驱动） */
  shake: { intensity: number; until: number };
  lastLeakAt: number;
  finalWaveAt: number;
  waveSpawned: number;
  waveKilled: number;
  nextWaveSpawns?: ReadonlyArray<{ enemy: string; count: number; path?: number }>;
  msg: string;
  backgroundId?: string;
  base?: { x: number; y: number };
  blocked?: ReadonlyArray<{ col: number; row: number; terrain: string }>;
  activePaths?: ReadonlyArray<number>;
  /** 车道模式状态（mode==='lane' 时透出给表现层） */
  laneMode?: boolean;
  /** 连续流夜袭模式状态（mode==='stream' 时透出） */
  streamMode?: boolean;
  /** 锻炉状态（mode==='forge' 时透出给表现层） */
  forges?: ReadonlyArray<import('../types').ForgeState>;
  /** 已收取伤害符累计加成（如 0.3 = 全塔伤害 +30%） */
  forgeBonus?: number;
  /** 各车道横扫符剩余数（index=pathIndex；0=已消耗） */
  sweepsLeft?: number[];
  sweepCol?: number;
  /** 夜袭模式横扫符触发行（防线按列布符，sweepRow 仍为触发行） */
  sweepRow?: number;
  /** 夜袭城墙行号（御剑守城贴底覆盖时与 wallRowOf 不同；表现层画墙用） */
  streamWallRow?: number;
  /** 夜袭 v0.92：出生预警（col 列在 [warnAt, spawnAt) 窗口内将出怪） */
  spawnWarnings?: ReadonlyArray<{ col: number; warnAt: number; spawnAt: number }>;
  /** 夜袭 v0.92：最近妖风时刻（表现层演出），-1=未发生 */
  lastWindAt?: number;
  /** 神雷锤击可用（弹药>0 且不在冷却） */
  hammerReady?: boolean;
  /** 神雷剩余弹药（stream 模式） */
  hammerAmmo?: number;
  /** 神雷每波弹药上限 */
  hammerAmmoMax?: number;
  /** 当前锤击连击数 */
  hammerCombo?: number;
  /** 御剑守城模式（v0.97 纯英雄：彻底无塔、鼠标移动+塔能力） */
  pureHero?: boolean;
  /** 御剑真人（pureHero/heroEnabled 时透出） */
  hero?: import('../types').HeroState;
  /** 场上塔符（拾取即获得塔能力） */
  sigils?: ReadonlyArray<import('../types').TowerSigil>;
  /** 场上待拾取灵石 */
  pickups?: ReadonlyArray<PickupStone>;
  /** 当前关卡全部活跃挑战（复刷已通关关卡时自动开启），每个的实时状态 */
  challenges?: ReadonlyArray<{
    id: string;
    name: string;
    kind: string;
    failed: boolean;
    failedReason?: string;
    progress?: {
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
  }>;
}

export class Game {
  level: LevelConfig;   // 构造时可能因境界豁免被替换（复刷/无尽），非 readonly
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
  /** 屏幕震动状态（表现层读 snapshot 渲染，确定性相位驱动） */
  shake: { intensity: number; until: number } = { intensity: 0, until: 0 };
  /** 最近漏怪时间（表现层：漏怪红晕反馈） */
  lastLeakAt = -1;
  /** 最终波开始时间（表现层：最后一波仪式演出） */
  finalWaveAt = -1;
  private acc = 0;
  nextWaveIn = PREP_FIRST;
  msg = '';
  onEvent?: (e: GameEvent) => void;
  telemetry?: TelemetryRepo;
  /** 遥测分层维度（v0.86 验收）：由应用层注入玩家 VIP 等级 */
  telemetryVipLevel = 0;
  private prevStones = 0;

  // —— 挑战玩法状态（复刷已通关关卡时，该关全部挑战同时开启）——
  activeChallenges: ChallengeDef[] = [];
  private challengeUpgraded = false;
  private challengeTotalSpent = 0;

  // —— 无尽模式跳关 + 阵眼 + 战报 ——
  endlessBlessings: string[] = [];
  private waveStartTime = 0;
  private lastWaveClearTime = 0;
  private waveRecords: WaveSnapshot[] = [];

  // —— 车道模式状态（v0.89 Phase 1）——
  readonly isLaneMode: boolean;
  /** 连续流夜袭模式（v0.91 P2）：纵向车道 + 波间 0 准备 */
  readonly isStreamMode: boolean;
  /** 三路经营战模式（v0.91 P3）：中路打怪 + 两侧锻炉经营 */
  readonly isForgeMode: boolean;
  private laneSweepsLeft: number[] = [];
  private lanePickups: PickupStone[] = [];
  private pickupUid = { n: 1 };
  private pendingPickups: { at: number; col: number; row: number }[] = [];
  private pickupRng: () => number;

  // —— 锻炉模式状态（v0.91 P3）——
  private forges: import('../types').ForgeState[] = [];
  /** 已收取伤害符累计加成（封顶前） */
  private forgeBonus = 0;
  private forgeUid = { n: 1 };

  // —— 夜袭 v0.92：全屏随机列 + 妖风 ——
  /** 出生预警（确定性时刻表）：[{col, warnAt, spawnAt}]，表现层读 */
  private spawnWarnings: { col: number; warnAt: number; spawnAt: number }[] = [];
  /** 妖风计时器：距下次妖风的秒数 */
  private windTimer = 0;
  /** 最近一次妖风时刻（表现层演出用） */
  lastWindAt = -1;
  /** 防线横扫符所在列（stream 模式） */
  private streamSweeperCols: number[] = [];
  /** 夜袭随机源（wave 派生） */
  private streamRng: () => number = () => 0;
  /** 夜袭种子基（构造时固定，与关卡 seed 关联） */
  private readonly streamSeedBase: number;

  // —— 夜袭 v0.93：神雷锤击（打小人快感）——
  /** 当前弹药 */
  private hammerAmmoLeft = 0;
  /** 冷却剩余秒（最小发射间隔） */
  private hammerCd = 0;
  /** 2s 窗口锤击连击数 */
  private hammerCombo = 0;
  private hammerComboLastAt = -10;
  /** 本波是否已触发连击伤害奖励 */
  private hammerComboRewarded = false;

  /** 御剑守城模式（v0.97 纯英雄：彻底无塔、鼠标移动+塔能力） */
  pureHero = false;

  // —— 夜袭 v0.97：御剑守城（纯英雄模式）——
  /** 城墙行号：stream.wallRow 覆盖（v0.98 御剑守城贴底 rows-2）优先，否则 WALL_INSET 默认 rows-5 */
  private heroWallRow(): number {
    return this.level.stream?.wallRow ?? wallRowOf(this.level.rows);
  }
  /** 真人实例（pureHero/heroEnabled 时创建，否则 null） */
  hero: import('../types').HeroState | null = null;
  /** 场上塔符（激活后自动飞向真人，到达即授予塔能力） */
  private sigils: import('../types').TowerSigil[] = [];
  /** 塔符 uid 序列 */
  private sigilUid = { n: 1 };
  /** 本波塔符掉落预算（击杀时于死亡坐标掉符，初始 0，startWave 置 3） */
  private sigilBudget = 0;

  getWaveClearTime(): number { return this.lastWaveClearTime; }

  setChallenge(levelChallenges: ChallengeDef[] | undefined): void {
    // 全部挑战同时开启，通关时逐个判定（达成几个算几个）
    this.activeChallenges = (levelChallenges ?? []).slice();
    this.challengeUpgraded = false;
    this.challengeTotalSpent = 0;
  }

  /** 通关后返回各挑战的判定结果（按达成顺序） */
  getChallengeResults(): ReadonlyArray<{ challenge: ChallengeDef; failed: boolean; failedReason: string }> {
    const towers = this.towerOps.towers.map((t) => ({ school: t.def.school, behavior: t.def.behavior }));
    return this.activeChallenges.map((ch) => {
      const r = checkChallenge(ch, {
        elapsed: this.waveManager.elapsed,
        towers,
        upgraded: this.challengeUpgraded,
        totalSpent: this.challengeTotalSpent,
      });
      return { challenge: ch, failed: r.failed, failedReason: r.failedReason ?? '' };
    });
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
    /** 境界封顶豁免判定（v0.86 方案 A）：返回 true 则该关不封境界（复刷已通关关/无尽模式由应用层传入） */
    realmCapExempt?: (levelId: string) => boolean,
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
    // 境界封顶豁免：无尽模式 / 已通关关卡复刷 → 移除境界上限（保护挑战玩法与大R复刷体验）
    if (level.maxTowerLevel !== undefined && (level.id === 'endless' || realmCapExempt?.(level.id))) {
      this.level = { ...level, maxTowerLevel: undefined };
    }
    this.waveManager = new WaveManager(this.level, mods);
    this.towerOps = new TowerOperations(this.level, reg, this.level.startStones);
    // 车道/夜袭模式初始化：每条活跃路径 1 个横扫符 + 拾取随机源（种子派生，确定性）
    this.isLaneMode = this.level.mode === 'lane' && !!this.level.lane;
    this.isStreamMode = this.level.mode === 'stream' && !!this.level.stream;
    this.isForgeMode = this.level.mode === 'forge' && !!this.level.forge;
    this.streamSeedBase = seed | 0;
    this.pickupRng = mulberry32(seed ^ 0x5f3759df);
    if (this.isLaneMode && this.level.lane) {
      const active = this.level.activePaths ?? this.level.paths.map((_, i) => i);
      this.laneSweepsLeft = this.level.paths.map((_, i) => (active.includes(i) ? 1 : 0));
    }
    if (this.isStreamMode) {
      // v0.92 全屏随机列：paths = cols 条纵向车道；横扫符按列随机布点（种子化）
      this.streamRng = mulberry32(seed ^ 0x2f8e3a1b);
      this.streamSweeperCols = sweeperColumns(this.level.cols, this.level.stream?.sweeperCount ?? 4, this.streamRng);
      this.laneSweepsLeft = this.level.paths.map((_, i) => (this.streamSweeperCols.includes(i) ? 1 : 0));
      this.windTimer = this.level.stream?.windIntervalSec ?? 0;
      // v0.97 御剑守城：分清纯英雄（vs 旧 heroEnabled）后站位城墙战线
      this.pureHero = this.isStreamMode && !!(this.level.stream?.pureHero);
      if (this.level.stream?.pureHero || this.level.stream?.heroEnabled) {
        this.hero = createHero(this.level.cols, this.heroWallRow());
        if (this.pureHero) {
          // 纯英雄关彻底无塔：塔上限 0、锤击禁用仅剩本命武器
          this.level = { ...this.level, buildable: this.level.buildable.map((r) => r.map(() => false)) };
        }
      }
    }
    if (this.isForgeMode && this.level.forge) {
      this.forges = initForges(this.forgeUid, this.level.forge);
    }
    const combatCtx: CombatUpdateCtx = {
      rng: () => this.rng(),
      strategies: strategies ?? defaultAttackRegistry(),
      mods: this.mods,
      towerMul: this.towerMul,
      destinyBoost: this.destinyBoost,
      hpMul: this.hpMul,
      difficultyBountyMul: this.difficultyBountyMul,
      elapsed: () => this.waveManager.elapsed,
      forgeDmgBonus: () => this.currentForgeBonus,
      spawnEnemyAt: (id, pathIdx, dist) => {
        const def = this.reg.enemy(id);
        // 夜袭全屏随机列：把 WaveDirector 分派的 pathIndex 重映射为确定性随机列
        const finalPath = this.isStreamMode ? this.streamSpawnPathOverride() : pathIdx;
        // 无尽模式赏金不随 hpMul 缩放（1.05^wave 指数增长会导致经济爆炸）
        const bountyMul = this.level.id === 'endless' ? 1 : undefined;
        const e = this.waveManager.spawnEnemyAt(id, finalPath, dist, def, this.hpMul, bountyMul);
        if (e && def?.bossAbility) {
          this.towerCombat.effects.push({
            kind: 'shockwave', x: e.x, y: e.y, color: def.color || '#ff4444',
            life: 0.6, maxLife: 0.6, vy: 0, shake: 6,
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
    // 本帧存活集合：用于"击杀掉落"判定（只统计本拍内新死的敌人）
    const beforeAliveUids = new Set<number>();
    for (const e of this.waveManager.enemies) {
      if (!e.dead && !e.leaked) beforeAliveUids.add(e.uid);
    }
    if (this.status === 'prep') {
      if (this.waveManager.waveIndex > 0) {
        this.nextWaveIn -= dt;
        if (this.nextWaveIn <= 0) this.startWave();
      }
    }
    if (this.waveManager.waveActive) {
      const bountyMul = this.level.id === 'endless' ? 1 : undefined;
      // 车道/夜袭模式：敌人抵达横扫符触发线 → 消耗该道符并拦下（不扣心，发小额赏金）
      // lane：横向车道，触发线是列（敌人 x ≤ sweepCol）；stream：防线按列布符（敌人所在列有符且 y ≤ sweepRow）
      const sweepCol = this.level.lane?.sweepCol ?? 0;
      const sweepRow = this.level.stream?.sweepRow ?? 0;
      const sweepCheck = (this.isLaneMode || this.isStreamMode)
        ? (e: EnemyR) => {
            // stream：敌自上而下（y 递增），防线在底部 → 触发行判定为 y ≥ sweepRow
            // lane：敌自右向左（x 递减），防线在左侧 → 触发线判定为 x ≤ sweepCol
            const hit = this.isStreamMode
              ? e.y >= sweepRow - 0.5 && (this.laneSweepsLeft[e.pathIndex] ?? 0) > 0
              : shouldTriggerSweep(e.x, sweepCol) && (this.laneSweepsLeft[e.pathIndex] ?? 0) > 0;
            if (!hit) return false;
            const lane = e.pathIndex;
            this.laneSweepsLeft[lane]--;
            this.emit({ type: 'sweep', pathIndex: lane });
            return true;
          }
        : undefined;
      const events = this.waveManager.update(dt, this.mods, this.reg, this.hpMul, bountyMul, sweepCheck);
      // 被横扫的敌人：发放小额赏金 + 记击杀数（战报/清波判定复用）
      if (events.sweptEnemies.length > 0) {
        const sweepBounty = Math.max(1, Math.round((this.level.lane ? 2 : 2)));
        for (const e of events.sweptEnemies) {
          this.towerOps.stones += sweepBounty;
          this.waveManager.waveKilled++;
        }
        this.recordEconomy(sweepBounty * events.sweptEnemies.length, 'sweep');
      }
      this.updatePickups(dt);
      this.tickStreamWind(dt);
      if (this.hammerCd > 0) this.hammerCd = Math.max(0, this.hammerCd - dt);
      this.processWaveEvents(events);
    }
    // 御剑守城：真人在 prep 阶段也能移动/拾取（v0.97 修复：进关后鼠标立即可操作）
    this.tickHero(dt);
    // 锻炉推进不依赖战斗状态（经营战核心节拍：波间经营、波内打怪）
    if (this.isForgeMode && this.level.forge) tickForges(this.forges, dt, this.level.forge);
    this.towerCombat.update(dt, this.waveManager.enemies, this.towerOps.towers);
    // 屏幕震动：扫描本帧新特效的 shake 标记（取最强，不叠加）
    for (const fx of this.towerCombat.effects) {
      if (fx.shake && fx.shake > 0 && fx.life >= fx.maxLife - FIXED_DT - 1e-9) {
        this.shake = triggerShake(this.shake, fx.shake, 0.35, this.waveManager.elapsed);
      }
    }
    // 塔符击杀掉落（v0.98）：本帧新死敌人（英雄弹道击杀等）于其死亡坐标掉符，
    // 掉落后立即自动飞向真人（homeSigils 每拍追踪）；每波预算上限、种子化抽系。
    if (this.pureHero && this.sigilBudget > 0) {
      const pool: import('../types').HeroTowerSchool[] = ['fire', 'thunder', 'ice', 'sword', 'talisman', 'spear'];
      const now = this.waveManager.elapsed;
      for (const e of this.waveManager.enemies) {
        if (!e.dead || !beforeAliveUids.has(e.uid)) continue;
        this.sigils.push({
          uid: this.sigilUid.n++,
          x: e.x, y: e.y,                       // 落在敌人死亡的地方（掉落感）
          school: pool[Math.floor(this.pickupRng() * pool.length)],
          spawnAt: now, lifeSec: 60,
        });
        this.sigilBudget--;
        if (this.sigilBudget <= 0) break;
      }
    }
    this.waveManager.cleanup();
    if (this.lives <= 0 && this.status !== 'lost') {
      this.status = 'lost';
      this.msg = '宗门失守……';
      this.emit({ type: 'lose' });
    }
  }

  private processWaveEvents(events: ReturnType<WaveManager['update']>): void {    const wave = this.waves[this.waveManager.waveIndex];
    const leakCost = events.leacked > 0 ? this.mods.leakToStone() : 0;
    if (leakCost > 0) {
      this.towerOps.stones = Math.max(0, this.towerOps.stones - leakCost * events.leacked);
    } else if (events.leacked > 0) {
      this.lives -= events.leacked;
    }
    for (let i = 0; i < events.leacked; i++) {
      this.lastLeakAt = this.waveManager.elapsed;   // 表现层：漏怪红晕
      this.emit({ type: 'leak' });
    }
    if (events.waveCleared) {
      this.waveManager.waveIndex++;
      this.lastWaveClearTime = Date.now();
      // 车道模式：清波奖改为波末掉落"大灵晶"（手动拾取，波间零点击压力；
      // 不过期、下一波开始前都可拾取——漏点不惩罚，只是延迟入账）
      if (this.isLaneMode && this.level.lane) {
        const laneRowYs = (this.level.activePaths ?? this.level.paths.map((_, i) => i))
          .map((i) => this.level.paths[i][0].y);
        const row = laneRowYs[Math.floor(this.pickupRng() * laneRowYs.length)] ?? 0;
        const col = 2 + Math.floor(this.pickupRng() * Math.max(1, this.level.cols - 4));
        this.lanePickups.push(makePickup(this.pickupUid, col, row, wave.clearBonus, this.waveManager.elapsed, Number.MAX_SAFE_INTEGER));
      } else {
        this.towerOps.stones += wave.clearBonus;
      }
      this.recordEconomy(wave.clearBonus, 'waveClear');
      const refund = this.mods.waveRefund();
      if (refund > 0) { this.towerOps.stones += Math.floor(wave.clearBonus * refund); this.recordEconomy(Math.floor(wave.clearBonus * refund), 'waveRefund'); }
      this.recordWaveSnapshot(wave, events, false);
      if (this.level.id !== 'endless' && this.waveManager.waveIndex >= this.waves.length) {
        this.status = 'won';
        this.msg = '守阵成功！山门无恙。';
        this.emit({ type: 'win' });
        // 遥测验收（v0.86）：通关快照——分层单塔依赖度核心指标
        if (this.telemetry) {
          const maxLv = this.towerOps.towers.reduce((m, t) => Math.max(m, t.level), 0);
          this.telemetry.recordLevelClear({
            levelId: this.level.id, difficulty: 'normal',
            vipLevel: this.telemetryVipLevel,
            towerCount: this.towerOps.towers.length,
            maxTowerLevel: maxLv,
            elapsed: this.waveManager.elapsed,
            livesLeft: this.lives,
          });
        }
        // 胜利演出：全塔波浪式 realmup（life = dur + delay，Board 在 life>maxLife 时跳过渲染 = 延迟启动）
        this.towerOps.towers.forEach((t, i) => {
          const delay = i * 0.12;
          const dur = 0.9;
          this.towerCombat.effects.push({
            kind: 'realmup', x: t.x, y: t.y, color: '#ffd700',
            life: dur + delay, maxLife: dur, vy: 0,
            school: t.def.school, tier: visualTier(t.level),
          });
        });
      } else {
        this.status = 'prep';
        // 连续流夜袭：波间 0~极短准备（清波即刻开下一波，压力连续不断）
        this.nextWaveIn = this.isStreamMode ? (this.level.stream?.prepBetweenSec ?? 0) : PREP_BETWEEN;
        this.msg = `第 ${this.waveManager.waveIndex} 波已退，清波奖 +${wave.clearBonus} 灵石。下一波 ${Math.ceil(this.nextWaveIn)} 秒后袭来。`;
      }
    }
  }

  // ---------- 车道模式：灵石拾取 ----------
  /** 波开始时生成拾取计划（确定性时刻表） */
  private schedulePickups(): void {
    this.pendingPickups = [];
    this.lanePickups = [];
    if (!this.isLaneMode || !this.level.lane) return;
    const cfg = this.level.lane.pickup;
    const active = (this.level.activePaths ?? this.level.paths.map((_, i) => i))
      .map((i) => this.level.paths[i][0].y);
    const horizon = 30;   // 计划窗口：波内前 30 秒期望分布
    this.pendingPickups = pickupSchedule(active, this.level.cols, cfg, this.waveManager.elapsed, horizon, this.pickupRng);
  }

  /** 每帧推进拾取：到时的落地生成，过期的消失（大灵晶 lifeSec=MAX 不过期） */
  private updatePickups(_dt: number): void {
    if (!this.isLaneMode) return;
    const now = this.waveManager.elapsed;
    while (this.pendingPickups.length > 0 && this.pendingPickups[0].at <= now) {
      const p = this.pendingPickups.shift()!;
      this.lanePickups.push(makePickup(this.pickupUid, p.col, p.row, this.level.lane?.pickup.value ?? 5, now));
    }
    this.lanePickups = this.lanePickups.filter((p) => !p.collected && !pickupExpired(p, now));
  }

  /** 玩家点击拾取（main.ts 调用）；返回获得灵石数（0=没点到/已过期） */
  collectPickup(uid: number): number {
    const p = this.lanePickups.find((x) => x.uid === uid && !x.collected);
    if (!p) return 0;
    p.collected = true;
    this.lanePickups = this.lanePickups.filter((x) => x.uid !== uid);
    this.towerOps.stones += p.value;
    this.recordEconomy(p.value, 'pickup');
    return p.value;
  }

  // ---------- 三路经营战：锻炉操作（v0.91 P3）----------
  /**
   * 点击锻炉（main.ts 调用）。状态机：
   *  - 炉就绪 → 收取伤害符（按炉等级计加成，封顶），进入下一轮锻造；
   *  - 炉未就绪且无选中 → 选中（合并第一步）；
   *  - 有选中：点同一炉取消；点相邻同级炉 → 合并；点其他炉 → 改选。
   * 返回操作结果描述（表现层 toast/刷新用）。
   */
  clickForge(uid: number): 'collected' | 'selected' | 'merged' | 'deselected' | 'none' {
    if (!this.isForgeMode || !this.level.forge) return 'none';
    const cfg = this.level.forge;
    const f = this.forges.find((x) => x.uid === uid);
    if (!f) return 'none';
    const selected = this.forges.find((x) => x.selected);

    if (f.ready) {
      // 收取：按炉等级计加成（高炉更值钱），封顶截断
      const add = cfg.collectDmgPctPerLevel * (f.level + 1);
      this.forgeBonus = capForgeBonus(this.forgeBonus, add, cfg);
      f.ready = false;
      f.progress = 0;
      // 顺手清掉所有选中态
      for (const x of this.forges) x.selected = false;
      this.msg = `丹成收取！全塔伤害 +${Math.round(this.forgeBonus * 100)}%（封顶 ${Math.round(cfg.maxTotalDmgPct * 100)}%）`;
      return 'collected';
    }

    if (selected && selected.uid === f.uid) {
      f.selected = false;
      return 'deselected';
    }
    if (selected && selected.level === f.level) {
      const merged = mergeForges(this.forges, selected.uid, f.uid, cfg);
      if (merged) {
        this.forges = merged;
        this.msg = `锻炉合璧！升至 ${f.level + 2} 级，出符更厚。`;
        return 'merged';
      }
    }
    // 改选
    for (const x of this.forges) x.selected = false;
    f.selected = true;
    return 'selected';
  }

  /** 锻炉加成（TowerCombat 注入用）：0 表示无 */
  get currentForgeBonus(): number {
    return this.isForgeMode ? this.forgeBonus : 0;
  }

  // ---------- 波次 ----------
  startWave(): void {
    if (this.status !== 'prep') return;
    if (this.waveManager.waveIndex >= this.waves.length) return;
    this.waveManager.startWave(this.waves[this.waveManager.waveIndex]);
    this.status = 'wave';
    this.msg = `第 ${this.waveManager.waveIndex + 1} 波来袭！`;
    if (this.isLaneMode) this.schedulePickups();
    if (this.isStreamMode) {
      this.scheduleStreamWave();
      // 神雷弹药：每波补满，重置连击与奖励标记（纯英雄关 PZ 禁用锤击）
      this.hammerAmmoLeft = this.level.stream?.hammerAmmo ?? 0;
      this.hammerCombo = 0;
      this.hammerComboRewarded = false;
      // v0.97 御剑守城：塔能力波间保留（成长积累），不清空
      // v0.98 塔符掉落改为"击杀时于死亡坐标掉符"（每波预算 3 枚，上限已由能力槽回收）
      if (this.pureHero && this.hero) this.sigilBudget = 3;
    }
    // 最后一波仪式（表现层）：非无尽模式标记最终波开始时间
    if (this.level.id !== 'endless' && this.waveManager.waveIndex === this.waves.length - 1) {
      this.finalWaveAt = this.waveManager.elapsed;
    }
    this.emit({ type: 'waveStart', wave: this.waveManager.waveIndex + 1 });
    // 聚灵阵开阵脉冲：波次开始时各阵法推一圈绿金 shockwave（表现层）
    for (const t of this.towerOps.towers) {
      if (t.def.behavior !== 'aura') continue;
      this.towerCombat.effects.push({
        kind: 'shockwave', x: t.x, y: t.y, color: t.def.color,
        life: 0.5, maxLife: 0.5, vy: 0,
      });
    }
  }

  // ---------- 夜袭 v0.92：全屏随机列出怪 + 出生预警 + 妖风 ----------
  /** 波开始时：为每个出生点生成确定性随机列 + 预警时刻表（同种子可复算） */
  private scheduleStreamWave(): void {
    this.spawnWarnings = [];
    if (!this.isStreamMode) return;
    const wave = this.waves[this.waveManager.waveIndex];
    const rng = mulberry32((this.streamSeedBase ^ (this.waveManager.waveIndex * 2654435761)) | 0);
    const cols = this.level.cols;
    const now = this.waveManager.elapsed;
    // 展开本波全部出生时刻（与 buildSpawnQueue 同规则），逐个分配随机列
    const entries: { time: number; col: number }[] = [];
    for (const sp of wave.spawns) {
      for (let i = 0; i < sp.count; i++) {
        entries.push({ time: now + sp.delay + i * sp.gap, col: randomSpawnCol(cols, rng) });
      }
    }
    entries.sort((a, b) => a.time - b.time);
    const warns = spawnWarnings(entries.map((e) => e.time));
    this.spawnWarnings = entries.map((e, i) => ({ col: e.col, warnAt: warns[i], spawnAt: e.time }));
    // （v0.98 起塔符不再随机布点：改为敌人被击杀时于其死亡坐标掉落，见 update() 内的击杀掉落逻辑）
  }

  /**
   * 夜袭出生列拦截：把 WaveDirector 分派的 pathIndex 重映射到确定性随机列。
   * 由 combatCtx.spawnEnemyAt 前置调用（Game 侧包装）。
   */
  private streamSpawnPathOverride(): number {
    const rng = mulberry32((this.streamSeedBase ^ (this.waveManager.waveIndex * 0x9e3779b9) ^ Math.floor(this.waveManager.elapsed * 1000)) | 0);
    return randomSpawnCol(this.level.cols, rng);
  }

  /** 妖风：全场存活敌人横移随机 ±1~2 列（重绑路径，保留进度） */
  private tickStreamWind(dt: number): void {
    if (!this.isStreamMode) return;
    const interval = this.level.stream?.windIntervalSec ?? 0;
    if (interval <= 0) return;
    this.windTimer -= dt;
    if (this.windTimer > 0) return;
    this.windTimer = interval;
    const cols = this.level.cols;
    const maxShift = 2;
    let moved = 0;
    for (const e of this.waveManager.enemies) {
      if (e.dead || e.leaked) continue;
      const nc = windShiftedCol(e.pathIndex, cols, maxShift, this.streamRng);
      if (nc !== e.pathIndex && this.waveManager.retargetPath(e, nc)) moved++;
    }
    this.lastWindAt = this.waveManager.elapsed;
    this.emit({ type: 'wind', movedCount: moved });
    this.msg = `妖风骤起！${moved} 只妖物行伍横移！`;
  }

  // ---------- 夜袭 v0.93：神雷锤击 ----------
  /** 神雷是否可用（弹药>0 且不在冷却） */
  get hammerReady(): boolean {
    return this.isStreamMode && (this.level.stream?.hammerAmmo ?? 0) > 0
      && this.hammerAmmoLeft > 0 && this.hammerCd <= 0;
  }

  get hammerAmmo(): number { return this.hammerAmmoLeft; }
  get hammerAmmoMax(): number { return this.level.stream?.hammerAmmo ?? 0; }
  get hammerComboCount(): number { return this.hammerCombo; }

  /**
   * 点击锤击敌人（打小人核心交互）：固定比例真伤 + 挤压特效 + 连击。
   * @param uid 敌人 uid
   * @returns 结果描述（表现层据此演出）：'hit' | 'crit' | 'killed' | 'noammo' | 'cooldown' | 'miss'
   */
  strikeEnemy(uid: number): 'hit' | 'crit' | 'killed' | 'noammo' | 'cooldown' | 'miss' {
    if (!this.isStreamMode) return 'miss';
    if ((this.level.stream?.hammerAmmo ?? 0) <= 0) return 'miss';
    if (this.hammerAmmoLeft <= 0) return 'noammo';
    if (this.hammerCd > 0) return 'cooldown';
    const e = this.waveManager.enemies.find((x) => x.uid === uid && !x.dead && !x.leaked);
    if (!e) return 'miss';
    // v0.96 御剑真人：贴身挥剑——距真人 ≤1.2 格才可击（全屏点击时代结束）
    if (this.hero && heroDistTo(this.hero, e.x, e.y) > 1.2) {
      this.msg = '距敌太远，操控真人靠近后再挥剑！（移动鼠标走位）';
      return 'miss';
    }
    // 消耗弹药 + 进入 0.3s 冷却
    this.hammerAmmoLeft--;
    this.hammerCd = 0.3;
    if (this.hero) this.hero.swingAt = this.waveManager.elapsed;   // 挥剑动画标记
    // 伤害 = 敌人缩放后最大血 × hammerDmgPct（与章节 hpMul 同步缩放，后期关不失效）；精英/BOSS 免暴击
    const pct = this.level.stream?.hammerDmgPct ?? 0.30;
    const dmg = Math.max(1, Math.round(e.maxHp * pct));
    const crit = !e.def.elite && !e.def.bossAbility;
    const final = crit ? dmg * 2 : dmg;
    // 连击计数（2s 窗口）
    const now = this.waveManager.elapsed;
    this.hammerCombo = (now - this.hammerComboLastAt < 2) ? this.hammerCombo + 1 : 1;
    this.hammerComboLastAt = now;
    // 连击 ≥15 且本波未奖励 → 本波弹药 +6（打小人高潮奖励）
    let comboBonus = false;
    if (this.hammerCombo >= 15 && !this.hammerComboRewarded) {
      this.hammerComboRewarded = true;
      this.hammerAmmoLeft += 6;
      comboBonus = true;
    }
    // 结算伤害（走 TowerCombat.damage：护甲不减免真伤路径——直接扣血，穿盾）
    const killedBefore = e.dead;
    e.shield = 0;                       // 神雷破盾
    e.hp -= final;
    e.hitFlash = crit ? 0.3 : 0.18;
    e.slowFactor = Math.min(e.slowFactor, 0.5);   // 锤击震慑：减速 50%（走既有 slow 机制 1 帧）
    e.slowUntil = now + 0.8;
    // 挤压特效：复用 hit 特效（style:'hammer' 表现层识别）+ 微震
    this.towerCombat.effects.push({
      kind: 'hit', x: e.x, y: e.y, color: crit ? '#ff5252' : '#ffd93d',
      life: 0.18, maxLife: 0.18, vy: 0,
      style: 'hammer', shake: crit ? 3 : 1.5,
    });
    if (e.hp <= 0) {
      e.dead = true;                    // WaveManager.cleanup 记击杀 + 发赏金
      this.emit({ type: 'kill', enemyId: e.def.id });
    }
    this.emit({ type: 'hammerStrike', uid, crit, killed: !killedBefore && e.dead, combo: this.hammerCombo, comboBonus });
    if (comboBonus) this.msg = `神雷连击 ×${this.hammerCombo}！弹药 +6！`;
    return e.dead ? 'killed' : (crit ? 'crit' : 'hit');
  }

  // ---------- 夜袭 v0.97：御剑守城（纯英雄，全部鼠标操作）----------
  /** 鼠标瞄准输入：设置真人目标 x（格坐标中心，clamp 内部处理） */
  setHeroTargetX(x: number): void {
    if (!this.hero) return;
    this.hero.targetX = x;
  }

  /** 点击集火：令所有塔能力优先攻击该敌人（选中即聚焦） */
  setFocus(uid: number): void {
    if (!this.hero) return;
    this.hero.focusUid = uid;
    this.msg = '已集火目标！';
  }

  /** 取消集火 */
  clearFocus(): void {
    if (!this.hero) return;
    this.hero.focusUid = undefined;
  }

  /** 每帧推进：横向移动 + 走位拾取塔符 + 塔能力自动攻击（prep/波中均推进） */
  private tickHero(dt: number): void {
    if (!this.hero) return;
    const hero = this.hero;
    const enemies = this.waveManager.enemies;
    // 移动（鼠标 X 跟随）；纯英雄模式真人锁定 y 不变（墙面战线）
    moveHeroX(hero, dt, this.level.cols);
    if (!this.pureHero) {
      hero.y = Math.max(0.5, this.heroWallRow() - 0.5);   // 旧英雄模式同样钳 y
    }
    // 塔符自动追踪 → 入体结算：到达即授予塔能力（本命剑并入升级；满槽回弹稍后再飞）
    const now = this.waveManager.elapsed;
    homeSigils(hero, this.sigils, now, dt);
    const granted = tryGrantSigils(hero, this.sigils, now);
    if (granted.length > 0) {
      const names = granted.map((s) => `${HERO_SCHOOL_META[s].icon}${HERO_SCHOOL_META[s].name}`).join('+');
      this.msg = `塔符入体·获得 ${names} 能力（自动开火）`;
      this.emit({ type: 'hammerStrike', uid: 0, crit: false, killed: false, combo: 0, comboBonus: false });
    }
    // 集火目标失效 → 清除
    if (hero.focusUid !== undefined
      && !enemies.some((e) => !e.dead && !e.leaked && e.uid === hero.focusUid)) {
      hero.focusUid = undefined;
    }
    // 冷却推进 + 逐能力攻击（v0.98：攻击改为真实弹道——从真人发射、命中才结算，
    // 走 TowerCombat 管线获得飞行轨迹 + 命中爆光 + 飘字掉血 + 击杀 poof，动感完整）
    tickCooldowns(hero, dt);
    for (const a of hero.abilities) {
      if (a.cd > 0) continue;
      const plan = planAbilityHit(hero, a, enemies);
      if (!plan) continue;
      a.cd = HERO_ABILITY_SPECS[a.school].rate;
      hero.swingAt = this.waveManager.elapsed;
      const meta = HERO_SCHOOL_META[a.school];
      const spec = HERO_ABILITY_SPECS[a.school];
      const tier = Math.min(a.level, 2) as 0 | 1 | 2;
      for (const hit of plan.targets) {
        const e = enemies[hit.idx];
        if (e.dead || e.leaked) continue;
        this.towerCombat.projectiles.push({
          x: hero.x, y: hero.y,
          targetUid: e.uid,
          dmg: hit.dmg,
          color: meta.color,
          dead: false,
          school: a.school, tier,
          fromX: hero.x, fromY: hero.y,
          slowMul: spec.slow?.mul, slowDuration: spec.slow?.duration,   // ice 减速随弹道命中附加
        });
      }
      this.emit({ type: 'hammerStrike', uid: 0, crit: true, killed: false, combo: 0, comboBonus: false });
    }
  }

  /** 场上塔符（snapshot 透出） */
  get activeSigils(): ReadonlyArray<import('../types').TowerSigil> {
    return this.sigils;
  }

  // ---------- 玩家操作 ----------
  canPlace(col: number, row: number): boolean {
    if (this.pureHero) return false;   // 御剑守城：彻底无塔
    // 锻炉格不可建塔（三路经营战）
    if (this.isForgeMode && forgeAtCell(this.forges, col, row)) return false;
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
      const t = this.towerOps.towers.find((x) => x.uid === uid);
      if (t) {
        const tier = visualTier(t.level);
        this.towerCombat.effects.push({
          kind: 'realmup', x: t.x, y: t.y, color: '#ffd700',
          life: 0.6 + tier * 0.2, maxLife: 0.6 + tier * 0.2, vy: 0,
          school: t.def.school, tier,
        });
        // 高境界（元婴+）突破额外冲击波 + 屏幕震动（tier2 更强）
        if (tier >= 1) {
          this.towerCombat.effects.push({
            kind: 'shockwave', x: t.x, y: t.y, color: t.def.color,
            life: 0.45, maxLife: 0.45, vy: 0,
            shake: tier >= 2 ? 6 : 3,
          });
        }
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

  setWaveStartTime(t: number): void { this.waveStartTime = t; }
  getWaveStartTime(): number { return this.waveStartTime; }

  /** 跳过 n 波：递增 waveIndex 并发放清波奖励 */
  skipWaves(n: number): number {
    const actual = Math.min(n, Math.max(0, 84 - this.waveManager.waveIndex));
    for (let i = 0; i < actual; i++) {
      this.waveManager.waveIndex++;
      const bonus = 100 + this.waveManager.waveIndex * 15;
      this.towerOps.stones += bonus;
      this.recordEconomy(bonus, 'waveSkip');
    }
    return actual;
  }

  /** 记录波次快照 */
  private recordWaveSnapshot(wave: WaveConfig, events: { killed: number; spawned: number; leacked: number }, skipped: boolean): void {
    const towerDps: { towerId: string; damage: number; kills: number }[] = [];
    for (const t of this.towerOps.towers) {
      const lv = t.def.levels[t.level];
      const dps = Math.round(lv.dmg * lv.rate);
      towerDps.push({ towerId: t.def.id, damage: dps, kills: 0 });
    }
    this.waveRecords.push({
      wave: this.waveManager.waveIndex,
      isBoss: ((this.waveManager.waveIndex) % 5) === 0,
      clearTime: this.waveManager.elapsed - (this.waveRecords.length > 0 ? this.waveRecords[this.waveRecords.length - 1].clearTime : 0),
      skipped,
      spawnCount: events.spawned,
      killed: events.killed,
      leaked: events.leacked,
      stonesBefore: this.towerOps.stones - wave.clearBonus,
      stonesGained: wave.clearBonus,
      towerDps,
    });
  }

  /** 获取某格上的阵眼类型 */
  formationAt(col: number, row: number): FormationType | null {
    return this.towerOps.formationAt(col, row);
  }

  /** 获取该局全部阵眼 */
  formations(): readonly FormationTile[] {
    return this.level.formations ?? [];
  }

  /** 触发无尽主动技能（天雷）：全屏 2000 真伤 */
  triggerEndlessSkill(): boolean {
    if (this.skillLastUsedWave !== undefined && this.waveManager.waveIndex - this.skillLastUsedWave < 25) {
      return false;
    }
    this.skillLastUsedWave = this.waveManager.waveIndex;
    // 对场上所有敌人造成 2000 真伤
    for (const e of this.waveManager.enemies) {
      e.hp -= 2000;
    }
    // 视觉特效：每个敌人位置 + 全屏冲击波
    for (const e of this.waveManager.enemies) {
      this.towerCombat.effects.push({
        kind: 'shockwave', x: e.x, y: e.y, color: '#ffd700', life: 0.6, maxLife: 0.6, vy: 0,
      });
    }
    // 全屏中心爆发
    this.towerCombat.effects.push({
      kind: 'burst', x: this.level.cols / 2, y: this.level.rows / 2, color: '#ffd700', life: 0.5, maxLife: 0.5, vy: 0,
    });
    this.msg = '天雷·灭！全屏清剿！';
    return true;
  }

  /** 主动技能是否可用 */
  get endlessSkillReady(): boolean {
    return this.skillLastUsedWave === undefined || this.waveManager.waveIndex - this.skillLastUsedWave >= 25;
  }
  private skillLastUsedWave: number | undefined = undefined;

  /** 导出战报 */
  get battleReport(): BattleReport {
    const towerSummary: TowerSummary[] = this.towerOps.towers.map((t) => {
      const lv = t.def.levels[t.level];
      return {
        towerId: t.def.id, level: t.level,
        col: t.col, row: t.row,
        onFormation: this.formationAt(t.col, t.row),
        totalDamage: Math.round(lv.dmg * lv.rate * this.waveManager.elapsed), totalKills: 0,
        placedAtWave: 0,
      };
    });
    return {
      date: new Date().toISOString(), mode: 'endless',
      totalWaves: this.waveManager.waveIndex,
      score: this.endlessScore,
      finalStones: Math.floor(this.towerOps.stones),
      blessings: this.endlessBlessings,
      waves: this.waveRecords,
      towers: towerSummary,
    };
  }

  // ---------- 挑战 ----------
  get challengeSucceeded(): boolean {
    return this.activeChallenges.length > 0;
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
      waveStartTime: this.waveStartTime,
      enemies: this.waveManager.enemies.map((e) => ({ ...e })),
      towers: this.towerOps.towers.map((t) => ({ ...t })),
      projectiles: this.towerCombat.projectiles.map((p) => ({ ...p })),
      effects: this.towerCombat.effects.map((fx) => ({ ...fx })),
      shake: { ...this.shake },
      lastLeakAt: this.lastLeakAt,
      finalWaveAt: this.finalWaveAt,
      waveSpawned: this.waveManager.waveTotalSpawned,
      waveKilled: this.waveManager.waveKilled,
      nextWaveSpawns: this.waveManager.peekNextWave(),
      msg: this.msg,
      backgroundId: this.level.backgroundId,
      base: this.level.base,
      blocked: this.level.blocked,
      activePaths: this.level.activePaths,
      laneMode: this.isLaneMode,
      sweepsLeft: (this.isLaneMode || this.isStreamMode) ? [...this.laneSweepsLeft] : undefined,
      sweepCol: this.isLaneMode ? this.level.lane?.sweepCol : undefined,
      sweepRow: this.isStreamMode ? this.level.stream?.sweepRow : undefined,
      streamWallRow: this.isStreamMode ? this.heroWallRow() : undefined,
      streamMode: this.isStreamMode,
      spawnWarnings: this.isStreamMode ? this.spawnWarnings.map((w) => ({ ...w })) : undefined,
      lastWindAt: this.isStreamMode ? this.lastWindAt : undefined,
      hammerReady: this.hammerReady,
      hammerAmmo: this.isStreamMode ? this.hammerAmmoLeft : undefined,
      hammerAmmoMax: this.isStreamMode ? this.hammerAmmoMax : undefined,
      hammerCombo: this.isStreamMode ? this.hammerCombo : undefined,
      pureHero: this.pureHero,
      hero: this.hero ? { ...this.hero, abilities: this.hero.abilities.map((a) => ({ ...a })) } : undefined,
      sigils: this.isStreamMode ? this.sigils.map((sc) => ({ ...sc })) : undefined,
      forges: this.isForgeMode ? this.forges.map((f) => ({ ...f })) : undefined,
      forgeBonus: this.isForgeMode ? this.forgeBonus : undefined,
      pickups: this.isLaneMode ? this.lanePickups.map((p) => ({ ...p })) : undefined,
    };

    // 全部活跃挑战的实时状态（失败判定基于已收集的统计数据）
    const towers = this.towerOps.towers;
    const results = this.getChallengeResults();
    const challenges = this.activeChallenges.map((ch, i) => {
      const res = results[i];
      let progress: NonNullable<GameState['challenges']>[number]['progress'];
      switch (ch.kind) {
        case 'speed':
          progress = { kind: 'speed', elapsed: this.waveManager.elapsed, limit: (ch.params?.limit as number) ?? 60 };
          break;
        case 'mono_school':
          progress = { kind: 'mono_school', towersPlaced: towers.length, totalTowers: towers.length, allowed: ch.params?.allowed as string };
          break;
        case 'no_upgrade':
          progress = { kind: 'no_upgrade', upgraded: this.challengeUpgraded };
          break;
        case 'no_aura':
          progress = { kind: 'no_aura', auraTowers: towers.filter((t) => t.def.behavior === 'aura').length, totalTowers: towers.length };
          break;
        case 'budget':
          progress = { kind: 'budget', totalSpent: this.challengeTotalSpent, budgetLimit: (ch.params?.limit as number) ?? 800 };
          break;
        default:
          progress = { kind: ch.kind };
      }
      return {
        id: ch.id,
        name: ch.name,
        kind: ch.kind,
        failed: res.failed,
        failedReason: res.failed ? res.failedReason : undefined,
        progress,
      };
    });

    return { ...state, challenges };
  }
}
