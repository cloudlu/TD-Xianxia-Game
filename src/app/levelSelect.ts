// 选关 / 关卡流程 / 通关结算（复刷已通关关卡时该关全部挑战自动开启，通关达成几个算几个）
import { Game } from '../engine/Game';
import { registry } from '../data/Registry';
import { resolveTitle, completedChapters, ENEMIES } from '../data/config';
import type { StoryBeat, LevelConfig } from '../types';
import { audio } from '../audio/AudioManager';
import { app, buildMods, lookup, telemetry } from './state';
import { showStory, hideStory, type ConfirmBeat } from './storyModal';
import { clearedKey } from '../repo/progress';
import { isUnlocked, computeStars, recordResult, awardContribution, isCleared, recordEndless, awardMilestones, isEndlessUnlocked, endlessMaxTowerLevel, globalTowerLevel, clearedStageCount, unlockedTowerIds, TOWER_LEVEL_THRESHOLDS, ENDLESS_UNLOCK_STAGES, TOWER_UNLOCK_TABLE } from '../repo/progressLevel';
import type { ChallengeDef } from '../types';
import { consumeDestiny, reincarnate } from '../repo/progressMeta';
import { generateWave, endlessHpMul, endlessContrib, MILESTONES, ENDLESS_PATHS, prepTime, calcSkip, SKIP_MESSAGES, BLESSINGS, pickBlessings, ENDLESS_FORMATIONS } from '../engine/EndlessMode';
import { buildableFromPaths } from '../data/config/levels/buildable';
import { REALM_STORIES, TOWER_UNLOCK_STORIES } from '../data/config/realmStories';
import { CHAPTER_CHAR_BEATS, chapterTitleByIndex, storyById, ENDING_STORIES, REALM_CHAR_LINES, CHARACTER_NAMES } from '../data/config';

const levelSelect = document.getElementById('levelSelect')!;
const lsList = document.getElementById('lsList')!;
const lsProgress = document.getElementById('lsProgress')!;
const lsSub = document.getElementById('lsSub')!;
const towerPanel = document.getElementById('towerPanel')!;

function starsText(n: number): string { return '★'.repeat(n) + '☆'.repeat(3 - n); }

/** 由 levelId（如 ch12-l3）解析章节索引（0 起），非主线返回 -1 */
function chapterIndexOf(levelId: string): number {
  const m = /^ch(\d+)-/.exec(levelId);
  return m ? Number(m[1]) - 1 : -1;
}

