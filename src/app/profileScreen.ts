// 玩家档案选择（多存档隔离）+ 切换玩家
import { app, selectProfile } from './state';
import { withDefaults } from '../repo/progress';
import { listProfiles, createProfile, deleteProfile, saveRepoFor } from '../repo/profiles';
import { renderLevelSelect } from './levelSelect';

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
    const prog = saveRepoFor(p.id).load();
    const cleared = new Set(Object.keys(prog.cleared).map((k) => k.split(':')[0])).size;
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
  document.getElementById('levelSelect')!.style.display = 'flex';
}

document.getElementById('profileCreateBtn')!.onclick = () => {
  const name = profileNameInput.value.trim();
  if (!name) { profileNameInput.focus(); return; }
  const p = createProfile(name);
  profileNameInput.value = '';
  enterProfile(p.id, p.name);
};
profileNameInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') document.getElementById('profileCreateBtn')!.click(); });

/** 切换玩家：返回档案选择 */
export function switchProfile(): void {
  app.game = null;
  app.currentLevel = null;
  app.selectedUid = null;
  app.profileId = null;
  app.profileName = '';
  app.progression = withDefaults({});
  document.getElementById('levelSelect')!.style.display = 'none';
  document.getElementById('metaOverlay')!.classList.remove('show');
  document.getElementById('towerPanel')!.classList.remove('show');
  renderProfileSelect();
  profileSelect.style.display = 'flex';
}
