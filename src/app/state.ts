import { Game } from '../engine/Game';
import type { ConfigLookup } from '../engine/Game';
import { registry } from '../data/Registry';
import { Board } from '../ui/Board';
import type { LevelConfig } from '../types';
import { ModifierSet } from '../data/Modifier';
import type { Modifier } from '../data/Modifier';
import { EQUIPMENT, VIP_LEVELS, talentMods, SLOTS, LIMITED_TREASURES, VIP_MAX_LEVEL } from '../data/config';
import type { EquipmentConfig } from '../data/config/equipment';
import type { SaveRepo } from '../repo/progress';
import { withDefaults } from '../repo/progress';
import { saveRepoFor } from '../repo/profiles';
import { LocalIAPRepo, type IAPRepo } from '../repo/iap';
import { RemoteIAPRepo } from '../repo/RemoteIAPRepo';
import { createLocalTelemetryRepo } from '../repo/telemetry';
import { setApiBase } from '../repo/api';
import { SOUL_SHOP_STATS } from './metaSoulShop';
import { CAPS } from '../data/Modifier';
import type { Progression } from '../repo/progress';

export const lookup: ConfigLookup = {
  enemy: (id) => registry.enemy(id),
  tower: (id) => registry.tower(id),
};

export let iap: IAPRepo = new LocalIAPRepo();

export const telemetry = createLocalTelemetryRepo();

export const app = {
  board: null as Board | null,
  game: null as Game | null,
  currentLevel: null as LevelConfig | null,
  selectedUid: null as number | null,
  activeTowerId: 'flying_sword',
  speedMul: 1,
  paused: true,
  leakFlashAmt: 0,
  prevStatus: 'prep' as string,
  last: 0,
  destinyBoost: 1 as number,
  selectedChallenge: null as string | null,
  profileId: null as string | null,
  profileName: '' as string,
  save: null as SaveRepo | null,
  progression: withDefaults({}),
};

/* progression 通过 setter 自动保存（每次重新赋值即触发 persist） */
let _progression: Progression = app.progression;
Object.defineProperty(app, 'progression', {
  get(): Progression { return _progression; },
  set(v: Progression) { _progression = v; try { persist(); } catch (e) { console.error('progression setter persist 失败:', e); } },
  enumerable: true,
  configurable: true,
});

/** 选定玩家档案：载入该档案存档（命名空间隔离） */
export async function selectProfile(id: string, name: string): Promise<void> {
  app.profileId = id;
  app.profileName = name;
  app.save = saveRepoFor(id);
  const data = await app.save.load();
  // 用 _progression 直接赋值，避免触发 setter → persist（防止 init-save 与后续写操作竞态）
  _progression = data;
}

/** 持久化当前档案（统一入口，避免各处判空） */
export function persist(): void {
  if (!app.save) { console.warn('persist: app.save 为空，进度未保存'); return; }
  app.save.save(app.progression);
}

/** 运行中生成的随机法宝（每次抽/造后添加到这里），与 EQUIPMENT 同层查询 */
export const GENERATED_EQUIPMENT: Record<string, EquipmentConfig> = {};

/** 由"装备(三槽) + 至宝 + 天命阶 + 天赋 + 仙魂"合并构建 ModifierSet（多来源走同一条管线，设计文档 §9） */
export function buildMods(): ModifierSet {
  const p = app.progression;
  const sources: Modifier[][] = [];
  for (const slot of SLOTS) {
    const id = p.equipped[slot.key];
    if (!id) continue;
    if (LIMITED_TREASURES[id]) {
      const lvl = p.treasureLevels[id] ?? 0;
      const scale = 1 + lvl * 0.15;
      const t = LIMITED_TREASURES[id];
      sources.push(t.mods.map((m) => ({ ...m, value: m.value * scale })));
      sources.push(t.uniqueMods.map((m) => ({ ...m, value: m.value * scale })));
    } else if (EQUIPMENT[id]) {
      const lvl = p.equipLevels[id] ?? 0;
      const scale = 1 + lvl * 0.15;
      sources.push(EQUIPMENT[id].mods.map((m) => ({ ...m, value: m.value * scale })));
    } else if (GENERATED_EQUIPMENT[id]) {
      const lvl = p.equipLevels[id] ?? 0;
      const scale = 1 + lvl * 0.15;
      sources.push(GENERATED_EQUIPMENT[id].mods.map((m) => ({ ...m, value: m.value * scale })));
    }
  }
  const vip = VIP_LEVELS[p.vipLevel]?.mods ?? [];
  if (vip.length) sources.push([...vip]);
  const tm = talentMods(p.talents);
  if (tm.length) sources.push(tm);
  // 仙魂碎片：独立乘数 1 + sqrt(碎片数) × 0.008（不封顶，走 _soulMul stat）
  const soulMul = Math.sqrt(p.soulShards) * 0.008;
  if (soulMul > 0) sources.push([{ stat: '_soulMul', op: 'mul_pct' as const, value: soulMul }]);
  // 仙魂商店：购买的永久加成（不封顶）
  for (const [statId, lvl] of Object.entries(p.soulShopLevels ?? {})) {
    if (lvl > 0) {
      const cfg = SOUL_SHOP_STATS[statId as keyof typeof SOUL_SHOP_STATS];
      if (cfg) sources.push([{ stat: statId, op: 'mul_pct' as const, value: lvl * cfg.perLevel }]);
    }
  }
  return ModifierSet.merge(sources);
}

/** 记录 VIP 状态遥测（用于平衡验证：各 VIP 档位实际有效加成、是否触顶） */
export function recordVipStatusTelemetry(): void {
  const mods = buildMods();
  const p = app.progression;
  const cur = VIP_LEVELS[p.vipLevel];
  const vipDmg = cur?.mods.filter(m => m.stat === 'dmg' || m.stat.endsWith('Dmg')).reduce((s, m) => s + (m.op === 'mul_pct' ? m.value : 0), 0) ?? 0;
  const vipBounty = cur?.mods.find(m => m.stat === 'bountyMul' && m.op === 'mul_pct')?.value ?? 0;
  const vipRate = cur?.mods.find(m => m.stat === 'rate' && m.op === 'mul_pct')?.value ?? 0;
  
  telemetry.recordVipStatus({
    vipLevel: p.vipLevel,
    effectiveDmgMul: mods.damageMul(['dmg', 'swordDmg', 'bowDmg', 'spearDmg', 'magicDmg', 'shieldDmg'], CAPS.damage),
    effectiveBountyMul: mods.bountyMul(CAPS.bounty),
    effectiveRateMul: mods.rateMul(CAPS.rate),
    isDmgCapped: vipDmg > CAPS.damage || mods.damageMul(['dmg', 'swordDmg', 'bowDmg', 'spearDmg', 'magicDmg', 'shieldDmg'], CAPS.damage) >= 1 + CAPS.damage,
    isBountyCapped: vipBounty > CAPS.bounty || mods.bountyMul(CAPS.bounty) >= 1 + CAPS.bounty,
    isRateCapped: vipRate > CAPS.rate || mods.rateMul(CAPS.rate) >= 1 + CAPS.rate,
  });
}

/** 切换到远程后端模式（前后端分离） */
export function useRemote(apiBase: string): void {
  setApiBase(apiBase);
  iap = new RemoteIAPRepo();
}


