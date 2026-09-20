// 波次管理（设计文档 §1.3）：负责敌人生命周期（生成 / 移动 / 漏怪 / 清波判定）
// 从 Game.ts 拆分，Game 作为协调者调用 WaveManager + CombatSystem。
//
// WaveManager 拥有 enemies[] 数组的所有权；战斗中需要读写敌人时，
// Game 直接操作 this.waveManager.enemies（不绕回调以避免性能开销）。

import type { LevelConfig, EnemyConfig, WaveConfig } from '../types';
import { buildSegments, positionAt, totalLength, type Segment } from './pure/path';
import { WaveDirector } from './WaveDirector';
import { scaleEnemy } from './pure/combat';
import { ModifierSet } from '../data/Modifier';

/** 敌人运行时状态（与 Game.ts 的 EnemyR 同构，合并后统一用此类型） */
export interface EnemyR {
  uid: number;
  def: EnemyConfig;
  hp: number;
  maxHp: number;
  shield: number;
  pathIndex: number;
  dist: number;
  x: number; y: number;
  abilityTimer: number;
  speedMul: number;
  hitFlash: number;
  bounty: number;
  slowFactor: number;
  slowUntil: number;
  dead: boolean;
  leaked: boolean;
  burrowTimer: number;
  burrowed: boolean;
}

/** 每帧波次事件，Game 据此更新 stones/lives/status */
export interface WaveEvents {
  leacked: number;       // 本帧漏怪总数（已经过横扫符拦截，实际扣心数）
  killed: number;        // 累计击杀（战报快照用）
  spawned: number;       // 累计生成（战报快照用）
  waveCleared: boolean;  // 本帧是否清完一波
  allCleared: boolean;   // 所有波次是否已清完
  sweptEnemies: EnemyR[]; // 本帧被横扫符清掉的敌人（车道模式，Game 负责发赏金/演出）
}

export class WaveManager {
  enemies: EnemyR[] = [];
  waveActive = false;
  waveIndex = 0;
  elapsed = 0;
  waveTotalSpawned = 0;
  waveKilled = 0;
  readonly segs: Segment[][];
  readonly pathLens: number[];
  readonly levelLives: number;
  /** 关卡级敌人速度倍率（夜袭冲阵；1=默认） */
  private readonly speedMul: number;

  private waveDir = new WaveDirector();
  private mods: ModifierSet;
  private uidSeq = 1_000_000;
  private waves: WaveConfig[];

  constructor(level: LevelConfig, mods: ModifierSet) {
    this.segs = level.paths.map((p) => buildSegments(p));
    this.pathLens = this.segs.map((s) => totalLength(s));
    this.waves = level.waves.slice();
    this.mods = mods;
    this.levelLives = level.lives;
    // 夜袭冲阵速度倍率（v0.93）：敌人整体加速，压缩塔的暴露输出窗口
    this.speedMul = level.mode === 'stream' ? (level.stream?.enemySpeedMul ?? 1) : 1;
  }

  /** 当前波次是否全部生成完毕 */
  get spawnDone(): boolean { return this.waveDir.done; }

  /** 总波次数 */
  get totalWaves(): number { return this.waves.length; }

  /** 下一波敌人预告（prep 时为当前波，wave 时为再下一波） */
  peekNextWave(): ReadonlyArray<{ enemy: string; count: number; path?: number }> | undefined {
    const idx = this.waveActive ? this.waveIndex + 1 : this.waveIndex;
    if (idx >= this.waves.length) return undefined;
    return this.waves[idx].spawns;
  }

  posAt(pathIndex: number, dist: number): { x: number; y: number } {
    return positionAt(this.segs[pathIndex] ?? [], dist);
  }

  /**
   * 妖风变列（v0.92）：把敌人重绑到另一条路径（列），保留行进进度 dist。
   * 路径几何必须同构（同长度纵向直线），否则位置会跳变——调用方保证。
   * 返回是否成功（目标路径存在时 true）。
   */
  retargetPath(e: EnemyR, newPathIndex: number): boolean {
    const segs = this.segs[newPathIndex];
    if (!segs) return false;
    e.pathIndex = newPathIndex;
    const p = positionAt(segs, e.dist);
    e.x = p.x; e.y = p.y;
    return true;
  }

