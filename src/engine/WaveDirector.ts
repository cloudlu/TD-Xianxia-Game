// 波次调度器（设计文档 §1.3 WaveDirector）：负责"何时生成哪个敌人、走哪条路"。
// 单一职责：只管生成队列与时间，不管敌人移动/清波判定（那些归 Game）。

import type { WaveConfig } from '../types';
import { buildSpawnQueue, type QueuedSpawn } from './pure/waves';

export type SpawnFn = (enemyId: string, pathIndex: number) => void;

export class WaveDirector {
  private queue: QueuedSpawn[] = [];
  private time = 0;

  /** 是否还有未生成的敌人 */
  get done(): boolean { return this.queue.length === 0; }

  /** 开始一波：展开配置为按时间排序的生成队列 */
  start(wave: WaveConfig): void {
    this.queue = buildSpawnQueue(wave.spawns);
    this.time = 0;
  }

  /** 推进时间，到点的敌人交给 spawn 回调生成（含路径分流） */
  update(dt: number, spawn: SpawnFn): void {
    this.time += dt;
    while (this.queue.length > 0 && this.queue[0].time <= this.time) {
      const item = this.queue.shift()!;
      spawn(item.enemyId, item.pathIndex);
    }
  }
}

