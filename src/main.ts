// 入口控制器：创建棋盘/HUD/塔栏/塔面板/输入，跑主循环。
// 覆盖层界面（选关/剧情/修炼）在 ./app/screens，共享状态在 ./app/state。

import { Board } from './ui/Board';
import { TOWERS, FAILED_STORY, SKINS, ENEMIES } from './data/config';
import { audio } from './audio/AudioManager';
import { app, buildMods } from './app/state';
import { damageStatsFor } from './data/Modifier';
import { showStory } from './app/storyModal';
import { returnToSelect, settleWin } from './app/levelSelect';
import { renderProfileSelect, switchProfile } from './app/profileScreen';
import './app/metaScreen';   // 模块加载时绑定 metaBtn 等
import type { Game } from './engine/Game';

// ---------- 棋盘 ----------
const canvas = document.getElementById('board') as HTMLCanvasElement;
const board = new Board(canvas, 16, 8);
app.board = board;
// 皮肤解析：读 app.progression 的装备皮肤（实时反映装备变化）
board.skinResolver = (towerId) => {
  const sid = app.progression.equippedSkins[towerId];
  if (!sid || !SKINS[sid]) return null;
  const s = SKINS[sid];
  return { icon: s.icon, color: s.color, effect: s.effect };
};
const leakFlash = document.getElementById('leakFlash')!;
const wavePreview = document.getElementById('wavePreview')!;
let lastWavePreviewHtml = '';

// ---------- HUD ----------
const hud = document.getElementById('hud')!;
hud.insertAdjacentHTML('afterbegin', `
  <div class="stat"><span class="label">灵石</span><span class="val stones" id="h-stones">0</span></div>
  <div class="stat"><span class="label">血量</span><span class="val lives" id="h-lives">0</span></div>
  <div class="stat"><span class="label">波次</span><span class="val wave" id="h-wave">0/0</span></div>
  <div class="stat" style="flex:1; justify-content:flex-end;"><span class="val" id="h-status" style="font-size:14px;color:#8b8ba0;"></span></div>`);
const elStones = document.getElementById('h-stones')!;
const elLives = document.getElementById('h-lives')!;
const elWave = document.getElementById('h-wave')!;
const elStatus = document.getElementById('h-status')!;

const startBtn = document.createElement('button');
startBtn.id = 'startBtn';
startBtn.textContent = '立即迎敌';
startBtn.onclick = () => app.game?.startWave();
hud.appendChild(startBtn);

const muteBtn = document.createElement('button');
muteBtn.id = 'muteBtn';
muteBtn.textContent = '🔊';
muteBtn.onclick = () => {
  audio.init(); audio.resume();
  audio.setMuted(!audio.muted);
  muteBtn.textContent = audio.muted ? '🔇' : '🔊';
};
hud.appendChild(muteBtn);

const speedGroup = document.createElement('div');
speedGroup.className = 'speed-group';
const SPEEDS: Array<{ label: string; val: number }> = [
  { label: '⏸', val: 0 }, { label: '1×', val: 1 }, { label: '2×', val: 2 },
];
SPEEDS.forEach((sp) => {
  const b = document.createElement('button');
  b.className = 'speed-btn' + (sp.val === app.speedMul ? ' active' : '');
  b.textContent = sp.label;
  b.onclick = () => {
    app.speedMul = sp.val;
    speedGroup.querySelectorAll('.speed-btn').forEach((x, i) => {
      (x as HTMLElement).classList.toggle('active', SPEEDS[i].val === app.speedMul);
    });
  };
  speedGroup.appendChild(b);
});
hud.appendChild(speedGroup);

// ---------- 塔选择栏 ----------
const panel = document.getElementById('panel')!;
const towerBtns = new Map<string, HTMLDivElement>();
function setActiveTower(id: string): void {
  app.activeTowerId = id;
  const def = TOWERS[id];
  board.setActiveBuild(id, { levels: def.levels, color: def.color });
  for (const [bid, btn] of towerBtns) btn.classList.toggle('active', bid === id);
}
const BEHAVIOR_LABEL: Record<string, string> = {
  projectile: '单体', pierce: '扫荡', aoe: '溅射', chain: '链电', aura: '光环',
};

