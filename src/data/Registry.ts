// Registry —— 按 id 查配置的统一入口（设计文档 §3）
// P2 起从 JSON 加载并校验，这里直接读 config 目录

import { TOWERS, ENEMIES, LEVELS, MANIFEST } from './config';
import type { TowerConfig, EnemyConfig, LevelConfig, ManifestEntry } from '../types';

class Registry {
  tower(id: string): TowerConfig | undefined { return TOWERS[id]; }
  enemy(id: string): EnemyConfig | undefined { return ENEMIES[id]; }
  level(id: string): LevelConfig | undefined { return LEVELS[id]; }
  towerIds(): string[] { return Object.keys(TOWERS); }
  manifest(): ReadonlyArray<ManifestEntry> { return MANIFEST; }
}

export const registry = new Registry();