export function renderLevelSelect(): void {
  const manifest = registry.manifest();
  const total = manifest.length;
  let cleared = 0, stars = 0;
  for (const entry of manifest) {
    const r = app.progression.cleared[clearedKey(entry.levelId)];
    if (r) { cleared += 1; stars += r.stars; }
  }
  // 动态头衔（修真地位）：随通关章节晋升
  const title = resolveTitle(completedChapters(manifest, app.progression));
  const destinyTxt = app.progression.destinyScrolls > 0 ? `　天命符 ${app.progression.destinyScrolls} 张` : '';
  lsSub.textContent = `${title.title}　·　${app.profileName || '修士'}${destinyTxt}`;
  const soulMul = Math.sqrt(app.progression.soulShards) * 0.008;
  const endingLabel: Record<string, string> = { ascend: '· 结局：成 道', wander: '· 结局：执 子 之 手', reincarnate: '· 隐藏结局：轮 回 重 逢' };
  const endingTxt = app.progression.finalEnding ? endingLabel[app.progression.finalEnding] ?? '' : '';
  lsProgress.textContent = `通关 ${cleared}/${total}    星 ★ ${stars}/${total * 3}${app.progression.reincarnationLevel > 0 ? `    转生 ${app.progression.reincarnationLevel} 世` : ''}${soulMul > 0 ? `    仙魂 +${(soulMul * 100).toFixed(2)}%` : ''}${endingTxt}`;

  // 塔境界 + 解锁状态
  const clearedCount = clearedStageCount(app.progression);
  const curRealmIdx = globalTowerLevel(clearedCount);
  const curRealmName = ['炼气','筑基','金丹','元婴','化神','渡劫','大乘','飞升'][curRealmIdx] ?? '未知';
  const nextThreshold = TOWER_LEVEL_THRESHOLDS[curRealmIdx + 1];
  const realmTxt = nextThreshold != null
    ? `当前修为：${curRealmName}（再通 ${nextThreshold - clearedCount} 关 → ${['炼气','筑基','金丹','元婴','化神','渡劫','大乘','飞升'][curRealmIdx + 1]}）`
    : `当前修为：${curRealmName}（已至化境）`;

  const available = unlockedTowerIds(app.progression);
  const allTowerIds = ['flying_sword','talisman','spear','aura','ice_mage','fire_mage','thunder_mage','mine_tower'];
  const iconMap: Record<string, string> = { flying_sword:'剑', talisman:'符', spear:'枪', aura:'阵', ice_mage:'冰', fire_mage:'火', thunder_mage:'雷', mine_tower:'地' };
  const unlockedStr = available.map((id) => iconMap[id] ?? id).join(' ');
  const lockedStr = allTowerIds
    .filter((id) => !available.includes(id))
    .map(() => '？')
    .join(' ');
  const lsRealm = document.getElementById('lsRealm');
  if (lsRealm) lsRealm.textContent = [realmTxt, unlockedStr ? `已解锁修士：${unlockedStr}` : '', lockedStr ? `未解锁：${lockedStr}` : ''].filter(Boolean).join('　|　');
  
  // 转生按钮
  const reincBtn = document.getElementById('reincarnateBtn')!;
  if (cleared === total) {
    reincBtn.style.display = 'inline-block';
    reincBtn.onclick = startReincarnation;
  } else {
    reincBtn.style.display = 'none';
  }

  refreshEndlessButton();
  lsList.innerHTML = '';

  // 章节卡片分组：每章 1 张卡片（章节名 + 3 个关卡按钮）
  const CN_NUM = ['零','一','二','三','四','五','六','七','八','九'];
  const cnNum = (n: number): string =>
    n < 10 ? CN_NUM[n] : n < 20 ? '十' + (n % 10 === 0 ? '' : CN_NUM[n % 10])
      : CN_NUM[Math.floor(n / 10)] + '十' + (n % 10 === 0 ? '' : CN_NUM[n % 10]);
  const chapters: Array<{
    chapterId: string; chapterTitle: string;
    levels: Array<{ entry: typeof manifest[number]; unlocked: boolean; stars: number; lvl: NonNullable<ReturnType<typeof registry.level>> }>;
  }> = [];
  manifest.forEach((entry, i) => {
    const lvl = registry.level(entry.levelId);
    if (!lvl) return;
    const existing = chapters.find((c) => c.chapterId === entry.chapterId);
    const level = {
      entry, unlocked: isUnlocked(manifest, i, app.progression),
      stars: app.progression.cleared[clearedKey(entry.levelId)]?.stars ?? 0,
      lvl,
    };
    if (existing) { existing.levels.push(level); }
    else { chapters.push({ chapterId: entry.chapterId, chapterTitle: entry.chapterTitle, levels: [level] }); }
  });

  let firstUnclearedBtn: HTMLElement | null = null;
  for (const chap of chapters) {
    const card = document.createElement('div');
    const chapCleared = chap.levels.every((l) => l.stars > 0)
      && chap.levels.every((l) => !l.lvl.challenges || l.lvl.challenges.every((c) => app.progression.challengesCompleted[c.id] != null));
    card.className = 'chapter-card' + (chapCleared ? ' cleared' : '');
    const chapStars = chap.levels.reduce((s, l) => s + l.stars, 0);
    const chapIdx = chapterIndexOf(chap.chapterId + '-l1');
    const chapTitle = chapIdx >= 0 ? chapterTitleByIndex(chapIdx) : chap.chapterTitle.replace(/^第.*章 · /, '');
    const head = document.createElement('div');
    head.className = 'cc-head';
    head.innerHTML = `
      <span class="cc-num">第${cnNum(Number(chap.chapterId.replace('ch', '')))}章</span>
      <span class="cc-title">${chapTitle}</span>
      ${chapCleared ? '<span class="cc-done">✓ 已通关</span>' : ''}
      <span class="cc-stars" title="本章 ★">★${chapStars}/${chap.levels.length * 3}</span>`;
    card.appendChild(head);
    chap.levels.forEach((l, li) => {
      const btn = document.createElement('div');
      btn.className = 'level-btn' + (l.unlocked ? '' : ' locked');
      const numTxt = ['壹', '贰', '叁'][li] ?? '·';
      const chTags = l.unlocked && l.lvl.challenges
        ? `<span class="lb-ch">${l.lvl.challenges.map((c) => {
            const done = app.progression.challengesCompleted[c.id] != null;
            return `<span class="ch-tag${done ? ' done' : ''}" title="${c.desc}">${done ? '✓' : '⚔'}</span>`;
          }).join('')}</span>` : '';
      btn.innerHTML = `
        <span class="lb-num">${numTxt}</span>
        <span class="lb-name">${l.unlocked ? l.lvl.name : '？？？'}</span>
        <span class="${l.unlocked ? 'lb-stars' : 'lb-lock'}">${l.unlocked ? starsText(l.stars) : '🔒'}</span>${chTags}`;
      if (l.unlocked) {
        btn.onclick = () => startLevel(l.entry.levelId);
        if (l.stars === 0 && firstUnclearedBtn === null) {
          firstUnclearedBtn = btn;
          btn.classList.add('next');
        }
      }
      card.appendChild(btn);
    });
    lsList.appendChild(card);
  }

  // 自动滚动到第一个未通关关卡
  if (firstUnclearedBtn) {
    requestAnimationFrame(() => firstUnclearedBtn!.scrollIntoView({ block: 'center', behavior: 'auto' }));
  }
}

