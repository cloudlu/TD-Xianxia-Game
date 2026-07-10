// 修炼界面（宗门）：法宝阁/天命阶/天赋/皮肤/充值 5 标签
import {
  TOWERS, EQUIPMENT, EQUIPMENT_IDS, VIP_LEVELS, VIP_MAX_LEVEL,
  SKINS, SKIN_IDS, TALENTS, TALENT_IDS, talentCost, SLOTS, resolveTitle, completedChapters,
} from '../data/config';
import type { EquipSlot } from '../types';
import { registry } from '../data/Registry';
import { app, iap, persist } from './state';
import {
  buyEquipment, equipItem, grantJade, upgradeVip, buySkin, equipSkin, upgradeTalent,
  redeemJade, upgradeEquip, applyDraw, craftEquip,
} from '../repo/progress';
import { drawGacha, FRAG_COST } from '../data/config/gacha';

type MetaTab = '法宝' | '天命' | '天赋' | '皮肤' | '寻仙' | '充值';
let metaTab: MetaTab = '法宝';
const metaCard = document.getElementById('metaCard')!;
const metaOverlay = document.getElementById('metaOverlay')!;

/** 刷新顶部余额（购买/兑换/强化后调用，避免数字不更新） */
function updateBalance(): void {
  const el = document.getElementById('metaBalance');
  if (el) el.innerHTML = `仙玉 <b style="color:#ffd93d">${app.progression.jade}</b>　·　贡献 <b style="color:#5fd3ff">${app.progression.contribution}</b>`;
}

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
  else renderRechargeTab();
}

const EQUIP_MAX_LEVEL = 5;
const equipUpgradeCost = (lvl: number) => Math.round(40 * Math.pow(1.5, lvl));

function renderEquipTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  const p = app.progression;
  let html = '<div class="eq-slots">';
  for (const s of SLOTS) {
    const id = p.equipped[s.key];
    const name = id ? (EQUIPMENT[id]?.name ?? '—') : '空';
    html += `<div class="slot"><span>${s.label}：<b style="color:#ffd93d">${name}</b></span>
      ${id ? `<button class="unequip" data-unequip="${s.key}">卸下</button>` : ''}</div>`;
  }
  html += '</div><div class="eq-grid">';
  for (const id of EQUIPMENT_IDS) {
    const eq = EQUIPMENT[id];
    const owned = p.ownedEquipment.includes(id);
    const slotLabel = SLOTS.find((s) => s.key === eq.slot)?.label ?? eq.slot;
    const equipped = p.equipped[eq.slot] === id;
    const lvl = p.equipLevels[id] ?? 0;
    const cls = equipped ? 'equipped' : owned ? 'owned' : '';
    const mainBtn = equipped
      ? '<button disabled>已装备</button>'
      : owned
        ? `<button class="equip" data-equip="${id}" data-slot="${eq.slot}">装备</button>`
        : `<button data-buy="${id}" ${p.contribution < eq.price ? 'disabled' : ''}>购买 ${eq.price}</button>`;
    const upgrade = owned
      ? (lvl >= EQUIP_MAX_LEVEL
          ? `<span style="color:#ffd93d;font-size:12px">强化 +${lvl}（满级）</span>`
          : `<button class="upgrade" data-upgrade="${id}" ${p.contribution < equipUpgradeCost(lvl) ? 'disabled' : ''}>强化 +${lvl}→+${lvl + 1}（${equipUpgradeCost(lvl)}）</button>`)
      : '';
    html += `<div class="eq-card ${cls}"><div class="eq-name">${eq.name} <span style="color:#8b8ba0;font-size:11px">[${slotLabel}]</span></div>
      <div class="eq-desc">${eq.desc}</div>
      <div class="eq-actions">${mainBtn}</div>${upgrade ? `<div class="eq-actions">${upgrade}</div>` : ''}</div>`;
  }
  el.innerHTML = `${html}</div>`;
  el.querySelectorAll('[data-buy]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const id = (b as HTMLElement).dataset.buy!;
    const next = buyEquipment(app.progression, id, EQUIPMENT[id].price);
    if (next) { app.progression = next; persist(); renderEquipTab(); }
  }; });
  el.querySelectorAll('[data-equip]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const id = (b as HTMLElement).dataset.equip!;
    const slot = (b as HTMLElement).dataset.slot as EquipSlot;
    app.progression = equipItem(app.progression, slot, id); persist(); renderEquipTab();
  }; });
  el.querySelectorAll('[data-unequip]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const slot = (b as HTMLElement).dataset.unequip as EquipSlot;
    app.progression = equipItem(app.progression, slot, null); persist(); renderEquipTab();
  }; });
  el.querySelectorAll('[data-upgrade]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const id = (b as HTMLElement).dataset.upgrade!;
    const lvl = app.progression.equipLevels[id] ?? 0;
    const u = upgradeEquip(app.progression, id, equipUpgradeCost(lvl), EQUIP_MAX_LEVEL);
    if (u) { app.progression = u; persist(); renderEquipTab(); }
  }; });
}

function renderVipTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  const cur = VIP_LEVELS[app.progression.vipLevel];
  const next = VIP_LEVELS[app.progression.vipLevel + 1];
  let html = `<div class="slot"><span>当前：<b style="color:#ffd93d">${cur.name}</b>　${cur.perks.join('，')}</span></div>`;
  if (next) {
    const can = app.progression.jade >= next.upgradeJade;
    html += `<div class="eq-card ${can ? '' : 'owned'}" style="margin-top:10px">
      <div class="eq-name">下一阶：${next.name}</div>
      <div class="eq-desc">${next.perks.join('，')}</div>
      <button id="vipUpBtn" ${can ? '' : 'disabled'}>晋升（${next.upgradeJade} 仙玉）</button></div>`;
  } else {
    html += `<div class="eq-card equipped" style="margin-top:10px"><div class="eq-name">已达最高天命阶</div></div>`;
  }
  el.innerHTML = html;
  const btn = document.getElementById('vipUpBtn');
  if (btn) btn.onclick = () => {
    const u = upgradeVip(app.progression, next!.upgradeJade, VIP_MAX_LEVEL);
    if (u) { app.progression = u; persist(); renderMeta(); }
  };
}

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
    if (u) { app.progression = u; persist(); renderTalentTab(); }
  }; });
}

function renderSkinTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  let html = `<div class="eq-desc">皮肤仅改变外观（字/颜色/光晕），不影响数值。点击装备/卸下。</div><div class="eq-grid">`;
  for (const id of SKIN_IDS) {
    const sk = SKINS[id];
    const towerName = TOWERS[sk.target]?.name ?? sk.target;
    const owned = app.progression.ownedSkins.includes(id);
    const equipped = app.progression.equippedSkins[sk.target] === id;
    const cls = equipped ? 'equipped' : owned ? 'owned' : '';
    const preview = `<span style="display:inline-block;width:34px;height:34px;line-height:34px;border-radius:6px;background:${sk.color};color:#0f1320;font-weight:bold;margin-right:8px;${sk.effect ? `box-shadow:0 0 10px ${sk.color};` : ''}">${sk.icon}</span>`;
    let btn: string;
    if (equipped) btn = `<button class="equip" data-unequip="${sk.target}">卸下</button>`;
    else if (owned) btn = `<button class="equip" data-equip="${id}" data-target="${sk.target}">装备</button>`;
    else btn = `<button data-buy="${id}" ${app.progression.jade < sk.price ? 'disabled' : ''}>购买 ${sk.price} 仙玉</button>`;
    html += `<div class="eq-card ${cls}"><div class="eq-name">${preview}${sk.name}</div>
      <div class="eq-desc">适用于：${towerName}</div>${btn}</div>`;
  }
  el.innerHTML = `${html}</div>`;
  el.querySelectorAll('[data-buy]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const id = (b as HTMLElement).dataset.buy!;
    const next = buySkin(app.progression, id, SKINS[id].price);
    if (next) { app.progression = next; persist(); renderSkinTab(); }
  }; });
  el.querySelectorAll('[data-equip]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const id = (b as HTMLElement).dataset.equip!;
    app.progression = equipSkin(app.progression, SKINS[id].target, id); persist(); renderSkinTab();
  }; });
  el.querySelectorAll('[data-unequip]').forEach((b) => { (b as HTMLElement).onclick = () => {
    app.progression = equipSkin(app.progression, (b as HTMLElement).dataset.unequip!, null); persist(); renderSkinTab();
  }; });
}

// 测试密码（仅开发测试用，防止试玩者随意充值）
const DEV_PASSWORD = 'td2026';

let gachaRng = mulberry32(Date.now());

function renderGachaTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  const p = app.progression;
  const frags = p.equipFragments;
  const canCraft = frags >= FRAG_COST;
  app.progression = p;  // trigger re-render if needed

  const html = `<div class="eq-desc" style="text-align:center;margin-bottom:10px;">
    仙魂碎片 <b style="color:#ffd93d">${p.soulShards}</b>（每5个 +1% 全体伤害）　·
    天命符 <b style="color:#ffd93d">${p.destinyScrolls}</b>（消耗1张 = 下关 +15% 伤害）　·
    装备碎片 <b style="color:#ffd93d">${frags}/${FRAG_COST}</b>
    ${canCraft ? '<br><button id="craftBtn" style="margin-top:6px;">合成随机限定法宝（消耗 ' + FRAG_COST + ' 碎片）</button>' : ''}
  </div>
  <div class="eq-grid">
    <div class="eq-card" style="text-align:center;">
      <div class="eq-name">单抽</div>
      <div class="eq-desc">120 贡献</div>
      <button id="singleDraw" ${p.contribution < 120 ? 'disabled' : ''}>寻 仙</button>
    </div>
    <div class="eq-card" style="text-align:center;">
      <div class="eq-name">十连</div>
      <div class="eq-desc">1000 贡献 · 保底稀有</div>
      <button id="tenDraw" ${p.contribution < 1000 ? 'disabled' : ''}>十 连 寻 仙</button>
    </div>
  </div>
  <div id="drawResult" style="text-align:center;margin-top:10px;font-size:14px;color:#ffd93d;min-height:20px;"></div>`;

  el.innerHTML = html;

  // 合成
  const craftBtn = document.getElementById('craftBtn');
  if (craftBtn) craftBtn.onclick = () => {
    if (frags < FRAG_COST) return;
    const ids = EQUIPMENT_IDS;
    const pick = ids[Math.floor(gachaRng() * ids.length)];
    const next = craftEquip(app.progression, pick);
    if (next) { app.progression = next; persist(); renderGachaTab(); }
  };

  // 单抽
  document.getElementById('singleDraw')!.onclick = () => {
    if (p.contribution < 120) return;
    const res = drawGacha(p.gachaPity, () => { gachaRng = mulberry32(gachaRng() * 1e9 | 0); return gachaRng(); });
    const next = applyDraw(app.progression, 120, res.result, res.newPity);
    if (next) { app.progression = next; persist(); showDrawResult(res.result); renderGachaTab(); }
  };

  // 十连
  document.getElementById('tenDraw')!.onclick = () => {
    if (p.contribution < 1000) return;
    let cur = app.progression;
    let pity = cur.gachaPity;
    const results: string[] = [];
    for (let i = 0; i < 10; i++) {
      const res = drawGacha(pity, () => { gachaRng = mulberry32(gachaRng() * 1e9 | 0); return gachaRng(); });
      const next = applyDraw(cur, i === 0 ? 1000 : 0, res.result, res.newPity);  // first deducts, rest free
      if (!next) break;
      cur = next;
      pity = res.newPity;
      results.push(prizeLabel(res.result));
    }
    app.progression = cur; persist();
    showDrawResultText(`十连：${results.join(' · ')}`);
    renderGachaTab();
  };
}

function prizeLabel(r: import('../data/config/gacha').DrawResult): string {
  if (r.contributionGain) return `+${r.contributionGain}贡献`;
  if (r.soulShards) return `${r.soulShards}仙魂`;
  if (r.destinyScrolls) return `天命+${r.destinyScrolls}`;
  if (r.frags) return `${r.frags}碎片`;
  return '';
}

function showDrawResult(r: import('../data/config/gacha').DrawResult): void {
  showDrawResultText(`${prizeLabel(r)}${r.pityTriggered ? ' · 保底！' : ''}`);
}

function showDrawResultText(text: string): void {
  const el = document.getElementById('drawResult');
  if (el) el.textContent = text;
}

/** 仅供寻仙用的简易随机 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function renderRechargeTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  const RATES: Array<{ jade: number; contrib: number }> = [
    { jade: 10, contrib: 80 },
    { jade: 50, contrib: 450 },
    { jade: 100, contrib: 1000 },
  ];
  let html = `<div class="eq-desc">充值功能（测试版，需开发密码）。</div>
    <div class="eq-grid">`;
  for (const p of iap.getProducts()) {
    html += `<div class="eq-card"><div class="eq-name">${p.label}</div>
      <div class="eq-desc">￥${p.priceCny}</div>
      <button data-iap="${p.id}">充值</button></div>`;
  }
  html += `</div>`;
  html += `<div class="eq-desc" style="margin-top:14px">仙玉兑换宗门贡献：</div><div class="eq-grid">`;
  for (const r of RATES) {
    html += `<div class="eq-card"><div class="eq-name">${r.contrib} 贡献</div>
      <div class="eq-desc">消耗 ${r.jade} 仙玉</div>
      <button data-redeem="${r.jade}/${r.contrib}" ${app.progression.jade < r.jade ? 'disabled' : ''}>兑换</button></div>`;
  }
  el.innerHTML = `${html}</div>`;
  el.querySelectorAll('[data-iap]').forEach((b) => { (b as HTMLElement).onclick = async () => {
    const pwd = prompt('请输入开发测试密码：');
    if (pwd !== DEV_PASSWORD) { if (pwd !== null) alert('密码错误'); return; }   // 密码错误或取消，不发放
    const r = await iap.purchase((b as HTMLElement).dataset.iap!);
    if (r.jade > 0) { app.progression = grantJade(app.progression, r.jade); persist(); renderRechargeTab(); }
  }; });
  el.querySelectorAll('[data-redeem]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const [jade, contrib] = (b as HTMLElement).dataset.redeem!.split('/').map(Number);
    const next = redeemJade(app.progression, jade, contrib);
    if (next) { app.progression = next; persist(); renderRechargeTab(); }
  }; });
}

document.getElementById('metaBtn')!.onclick = () => { metaTab = '法宝'; renderMeta(); metaOverlay.classList.add('show'); };
