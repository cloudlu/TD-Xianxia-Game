// 玩家档案选择（多存档隔离）+ 切换玩家
import { app, selectProfile, persist } from './state';
import { withDefaults } from '../repo/progress';
import { listProfiles, createProfile, deleteProfile, saveRepoFor } from '../repo/profiles';
import { renderLevelSelect } from './levelSelect';

const profileSelect = document.getElementById('profileSelect')!;
const profileList = document.getElementById('profileList')!;
const profileNameInput = document.getElementById('profileNameInput') as HTMLInputElement;

export async function renderProfileSelect(): Promise<void> {
  const profiles = listProfiles();
  profileList.innerHTML = '';
  if (profiles.length === 0) {
    profileList.innerHTML = '<div class="eq-desc" style="text-align:center">尚无修士，请新建一位开始你的修真之旅。</div>';
  }
  const rows: HTMLElement[] = await Promise.all(profiles.map(async (p) => {
    const prog = await saveRepoFor(p.id).load();
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
      if ((ev.target as HTMLElement).dataset.del) return;
      enterProfile(p.id, p.name);
    };
    return row;
  }));
  for (const row of rows) profileList.appendChild(row);
  profileList.querySelectorAll('[data-del]').forEach((b) => {
    (b as HTMLElement).onclick = (ev) => {
      ev.stopPropagation();
      deleteProfile((b as HTMLElement).dataset.del!);
      renderProfileSelect();
    };
  });
}

async function enterProfile(id: string, name: string): Promise<void> {
  await selectProfile(id, name);
  profileSelect.style.display = 'none';
  renderLevelSelect();
  document.getElementById('levelSelect')!.style.display = 'flex';
}

document.getElementById('profileCreateBtn')!.onclick = async () => {
  const name = profileNameInput.value.trim();
  if (!name) { profileNameInput.focus(); return; }
  const p = createProfile(name);
  profileNameInput.value = '';
  await enterProfile(p.id, p.name);
};
profileNameInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') document.getElementById('profileCreateBtn')!.click(); });

/** 切换玩家：返回档案选择 */
export async function switchProfile(): Promise<void> {
  // 先保存当前进度再清理，避免 setter 存空数据覆盖真实存档
  persist();
  app.game = null;
  app.currentLevel = null;
  app.selectedUid = null;
  app.profileId = null;
  app.profileName = '';
  app.save = null;
  app.progression = withDefaults({});  // 此时 app.save==null，setter 内的 persist 跳过了
  document.getElementById('levelSelect')!.style.display = 'none';
  document.getElementById('metaOverlay')!.classList.remove('show');
  document.getElementById('towerPanel')!.classList.remove('show');
  await renderProfileSelect();
  profileSelect.style.display = 'flex';
}
