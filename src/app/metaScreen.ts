// 宗门修真主面板（§8 选关界面里的 metaBtn → 弹出 metaCard）
// 各 tab 已拆至独立文件：
//   metaEquip.ts  → 法宝阁
//   metaGacha.ts  → 寻仙
//   metaRecharge.ts → 充值
//   metaVip.ts → 天命阶
//   metaSoulShop.ts → 仙魂商店
// 天赋/皮肤 因体量小保留在此。
// 共享工具函数在 metaShared.ts。

import {
  TOWERS, SKINS, SKIN_IDS, TALENTS, TALENT_IDS, talentCost,
  resolveTitle, completedChapters,
} from '../data/config';
import { registry } from '../data/Registry';
import { app } from './state';
import {
  buySkin, equipSkin, upgradeTalent,
} from '../repo/progressMeta';
import { updateBalance } from './metaShared';
import { renderEquipTab } from './metaEquip';
import { renderGachaTab } from './metaGacha';
import { renderRechargeTab } from './metaRecharge';
import { renderSoulShopTab } from './metaSoulShop';
import { renderVipTab } from './metaVip';

type MetaTab = '法宝' | '天命' | '天赋' | '皮肤' | '寻仙' | '充值' | '仙魂';
let metaTab: MetaTab = '法宝';

const metaCard = document.getElementById('metaCard')!;
const metaOverlay = document.getElementById('metaOverlay')!;

export function renderMeta(): void {
  const title = resolveTitle(completedChapters(registry.manifest(), app.progression));
  const titleLine = title.nextTitle
    ? `当前头衔：<b style="color:#ffd93d">${title.title}</b>　·　下一阶：<b>${title.nextTitle}</b>（再通关 1 章即可晋升）`
    : `当前头衔：<b style="color:#ffd93d">${title.title}</b>　·　已达宗门至高`;
  metaCard.innerHTML = `
    <h2>宗 门 修 真</h2>
    <div class="meta-balance">${titleLine}</div>
    <div class="meta-tabs">
      <button data-tab="法宝" class="${metaTab === '法宝' ? 'active' : ''}">法宝阁</button>
      <button data-tab="天命" class="${metaTab === '天命' ? 'active' : ''}">天命阶</button>
      <button data-tab="天赋" class="${metaTab === '天赋' ? 'active' : ''}">天赋</button>
      <button data-tab="皮肤" class="${metaTab === '皮肤' ? 'active' : ''}">皮肤</button>
      <button data-tab="寻仙" class="${metaTab === '寻仙' ? 'active' : ''}">寻仙</button>
      <button data-tab="充值" class="${metaTab === '充值' ? 'active' : ''}">充值</button>
      <button data-tab="仙魂" class="${metaTab === '仙魂' ? 'active' : ''}">仙魂商店</button>
    </div>
    <div class="meta-balance" id="metaBalance">仙玉 <b style="color:#ffd93d">${app.progression.jade}</b>　·　贡献 <b style="color:#5fd3ff">${app.progression.contribution}</b></div>
    <div id="metaContent"></div>
    <div class="close-row"><button id="metaCloseBtn">返 回 选 关</button></div>`;
  document.getElementById('metaCloseBtn')!.onclick = () => metaOverlay.classList.remove('show');
  metaCard.querySelectorAll('[data-tab]').forEach((b) => {
    (b as HTMLElement).onclick = () => { metaTab = (b as HTMLElement).dataset.tab as MetaTab; renderMeta(); };
  });
  if (metaTab === '法宝') renderEquipTab();
  else if (metaTab === '天命') renderVipTab();
  else if (metaTab === '天赋') renderTalentTab();
  else if (metaTab === '皮肤') renderSkinTab();
  else if (metaTab === '寻仙') renderGachaTab();
  else if (metaTab === '充值') renderRechargeTab();
  else renderSoulShopTab();
}

