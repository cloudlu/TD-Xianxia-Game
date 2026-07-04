// 入口控制器：创建棋盘/HUD/塔栏/塔面板/输入，跑主循环。
// 覆盖层界面（选关/剧情/修炼）在 ./app/screens，共享状态在 ./app/state。

import { Board } from './ui/Board';
import { TOWERS, FAILED_STORY, SKINS } from './data/config';
import { audio } from './audio/AudioManager';
import { app } from './app/state';
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
for (const id of Object.keys(TOWERS)) {
  const def = TOWERS[id];
  const btn = document.createElement('div');
  btn.className = 'tower-btn' + (id === app.activeTowerId ? ' active' : '');
  btn.innerHTML = `
    <span class="name">${def.icon} ${def.name}</span>
    <span class="cost">${def.cost} 灵石</span>
    <span class="desc">${def.desc}</span>`;
  btn.onclick = () => { if (!btn.classList.contains('disabled')) setActiveTower(id); };
  panel.appendChild(btn);
  towerBtns.set(id, btn);
}
board.setActiveBuild(app.activeTowerId, {
  levels: TOWERS[app.activeTowerId].levels, color: TOWERS[app.activeTowerId].color,
});

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

// ---------- 输入 ----------
canvas.addEventListener('mousemove', (ev) => {
  const { col, row } = board.cellAt(ev.clientX, ev.clientY);
  board.hoverCol = col; board.hoverRow = row;
});
canvas.addEventListener('mouseleave', () => { board.hoverCol = -1; board.hoverRow = -1; });
canvas.addEventListener('click', (ev) => {
  if (!app.game) return;
  const { col, row } = board.cellAt(ev.clientX, ev.clientY);
  const t = app.game.towerAt(col, row);
  if (t) {
    app.selectedUid = t.uid;
  } else {
    app.selectedUid = null;
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

  if (!app.game || !app.currentLevel) { requestAnimationFrame(frame); return; }

  if (!app.paused && app.speedMul > 0) app.game.tick(dt * app.speedMul);

  const s = app.game.snapshot();
  board.render(s, app.currentLevel.buildable);

  elStones.textContent = String(s.stones);
  elLives.textContent = String(s.lives);
  elWave.textContent = `${Math.min(s.waveIndex + 1, s.totalWaves)}/${s.totalWaves}`;
  elStatus.textContent = s.msg;

  for (const [id, btn] of towerBtns) btn.classList.toggle('disabled', s.stones < TOWERS[id].cost);
  updateTowerPanel(s);

  startBtn.disabled = s.status !== 'prep';
  if (s.status === 'prep') startBtn.textContent = `立即迎敌（${Math.ceil(s.nextWaveIn)}s 后自动开始）`;
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