/** 敌人特性文案（预告/信息用） */
function enemyTraits(def: { fly?: boolean; shield?: number; lifestealHp?: number; knockback?: boolean; stealth?: boolean; split?: unknown; elite?: boolean; bossAbility?: unknown } | undefined): string {
  if (!def) return '';
  const t: string[] = [];
  if (def.elite) t.push('精英');
  if (def.fly) t.push('⚠飞行·需对空塔');
  if (def.shield) t.push('护盾');
  if (def.lifestealHp) t.push('回血');
  if (def.stealth) t.push('隐身·需聚灵阵');
  if (def.split) t.push('分裂');
  if (def.knockback) t.push('撞塔');
  if (def.bossAbility) t.push('BOSS');
  return t.join(' · ');
}
for (const id of Object.keys(TOWERS)) {
  const def = TOWERS[id];
  const lv0 = def.levels[0];
  const dps = def.behavior === 'aura' ? 0 : Math.round(lv0.dmg * lv0.rate);
  const statTxt = def.behavior === 'aura'
    ? `光环：伤害+${Math.round((lv0.auraBuff?.dmgMul ?? 0) * 100)}% 攻速+${Math.round((lv0.auraBuff?.rateMul ?? 0) * 100)}%`
    : `DPS ${dps} · 射程 ${lv0.range} · ${BEHAVIOR_LABEL[def.behavior] ?? def.behavior}${def.hitsAir ? ' · 对空+对地' : ' · 仅对地'}`;
  const btn = document.createElement('div');
  btn.className = 'tower-btn' + (id === app.activeTowerId ? ' active' : '');
  btn.innerHTML = `
    <span class="name">${def.icon} ${def.name}</span>
    <span class="cost">${def.cost} 灵石</span>
    <span class="desc">${def.desc}</span>
    <span class="desc stat-line" style="color:#5fd3ff">${statTxt}</span>`;
  btn.onclick = () => { if (!btn.classList.contains('disabled')) setActiveTower(id); };
  panel.appendChild(btn);
  towerBtns.set(id, btn);
}
board.setActiveBuild(app.activeTowerId, {
  levels: TOWERS[app.activeTowerId].levels, color: TOWERS[app.activeTowerId].color,
});

/** 刷新底部塔按钮的有效数值（原始(加成后) 格式）；只显示 meta（法宝/天赋/VIP），不含章节缩放 */
function refreshTowerButtonStats(): void {
  const mods = buildMods();
  for (const id of Object.keys(TOWERS)) {
    const def = TOWERS[id];
    const lv0 = def.levels[0];
    const isAura = def.behavior === 'aura';
    let statTxt: string;
    if (isAura) {
      const ab = lv0.auraBuff;
      statTxt = `光环：伤害+${Math.round((ab?.dmgMul ?? 0) * 100)}% 攻速+${Math.round((ab?.rateMul ?? 0) * 100)}%`;
    } else {
      const baseDps = Math.round(lv0.dmg * lv0.rate);
      const buffedDps = Math.round(baseDps * mods.damageMul(damageStatsFor(def.school)) * mods.rateMul());
      const baseRange = lv0.range;
      const buffedRange = Math.round((baseRange + mods.rangeAdd()) * 10) / 10;
      const baseCrit = Math.round((lv0.crit ?? 0) * 100);
      const buffedCrit = Math.min(60, baseCrit + Math.round(mods.critBonus() * 100));
      const dpsTxt = buffedDps > baseDps ? `DPS ${baseDps}(${buffedDps})` : `DPS ${baseDps}`;
      const rangeTxt = buffedRange > baseRange ? `射程 ${baseRange}(${buffedRange})` : `射程 ${baseRange}`;
      const critTxt = buffedCrit > baseCrit ? `暴击 ${baseCrit}%(${buffedCrit}%)` : '';
      const behTxt = BEHAVIOR_LABEL[def.behavior] ?? def.behavior;
      const airTxt = def.hitsAir ? '对空+对地' : '仅对地';
      statTxt = `${dpsTxt} · ${rangeTxt} · ${behTxt} · ${airTxt}${critTxt ? ' · ' + critTxt : ''}`;
    }
    const btn = towerBtns.get(id);
    if (btn) {
      const el = btn.querySelector('.stat-line');
      if (el && el.textContent !== statTxt) el.textContent = statTxt;
    }
  }
}

// ---------- 塔操作面板 ----------
const TARGET_LABEL: Record<string, string> = {
  first: '首敌·最前', last: '末敌·最后', strongest: '最强', nearest: '最近',
};
const towerPanel = document.getElementById('towerPanel')!;
const tpTitle = document.getElementById('tpTitle')!;
const tpRealm = document.getElementById('tpRealm')!;
const tpTarget = document.getElementById('tpTarget')!;
const tpUpgrade = document.getElementById('tpUpgrade') as HTMLButtonElement;
const tpSell = document.getElementById('tpSell') as HTMLButtonElement;
const tpStats = document.getElementById('tpStats')!;
document.getElementById('tpClose')!.onclick = () => { app.selectedUid = null; };
tpUpgrade.onclick = () => { if (app.game && app.selectedUid !== null && app.game.upgradeTower(app.selectedUid)) audio.sfx('upgrade'); };
tpSell.onclick = () => { if (app.game && app.selectedUid !== null && app.game.sellTower(app.selectedUid)) { audio.sfx('sell'); app.selectedUid = null; } };
tpTarget.onclick = () => { if (app.game && app.selectedUid !== null) app.game.cycleTargetPolicy(app.selectedUid); };

