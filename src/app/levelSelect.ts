// 选关 / 关卡流程 / 通关结算
import { Game } from '../engine/Game';
import { registry } from '../data/Registry';
import { resolveTitle, completedChapters } from '../data/config';
import type { StoryBeat, Difficulty, LevelConfig } from '../types';
import { DIFFICULTY_MUL } from '../types';
import { audio } from '../audio/AudioManager';
import { app, buildMods, lookup, telemetry } from './state';
import { showStory, hideStory, type ConfirmBeat } from './storyModal';
import { clearedKey } from '../repo/progress';
import { isUnlocked, computeStars, recordResult, awardContribution, setDifficulty, isClearedOn, isClearedAny, recordEndless, awardMilestones, isEndlessUnlocked, endlessMaxTowerLevel, clearedStageCount, ENDLESS_UNLOCK_STAGES } from '../repo/progressLevel';
import type { ChallengeDef } from '../types';
import { consumeDestiny, reincarnate } from '../repo/progressMeta';
import { generateWave, endlessHpMul, endlessContrib, MILESTONES, ENDLESS_PATHS, prepTime } from '../engine/EndlessMode';
import { buildableFromPaths } from '../data/config/levels/buildable';

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
    // 任意难度通关即算已通该关
    const keys = Object.keys(app.progression.cleared);
    const anyClear = keys.some((k) => k.startsWith(`${entry.levelId}:`));
    if (anyClear) cleared += 1;
    // 总星数取各难度最高星之和
    ([ 'simple', 'normal', 'hard' ] as Difficulty[]).forEach((d) => {
      const r = app.progression.cleared[clearedKey(entry.levelId, d)];
      if (r) stars += r.stars;
    });
  }
  // 动态头衔（修真地位）：随通关章节晋升
  const title = resolveTitle(completedChapters(manifest, app.progression));
  const destinyTxt = app.progression.destinyScrolls > 0 ? `　天命符 ${app.progression.destinyScrolls} 张` : '';
  lsSub.textContent = `${title.title}　·　${app.profileName || '修士'}${destinyTxt}`;
  const soulMul = Math.sqrt(app.progression.soulShards) * 0.008;
  lsProgress.textContent = `通关 ${cleared}/${total}    星 ★ ${stars}/${total * 3}${app.progression.reincarnationLevel > 0 ? `    转生 ${app.progression.reincarnationLevel} 世` : ''}${soulMul > 0 ? `    仙魂 +${(soulMul * 100).toFixed(2)}%` : ''}`;
  
  // 转生按钮
  const reincBtn = document.getElementById('reincarnateBtn')!;
  if (cleared === total) {
    reincBtn.style.display = 'inline-block';
    reincBtn.onclick = startReincarnation;
  } else {
    reincBtn.style.display = 'none';
  }

  // 难度选择器
  const diffBar = document.getElementById('diffBar')!;
  const curDiff = app.progression.difficulty ?? 'normal';
  diffBar.innerHTML = '';
  (['simple', 'normal', 'hard'] as Difficulty[]).forEach((d) => {
    const b = document.createElement('button');
    b.className = 'diff-btn' + (d === curDiff ? ' active' : '');
    b.textContent = DIFFICULTY_MUL[d].label;
    b.onclick = () => {
      app.progression = setDifficulty(app.progression, d);
      renderLevelSelect();
    };
      diffBar.appendChild(b);
    });

    refreshEndlessButton();
    // persist() 由 app.progression setter 自动触发
  lsList.innerHTML = '';
  manifest.forEach((entry, i) => {
    const lvl = registry.level(entry.levelId);
    if (!lvl) return;
    const unlocked = isUnlocked(manifest, i, app.progression, curDiff);
    const lvlStars = app.progression.cleared[clearedKey(entry.levelId, curDiff)]?.stars ?? 0;
    const row = document.createElement('div');
    row.className = 'level-row' + (unlocked ? '' : ' locked');
    row.innerHTML = `
      <div class="lr-title">
        <div class="lr-name">${unlocked ? lvl.name : '？？？'}</div>
        <div class="lr-chap">${entry.chapterTitle}</div>
      </div>
      <div class="${unlocked ? 'lr-stars' : 'lr-lock'}">${unlocked ? starsText(lvlStars) : '🔒'}</div>
      ${unlocked && lvl.challenges ? `<div class="lr-challenges">${lvl.challenges.map((c) => {
        const done = app.progression.challengesCompleted[c.id] != null;
        return `<span class="ch-tag${done ? ' done' : ''}" title="${c.desc}">${done ? '✓' : '⚔'} ${c.name}</span>`;
      }).join('')}</div>` : ''}`;
    if (unlocked) row.onclick = () => startLevel(entry.levelId);
    lsList.appendChild(row);
  });
}

