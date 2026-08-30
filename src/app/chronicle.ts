// 宗门编年史：按已读剧情 id（app.progression.chronicle）回放时间线（仿小说章节）
import { app } from './state';
import { chronicleGroups, storyById, PROLOGUE_STORY, ENDING_STORIES } from '../data/config';
import type { StoryBeat } from '../types';

const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
function cnNum(n: number): string {
  if (n < 10) return CN_NUM[n];
  if (n < 20) return '十' + (n % 10 === 0 ? '' : CN_NUM[n % 10]);
  return CN_NUM[Math.floor(n / 10)] + '十' + (n % 10 === 0 ? '' : CN_NUM[n % 10]);
}

function beatHtml(beat: StoryBeat): string {
  const title = beat.chapter ? `${beat.chapter} · ${beat.title}` : beat.title;
  return `<div class="chronicle-beat"><div class="cb-title">${title}</div><div class="cb-lines">${beat.lines.join('\n')}</div></div>`;
}

export function renderChronicle(): string {
  const read = new Set(app.progression?.chronicle ?? []);
  const endingId = app.progression?.finalEnding ? `ending_${app.progression.finalEnding}` : null;
  let html = '<h2>宗 门 编 年 史</h2><div class="eq-desc" style="text-align:center;margin-bottom:14px;">你走过的路，都在这里——剧情按阅读顺序收录，随通关进度自动补全。</div>';

  // 序章（仅已读/已回填时显示）
  if (read.has('prologue')) {
    html += `<div class="chronicle-chapter"><h3>序 · 守 山 人</h3>${beatHtml(PROLOGUE_STORY)}</div>`;
  }

  // 30 章（角色对白 + 下回预告）
  const groups = chronicleGroups();
  let anySeen = false;
  for (const g of groups) {
    const beats = g.beats.filter((b) => read.has(b.id!));
    if (beats.length === 0) continue;
    anySeen = true;
    const num = Number(g.chapterId.replace('ch', ''));
    html += `<div class="chronicle-chapter"><h3>第${cnNum(num)}章 · ${g.title}</h3>${beats.map(beatHtml).join('')}</div>`;
  }

  // 结局
  if (endingId && ENDING_STORIES[endingId]) {
    html += `<div class="chronicle-chapter"><h3>终 章 · 结 局</h3>${beatHtml(ENDING_STORIES[endingId])}</div>`;
  } else if (anySeen) {
    // 已读但无结局：显示已读结局备用（若 ch30 未通关则不显示）
    const seenEnding = Object.values(ENDING_STORIES).find((b) => read.has(b.id!));
    if (seenEnding) html += `<div class="chronicle-chapter"><h3>终 章 · 结 局</h3>${beatHtml(seenEnding)}</div>`;
  }

  if (!anySeen && !read.has('prologue') && !endingId) {
    html += '<div class="chronicle-empty">编年史尚空白——从第一章第一关开始，你的故事便会在这里展开。</div>';
  }
  html += '<div class="close-row"><button id="chronicleClose">返 回 选 关</button></div>';
  return html;
}
