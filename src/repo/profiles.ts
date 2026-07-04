// 本地玩家档案（多存档隔离）：每个 profile 一个独立 localStorage key。
// 联网后这套被 RemoteSaveRepo（按 accountId 服务端存）取代，调用方不变。

import { LocalSaveRepo } from './progress';
import type { SaveRepo } from './progress';

export interface Profile { id: string; name: string; }

const PROFILES_KEY = 'xianxia-td:profiles';
const saveKey = (id: string) => `xianxia-td:progress-${id}`;

export function listProfiles(): Profile[] {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY) ?? '[]') as Profile[]; }
  catch { return []; }
}

function saveProfiles(list: Profile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
}

/** 新建档案（id 随机生成），返回新档案；同名允许 */
export function createProfile(name: string): Profile {
  const id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const profile = { id, name: name.trim() || '无名修士' };
  const list = listProfiles();
  list.push(profile);
  saveProfiles(list);
  return profile;
}

/** 删除档案及其存档 */
export function deleteProfile(id: string): void {
  saveProfiles(listProfiles().filter((p) => p.id !== id));
  localStorage.removeItem(saveKey(id));
}

/** 该档案对应的存档 Repo（命名空间隔离） */
export function saveRepoFor(id: string): SaveRepo {
  return new LocalSaveRepo(saveKey(id));
}
