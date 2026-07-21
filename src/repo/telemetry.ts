// 遥测埋点：TelemetryRepo 接口 + LocalTelemetryRepo（localStorage 持久化）
// 设计文档 v0.74 — P1 遥测埋点

export interface TelemetryKill {
  levelId: string; difficulty: string; waveIndex: number;
  towerId: string; enemyId: string; bounty: number;
}

export interface TelemetryLeak {
  levelId: string; difficulty: string; waveIndex: number;
  enemyId: string; livesLost: number;
}

export interface TelemetryEconomy {
  levelId: string; difficulty: string; elapsed: number;
  stones: number; delta: number; reason: string;
}

export interface TelemetryTowerDps {
  levelId: string; difficulty: string; elapsed: number;
  towerId: string; totalDmg: number; kills: number;
}

export interface TelemetryVipStatus {
  vipLevel: number;
  effectiveDmgMul: number;
  effectiveBountyMul: number;
  effectiveRateMul: number;
  isDmgCapped: boolean;
  isBountyCapped: boolean;
  isRateCapped: boolean;
}

export interface TelemetryEntry {
  type: 'kill' | 'leak' | 'economy' | 'tower_dps' | 'vip_status';
  levelId: string;
  difficulty: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface TelemetryRepo {
  recordKill(entry: TelemetryKill): void;
  recordLeak(entry: TelemetryLeak): void;
  recordEconomy(entry: TelemetryEconomy): void;
  recordTowerDps(entry: TelemetryTowerDps): void;
  recordVipStatus(entry: TelemetryVipStatus): void;
  getSessionLogs(): TelemetryEntry[];
  clear(): void;
}

const STORAGE_KEY = 'telemetry_log';

export function createLocalTelemetryRepo(namespace = ''): TelemetryRepo {
  const key = namespace + STORAGE_KEY;
  let entries: TelemetryEntry[] = load();

  function load(): TelemetryEntry[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as TelemetryEntry[]) : [];
    } catch { return []; }
  }

  function save(): void {
    try { localStorage.setItem(key, JSON.stringify(entries)); } catch { /* quota exceeded — ignore */ }
  }

  return {
    recordKill(e) {
      entries.push({ type: 'kill', levelId: e.levelId, difficulty: e.difficulty, timestamp: Date.now(), data: { ...e } });
      save();
    },
    recordLeak(e) {
      entries.push({ type: 'leak', levelId: e.levelId, difficulty: e.difficulty, timestamp: Date.now(), data: { ...e } });
      save();
    },
    recordEconomy(e) {
      entries.push({ type: 'economy', levelId: e.levelId, difficulty: e.difficulty, timestamp: Date.now(), data: { delta: e.delta, reason: e.reason, balance: e.stones, elapsed: e.elapsed } });
      save();
    },
    recordTowerDps(e) {
      entries.push({ type: 'tower_dps', levelId: e.levelId, difficulty: e.difficulty, timestamp: Date.now(), data: { ...e } });
      save();
    },
    recordVipStatus(e) {
      entries.push({ type: 'vip_status', levelId: '', difficulty: '', timestamp: Date.now(), data: { ...e } });
      save();
    },
    getSessionLogs() { return [...entries]; },
    clear() { entries = []; save(); },
  };
}
