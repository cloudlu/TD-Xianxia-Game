// 波次生成的纯函数（设计文档 §8.3 spawn 编排，含多路径分流 path 字段）
import type { SpawnEntry } from '../../types';

export interface QueuedSpawn {
  enemyId: string;
  time: number;
  pathIndex: number;   // 走第几条路径
}

/** 把一波的 spawn 配置展开为按时间排序的生成队列 */
export function buildSpawnQueue(spawns: ReadonlyArray<SpawnEntry>): QueuedSpawn[] {
  const q: QueuedSpawn[] = [];
  for (const sp of spawns) {
    const pathIndex = sp.path ?? 0;
    for (let i = 0; i < sp.count; i++) {
      q.push({ enemyId: sp.enemy, time: sp.delay + i * sp.gap, pathIndex });
    }
  }
  return q.sort((a, b) => a.time - b.time);
}

