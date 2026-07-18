import type { Modifier } from '../Modifier';

/** VIP 每日/每周/一次性奖励 */
export interface VipReward {
  jade?: number;
  contribution?: number;
  destinyScrolls?: number;
  soulShards?: number;
}

/** VIP 解锁的功能标识 */
export type VipFeature = 
  | 'autoBattle2x' 
  | 'skipWave' 
  | 'offlineIdle' 
  | 'extraDestinySlot';

/** 天命阶（VIP）等级配置（设计文档 §9.4）—— mods 为该等级的累计总加成 */
export interface VipLevelConfig {
  level: number;
  name: string;
  upgradeJade: number;   // 从上一级升到本级所需仙玉
  mods: Modifier[];      // 该等级累计加成（走 Modifier 管线）
  perks: string[];       // 文案展示
  // === 运营功能 ===
  dailyReward?: VipReward;        // 每日登录奖励
  weeklyReward?: VipReward;       // 每周奖励
  oneTimeReward?: VipReward;      // 升级即领一次性礼包
  unlockFeatures?: VipFeature[];  // 解锁功能
  extraDestinySlots?: number;     // 额外天命符位（0-3）
  icon?: string;                  // UI 图标
  color?: string;                 // UI 主题色
}

export const VIP_LEVELS: readonly VipLevelConfig[] = [
  { level: 0, name: '凡人', upgradeJade: 0, mods: [], perks: ['无加成'], icon: '👤', color: '#888' },
  { level: 1, name: '天命一阶', upgradeJade: 60, mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.10 }],
    perks: ['赏金 +10%'], dailyReward: { contribution: 50 }, icon: '🌱', color: '#4caf50' },
  { level: 2, name: '天命二阶', upgradeJade: 120,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.15 }, { stat: 'rate', op: 'mul_pct', value: 0.05 }],
    perks: ['赏金 +15%', '攻速 +5%'], dailyReward: { contribution: 100 }, unlockFeatures: ['autoBattle2x'], icon: '🌿', color: '#8bc34a' },
  { level: 3, name: '天命三阶', upgradeJade: 240,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.20 }, { stat: 'rate', op: 'mul_pct', value: 0.08 }, { stat: 'dmg', op: 'mul_pct', value: 0.08 }],
    perks: ['赏金 +20%', '攻速 +8%', '全体伤害 +8%'], dailyReward: { contribution: 150, destinyScrolls: 1 }, weeklyReward: { contribution: 500 }, unlockFeatures: ['skipWave'], oneTimeReward: { jade: 30 }, icon: '🌳', color: '#cddc39' },
  { level: 4, name: '天命四阶', upgradeJade: 480,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.25 }, { stat: 'rate', op: 'mul_pct', value: 0.10 }, { stat: 'dmg', op: 'mul_pct', value: 0.12 }, { stat: 'crit', op: 'add', value: 0.03 }],
    perks: ['赏金 +25%', '攻速 +10%', '全伤 +12%', '暴击 +3%'], dailyReward: { contribution: 200, destinyScrolls: 1 }, weeklyReward: { contribution: 800, soulShards: 5 }, unlockFeatures: ['autoBattle2x', 'extraDestinySlot'], extraDestinySlots: 1, oneTimeReward: { jade: 60 }, icon: '🌸', color: '#ffeb3b' },
  { level: 5, name: '天命五阶', upgradeJade: 960,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.30 }, { stat: 'rate', op: 'mul_pct', value: 0.12 }, { stat: 'dmg', op: 'mul_pct', value: 0.15 }, { stat: 'crit', op: 'add', value: 0.05 }, { stat: 'range', op: 'add', value: 0.3 }],
    perks: ['赏金 +30%', '攻速 +12%', '全伤 +15%', '暴击 +5%', '射程 +0.3'], dailyReward: { contribution: 300, destinyScrolls: 2, soulShards: 5 }, weeklyReward: { contribution: 1200, soulShards: 10 }, unlockFeatures: ['skipWave', 'offlineIdle'], extraDestinySlots: 1, oneTimeReward: { jade: 120 }, icon: '🌺', color: '#ff9800' },
  { level: 6, name: '天命六阶', upgradeJade: 1600,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.35 }, { stat: 'rate', op: 'mul_pct', value: 0.14 }, { stat: 'dmg', op: 'mul_pct', value: 0.18 }, { stat: 'crit', op: 'add', value: 0.07 }, { stat: 'range', op: 'add', value: 0.4 }],
    perks: ['赏金 +35%', '攻速 +14%', '全伤 +18%', '暴击 +7%', '射程 +0.4'], dailyReward: { contribution: 400, destinyScrolls: 2, soulShards: 8 }, weeklyReward: { contribution: 1600, soulShards: 15 }, unlockFeatures: ['autoBattle2x', 'extraDestinySlot'], extraDestinySlots: 1, oneTimeReward: { jade: 200 }, icon: '🌼', color: '#ff5722' },
  { level: 7, name: '天命七阶', upgradeJade: 2400,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.40 }, { stat: 'rate', op: 'mul_pct', value: 0.16 }, { stat: 'dmg', op: 'mul_pct', value: 0.22 }, { stat: 'crit', op: 'add', value: 0.09 }, { stat: 'range', op: 'add', value: 0.5 }],
    perks: ['赏金 +40%', '攻速 +16%', '全伤 +22%', '暴击 +9%', '射程 +0.5'], dailyReward: { contribution: 500, destinyScrolls: 3, soulShards: 10 }, weeklyReward: { contribution: 2000, soulShards: 20 }, unlockFeatures: ['skipWave', 'offlineIdle'], extraDestinySlots: 1, oneTimeReward: { jade: 300 }, icon: '🌻', color: '#e91e63' },
  { level: 8, name: '天命八阶', upgradeJade: 3400,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.45 }, { stat: 'rate', op: 'mul_pct', value: 0.18 }, { stat: 'dmg', op: 'mul_pct', value: 0.26 }, { stat: 'crit', op: 'add', value: 0.11 }, { stat: 'range', op: 'add', value: 0.6 }],
    perks: ['赏金 +45%', '攻速 +18%', '全伤 +26%', '暴击 +11%', '射程 +0.6'], dailyReward: { contribution: 600, destinyScrolls: 3, soulShards: 15 }, weeklyReward: { contribution: 2500, soulShards: 25 }, unlockFeatures: ['autoBattle2x', 'extraDestinySlot'], extraDestinySlots: 1, oneTimeReward: { jade: 450 }, icon: '🌹', color: '#9c27b0' },
  { level: 9, name: '天命九阶', upgradeJade: 4600,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.50 }, { stat: 'rate', op: 'mul_pct', value: 0.20 }, { stat: 'dmg', op: 'mul_pct', value: 0.30 }, { stat: 'crit', op: 'add', value: 0.13 }, { stat: 'range', op: 'add', value: 0.7 }],
    perks: ['赏金 +50%', '攻速 +20%', '全伤 +30%', '暴击 +13%', '射程 +0.7'], dailyReward: { contribution: 800, destinyScrolls: 4, soulShards: 20 }, weeklyReward: { contribution: 3200, soulShards: 30 }, unlockFeatures: ['skipWave', 'offlineIdle'], extraDestinySlots: 1, oneTimeReward: { jade: 600 }, icon: '🌷', color: '#673ab7' },
  { level: 10, name: '天命十阶', upgradeJade: 6000,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.55 }, { stat: 'rate', op: 'mul_pct', value: 0.22 }, { stat: 'dmg', op: 'mul_pct', value: 0.35 }, { stat: 'crit', op: 'add', value: 0.15 }, { stat: 'range', op: 'add', value: 0.8 }],
    perks: ['赏金 +55%', '攻速 +22%', '全伤 +35%', '暴击 +15%', '射程 +0.8'], dailyReward: { contribution: 1000, destinyScrolls: 5, soulShards: 25 }, weeklyReward: { contribution: 4000, soulShards: 40 }, unlockFeatures: ['autoBattle2x', 'extraDestinySlot'], extraDestinySlots: 1, oneTimeReward: { jade: 800 }, icon: '🌸', color: '#3f51b5' },
  { level: 11, name: '天命十一阶', upgradeJade: 8000,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.60 }, { stat: 'rate', op: 'mul_pct', value: 0.24 }, { stat: 'dmg', op: 'mul_pct', value: 0.40 }, { stat: 'crit', op: 'add', value: 0.17 }, { stat: 'range', op: 'add', value: 0.9 }],
    perks: ['赏金 +60%', '攻速 +24%', '全伤 +40%', '暴击 +17%', '射程 +0.9'], dailyReward: { contribution: 1300, destinyScrolls: 6, soulShards: 30 }, weeklyReward: { contribution: 5000, soulShards: 50 }, unlockFeatures: ['skipWave', 'offlineIdle'], extraDestinySlots: 1, oneTimeReward: { jade: 1000 }, icon: '🌺', color: '#2196f3' },
  { level: 12, name: '天命十二阶', upgradeJade: 10500,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.65 }, { stat: 'rate', op: 'mul_pct', value: 0.26 }, { stat: 'dmg', op: 'mul_pct', value: 0.45 }, { stat: 'crit', op: 'add', value: 0.19 }, { stat: 'range', op: 'add', value: 1.0 }],
    perks: ['赏金 +65%', '攻速 +26%', '全伤 +45%', '暴击 +19%', '射程 +1.0'], dailyReward: { contribution: 1600, destinyScrolls: 7, soulShards: 40 }, weeklyReward: { contribution: 6400, soulShards: 60 }, unlockFeatures: ['autoBattle2x', 'extraDestinySlot'], extraDestinySlots: 1, oneTimeReward: { jade: 1300 }, icon: '🌻', color: '#03a9f4' },
  { level: 13, name: '天命十三阶', upgradeJade: 13500,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.70 }, { stat: 'rate', op: 'mul_pct', value: 0.28 }, { stat: 'dmg', op: 'mul_pct', value: 0.50 }, { stat: 'crit', op: 'add', value: 0.21 }, { stat: 'range', op: 'add', value: 1.1 }],
    perks: ['赏金 +70%', '攻速 +28%', '全伤 +50%', '暴击 +21%', '射程 +1.1'], dailyReward: { contribution: 2000, destinyScrolls: 8, soulShards: 50 }, weeklyReward: { contribution: 8000, soulShards: 70 }, unlockFeatures: ['skipWave', 'offlineIdle'], extraDestinySlots: 1, oneTimeReward: { jade: 1700 }, icon: '🌹', color: '#00bcd4' },
  { level: 14, name: '天命十四阶', upgradeJade: 17000,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.75 }, { stat: 'rate', op: 'mul_pct', value: 0.30 }, { stat: 'dmg', op: 'mul_pct', value: 0.55 }, { stat: 'crit', op: 'add', value: 0.23 }, { stat: 'range', op: 'add', value: 1.2 }],
    perks: ['赏金 +75%', '攻速 +30%', '全伤 +55%', '暴击 +23%', '射程 +1.2'], dailyReward: { contribution: 2500, destinyScrolls: 10, soulShards: 60 }, weeklyReward: { contribution: 10000, soulShards: 80 }, unlockFeatures: ['autoBattle2x', 'extraDestinySlot'], extraDestinySlots: 1, oneTimeReward: { jade: 2200 }, icon: '🌷', color: '#009688' },
  { level: 15, name: '天命十五阶', upgradeJade: 22000,
    mods: [{ stat: 'bountyMul', op: 'mul_pct', value: 0.80 }, { stat: 'rate', op: 'mul_pct', value: 0.32 }, { stat: 'dmg', op: 'mul_pct', value: 0.60 }, { stat: 'crit', op: 'add', value: 0.25 }, { stat: 'range', op: 'add', value: 1.3 }],
    perks: ['赏金 +80%', '攻速 +32%', '全伤 +60%', '暴击 +25%', '射程 +1.3'], dailyReward: { contribution: 3000, destinyScrolls: 12, soulShards: 80 }, weeklyReward: { contribution: 12000, soulShards: 100 }, unlockFeatures: ['autoBattle2x', 'skipWave', 'offlineIdle', 'extraDestinySlot'], extraDestinySlots: 1, oneTimeReward: { jade: 3000 }, icon: '👑', color: '#ffd700' },
];

