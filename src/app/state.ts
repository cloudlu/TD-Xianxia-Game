import { Game } from '../engine/Game';
import type { ConfigLookup } from '../engine/Game';
import { registry } from '../data/Registry';
import { Board } from '../ui/Board';
import type { LevelConfig } from '../types';
import { ModifierSet } from '../data/Modifier';
import type { Modifier } from '../data/Modifier';
import { EQUIPMENT, VIP_LEVELS, talentMods, SLOTS } from '../data/config';
import type { SaveRepo } from '../repo/progress';
import { withDefaults } from '../repo/progress';
import { saveRepoFor } from '../repo/profiles';
import { LocalIAPRepo } from '../repo/iap';

export const lookup: ConfigLookup = {
  enemy: (id) => registry.enemy(id),
  tower: (id) => registry.tower(id),
};

export const iap = new LocalIAPRepo();

export const app = {
  board: null as Board | null,            // 由 main 创建后注入
  // —— 会话状态 ——
  game: null as Game | null,
  currentLevel: null as LevelConfig | null,
  selectedUid: null as number | null,
  activeTowerId: 'flying_sword',
  speedMul: 1,           // 0=暂停 1=1× 2=2×
  paused: true,          // 弹窗/选关期间不推进 tick
  leakFlashAmt: 0,
  prevStatus: 'prep' as string,
  last: 0,
  destinyBoost: 1 as number,     // 天命符加成的 DPS 乘数（1.15 → 消耗后下一关有效）
  // —— 档案与持久状态 ——
  profileId: null as string | null,
  profileName: '' as string,
  save: null as SaveRepo | null,
  progression: withDefaults({}),   // 选定档案后载入；初始空
};

/** 选定玩家档案：载入该档案存档（命名空间隔离） */
export function selectProfile(id: string, name: string): void {
  app.profileId = id;
  app.profileName = name;
  app.save = saveRepoFor(id);
  app.progression = app.save.load();
}

/** 持久化当前档案（统一入口，避免各处判空） */
export function persist(): void {
  app.save?.save(app.progression);
}

/** 由"装备(三槽) + 天命阶 + 天赋 + 仙魂"合并构建 ModifierSet（多来源走同一条管线，设计文档 §9） */
export function buildMods(): ModifierSet {
  const p = app.progression;
  const sources: Modifier[][] = [];
  for (const slot of SLOTS) {
    const id = p.equipped[slot.key];
    if (id && EQUIPMENT[id]) {
      const lvl = p.equipLevels[id] ?? 0;
      const scale = 1 + lvl * 0.15;
      sources.push(EQUIPMENT[id].mods.map((m) => ({ ...m, value: m.value * scale })));
    }
  }
  const vip = VIP_LEVELS[p.vipLevel]?.mods ?? [];
  if (vip.length) sources.push([...vip]);
  const tm = talentMods(p.talents);
  if (tm.length) sources.push(tm);
  // 仙魂碎片：每 5 个 +1% 全体伤害（走 Modifier 管线，和装备/天赋/VIP 加法叠加、统一封顶）
  const soulDmg = Math.floor(p.soulShards / 5) * 0.01;
  if (soulDmg > 0) sources.push([{ stat: 'dmg', op: 'mul_pct' as const, value: soulDmg }]);
  return ModifierSet.merge(sources);
}