function updateTowerPanel(s: ReturnType<Game['snapshot']>): void {
  if (app.selectedUid === null || !app.game) { towerPanel.classList.remove('show'); return; }
  const t = s.towers.find((x) => x.uid === app.selectedUid);
  if (!t) { app.selectedUid = null; towerPanel.classList.remove('show'); return; }
  const rect = canvas.getBoundingClientRect();
  const cell = canvas.width / board.cols;
  towerPanel.style.left = Math.min(rect.left + (t.col + 0.5) * cell + 24, window.innerWidth - 210) + 'px';
  towerPanel.style.top = Math.max(8, Math.min(rect.top + t.row * cell, window.innerHeight - 180)) + 'px';
  towerPanel.classList.add('show');

  tpTitle.textContent = `${t.def.icon} ${t.def.name}`;
  tpRealm.textContent = t.def.levels[t.level].realm;
  tpTarget.textContent = TARGET_LABEL[t.targetPolicy] ?? t.targetPolicy;

  // 有效属性（只显示法宝/天赋/VIP + 光环加成，不含章节缩放——不暴露实现细节）
  if (t.def.behavior === 'aura') {
    const ab = t.def.levels[t.level].auraBuff;
    tpStats.textContent = `光环：伤害+${Math.round((ab?.dmgMul ?? 0) * 100)}% · 攻速+${Math.round((ab?.rateMul ?? 0) * 100)}%`;
  } else {
    const lv = t.def.levels[t.level];
    const mods = buildMods();
    const aura = app.game.auraBuffFor(t.uid) ?? { dmgMul: 0, rateMul: 0 };
    const baseDps = Math.round(lv.dmg * lv.rate);
    const totalMul = mods.damageMul(damageStatsFor(t.def.school)) * mods.rateMul() * (1 + aura.dmgMul) * (1 + aura.rateMul);
    const buffedDps = Math.round(baseDps * totalMul);
    const baseRange = lv.range;
    const buffedRange = Math.round((baseRange + mods.rangeAdd()) * 10) / 10;
    const baseCrit = Math.round((lv.crit ?? 0) * 100);
    const buffedCrit = Math.min(60, baseCrit + Math.round(mods.critBonus() * 100));
    const dpsTxt = buffedDps > baseDps ? `DPS ${baseDps}(${buffedDps})` : `DPS ${baseDps}`;
    const rangeTxt = buffedRange > baseRange ? `射程 ${baseRange}(${buffedRange})` : `射程 ${baseRange}`;
    const critTxt = buffedCrit > baseCrit ? `暴击 ${baseCrit}%(${buffedCrit}%)` : (baseCrit > 0 ? `暴击 ${baseCrit}%` : '');
    const auraTxt = aura.dmgMul > 0 ? ` · 光环+${Math.round(aura.dmgMul * 100)}%` : '';
    tpStats.textContent = `${dpsTxt} · ${rangeTxt}${critTxt ? ' · ' + critTxt : ''}${auraTxt}`;
  }

  const cost = app.game.upgradeCost(t.uid);
  if (cost === null) {
    tpUpgrade.textContent = t.level < t.def.levels.length - 1 ? '已达本关境界上限' : '已达化神';
    tpUpgrade.disabled = true;
  } else {
    tpUpgrade.textContent = `突破至 ${t.def.levels[t.level + 1].realm}（${cost} 灵石）`;
    tpUpgrade.disabled = s.stones < cost;
  }
  tpSell.textContent = `出售（+${app.game.sellRefund(t.uid)} 灵石）`;
}

// ---------- 输入（左键塔弹出面板，离开面板 100ms 自动消失） ----------
let hidePanelTimer: number | null = null;
const startHidePanel = (): void => {
  if (hidePanelTimer !== null) clearTimeout(hidePanelTimer);
  hidePanelTimer = window.setTimeout(() => { app.selectedUid = null; hidePanelTimer = null; }, 200);
};
const cancelHidePanel = (): void => {
  if (hidePanelTimer !== null) { clearTimeout(hidePanelTimer); hidePanelTimer = null; }
};
// 面板悬停时保持显示（鼠标在面板上不消失）
towerPanel.addEventListener('mouseenter', cancelHidePanel);
towerPanel.addEventListener('mouseleave', startHidePanel);

