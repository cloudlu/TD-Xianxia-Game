// 皮肤（设计文档 §9.3）：简约风，纯外观（字 + 颜色 + 可选光晕），无属性、仙玉购买。
// 每个皮肤绑定一个塔（target），装备后 Board 用其 icon/color/effect 覆盖默认外观。

export type SkinEffect = 'gold' | 'red' | 'green' | 'blue';

export interface SkinConfig {
  id: string;
  target: string;        // 作用于哪个塔 id
  name: string;
  icon: string;          // 覆盖图标字
  color: string;         // 覆盖颜色
  effect?: SkinEffect;   // 可选光晕
  price: number;         // 仙玉
}

export const SKINS: Record<string, SkinConfig> = {
  fs_immortal: { id: 'fs_immortal', target: 'flying_sword', name: '仙人临凡', icon: '神', color: '#ffd700', effect: 'gold', price: 120 },
  fs_blood:    { id: 'fs_blood', target: 'flying_sword', name: '血魔剑影', icon: '魔', color: '#c62828', effect: 'red', price: 80 },
  tal_thunder: { id: 'tal_thunder', target: 'talisman', name: '雷劫符师', icon: '雷', color: '#29b6f6', effect: 'blue', price: 100 },
  sp_war:      { id: 'sp_war', target: 'spear', name: '破阵战神', icon: '戟', color: '#ff8a65', effect: 'red', price: 100 },
  aura_spirit: { id: 'aura_spirit', target: 'aura', name: '灵脉显化', icon: '灵', color: '#66bb6a', effect: 'green', price: 90 },
  fs_ghost:    { id: 'fs_ghost', target: 'flying_sword', name: '幽冥剑修', icon: '冥', color: '#9ccc65', price: 60 },
};

export const SKIN_IDS = Object.keys(SKINS);

/** 光晕配色（Board 渲染用） */
export const EFFECT_COLOR: Record<SkinEffect, string> = {
  gold: '#ffd700',
  red: '#ff5252',
  green: '#66bb6a',
  blue: '#29b6f6',
};
