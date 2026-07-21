// 玩家操作（设计文档 §1.3）：负责塔的放置 / 升级 / 出售 / 索敌切换
// 拥有 towers[] 和 stones，Game 作为协调者统⼀管理 msg/emit。

import type { LevelConfig, TowerConfig, TargetPolicy } from '../types';
import { investedCost, sellRefund as computeSellRefund } from './pure/economy';

export interface TowerR {
  uid: number;
  def: TowerConfig;
  col: number; row: number;
  x: number; y: number;
  level: number;
  cooldown: number;
  targetPolicy: TargetPolicy;
  disabledUntil: number;
  knockImmuneUntil: number;
  flashTimer: number;
}

export interface TowerLookup {
  tower(id: string): TowerConfig | undefined;
}

export class TowerOperations {
  towers: TowerR[] = [];
  stones: number;
  msg: string = '';
  globalTargetPolicy: TargetPolicy | null = null;

  private uidCounter = 1;

  constructor(
    private level: LevelConfig,
    private reg: TowerLookup,
    startStones: number,
  ) {
    this.stones = startStones;
  }

  canPlace(col: number, row: number): boolean {
    if (col < 0 || row < 0 || col >= this.level.cols || row >= this.level.rows) return false;
    if (!this.level.buildable[row][col]) return false;
    return !this.towers.some((t) => t.col === col && t.row === row);
  }

  placeTower(col: number, row: number, towerId: string): boolean {
    const def = this.reg.tower(towerId);
    if (!def || !this.canPlace(col, row)) return false;
    if (this.stones < def.cost) { this.msg = '灵石不足！'; return false; }
    this.stones -= def.cost;
    this.towers.push({
      uid: this.nextUid(), def, col, row,
      x: col + 0.5, y: row + 0.5, level: 0, cooldown: 0,
      targetPolicy: this.globalTargetPolicy ?? def.targetPolicy, disabledUntil: 0, knockImmuneUntil: 0, flashTimer: 0,
    });
    this.msg = `布置 ${def.name}。`;
    return true;
  }

  towerAt(col: number, row: number): TowerR | undefined {
    return this.towers.find((t) => t.col === col && t.row === row);
  }

  private static POLICIES: TargetPolicy[] = ['first', 'last', 'strongest', 'nearest'];

  cycleTargetPolicy(uid: number): TargetPolicy | null {
    const t = this.towers.find((x) => x.uid === uid);
    if (!t) return null;
    const i = TowerOperations.POLICIES.indexOf(t.targetPolicy);
    t.targetPolicy = TowerOperations.POLICIES[(i + 1) % TowerOperations.POLICIES.length];
    return t.targetPolicy;
  }

  setGlobalTargetPolicy(policy: TargetPolicy): void {
    this.globalTargetPolicy = policy;
    for (const t of this.towers) t.targetPolicy = policy;
  }

  private maxTowerLevelFor(def: TowerConfig): number {
    const towerMax = def.levels.length - 1;
    const levelCap = this.level.maxTowerLevel ?? towerMax;
    return Math.min(levelCap, towerMax);
  }

  upgradeCost(uid: number): number | null {
    const t = this.towers.find((x) => x.uid === uid);
    if (!t || t.level >= this.maxTowerLevelFor(t.def)) return null;
    return t.def.levels[t.level + 1].upgradeCost ?? null;
  }

  sellRefund(uid: number): number {
    const t = this.towers.find((x) => x.uid === uid);
    return t ? computeSellRefund(t.def, t.level) : 0;
  }

  upgradeTower(uid: number): boolean {
    const t = this.towers.find((x) => x.uid === uid);
    if (!t) return false;
    const cap = this.maxTowerLevelFor(t.def);
    if (t.level >= cap) {
      this.msg = t.level >= t.def.levels.length - 1 ? '已达化神，无可突破。' : '已达本关境界上限。';
      return false;
    }
    const nextLv = t.def.levels[t.level + 1];
    if (nextLv.upgradeCost === undefined) return false;
    if (this.stones < nextLv.upgradeCost) { this.msg = '灵石不足，无法突破！'; return false; }
    this.stones -= nextLv.upgradeCost;
    t.level += 1;
    this.msg = `${t.def.name} 突破至 ${nextLv.realm}！`;
    return true;
  }

  sellTower(uid: number): boolean {
    const idx = this.towers.findIndex((x) => x.uid === uid);
    if (idx < 0) return false;
    const t = this.towers[idx];
    const refund = Math.floor(this.invested(t) * t.def.sellRatio);
    this.stones += refund;
    this.towers.splice(idx, 1);
    this.msg = `出售 ${t.def.name}，返还 ${refund} 灵石。`;
    return true;
  }

  private invested(t: TowerR): number {
    return investedCost(t.def, t.level);
  }

  private nextUid(): number { return this.uidCounter++; }
}