export function returnToSelect(): void {
  app.game = null;
  app.currentLevel = null;
  app.selectedUid = null;
  app.selectedChallenge = null;
  app.destinyBoost = 1;
  towerPanel.classList.remove('show');
  hideStory();
  renderLevelSelect();
  levelSelect.style.display = 'flex';
  requestAnimationFrame(() => levelSelect.classList.remove('fade-out'));
}

export function startLevel(id: string): void {
  const lvl = registry.level(id);
  const board = app.board;
  if (!lvl || !board) return;

  // 挑战选择：只有该关至少通关过一次（任意难度）才显示挑战选择
  const challenges = lvl.challenges;
  if (challenges && challenges.length > 0 && app.selectedChallenge === null && isClearedAny(app.progression, id)) {
    showChallengeSelect(challenges, id);
    return;
  }

  const doStart = () => {
    app.currentLevel = lvl;
    levelSelect.classList.add('fade-out');
    setTimeout(() => { levelSelect.style.display = 'none'; levelSelect.classList.remove('fade-out'); }, 280);
    board.configure(lvl.cols, lvl.rows, lvl.paths);

    audio.init(); audio.resume(); audio.startMusic();

    // 天命符：使用（已在确认中决定）
    app.progression = pAfterDestiny;
    app.destinyBoost = useScroll ? 1.08 : 1;

    const diff = DIFFICULTY_MUL[app.progression.difficulty] ?? DIFFICULTY_MUL.normal;
    app.game = new Game(lvl, lookup, 12345, undefined, buildMods(), diff.hp, diff.bounty, app.destinyBoost);
    // 传入选定的挑战
    if (app.selectedChallenge && app.selectedChallenge !== 'skip' && challenges) {
      const cd = challenges.find((c) => c.id === app.selectedChallenge);
      if (cd) app.game.setChallenge([cd]);
    }
    // 重置，下一关重新选择
    app.selectedChallenge = null;
    app.game.onEvent = onGameEvent;
    app.game.telemetry = telemetry;

    app.selectedUid = null;
    app.speedMul = 1;
    resetSpeedUI();
    app.prevStatus = 'prep';
    app.paused = true;
    app.last = performance.now();
    showStory(lvl.story?.intro ?? { title: lvl.name, lines: ['守卫此关。'], btn: '开 始' }, () => { app.paused = false; });
  };

  // 天命符确认：有符时询问玩家是否使用
  let useScroll = false;
  let pAfterDestiny = app.progression;
  if (app.progression.destinyScrolls > 0) {
    const confirmBeat: ConfirmBeat = {
      chapter: '天 命 符',
      title: '天 命 加 持',
      lines: [`消耗 1 张天命符，本关全体伤害 +8%（不可叠加，每关最多用 1 张）。\n剩余天命符：${app.progression.destinyScrolls} 张`],
      btn: '使 用 天 命 符',
      btnCancel: '不 用',
      onCancel: () => { useScroll = false; pAfterDestiny = app.progression; doStart(); },
    };
    showStory(confirmBeat, () => {
      useScroll = true;
      const r = consumeDestiny(app.progression);
      pAfterDestiny = r.progression;
      doStart();
    });
  } else {
    doStart();
  }
}

