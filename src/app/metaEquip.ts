// 法宝阁（持有 + 商铺）
import type { EquipSlot } from '../types';
import type { EquipmentConfig } from '../data/config/equipment';
import { EQUIPMENT, EQUIPMENT_IDS, SLOTS, LIMITED_TREASURES } from '../data/config';
import { app, GENERATED_EQUIPMENT } from './state';
import { equipItem, upgradeEquip, upgradeTreasure, buyEquipment } from '../repo/progressMeta';
import { equipName, equipSlot, modLabel, updateBalance } from './metaShared';

export const EQUIP_MAX_LEVEL = 10;
export const TREASURE_MAX_LEVEL = 10;
export const equipUpgradeCost = (lvl: number) => Math.pow(2, lvl);
export const treasureUpgradeCost = (lvl: number, mul: number) => Math.round(Math.pow(2, lvl) * mul);

type EquipSubTab = '持有' | '商铺';
let equipSubTab: EquipSubTab = '持有';
export type EquipSlotFilter = '全部' | 'weapon' | 'armor' | 'accessory' | 'treasure';
let equipSlotFilter: EquipSlotFilter = '全部';
const EQUIP_SLOT_FILTERS: ReadonlyArray<{ key: EquipSlotFilter; label: string }> = [
  { key: '全部', label: '全部' },
  { key: 'weapon', label: '本命法宝' },
  { key: 'armor', label: '护体法衣' },
  { key: 'accessory', label: '随身灵物' },
  { key: 'treasure', label: '至宝' },
];

function matchesSlot(itemSlot: EquipSlot | null): boolean {
  if (equipSlotFilter === 'treasure') return true;
  return equipSlotFilter === '全部' || equipSlotFilter === itemSlot;
}

export function renderEquipTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  const p = app.progression;

  const subTabs = `<div class="meta-tabs" style="margin-bottom:8px;">
    <button data-subtab="持有" class="${equipSubTab === '持有' ? 'active' : ''}">持 有</button>
    <button data-subtab="商铺" class="${equipSubTab === '商铺' ? 'active' : ''}">商 铺</button>
  </div>`;

  if (equipSubTab === '持有') {
    renderOwned(el, p, subTabs);
  } else {
    renderShop(el, p, subTabs);
  }

  el.querySelectorAll('[data-subtab]').forEach((b) => {
    (b as HTMLElement).onclick = () => { equipSubTab = (b as HTMLElement).dataset.subtab as EquipSubTab; renderEquipTab(); };
  });
  el.querySelectorAll('[data-equip]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const id = (b as HTMLElement).dataset.equip!;
    const slot = equipSlot(id);
    if (!slot) return;
    app.progression = equipItem(app.progression, slot, id); renderEquipTab();
  }; });
  el.querySelectorAll('[data-unequip]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const slot = (b as HTMLElement).dataset.unequip as EquipSlot;
    app.progression = equipItem(app.progression, slot, null); renderEquipTab();
  }; });
  el.querySelectorAll('[data-upgrade]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const id = (b as HTMLElement).dataset.upgrade!;
    const lvl = app.progression.equipLevels[id] ?? 0;
    const u = upgradeEquip(app.progression, id, equipUpgradeCost(lvl), EQUIP_MAX_LEVEL);
    if (u) { app.progression = u; renderEquipTab(); }
  }; });
  el.querySelectorAll('[data-treasure-up]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const id = (b as HTMLElement).dataset.treasureUp!;
    const lvl = app.progression.treasureLevels[id] ?? 0;
    const mul = LIMITED_TREASURES[id].upgradeCostMultiplier;
    const u = upgradeTreasure(app.progression, id, treasureUpgradeCost(lvl, mul), TREASURE_MAX_LEVEL);
    if (u) { app.progression = u; renderEquipTab(); }
  }; });
  el.querySelectorAll('[data-buy]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const id = (b as HTMLElement).dataset.buy!;
    const next = buyEquipment(app.progression, id, EQUIPMENT[id].price);
    if (next) { app.progression = next; renderEquipTab(); }
  }; });
}

