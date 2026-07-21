// API 基础配置 + fetch 封装
export let API_BASE = '';

export function setApiBase(url: string): void { API_BASE = url; }

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) throw new Error(`API GET ${path} ${r.status}`);
  return r.json() as T;
}

export async function apiPut(path: string, body: unknown): Promise<void> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API PUT ${path} ${r.status}`);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API POST ${path} ${r.status}`);
  return r.json() as T;
}