export const VIP_MAX_LEVEL = VIP_LEVELS.length - 1;

/** 校验 VIP 配置完整性（启动时调用） */
export function validateVipConfig(): void {
  const seen = new Set<number>();
  for (const v of VIP_LEVELS) {
    if (seen.has(v.level)) throw new Error(`VIP 等级重复: ${v.level}`);
    seen.add(v.level);
    if (v.level < 0 || v.level > VIP_MAX_LEVEL) throw new Error(`VIP 等级越界: ${v.level}`);
    if (v.upgradeJade < 0) throw new Error(`VIP ${v.level} upgradeJade 不能为负`);
    if (v.extraDestinySlots !== undefined && (v.extraDestinySlots < 0 || v.extraDestinySlots > 3)) {
      throw new Error(`VIP ${v.level} extraDestinySlots 超出范围 0-3`);
    }
    for (const m of v.mods) {
      if (!['add', 'mul_pct'].includes(m.op)) throw new Error(`VIP ${v.level} mod op 非法: ${m.op}`);
      if (typeof m.value !== 'number' || !isFinite(m.value)) throw new Error(`VIP ${v.level} mod value 非法: ${m.value}`);
    }
  }
  // 连续性检查
  for (let i = 0; i <= VIP_MAX_LEVEL; i++) {
    if (!seen.has(i)) throw new Error(`VIP 等级缺失: ${i}`);
  }
}
