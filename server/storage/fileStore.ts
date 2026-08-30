import {
  readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync,
  copyFileSync, renameSync, readdirSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const DIR = dirname(fileURLToPath(import.meta.url));
const DATA = join(DIR, '..', 'data');
const PROFILES_FILE = join(DATA, 'profiles.json');
const PROFILES_DIR = join(DATA, 'profiles');
const BACKUPS_DIR = join(DATA, 'backups');

// 每个档案在本机保留的每日备份份数（超出即清理）
const BACKUP_KEEP = 30;

function ensureDirs(): void {
  if (!existsSync(DATA)) mkdirSync(DATA, { recursive: true });
  if (!existsSync(PROFILES_DIR)) mkdirSync(PROFILES_DIR, { recursive: true });
  if (!existsSync(BACKUPS_DIR)) mkdirSync(BACKUPS_DIR, { recursive: true });
}

/** 本地日期戳 YYYYMMDD（用于按天去重备份） */
function dateStamp(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

function profileFile(id: string): string { return join(PROFILES_DIR, `${id}.json`); }

function safeParse(raw: string): any {
  try { return JSON.parse(raw); } catch { return null; }
}

function readIfExists(p: string): string | null {
  try { return existsSync(p) ? readFileSync(p, 'utf-8') : null; } catch { return null; }
}

/**
 * 每日备份：该档案当天尚无备份时，把当前存档复制到 backups/。
 * 仅当旧档存在时复制；复制后清理过量旧备份。
 */
function backupIfDue(id: string): void {
  ensureDirs();
  const src = profileFile(id);
  if (!existsSync(src)) return;
  const bak = join(BACKUPS_DIR, `${id}.${dateStamp()}.json`);
  if (!existsSync(bak)) {
    try { copyFileSync(src, bak); } catch { /* 备份失败不阻断主流程 */ }
  }
  try {
    const matches = readdirSync(BACKUPS_DIR)
      .filter((f) => f.startsWith(`${id}.`) && f.endsWith('.json'))
      .sort();
    const excess = matches.length - BACKUP_KEEP;
    for (let i = 0; i < excess; i++) {
      try { unlinkSync(join(BACKUPS_DIR, matches[i])); } catch { /* 忽略 */ }
    }
  } catch { /* 忽略 */ }
}

/** 存档是否明显有积累——用于拒绝"空档覆盖富档"的判据 */
function clearlyRich(p: any): boolean {
  return !!p && (
    (p.jade ?? 0) > 0 ||
    (p.totalRecharged ?? 0) > 0 ||
    (p.totalRechargedCny ?? 0) > 0 ||
    (p.vipLevel ?? 0) > 0 ||
    (p.ownedEquipment?.length ?? 0) > 0 ||
    (p.ownedTreasures?.length ?? 0) > 0 ||
    (p.reincarnationLevel ?? 0) > 0 ||
    (p.soulShards ?? 0) > 0 ||
    (p.challengeMedals ? Object.keys(p.challengeMedals).length > 0 : false)
  );
}

/** 待保存内容是否呈现为"全新/空档" */
function looksFresh(p: any): boolean {
  return !p || (
    (p.jade ?? 0) <= 0 &&
    (p.totalRecharged ?? 0) <= 0 &&
    (p.totalRechargedCny ?? 0) <= 0 &&
    (p.vipLevel ?? 0) <= 0 &&
    (p.ownedEquipment?.length ?? 0) === 0 &&
    (p.ownedTreasures?.length ?? 0) === 0 &&
    (p.reincarnationLevel ?? 0) <= 0 &&
    (p.soulShards ?? 0) <= 0 &&
    (p.challengeMedals ? Object.keys(p.challengeMedals).length === 0 : true) &&
    (p.cleared ? Object.keys(p.cleared).length <= 1 : true) &&
    (p.chronicle ? p.chronicle.length <= 2 : true)
  );
}

export interface Profile { id: string; name: string; }

export function listProfiles(): Profile[] {
  ensureDirs();
  if (!existsSync(PROFILES_FILE)) return [];
  try { return JSON.parse(readFileSync(PROFILES_FILE, 'utf-8')) as Profile[]; }
  catch { return []; }
}

function saveProfiles(list: Profile[]): void {
  ensureDirs();
  writeFileSync(PROFILES_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

export function createProfile(name: string): Profile {
  const id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const profile: Profile = { id, name: name.trim() || '无名修士' };
  const list = listProfiles();
  list.push(profile);
  saveProfiles(list);
  return profile;
}

export function deleteProfile(id: string): void {
  backupIfDue(id); // 删除前留一份备份，防误删
  const list = listProfiles().filter((p) => p.id !== id);
  saveProfiles(list);
  const f = profileFile(id);
  if (existsSync(f)) unlinkSync(f);
}

export function loadProgress(id: string): string | null {
  ensureDirs();
  return readIfExists(profileFile(id));
}

/**
 * 保存进度：
 *  1) 先给旧档备份（每日一次），即使后续写入被拒也能留证；
 *  2) 防静默清零：若磁盘已有"明显有积累"的存档、而本次提交形如空档，则拒绝写入并抛错
 *     （code: REFUSE_WIPE），供路由转 409；
 *  3) 原子写入（临时文件 + rename），避免崩溃造成半截损坏文件。
 */
export function saveProgress(id: string, json: string): void {
  ensureDirs();
  const existing = readIfExists(profileFile(id));
  const incoming = safeParse(json);

  backupIfDue(id);

  if (clearlyRich(existing && safeParse(existing)) && looksFresh(incoming)) {
    const err = new Error(`拒绝用空档覆盖有积累的存档: ${id}`) as Error & { code?: string };
    err.code = 'REFUSE_WIPE';
    throw err;
  }

  const f = profileFile(id);
  const tmp = `${f}.tmp`;
  writeFileSync(tmp, json, 'utf-8');
  renameSync(tmp, f);
}