canvas.addEventListener('mousemove', (ev) => {
  const { col, row } = board.cellAt(ev.clientX, ev.clientY);
  board.hoverCol = col; board.hoverRow = row;
});
canvas.addEventListener('mouseleave', () => { board.hoverCol = -1; board.hoverRow = -1; startHidePanel(); });
canvas.addEventListener('click', (ev) => {
  if (!app.game) return;
  const { col, row } = board.cellAt(ev.clientX, ev.clientY);
  const t = app.game.towerAt(col, row);
  if (t) {
    app.selectedUid = t.uid;       // 左键塔 → 弹出操作面板
    cancelHidePanel();
  } else {
    if (app.game.canPlace(col, row) && app.game.placeTower(col, row, app.activeTowerId)) audio.sfx('place');
  }
});
canvas.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
  if (!app.game) return;
  const { col, row } = board.cellAt(ev.clientX, ev.clientY);
  const t = app.game.towerAt(col, row);
  if (t && app.game.sellTower(t.uid)) { audio.sfx('sell'); if (app.selectedUid === t.uid) app.selectedUid = null; }
});

// ---------- 主循环 ----------
app.last = performance.now();

function frame(now: number): void {
  const dt = (now - app.last) / 1000;
  app.last = now;

  if (app.leakFlashAmt > 0) {
    app.leakFlashAmt = Math.max(0, app.leakFlashAmt - dt * 1.6);
    leakFlash.style.opacity = String(app.leakFlashAmt);
  }

  refreshTowerButtonStats();   // 刷新塔按钮的 meta 加成数值

  if (!app.game || !app.currentLevel) { requestAnimationFrame(frame); return; }

  if (!app.paused && app.speedMul > 0) app.game.tick(dt * app.speedMul);

  const s = app.game.snapshot();
  board.render(s, app.currentLevel.buildable);

  elStones.textContent = String(s.stones);
  elLives.textContent = String(s.lives);
  elWave.textContent = `${Math.min(s.waveIndex + 1, s.totalWaves)}/${s.totalWaves}`;
  elStatus.textContent = s.msg;

  // 下一波敌人预告（只在内容变化时重建 DOM，避免每帧重建导致 :hover 失效）
  let previewHtml: string;
  if (s.nextWaveSpawns && s.nextWaveSpawns.length) {
    const chips = s.nextWaveSpawns.map((sp) => {
      const def = ENEMIES[sp.enemy];
      const icon = def?.icon ?? '?';
      const color = def?.color ?? '#888';
      const name = def?.name ?? sp.enemy;
      const traits = enemyTraits(def);
      return `<span class="wv-chip">
        <span class="wv-ico" style="color:${color}">${icon}</span>
        <span class="wv-name">${name}</span>
        <span class="wv-count">×${sp.count}</span>
        <div class="wv-tip"><b>${name}</b><br>
        <span class="wv-stat">HP ${def?.hp ?? '?'} · 甲 ${def?.armor ?? 0} · 速 ${def?.speed ?? '?'} · 赏金 ${def?.bounty ?? '?'}</span>${traits ? `<br><span class="wv-trait">${traits}</span>` : ''}</div>
      </span>`;
    }).join('');
    previewHtml = `<span class="wv-label">下一波</span> ${chips}<span class="wv-label" style="margin-left:auto;font-size:12px">悬停查看敌人属性</span>`;
  } else {
    previewHtml = '<span class="wv-label">已是最后一波</span>';
  }
  if (previewHtml !== lastWavePreviewHtml) {
    wavePreview.innerHTML = previewHtml;
    lastWavePreviewHtml = previewHtml;
  }

  for (const [id, btn] of towerBtns) btn.classList.toggle('disabled', s.stones < TOWERS[id].cost);
  updateTowerPanel(s);

  startBtn.disabled = s.status !== 'prep';
  if (s.status === 'prep') startBtn.textContent = s.nextWaveIn < 0 ? '开始第 1 波' : `立即迎敌（${Math.ceil(s.nextWaveIn)}s 后自动开始）`;
  else if (s.status === 'won') startBtn.textContent = '✅ 守阵成功';
  else if (s.status === 'lost') startBtn.textContent = '❌ 宗门失守';
  else startBtn.textContent = `第 ${s.waveIndex + 1} 波进行中…`;

  if (s.status !== app.prevStatus) {
    if (s.status === 'won') {
      audio.stopMusic();
      settleWin(s.lives, app.currentLevel.lives, app.currentLevel.id, app.currentLevel.story?.outro);
    } else if (s.status === 'lost') {
      audio.stopMusic();
      showStory(FAILED_STORY, returnToSelect);
    }
  }
  app.prevStatus = s.status;

  requestAnimationFrame(frame);
}

// ---------- 启动 ----------
renderProfileSelect();   // 先选玩家档案（多存档隔离）
document.getElementById('switchBtn')!.onclick = switchProfile;
requestAnimationFrame(frame);