/** 弹窗选择挑战 */
function showChallengeSelect(challenges: ChallengeDef[], levelId: string): void {
  const already = new Set(Object.keys(app.progression.challengesCompleted));
  const challengeButtons = challenges.map((c) => {
    const done = already.has(c.id);
    return `<button class="ch-opt${done ? ' done' : ''}" data-cid="${c.id}" style="display:block;width:100%;text-align:left;margin:6px 0;padding:12px 16px;background:linear-gradient(180deg,#2a3450,#1c2640);border:1px solid #3a4a6a;border-radius:6px;color:#e0e0e0;cursor:pointer;font-size:16px">
      <span style="color:#ffd93d;font-weight:bold">${c.name}</span>
      <span style="color:#8b8ba0;margin-left:12px">${c.desc}</span>
      <span style="color:#5fd3ff;float:right">+${c.rewardContrib} 贡献</span>
      ${done ? '<span style="color:#4caf50;margin-left:8px">✓ 已达成</span>' : ''}
    </button>`;
  }).join('');

  const beat: ConfirmBeat = {
    chapter: '挑 战',
    title: '选 择 挑 战',
    lines: ['可选挑战（通关额外奖励宗门贡献）：', '', `<div style="text-align:left;font-size:16px;line-height:2">${challengeButtons}</div>`, '', '点击上方任一挑战直接进入，或点下方跳过。'],
    btn: '跳 过（不选挑战）',
    btnCancel: '取 消',
    onCancel: () => { renderLevelSelect(); },
    html: true,
  };
  showStory(beat, () => {
    // 跳过，不选挑战
    app.selectedChallenge = 'skip';
    startLevel(levelId);
  });

  // 绑定挑战按钮点击
  setTimeout(() => {
    const body = document.getElementById('storyBody');
    if (!body) return;
    body.querySelectorAll('.ch-opt').forEach((el) => {
      el.addEventListener('click', () => {
        const cid = (el as HTMLElement).dataset.cid!;
        app.selectedChallenge = cid;
        hideStory();
        startLevel(levelId);
      });
    });
  }, 0);
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
    case 'boss': audio.sfx('boss'); break;
  }
}

type GameEventLike =
  | { type: 'kill' } | { type: 'leak' }
  | { type: 'waveStart'; wave: number }
  | { type: 'win' } | { type: 'lose' }
  | { type: 'boss' };

function pulseLives(): void {
  const el = document.getElementById('h-lives');
  if (!el) return;
  el.classList.remove('hit');
  void el.offsetWidth;
  el.classList.add('hit');
}

function resetSpeedUI(): void {
  document.querySelectorAll('.speed-btn').forEach((b, i) => {
    (b as HTMLElement).classList.toggle('active', [0, 1, 2, 3][i] === app.speedMul);
  });
}

