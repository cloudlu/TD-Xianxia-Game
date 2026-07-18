// 剧情弹窗（打字机 + 跳过），开场/通关/失败共用
import type { StoryBeat } from '../types';
import { app } from './state';

export interface ConfirmBeat extends StoryBeat {
  btnCancel?: string;         // 取消按钮文字（有则显示双按钮）
  onCancel?: () => void;      // 取消回调
  html?: boolean;             // lines[0] 等是否为 HTML（直接 innerHTML，不走打字机）
}

let typeTimer: number | null = null;
const overlay = document.getElementById('storyOverlay')!;
const sChapter = document.getElementById('storyChapter')!;
const sTitle = document.getElementById('storyTitle')!;
const sBody = document.getElementById('storyBody')!;
const sBtn = document.getElementById('storyBtn') as HTMLButtonElement;
const sSkip = document.getElementById('storySkip') as HTMLButtonElement;
const sCancel = document.getElementById('storyCancel') as HTMLButtonElement;

/** 隐藏剧情弹窗（供关卡流程返回选关时调用） */
export function hideStory(): void { overlay.classList.remove('show'); }

function finish(): void {
  if (typeTimer !== null) { clearInterval(typeTimer); typeTimer = null; }
}

export function showStory(beat: StoryBeat, onClose: () => void): void {
  const cb = beat as ConfirmBeat;
  sChapter.textContent = cb.chapter ?? '';
  sTitle.textContent = cb.title;
  sBody.textContent = '';
  sBtn.textContent = cb.btn;
  sBtn.disabled = true;
  sBtn.style.opacity = '0.4';
  sBtn.style.display = '';
  sSkip.style.display = '';
  if (cb.btnCancel) {
    sCancel.textContent = cb.btnCancel;
    sCancel.style.display = '';
    sSkip.style.display = 'none';
  } else {
    sCancel.style.display = 'none';
    sSkip.style.display = '';
  }
  overlay.classList.add('show');
  app.paused = true;

  let finishTyping: () => void;

  if (cb.html) {
    // 直接渲染 HTML，无打字机
    sBody.innerHTML = cb.lines.join('\n');
    sBtn.disabled = false;
    sBtn.style.opacity = '1';
    finishTyping = () => {};
  } else {
    // 打字机效果
    const full = cb.lines.join('\n');
    let i = 0;
    finishTyping = () => {
      finish();
      sBody.textContent = full;
      sBtn.disabled = false;
      sBtn.style.opacity = '1';
    };
    typeTimer = window.setInterval(() => {
      i += 1;
      sBody.textContent = full.slice(0, i);
      if (i >= full.length) finishTyping();
    }, 55);
  }

  sSkip.onclick = () => {
    finishTyping(); overlay.classList.remove('show'); onClose();
  };
  sCancel.onclick = () => {
    finishTyping(); overlay.classList.remove('show'); cb.onCancel?.();
  };
  sBtn.onclick = () => {
    if (sBtn.disabled) { finishTyping(); return; }
    overlay.classList.remove('show');
    onClose();
  };
}
