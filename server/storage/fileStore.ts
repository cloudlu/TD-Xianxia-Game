import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const DIR = dirname(fileURLToPath(import.meta.url));
const DATA = join(DIR, '..', 'data');
const PROFILES_FILE = join(DATA, 'profiles.json');
const PROFILES_DIR = join(DATA, 'profiles');

function ensureDirs(): void {
  if (!existsSync(DATA)) mkdirSync(DATA, { recursive: true });
  if (!existsSync(PROFILES_DIR)) mkdirSync(PROFILES_DIR, { recursive: true });
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
  const list = listProfiles().filter(p => p.id !== id);
  saveProfiles(list);
  const f = join(PROFILES_DIR, `${id}.json`);
  if (existsSync(f)) unlinkSync(f);
}

export function loadProgress(id: string): string | null {
  ensureDirs();
  const f = join(PROFILES_DIR, `${id}.json`);
  if (!existsSync(f)) return null;
  try { return readFileSync(f, 'utf-8'); } catch { return null; }
}

export function saveProgress(id: string, json: string): void {
  ensureDirs();
  writeFileSync(join(PROFILES_DIR, `${id}.json`), json, 'utf-8');
}
