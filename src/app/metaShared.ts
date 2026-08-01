// 宗门修真各 tab 共享的工具函数
import type { EquipSlot } from '../types';
import { EQUIPMENT, LIMITED_TREASURES } from '../data/config';
import { STAT_LABELS } from '../data/Modifier';
import { app, GENERATED_EQUIPMENT } from './state';

export function updateBalance(): void {
  const el = document.getElementById('metaBalance');
  if (el) el.innerHTML = `仙玉 <b style="color:#ffd93d">${app.progression.jade}</b>　·　贡献 <b style="color:#5fd3ff">${app.progression.contribution}</b>`;
}

export function equipName(id: string): string {
  return EQUIPMENT[id]?.name ?? LIMITED_TREASURES[id]?.name ?? GENERATED_EQUIPMENT[id]?.name ?? app.progression.generatedEquipNames[id] ?? '—';
}
export function equipSlot(id: string): EquipSlot | null {
  return EQUIPMENT[id]?.slot ?? LIMITED_TREASURES[id]?.slot ?? GENERATED_EQUIPMENT[id]?.slot ?? null;
}
export function equipDesc(id: string): string {
  const eq = EQUIPMENT[id] ?? GENERATED_EQUIPMENT[id];
  if (eq) return eq.mods.map(modLabel).join('，');
  return '';
}
export function modLabel(m: { stat: string; op: string; value: number }): string {
  const label = STAT_LABELS[m.stat] ?? m.stat;
  return m.op === 'add' ? `${label}+${m.value}` : `${label}+${Math.round(m.value * 100)}%`;
}