/** 通关结算（由 main 的主循环在检测到 won 时调用）：含头衔晋升检测 + 挑战奖励 */
export function settleWin(livesRemaining: number, startLives: number, levelId: string, outro?: StoryBeat): void {
  const manifest = registry.manifest();
  const before = resolveTitle(completedChapters(manifest, app.progression)).index;
  const stars = computeStars(livesRemaining, startLives);
  const diff = app.progression.difficulty ?? 'normal';
  app.progression = recordResult(app.progression, levelId, diff, stars);
  app.progression = awardContribution(app.progression, stars);
  // 挑战结算
  let challengeTxt = '';
  if (app.game?.activeChallenge && app.game?.challengeSucceeded) {
    const cid = app.game.activeChallenge.id;
    if (!app.progression.challengesCompleted[cid]) {
      app.progression = {
        ...app.progression,
        challengesCompleted: { ...app.progression.challengesCompleted, [cid]: 1 },
        contribution: app.progression.contribution + app.game.activeChallenge.rewardContrib,
      };
      challengeTxt = `\n🌟 挑战「${app.game.activeChallenge.name}」达成！+${app.game.activeChallenge.rewardContrib} 宗门贡献！`;
    } else {
      challengeTxt = `\n挑战「${app.game.activeChallenge.name}」已达成过。`;
    }
  } else if (app.game?.activeChallenge && app.game?.challengeFailed) {
    challengeTxt = `\n挑战「${app.game.activeChallenge.name}」失败：${app.game.challengeFailedReason}`;
  }
  const after = resolveTitle(completedChapters(manifest, app.progression));
  app.selectedChallenge = null;

  const lines = [`获得 ${20 + stars * 10} 宗门贡献。${challengeTxt}`];
  const beat: StoryBeat = outro ?? { title: '守阵成功', lines, btn: '返 回 选 关' };
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

// ---------- 转生 ----------
export function startReincarnation(): void {
  const manifest = registry.manifest();
  const r = reincarnate(app.progression, manifest);
  if (!r) return;
  const { progression: p, soulShardsGained } = r;
  showStory({
    chapter: '转 世 重 修',
    title: `第 ${p.reincarnationLevel} 世 · 再 修 仙 途`,
    lines: [
      `你历经百劫，决定重入轮回。`,
      `前世修为化入灵魂深处：仙魂碎片 +${soulShardsGained}`,
      `你的仙魂之力在觉醒：${(Math.sqrt(p.soulShards) * 0.008).toFixed(4)} × 全属性`,
      `当前仙魂碎片：${p.soulShards}`,
      '',
      '关卡进度已重置。再次通关可获更多碎片。',
    ],
    btn: '入 轮 回',
  }, () => {
    app.progression = p;
    renderLevelSelect();
  });
}

// ---------- 无尽模式 ----------
let endlessWaveSeed = Date.now();

export function startEndless(): void {
  if (!isEndlessUnlocked(app.progression)) {
    const need = ENDLESS_UNLOCK_STAGES - clearedStageCount(app.progression);
    showStory({
      chapter: '无 尽 试 炼',
      title: '尚 未 解 锁',
      lines: [`需通关至少 ${ENDLESS_UNLOCK_STAGES} 关主线方可进入无尽试炼。`, need > 0 ? `还需再通关 ${need} 关。` : ''],
      btn: '返 回',
    }, () => {});
    return;
  }
  const board = app.board; if (!board) return;
  const cols = 16, rows = 8;
  const level: LevelConfig = {
    id: 'endless', name: '无尽试炼', startStones: 600, lives: 3,
    cols, rows, paths: ENDLESS_PATHS,
    buildable: buildableFromPaths(cols, rows, ENDLESS_PATHS),
    hpMul: 1, waves: [],
    maxTowerLevel: endlessMaxTowerLevel(app.progression),
  };

  const doStart = () => {
    app.currentLevel = level;
    levelSelect.classList.add('fade-out');
    setTimeout(() => { levelSelect.style.display = 'none'; levelSelect.classList.remove('fade-out'); }, 280);
    board.configure(cols, rows, ENDLESS_PATHS);

    audio.init(); audio.resume(); audio.startMusic();
    app.progression = pAfterDestiny;
    app.destinyBoost = useScroll ? 1.08 : 1;

    const diff = DIFFICULTY_MUL[app.progression.difficulty ?? 'normal'];
    app.game = new Game(level, lookup, 12345, undefined, buildMods(), diff.hp, diff.bounty, app.destinyBoost);
    app.game.onEvent = onGameEvent;
    app.game.telemetry = telemetry;

    endlessWaveSeed = Date.now();
    const w0 = generateWave(0, endlessWaveSeed);
    app.game.addWave(w0);
    app.game.startWave();

    app.selectedUid = null;
    app.speedMul = 1;
    resetSpeedUI();
    app.prevStatus = 'prep';
    app.paused = true;
    app.last = performance.now();
    showStory({
      chapter: '无 尽 试 炼', title: '守 到 最 后',
      lines: ['无尽妖兽涌来，一波比一波更强。', '守到不能再守为止。你的最高波次将载入宗门记录。'],
      btn: '迎 战',
    }, () => { app.paused = false; });
  };

  let useScroll = false;
  let pAfterDestiny = app.progression;
  if (app.progression.destinyScrolls > 0) {
    const confirmBeat: ConfirmBeat = {
      chapter: '天 命 符',
      title: '天 命 加 持',
      lines: [`消耗 1 张天命符，本关全体伤害 +8%（不可叠加，每关最多用 1 张）。\n剩余天命符：${app.progression.destinyScrolls} 张`],
      btn: '使 用 天 命 符',
      btnCancel: '不 用',
      onCancel: () => { useScroll = false; pAfterDestiny = app.progression; doStart(); },
    };
    showStory(confirmBeat, () => {
      useScroll = true;
      const r = consumeDestiny(app.progression);
      pAfterDestiny = r.progression;
      doStart();
    });
  } else {
    doStart();
  }
}

/** 刷新无尽按钮的锁定/解锁状态（选关时调用，也可被 main 初始化时调用） */
export function refreshEndlessButton(): void {
  const btn = document.getElementById('endlessBtn');
  if (!btn) return;
  const unlocked = isEndlessUnlocked(app.progression);
  const cur = clearedStageCount(app.progression);
  Object.assign(btn.style, unlocked ? {
    background: 'linear-gradient(180deg,#c0392b,#96281b)',
    border: '1px solid #c0392b',
    cursor: 'pointer',
    color: '#fff',
  } : {
    background: '#555',
    border: '1px solid #555',
    cursor: 'not-allowed',
    color: '#999',
  });
  btn.textContent = unlocked ? '无 尽 试 炼' : `无尽试炼（${cur}/${ENDLESS_UNLOCK_STAGES}）`;
  btn.title = unlocked ? '' : `通关 ${ENDLESS_UNLOCK_STAGES} 关主线后解锁`;
}

/** 无尽模式每波清空后自动推进（main 帧循环调用） */
export function tickEndless(): void {
  if (!app.game || !app.currentLevel || app.currentLevel.id !== 'endless') return;
  if (app.game.status !== 'prep') return;
  const wave = app.game.waveIndex;
  // 自动生成下一波
  app.game.setHpMul(endlessHpMul(wave));
  const w = generateWave(wave, endlessWaveSeed);
  app.game.addWave(w);
  // 自动开始（不需要玩家点）
  app.game.startWave();
}

/** 无尽模式结算 */
export function settleEndless(): void {
  if (!app.game) return;
  const wave = app.game.clearedWaves;
  const score = app.game.endlessScore;
  const contrib = endlessContrib(score);

  // 高分存档
  const { progression: p1, isNewBest } = recordEndless(app.progression, wave, score);
  // 里程碑
  const { progression: p2, newMilestones } = awardMilestones(p1, wave);
  // 贡献
  let bonusContrib = 0;
  for (const m of newMilestones) bonusContrib += MILESTONES.get(m)?.contrib ?? 0;
  const totalContrib = isNewBest ? Math.round(contrib * 1.2) + bonusContrib : contrib + bonusContrib;
  app.progression = awardContribution(p2, 0, 0);  // placeholder—we'll add custom amount
  app.progression = { ...app.progression, contribution: app.progression.contribution + totalContrib };

  const bestTxt = isNewBest ? ' · 新纪录！+20% 贡献' : '';
  const mileTxt = newMilestones.length > 0 ? ` · 里程碑 wave ${newMilestones.join(',')} +${bonusContrib} 贡献` : '';
  const titles = newMilestones.map((m) => MILESTONES.get(m)?.title).filter(Boolean).join('、');
  const titleTxt = titles ? `\n获得称号：${titles}` : '';

  showStory({
    chapter: '无 尽 试 炼', title: '试 炼 结 束',
    lines: [`你守到了第 ${wave} 波。`, `贡献 +${totalContrib}${bestTxt}${mileTxt}${titleTxt}`],
    btn: '返 回 选 关',
  }, returnToSelect);
}

