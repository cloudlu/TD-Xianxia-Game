// 选关 / 关卡流程 / 通关结算
import { Game } from '../engine/Game';
import { registry } from '../data/Registry';
import { resolveTitle, completedChapters } from '../data/config';
import type { StoryBeat } from '../types';
import { audio } from '../audio/AudioManager';
import { app, buildMods, lookup, persist } from './state';
import { showStory, hideStory } from './storyModal';
import { isUnlocked, computeStars, recordResult, awardContribution } from '../repo/progress';

const levelSelect = document.getElementById('levelSelect')!;
const lsList = document.getElementById('lsList')!;
const lsProgress = document.getElementById('lsProgress')!;
const lsSub = document.getElementById('lsSub')!;
const towerPanel = document.getElementById('towerPanel')!;

function starsText(n: number): string { return '★'.repeat(n) + '☆'.repeat(3 - n); }

export function renderLevelSelect(): void {
  const manifest = registry.manifest();
  const total = manifest.length;
  let cleared = 0, stars = 0;
  for (const entry of manifest) {
    const r = app.progression.cleared[entry.levelId];
    if (r) { cleared += 1; stars += r.stars; }
  }
  // 动态头衔（修真地位）：随通关章节晋升
  const title = resolveTitle(completedChapters(manifest, app.progression));
  lsSub.textContent = `${title.title}　·　${app.profileName || '修士'}`;
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
  hideStory();
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

/** 通关结算（由 main 的主循环在检测到 won 时调用）：含头衔晋升检测 */
export function settleWin(livesRemaining: number, startLives: number, levelId: string, outro?: StoryBeat): void {
  const manifest = registry.manifest();
  const before = resolveTitle(completedChapters(manifest, app.progression)).index;
  const stars = computeStars(livesRemaining, startLives);
  app.progression = recordResult(app.progression, levelId, stars);
  app.progression = awardContribution(app.progression, stars);
  const after = resolveTitle(completedChapters(manifest, app.progression));
  persist();

  const beat: StoryBeat = outro ?? { title: '守阵成功', lines: [`获得 ${20 + stars * 10} 宗门贡献。`], btn: '返 回 选 关' };
  if (after.index > before) {
    // 晋升：先播结局，再弹晋升庆典，最后回选关
    showStory(beat, () => showPromotion(after.title, returnToSelect));
  } else {
    showStory(beat, returnToSelect);
  }
}

/** 头衔晋升庆典弹窗 */
function showPromotion(newTitle: string, onClose: () => void): void {
  audio.sfx('promote');
  showStory(
    {
      chapter: '宗 门 嘉 奖',
      title: `晋 升 · ${newTitle}`,
      lines: [
        '你的护阵之功，宗门上下有目共睹。',
        `长老会决议：即日起，册封你为「${newTitle}」。`,
        '修真之路，更进一层。',
      ],
      btn: '领 命',
    },
    onClose,
  );
}