// ---------- 天赋 ----------
function renderTalentTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  let html = `<div class="eq-desc">用宗门贡献升级永久天赋，进关即生效（与法宝/天命加成叠加，统一封顶）。</div><div class="eq-grid">`;
  for (const id of TALENT_IDS) {
    const t = TALENTS[id];
    const lvl = app.progression.talents[id] ?? 0;
    const maxed = lvl >= t.maxLevel;
    const cost = talentCost(t, lvl);
    const cur = t.perLevel * lvl;
    const curTxt = t.op === 'add' ? `+${cur.toFixed(2)}` : `+${Math.round(cur * 100)}%`;
    const cls = maxed ? 'equipped' : lvl > 0 ? 'owned' : '';
    const btn = maxed
      ? '<button disabled>已满级</button>'
      : `<button data-up="${id}" ${app.progression.contribution < cost ? 'disabled' : ''}>升级 ${cost} 贡献</button>`;
    html += `<div class="eq-card ${cls}">
      <div class="eq-name">${t.name} <span style="color:#ffd93d;font-size:13px">Lv ${lvl}/${t.maxLevel}</span></div>
      <div class="eq-desc">${t.desc} ${curTxt}${maxed ? '' : ` → 下级 ${t.op === 'add' ? `+${(t.perLevel * (lvl + 1)).toFixed(2)}` : `+${Math.round(t.perLevel * (lvl + 1) * 100)}%`}`}</div>${btn}</div>`;
  }
  el.innerHTML = `${html}</div>`;
  el.querySelectorAll('[data-up]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const id = (b as HTMLElement).dataset.up!;
    const t = TALENTS[id];
    const u = upgradeTalent(app.progression, id, talentCost(t, app.progression.talents[id] ?? 0), t.maxLevel);
    if (u) { app.progression = u; renderTalentTab(); }
  }; });
}

// ---------- 皮肤 ----------
function renderSkinTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  let html = `<div class="eq-desc">皮肤仅改变外观（字/颜色/光晕），不影响数值。</div>`;

  const byTower: Record<string, string[]> = {};
  for (const id of SKIN_IDS) {
    const target = SKINS[id].target;
    if (!byTower[target]) byTower[target] = [];
    byTower[target].push(id);
  }

  for (const [towerId, skinIds] of Object.entries(byTower)) {
    const towerName = TOWERS[towerId]?.name ?? towerId;
    html += `<div class="eq-desc" style="margin-top:10px;font-weight:bold;color:#ffd93d;">━ ${towerName} ━</div><div class="eq-grid">`;
    for (const id of skinIds) {
      const sk = SKINS[id];
      const owned = app.progression.ownedSkins.includes(id);
      const equipped = app.progression.equippedSkins[towerId] === id;
      const cls = equipped ? 'equipped' : owned ? 'owned' : '';
      const preview = `<span style="display:inline-block;width:34px;height:34px;line-height:34px;border-radius:6px;background:${sk.color};color:#0f1320;font-weight:bold;margin-right:8px;${sk.effect ? `box-shadow:0 0 10px ${sk.color};` : ''}">${sk.icon}</span>`;
      let btn: string;
      if (equipped) btn = `<button class="equip" data-unequip="${towerId}">卸下</button>`;
      else if (owned) btn = `<button class="equip" data-equip="${id}" data-target="${towerId}">装备</button>`;
      else btn = `<button data-buy="${id}" ${app.progression.jade < sk.price ? 'disabled' : ''}>购买 ${sk.price} 仙玉</button>`;
      html += `<div class="eq-card ${cls}"><div class="eq-name">${preview}${sk.name}</div>${btn}</div>`;
    }
    html += '</div>';
  }

  el.innerHTML = html;
  el.querySelectorAll('[data-buy]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const id = (b as HTMLElement).dataset.buy!;
    const next = buySkin(app.progression, id, SKINS[id].price);
    if (next) { app.progression = next; renderSkinTab(); }
  }; });
  el.querySelectorAll('[data-equip]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const id = (b as HTMLElement).dataset.equip!;
    app.progression = equipSkin(app.progression, SKINS[id].target, id); renderSkinTab();
  }; });
  el.querySelectorAll('[data-unequip]').forEach((b) => { (b as HTMLElement).onclick = () => {
    app.progression = equipSkin(app.progression, (b as HTMLElement).dataset.unequip!, null); renderSkinTab();
  }; });
}

document.getElementById('metaBtn')!.onclick = () => { metaTab = '法宝'; renderMeta(); metaOverlay.classList.add('show'); };