  /** 开始一波 */
  startWave(wave: WaveConfig): void {
    this.waveDir.start(wave);
    this.waveActive = true;
    this.waveTotalSpawned = 0;
    this.waveKilled = 0;
  }

  /** 在指定路径的指定进度生成敌人（波次起始 dist=0；分裂/召唤用具体位置） */
  spawnEnemyAt(enemyId: string, pathIndex: number, dist: number, def: EnemyConfig | undefined, hpMul: number, bountyMul?: number): EnemyR | null {
    if (!def) return null;
    const p = this.posAt(pathIndex, dist);
    const scaled = scaleEnemy(def.hp, def.bounty, hpMul, bountyMul);
    const e: EnemyR = {
      uid: this.uidSeq++, def, hp: scaled.hp, maxHp: scaled.hp,
      shield: (def.shield ?? 0) * hpMul, pathIndex, dist,
      x: p.x, y: p.y, abilityTimer: def.bossAbility?.interval ?? 0,
      speedMul: 1, hitFlash: 0, bounty: scaled.bounty, slowFactor: 1, slowUntil: 0,
      dead: false, leaked: false,
      burrowTimer: def.burrow?.surfDuration ?? 0,
      burrowed: false,
    };
    this.enemies.push(e);
    this.waveTotalSpawned++;
    return e;
  }

  /** 推进一帧波次（生成 + 移动 + 漏怪判定），返回本帧事件 */
  update(dt: number, mods: ModifierSet, regLookup: { enemy(id: string): EnemyConfig | undefined }, hpMul: number, bountyMul?: number, sweepCheck?: (e: EnemyR) => boolean): WaveEvents {
    this.elapsed += dt;
    const result: WaveEvents = { leacked: 0, killed: this.waveKilled, spawned: this.waveTotalSpawned, waveCleared: false, allCleared: false, sweptEnemies: [] };

    // 生成
    this.waveDir.update(dt, (id, pathIndex) => {
      const def = regLookup.enemy(id);
      this.spawnEnemyAt(id, pathIndex, 0, def, hpMul, bountyMul);
    });

    // 移动
    const globalSlow = mods.enemySlowAura();
    for (const e of this.enemies) {
      if (e.leaked || e.dead) continue;
      const slowMul = (this.elapsed < e.slowUntil) ? e.slowFactor : globalSlow;
      e.dist += e.def.speed * this.speedMul * e.speedMul * slowMul * dt;
      const pathLen = this.pathLens[e.pathIndex] ?? 0;
      if (e.dist < pathLen) {
        const p = this.posAt(e.pathIndex, e.dist);
        e.x = p.x; e.y = p.y;
        // 越过横扫符触发线即扫（lane/stream 的防线可在路径中段）
        if (sweepCheck && sweepCheck(e)) {
          e.leaked = true;       // 从场上移除，但不计漏怪（不扣心）
          result.sweptEnemies.push(e);
        }
      } else if (sweepCheck && sweepCheck(e)) {
        // 抵达终点时的最后机会（触发线在终点附近/越过时兜底）
        e.leaked = true;
        result.sweptEnemies.push(e);
      } else {
        e.leaked = true;
        result.leacked++;
      }
    }

    // 清波判定（waveIndex 由 Game 在 processWaveEvents 中递增，allCleared 也由 Game 判断）
    if (this.waveDir.done && this.enemies.length === 0) {
      this.waveActive = false;
      result.waveCleared = true;
      // allCleared 由 Game.processWaveEvents 根据 Game.waves.length 判定
    }

    return result;
  }

  /** 移除阵亡/漏怪（每帧末尾调用） */
  cleanup(): void {
    for (const e of this.enemies) {
      if (e.dead) this.waveKilled++;
    }
    this.enemies = this.enemies.filter((e) => !e.dead && !e.leaked);
  }
}
