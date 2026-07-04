// 覆盖层界面：剧情弹窗 / 选关 / 关卡流程 / 修炼界面（法宝/天命/天赋/皮肤/充值）
// 只依赖 app 状态 + DOM id，不依赖 main 的局部变量。

import { Game } from '../engine/Game';
import { registry } from '../data/Registry';
import {
  TOWERS, EQUIPMENT, EQUIPMENT_IDS, VIP_LEVELS, VIP_MAX_LEVEL,
  SKINS, SKIN_IDS, TALENTS, TALENT_IDS, talentCost, SLOTS,
} from '../data/config';
import type { StoryBeat, EquipSlot } from '../types';
import { audio } from '../audio/AudioManager';
import { app, iap, lookup, buildMods, persist, selectProfile } from './state';
import {
  isUnlocked, computeStars, recordResult, awardContribution,
  buyEquipment, equipItem, grantJade, upgradeVip, buySkin, equipSkin, upgradeTalent,
  redeemJade, upgradeEquip, withDefaults,
} from '../repo/progress';
import { listProfiles, createProfile, deleteProfile, saveRepoFor } from '../repo/profiles';

// ---------- 剧情弹窗 ----------
let typeTimer: number | null = null;
const overlay = document.getElementById('storyOverlay')!;
const sChapter = document.getElementById('storyChapter')!;
const sTitle = document.getElementById('storyTitle')!;
const sBody = document.getElementById('storyBody')!;
const sBtn = document.getElementById('storyBtn') as HTMLButtonElement;
const sSkip = document.getElementById('storySkip') as HTMLButtonElement;

export function showStory(beat: StoryBeat, onClose: () => void): void {
  sChapter.textContent = beat.chapter ?? '';
  sTitle.textContent = beat.title;
  sBtn.textContent = beat.btn;
  sBody.textContent = '';
  sBtn.disabled = true;
  sBtn.style.opacity = '0.4';
  overlay.classList.add('show');
  app.paused = true;

  const full = beat.lines.join('\n');
  let i = 0;
  const finish = () => {
    if (typeTimer !== null) { clearInterval(typeTimer); typeTimer = null; }
    sBody.textContent = full;
    sBtn.disabled = false;
    sBtn.style.opacity = '1';
  };
  typeTimer = window.setInterval(() => {
    i += 1;
    sBody.textContent = full.slice(0, i);
    if (i >= full.length) finish();
  }, 55);

  sSkip.onclick = () => {            // 跳过：补全文字并直接关闭推进
    finish();
    overlay.classList.remove('show');
    onClose();
  };
  sBtn.onclick = () => {
    if (sBtn.disabled) { finish(); return; }   // 文字未完，先补全
    overlay.classList.remove('show');
    onClose();
  };
}

// ---------- 选关 / 关卡流程 ----------
const levelSelect = document.getElementById('levelSelect')!;
const lsList = document.getElementById('lsList')!;
const lsProgress = document.getElementById('lsProgress')!;
const towerPanel = document.getElementById('towerPanel')!;
const metaOverlay = document.getElementById('metaOverlay')!;

function starsText(n: number): string { return '★'.repeat(n) + '☆'.repeat(3 - n); }

export function renderLevelSelect(): void {
  const manifest = registry.manifest();
  const total = manifest.length;
  let cleared = 0, stars = 0;
  for (const entry of manifest) {
    const r = app.progression.cleared[entry.levelId];
    if (r) { cleared += 1; stars += r.stars; }
  }
  lsProgress.textContent = `通关 ${cleared}/${total}    星 ★ ${stars}/${total * 3}`;

  lsList.innerHTML = '';
  manifest.forEach((entry, i) => {
    const lvl = registry.level(entry.levelId);
    if (!lvl) return;
    const unlocked = isUnlocked(manifest, i, app.progression);
    const lvlStars = app.progression.cleared[entry.levelId]?.stars ?? 0;
    const row = document.createElement('div');
    row.className = 'level-row' + (unlocked ? '' : ' locked');
    row.innerHTML = `
      <div class="lr-title">
        <div class="lr-name">${unlocked ? lvl.name : '？？？'}</div>
        <div class="lr-chap">${entry.chapterTitle}</div>
      </div>
      <div class="${unlocked ? 'lr-stars' : 'lr-lock'}">${unlocked ? starsText(lvlStars) : '🔒'}</div>`;
    if (unlocked) row.onclick = () => startLevel(entry.levelId);
    lsList.appendChild(row);
  });
}