function renderOwned(el: HTMLElement, p: typeof app.progression, subTabs: string): void {
  let html = subTabs;

  html += '<div class="meta-tabs" style="margin-bottom:6px;">';
  for (const f of EQUIP_SLOT_FILTERS) {
    html += `<button data-slot-filter="${f.key}" class="${equipSlotFilter === f.key ? 'active' : ''}">${f.label}</button>`;
  }
  html += '</div>';

  html += `<div class="eq-desc">使用 <b style="color:#5fd3ff">装备碎片</b> 强化（每级 +15% 属性，上限 Lv.${EQUIP_MAX_LEVEL}）。至宝限「寻仙」特等奖。</div>`;

  html += '<div class="eq-slots">';
  for (const s of SLOTS) {
    const id = p.equipped[s.key];
    const name = id ? equipName(id) : '空';
    html += `<div class="slot"><span>${s.label}：<b style="color:#ffd93d">${name}</b></span>
      ${id ? `<button class="unequip" data-unequip="${s.key}">卸下</button>` : ''}</div>`;
  }
  html += '</div><div class="eq-grid">';

  for (const id of p.ownedTreasures) {
    const t = LIMITED_TREASURES[id];
    if (!t || !matchesSlot(t.slot)) continue;
    const slotLabel = SLOTS.find((s) => s.key === t.slot)?.label ?? t.slot;
    const equipped = p.equipped[t.slot] === id;
    const lvl = p.treasureLevels[id] ?? 0;
    const cls = equipped ? 'equipped' : 'owned';
    const cost = treasureUpgradeCost(lvl, t.upgradeCostMultiplier);
    const allMods = [...t.mods, ...t.uniqueMods];
    const statLine = allMods.map(modLabel).join(' · ');
    const upgrade = lvl >= TREASURE_MAX_LEVEL
      ? `<span style="color:#ffd93d;font-size:12px">+${lvl}（满级）</span>`
      : `<button class="upgrade" data-treasure-up="${id}" ${p.equipFragments < cost ? 'disabled' : ''}>+${lvl}→+${lvl + 1}（${cost} 碎片）</button>`;
    const mainBtn = equipped
      ? '<button disabled>已装备</button>'
      : `<button class="equip" data-equip="${id}" data-slot="${t.slot}">装备</button>`;
    html += `<div class="eq-card ${cls}" style="border-color:#ffd93d;box-shadow:0 0 12px rgba(255,217,61,0.25);">
      <div class="eq-name">★ ${t.name} <span style="color:#ffd93d;font-size:11px">至宝 [${slotLabel}]</span></div>
      <div class="eq-desc">${statLine}</div>
      <div class="eq-actions">${mainBtn} ${upgrade}</div></div>`;
  }

  const ownedSet = new Set([...p.ownedEquipment, ...Object.keys(GENERATED_EQUIPMENT)]);
  const slotsToShow = equipSlotFilter === '全部' ? SLOTS : (equipSlotFilter === 'treasure' ? [] : SLOTS.filter((s) => s.key === equipSlotFilter));
  for (const s of slotsToShow) {
    for (const id of ownedSet) {
      const eq = EQUIPMENT[id] ?? GENERATED_EQUIPMENT[id] ?? (p.generatedEquipData as Record<string, EquipmentConfig>)[id];
      if (!eq || eq.slot !== s.key) continue;
      const equipped = p.equipped[s.key] === id;
      const lvl = p.equipLevels[id] ?? 0;
      const cls = equipped ? 'equipped' : 'owned';
      const name = equipName(id);
      const statLine = eq.mods.map(modLabel).join(' · ');
      const cost = equipUpgradeCost(lvl);
      const upgrade = lvl >= EQUIP_MAX_LEVEL
        ? `<span style="color:#ffd93d;font-size:12px">+${lvl}（满级）</span>`
        : `<button class="upgrade" data-upgrade="${id}" ${p.equipFragments < cost ? 'disabled' : ''}>+${lvl}→+${lvl + 1}（${cost} 碎片）</button>`;
      const mainBtn = equipped
        ? '<button disabled>已装备</button>'
        : `<button class="equip" data-equip="${id}" data-slot="${s.key}">装备</button>`;
    html += `<div class="eq-card ${cls}"><div class="eq-name">${name} <span style="color:#8b8ba0;font-size:11px">[${s.label}]</span></div>
      <div class="eq-desc">${statLine}</div>
      <div class="eq-actions">${mainBtn} ${upgrade}</div></div>`;
    }
  }

  el.innerHTML = `${html}</div>`;

  el.querySelectorAll('[data-slot-filter]').forEach((b) => {
    (b as HTMLElement).onclick = () => {
      equipSlotFilter = (b as HTMLElement).dataset.slotFilter as EquipSlotFilter;
      renderEquipTab();
    };
  });
}

function renderShop(el: HTMLElement, p: typeof app.progression, subTabs: string): void {
  const ownedSet = new Set(p.ownedEquipment);
  let html = subTabs;
  html += `<div class="eq-desc">使用 <b style="color:#5fd3ff">宗门贡献</b> 购买固定法宝。</div><div class="eq-grid">`;
  for (const id of EQUIPMENT_IDS) {
    if (ownedSet.has(id)) continue;
    const eq = EQUIPMENT[id];
    const slotLabel = SLOTS.find((s) => s.key === eq.slot)?.label ?? eq.slot;
    const statLine = eq.mods.map(modLabel).join(' · ');
    html += `<div class="eq-card"><div class="eq-name">${eq.name} <span style="color:#8b8ba0;font-size:11px">[${slotLabel}]</span></div>
      <div class="eq-desc">${statLine}</div>
      <div class="eq-actions"><button data-buy="${id}" ${p.contribution < eq.price ? 'disabled' : ''}>购买 ${eq.price} 贡献</button></div></div>`;
  }
  el.innerHTML = `${html}</div>`;
}