export function returnToSelect(): void {
  app.game = null;
  app.currentLevel = null;
  app.selectedUid = null;
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

  // 复刷已通关关卡：该关全部挑战自动同时开启，通关时达成几个算几个
  const challenges = isCleared(app.progression, id) ? lvl.challenges : undefined;

  const doStart = () => {
    app.currentLevel = lvl;
    levelSelect.classList.add('fade-out');
    setTimeout(() => { levelSelect.style.display = 'none'; levelSelect.classList.remove('fade-out'); }, 280);
    board.configure(lvl.cols, lvl.rows, lvl.paths, lvl.formations);

    audio.init(); audio.resume(); audio.startMusic();

    // 天命符：使用（已在确认中决定）
    app.progression = pAfterDestiny;
    app.destinyBoost = useScroll ? 1.08 : 1;

    // 境界封顶豁免：已通关关卡复刷不封境界（v0.86 方案 A，保住挑战玩法/大R复刷体验）
    app.game = new Game(lvl, lookup, 12345, undefined, buildMods(), 1, 1, app.destinyBoost,
      (levelId) => !!app.progression.cleared[levelId]);
    // 开启该关全部挑战（复刷时）
    if (challenges && challenges.length > 0) app.game.setChallenge(challenges);
    app.game.onEvent = onGameEvent;
    app.game.telemetry = telemetry;
    app.game.telemetryVipLevel = app.progression.vipLevel ?? 0;

    app.selectedUid = null;
    app.speedMul = 1;
    resetSpeedUI();
    app.prevStatus = 'prep';
    app.paused = true;
    app.last = performance.now();
    // 剧情链：关卡旁白 intro →（仅章首 l1 关）章首人物对白 → 开战
    // 已读剧情（chronicle 中已有 id）自动跳过，复刷关卡直接开始
    const chapterIdx = chapterIndexOf(lvl.id);
    const isL1 = /-l1$/.test(lvl.id);
    const charBeat = chapterIdx >= 0 && isL1 ? CHAPTER_CHAR_BEATS[chapterIdx]?.l1 : undefined;
    const rawIntro = lvl.story?.intro ?? { title: lvl.name, lines: ['守卫此关。'], btn: '开 始' };
    const intro: StoryBeat = { ...rawIntro, id: `${lvl.id}_intro` };
    const seen = new Set(app.progression?.chronicle ?? []);
    const chain: StoryBeat[] = [];
    if (!seen.has(intro.id!)) chain.push(intro);
    if (charBeat && !seen.has(charBeat.id!)) chain.push(charBeat);
    const begin = () => { app.paused = false; };
    if (chain.length === 0) { begin(); }
    else if (chain.length === 1) { showStory(chain[0], begin); }
    else { showStory(chain[0], () => showStory(chain[1], begin)); }
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

/** 连杀窗口（表现层）：2s 内击杀计数，≥5 触发 zoom 演出与飘字 */
let streakCount = 0;
let streakLastAt = -999;
let streakShownAt = 0;
/** 最近一次连杀演出触发时间（main.ts 渲染循环读取后驱动 Board zoom 脉冲） */
export let streakPulseAt = 0;
export function markStreakPulseConsumed(): void { streakPulseAt = 0; }

function onGameEvent(e: GameEventLike): void {
  switch (e.type) {
    case 'kill': {
      // 击杀音分档：按敌人档次 normal/elite/boss（v0.87 批次3）
      const edef = e.enemyId ? ENEMIES[e.enemyId] : undefined;
      const style = edef?.bossAbility ? 'kill_boss' : edef?.elite ? 'kill_elite' : 'kill';
      audio.sfx(style);
      // 连杀演出：2s 窗口计数，≥5 触发 zoom + 飘字
      const now = performance.now() / 1000;
      streakCount = now - streakLastAt < 2 ? streakCount + 1 : 1;
      streakLastAt = now;
      if (streakCount >= 5 && now - streakShownAt > 1.5) {
        streakShownAt = now;
        streakPulseAt = now;
        showStreakBanner(streakCount);
      }
      break;
    }
    case 'leak':
      audio.sfx('leak');
      app.leakFlashAmt = 1;
      pulseLives();
      break;
    case 'waveStart':
      audio.sfx('wave');
      // 连斩跨波保留（v0.87）：波间 prep 无怪可杀不算断连——把窗口起点平移到开波时刻，
      // 上一波攒的连杀数保留，开波首杀即可续上
      if (streakCount > 0) streakLastAt = performance.now() / 1000;
      break;
    case 'win': audio.sfx('win'); break;
    case 'lose': audio.sfx('lose'); break;
    case 'boss': audio.sfx('boss'); break;
  }
}

/** 连杀飘字（DOM，短暂显示） */
function showStreakBanner(n: number): void {
  const el = document.getElementById('streakBanner');
  if (!el) return;
  el.textContent = `${n} 连斩！`;
  el.classList.remove('show');
  void el.offsetWidth;   // 重启动画
  el.classList.add('show');
}

type GameEventLike =
  | { type: 'kill'; enemyId?: string } | { type: 'leak' }
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

/** 通关结算（由 main 的主循环在检测到 won 时调用）：含头衔晋升检测 + 挑战奖励 + 境界突破 + 塔解锁 */
export function settleWin(livesRemaining: number, startLives: number, levelId: string, outro?: StoryBeat): void {
  const manifest = registry.manifest();
  const beforeClear = clearedStageCount(app.progression);
  const beforeLevel = globalTowerLevel(beforeClear);
  const beforeTowers = new Set(unlockedTowerIds(app.progression));
  const beforeTitle = resolveTitle(completedChapters(manifest, app.progression)).index;

  const stars = computeStars(livesRemaining, startLives);
  app.progression = recordResult(app.progression, levelId, stars);
  app.progression = awardContribution(app.progression, stars);

  // 挑战结算：通关时该关全部挑战逐个判定，达成几个算几个
  let challengeTxt = '';
  let challengeGain = 0;
  const newlyDone: string[] = [];
  const failedNames: string[] = [];
  if (app.game?.challengeSucceeded) {
    for (const res of app.game.getChallengeResults()) {
      const cid = res.challenge.id;
      if (res.failed) {
        if (!app.progression.challengesCompleted[cid]) failedNames.push(res.challenge.name);
        continue;
      }
      if (!app.progression.challengesCompleted[cid]) {
        newlyDone.push(res.challenge.name);
        challengeGain += res.challenge.rewardContrib;
        app.progression = {
          ...app.progression,
          challengesCompleted: { ...app.progression.challengesCompleted, [cid]: 1 },
          contribution: app.progression.contribution + res.challenge.rewardContrib,
        };
      }
    }
    if (newlyDone.length > 0) challengeTxt = `\n🌟 挑战达成：${newlyDone.join('、')}！+${challengeGain} 宗门贡献！`;
    if (failedNames.length > 0) challengeTxt += `\n未达成：${failedNames.join('、')}`;
  }
  const afterTitle = resolveTitle(completedChapters(manifest, app.progression));

  // 检测境界突破 + 塔解锁
  const afterClear = clearedStageCount(app.progression);
  const afterLevel = globalTowerLevel(afterClear);
  const afterTowers = unlockedTowerIds(app.progression);
  const newTowers = afterTowers.filter((id) => !beforeTowers.has(id));

  const lines = [`获得 ${20 + stars * 10} 宗门贡献。${challengeTxt}`];
  const settlementBeat: StoryBeat = outro ?? { title: '守阵成功', lines, btn: '返 回 选 关' };

  function finalSettlement(): void {
    const finish = () => {
      if (levelId === 'ch30-l3') showEndingChoice(returnToSelect);
      else showChapterEpilogue(levelId, returnToSelect);
    };
    // 先弹结算对白（异步），再走晋升 / 章末剧情 / 结局；切勿在 frame 内同步 returnToSelect
    if (afterTitle.index > beforeTitle) {
      showStory(settlementBeat, () => showPromotion(afterTitle.title, finish));
    } else {
      showStory(settlementBeat, finish);
    }
  }

  function playNextUnlock(level: number, towerIdx: number): void {
    if (level < afterLevel) {
      const s = REALM_STORIES[level + 1];
      const charLine = REALM_CHAR_LINES[level + 1];
      const fullLines = charLine ? [...s.lines, '', charLine.line] : s.lines;
      showStory({ chapter: s.chapter, title: s.title, lines: fullLines, btn: s.btn }, () => playNextUnlock(level + 1, towerIdx));
      return;
    }
    if (towerIdx < newTowers.length) {
      const s = TOWER_UNLOCK_STORIES[newTowers[towerIdx]];
      if (s) { showStory(s, () => playNextUnlock(level, towerIdx + 1)); return; }
    }
    finalSettlement();
  }

  if (afterLevel > beforeLevel || newTowers.length > 0) {
    playNextUnlock(beforeLevel, 0);
  } else {
    finalSettlement();
  }
}

/** 章末剧情链：l3 通关后追加该章角色收尾对白 + 「下回预告」（ch30 不追加，转结局抉择） */
function showChapterEpilogue(levelId: string, onDone: () => void): void {
  const chapIdx = chapterIndexOf(levelId);
  const isL3 = /-l3$/.test(levelId);
  if (chapIdx < 0 || !isL3) { onDone(); return; }
  const charL3 = CHAPTER_CHAR_BEATS[chapIdx]?.l3;
  const preview = storyById(`ch${chapIdx + 1}_preview`);
  const finish = () => onDone();
  if (charL3 && preview) {
    showStory(charL3, () => showStory(preview, finish));
  } else if (charL3) {
    showStory(charL3, finish);
  } else if (preview) {
    showStory(preview, finish);
  } else {
    finish();
  }
}

/** 终章（ch30-l3）结局抉择：成道 / 归隐（道侣） / 转生隐藏结局 */
function showEndingChoice(onDone: () => void): void {
  const reinc = (app.progression.reincarnationLevel ?? 0) >= 1;
  const choice: ConfirmBeat = {
    chapter: '天 道 之 问',
    title: '你 愿 意 成 为 新 的 天 道 吗 ？',
    lines: reinc
      ? [
          '道祖魔影再次消散，天外天归于宁静。',
          '轮回数世，你已仙魂通透。',
          '天道的声音再度响起，却带着一丝迟疑——',
          '「轮回之人……你还要拒绝本座吗？」',
        ]
      : [
          '道祖魔影消散，天外天归于宁静。',
          '回望修真界——那个你从外门弟子开始守护的小小宗门。',
          '天道问：「你愿意成为新的天道吗？」',
        ],
    btn: '成 为 天 道',
    btnCancel: reinc ? '再 世 寻 她' : '归 于 人 间',
    onCancel: () => applyEnding(reinc ? 'reincarnate' : 'wander', onDone),
  };
  showStory(choice, () => applyEnding('ascend', onDone));
}

/** 应用结局并展示结局剧情（记录 finalEnding，互斥） */
function applyEnding(kind: 'ascend' | 'wander' | 'reincarnate', onDone: () => void): void {
  app.progression = { ...app.progression, finalEnding: kind };
  const beat = ENDING_STORIES[`ending_${kind}`];
  if (beat) showStory(beat, onDone);
  else onDone();
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
  const cols = 32, rows = 12;
  const level: LevelConfig = {
    id: 'endless', name: '无尽试炼', startStones: 600, lives: 3,
    cols, rows, paths: ENDLESS_PATHS,
    buildable: buildableFromPaths(cols, rows, ENDLESS_PATHS),
    hpMul: 1, waves: [],
    maxTowerLevel: endlessMaxTowerLevel(app.progression),
    formations: ENDLESS_FORMATIONS,
  };

  const doStart = () => {
    app.currentLevel = level;
    levelSelect.classList.add('fade-out');
    setTimeout(() => { levelSelect.style.display = 'none'; levelSelect.classList.remove('fade-out'); }, 280);
    board.configure(cols, rows, ENDLESS_PATHS, level.formations);

    audio.init(); audio.resume(); audio.startMusic();
    app.progression = pAfterDestiny;
    app.destinyBoost = useScroll ? 1.08 : 1;

    app.game = new Game(level, lookup, 12345, undefined, buildMods(), 1, 1, app.destinyBoost);
    app.game.onEvent = onGameEvent;
    app.game.telemetry = telemetry;
    app.game.telemetryVipLevel = app.progression.vipLevel ?? 0;

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
  if (app.paused) return;

  let wave = app.game.waveIndex;

  // 每 10 波弹加持选择（在开始下一波之前）
  if (wave > 0 && wave % 10 === 0 && !app.game.endlessBlessings.includes(`milestone_${wave}`)) {
    app.game.endlessBlessings.push(`milestone_${wave}`);
    showBlessingChoice(wave);
    return;
  }

  // 计算上一波通关耗时 → 跳关（使用冻结的 waveClearTime，不含暂停耗时）
  const prevWave = app.game.clearedWaves;
  if (prevWave > 0 && !skipCooldown) {
    const waveEnd = app.game.getWaveClearTime();
    const waveStart = app.game.getWaveStartTime();
    if (waveStart > 0 && waveEnd > 0) {
      const clearTime = (waveEnd - waveStart) / 1000;
      const skip = calcSkip(clearTime, prevWave - 1);
      if (skip > 0) {
        const actual = app.game.skipWaves(skip);
        if (actual > 0) {
          app.endlessSkipDisplay = actual;
          skipCooldown = true;
          setTimeout(() => { skipCooldown = false; }, 2000);
          wave = app.game.waveIndex; // 跳关后更新 wave

          // 跳关后检查是否正好落在整数波 → 补弹加持
          if (wave > 0 && wave % 10 === 0 && !app.game.endlessBlessings.includes(`milestone_${wave}`)) {
            app.game.endlessBlessings.push(`milestone_${wave}`);
            showBlessingChoice(wave);
            return;
          }
        }
      }
    }
  }

  app.game.setHpMul(endlessHpMul(wave));
  const w = generateWave(wave, endlessWaveSeed);
  app.game.addWave(w);
  app.game.startWave();
  app.game.setWaveStartTime(Date.now());
}

/** 每 10 波弹加持选择 */
function showBlessingChoice(wave: number): void {
  const existing = app.game!.endlessBlessings;
  const options = pickBlessings(wave * 31 + endlessWaveSeed, 3, existing);

  const lines = [
    `第 ${wave} 波里程碑——选择一项加持：`,
    '',
    options.map((b, i) =>
      `<button class="blessing-opt" data-idx="${i}" style="display:block;width:100%;text-align:left;margin:6px 0;padding:12px 16px;background:linear-gradient(180deg,#2a3450,#1c2640);border:1px solid #3a4a6a;border-radius:6px;color:#e0e0e0;cursor:pointer;font-size:16px">
        <span style="color:#ffd93d;font-weight:bold">${b.name}</span>
        <span style="color:#8b8ba0;margin-left:12px">${b.desc}</span>
      </button>`
    ).join(''),
  ];

  const beat: ConfirmBeat = {
    chapter: '阵 眼 共 鸣',
    title: '天 地 加 持',
    lines,
    btn: '',
    html: true,
  };
  showStory(beat, () => { app.paused = false; });
  // 隐藏跳过按钮
  const skipBtn = document.getElementById('storySkip');
  if (skipBtn) skipBtn.style.display = 'none';

  setTimeout(() => {
    const body = document.getElementById('storyBody');
    if (!body) return;
    body.querySelectorAll('.blessing-opt').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt((el as HTMLElement).dataset.idx!, 10);
        const chosen = options[idx];
        app.game!.endlessBlessings.push(chosen.id);
        hideStory();
        app.paused = false;
      });
    });
  }, 0);
}

let skipCooldown = false;

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