export function returnToSelect(): void {
  app.game = null;
  app.currentLevel = null;
  app.selectedUid = null;
  towerPanel.classList.remove('show');
  overlay.classList.remove('show');
  renderLevelSelect();
  levelSelect.style.display = 'flex';
}

export function startLevel(id: string): void {
  const lvl = registry.level(id);
  if (!lvl || !app.board) return;
  app.currentLevel = lvl;
  levelSelect.style.display = 'none';
  app.board.configure(lvl.cols, lvl.rows, lvl.paths);

  audio.init(); audio.resume(); audio.startMusic();   // 用户手势内初始化音频

  app.game = new Game(lvl, lookup, 12345, undefined, buildMods());
  app.game.onEvent = onGameEvent;

  app.selectedUid = null;
  app.speedMul = 1;
  resetSpeedUI();
  app.prevStatus = 'prep';
  app.paused = true;
  app.last = performance.now();
  showStory(lvl.story?.intro ?? { title: lvl.name, lines: ['守卫此关。'], btn: '开 始' }, () => { app.paused = false; });
}

function onGameEvent(e: GameEventLike): void {
  switch (e.type) {
    case 'kill': audio.sfx('kill'); break;
    case 'leak':
      audio.sfx('leak');
      app.leakFlashAmt = 1;
      pulseLives();
      break;
    case 'waveStart': audio.sfx('wave'); break;
    case 'win': audio.sfx('win'); break;
    case 'lose': audio.sfx('lose'); break;
  }
}

type GameEventLike =
  | { type: 'kill' } | { type: 'leak' }
  | { type: 'waveStart'; wave: number }
  | { type: 'win' } | { type: 'lose' };

function pulseLives(): void {
  const el = document.getElementById('h-lives');
  if (!el) return;
  el.classList.remove('hit');
  void el.offsetWidth;
  el.classList.add('hit');
}

function resetSpeedUI(): void {
  document.querySelectorAll('.speed-btn').forEach((b, i) => {
    (b as HTMLElement).classList.toggle('active', [0, 1, 2][i] === app.speedMul);
  });
}

// ---------- 修炼界面（标签：法宝 / 天命 / 天赋 / 皮肤 / 充值） ----------
type MetaTab = '法宝' | '天命' | '天赋' | '皮肤' | '充值';
let metaTab: MetaTab = '法宝';
const metaCard = document.getElementById('metaCard')!;

/** 刷新顶部余额（购买/兑换/强化后调用，避免数字不更新） */
function updateBalance(): void {
  const el = document.getElementById('metaBalance');
  if (el) el.innerHTML = `仙玉 <b style="color:#ffd93d">${app.progression.jade}</b>　·　贡献 <b style="color:#5fd3ff">${app.progression.contribution}</b>`;
}

