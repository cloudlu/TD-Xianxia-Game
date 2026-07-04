// 剧情弹窗（打字机 + 跳过），开场/通关/失败共用
import type { StoryBeat } from '../types';
import { app } from './state';

let typeTimer: number | null = null;
const overlay = document.getElementById('storyOverlay')!;
const sChapter = document.getElementById('storyChapter')!;
const sTitle = document.getElementById('storyTitle')!;
const sBody = document.getElementById('storyBody')!;
const sBtn = document.getElementById('storyBtn') as HTMLButtonElement;
const sSkip = document.getElementById('storySkip') as HTMLButtonElement;

/** 隐藏剧情弹窗（供关卡流程返回选关时调用） */
export function hideStory(): void { overlay.classList.remove('show'); }

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