function renderMeta(): void {
  metaCard.innerHTML = `
    <h2>宗 门 修 真</h2>
    <div class="meta-tabs">
      <button data-tab="法宝" class="${metaTab === '法宝' ? 'active' : ''}">法宝阁</button>
      <button data-tab="天命" class="${metaTab === '天命' ? 'active' : ''}">天命阶</button>
      <button data-tab="天赋" class="${metaTab === '天赋' ? 'active' : ''}">天赋</button>
      <button data-tab="皮肤" class="${metaTab === '皮肤' ? 'active' : ''}">皮肤</button>
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
  else renderRechargeTab();
}

const EQUIP_MAX_LEVEL = 5;
const equipUpgradeCost = (lvl: number) => Math.round(40 * Math.pow(1.5, lvl));

function renderEquipTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  const p = app.progression;
  // 三槽位状态条
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

function renderRechargeTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  const RATES: Array<{ jade: number; contrib: number }> = [
    { jade: 10, contrib: 80 },
    { jade: 50, contrib: 450 },
    { jade: 100, contrib: 1000 },
  ];
  let html = `<div class="eq-desc">演示版充值：点击即发放仙玉（mock 支付）。联网后接入真实支付。</div>
    <div class="eq-grid">`;
  for (const p of iap.getProducts()) {
    html += `<div class="eq-card"><div class="eq-name">${p.label}</div>
      <div class="eq-desc">￥${p.priceCny}</div>
      <button data-iap="${p.id}">充值</button></div>`;
  }
  html += `</div>`;
  html += `<div class="eq-desc" style="margin-top:14px">仙玉兑换宗门贡献（付费加速养成）：</div><div class="eq-grid">`;
  for (const r of RATES) {
    html += `<div class="eq-card"><div class="eq-name">${r.contrib} 贡献</div>
      <div class="eq-desc">消耗 ${r.jade} 仙玉</div>
      <button data-redeem="${r.jade}/${r.contrib}" ${app.progression.jade < r.jade ? 'disabled' : ''}>兑换</button></div>`;
  }
  el.innerHTML = `${html}</div>`;
  el.querySelectorAll('[data-iap]').forEach((b) => { (b as HTMLElement).onclick = async () => {
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

// 通关结算（由 main 的主循环在检测到 won 时调用）
export function settleWin(livesRemaining: number, startLives: number, levelId: string, outro?: StoryBeat): void {
  const stars = computeStars(livesRemaining, startLives);
  app.progression = recordResult(app.progression, levelId, stars);
  app.progression = awardContribution(app.progression, stars);
  persist();
  showStory(outro ?? { title: '守阵成功', lines: [`获得 ${20 + stars * 10} 宗门贡献。`], btn: '返 回 选 关' }, returnToSelect);
}

// ---------- 档案选择（多玩家存档隔离） ----------
const profileSelect = document.getElementById('profileSelect')!;
const profileList = document.getElementById('profileList')!;
const profileNameInput = document.getElementById('profileNameInput') as HTMLInputElement;

export function renderProfileSelect(): void {
  const profiles = listProfiles();
  profileList.innerHTML = '';
  if (profiles.length === 0) {
    profileList.innerHTML = '<div class="eq-desc" style="text-align:center">尚无修士，请新建一位开始你的修真之旅。</div>';
  }
  for (const p of profiles) {
    // 读该档案进度摘要
    const prog = saveRepoFor(p.id).load();
    const cleared = Object.keys(prog.cleared).length;
    const row = document.createElement('div');
    row.className = 'profile-row';
    row.innerHTML = `
      <div>
        <div class="pr-name">${p.name}</div>
        <div class="pr-meta">通关 ${cleared} 关　·　仙玉 ${prog.jade}　·　贡献 ${prog.contribution}</div>
      </div>
      <button class="pr-del" data-del="${p.id}">删除</button>`;
    row.onclick = (ev) => {
      if ((ev.target as HTMLElement).dataset.del) return;   // 点删除不进入
      enterProfile(p.id, p.name);
    };
    profileList.appendChild(row);
  }
  profileList.querySelectorAll('[data-del]').forEach((b) => {
    (b as HTMLElement).onclick = (ev) => {
      ev.stopPropagation();
      deleteProfile((b as HTMLElement).dataset.del!);
      renderProfileSelect();
    };
  });
}

function enterProfile(id: string, name: string): void {
  selectProfile(id, name);
  profileSelect.style.display = 'none';
  renderLevelSelect();
  levelSelect.style.display = 'flex';
}

document.getElementById('profileCreateBtn')!.onclick = () => {
  const name = profileNameInput.value.trim();
  if (!name) { profileNameInput.focus(); return; }
  const p = createProfile(name);
  profileNameInput.value = '';
  enterProfile(p.id, p.name);
};
profileNameInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') document.getElementById('profileCreateBtn')!.click(); });

/** 切换玩家：返回档案选择（挂到选关界面的「切换」按钮） */
export function switchProfile(): void {
  app.game = null;
  app.currentLevel = null;
  app.selectedUid = null;
  app.profileId = null;
  app.profileName = '';
  app.progression = withDefaults({});
  levelSelect.style.display = 'none';
  metaOverlay.classList.remove('show');
  towerPanel.classList.remove('show');
  renderProfileSelect();
  profileSelect.style.display = 'flex';
}
