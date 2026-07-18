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
  // 飞剑修士
  fs_immortal: { id: 'fs_immortal', target: 'flying_sword', name: '仙人临凡', icon: '神', color: '#ffd700', effect: 'gold', price: 120 },
  fs_blood:    { id: 'fs_blood', target: 'flying_sword', name: '血魔剑影', icon: '魔', color: '#c62828', effect: 'red', price: 80 },
  // 符箓修士
  tal_thunder: { id: 'tal_thunder', target: 'talisman', name: '雷劫符师', icon: '霆', color: '#29b6f6', effect: 'blue', price: 100 },
  tal_runes:   { id: 'tal_runes', target: 'talisman', name: '符文大师', icon: '符', color: '#ce93d8', effect: 'blue', price: 80 },
  // 长枪兵修
  sp_war:      { id: 'sp_war', target: 'spear', name: '破阵战神', icon: '戟', color: '#ff8a65', effect: 'red', price: 100 },
  sp_dragon:   { id: 'sp_dragon', target: 'spear', name: '苍龙破阵', icon: '龙', color: '#66bb6a', effect: 'green', price: 80 },
  // 聚灵阵
  aura_spirit: { id: 'aura_spirit', target: 'aura', name: '灵脉显化', icon: '灵', color: '#26a69a', effect: 'green', price: 90 },
  aura_mountain:{id: 'aura_mountain', target: 'aura', name: '地脉流转', icon: '山', color: '#a1887f', effect: 'gold', price: 100 },
  // 火法修士
  fire_phoenix:{ id: 'fire_phoenix', target: 'fire_mage', name: '凤凰涅槃', icon: '凤', color: '#ff6d00', effect: 'gold', price: 120 },
  fire_blaze:  { id: 'fire_blaze', target: 'fire_mage', name: '烈焰焚天', icon: '焰', color: '#e53935', effect: 'red', price: 80 },
  // 雷法修士
  thunder_god: { id: 'thunder_god', target: 'thunder_mage', name: '雷神降世', icon: '霄', color: '#6c5ce7', effect: 'blue', price: 110 },
  thunder_storm:{id: 'thunder_storm', target: 'thunder_mage', name: '万雷齐鸣', icon: '雷', color: '#5c6bc0', effect: 'blue', price: 80 },
  // 寒冰修士
  ice_fairy:   { id: 'ice_fairy', target: 'ice_mage', name: '冰霜仙子', icon: '仙', color: '#81d4fa', effect: 'blue', price: 100 },
  ice_abyss:   { id: 'ice_abyss', target: 'ice_mage', name: '玄冰深渊', icon: '冰', color: '#4dd0e1', effect: 'blue', price: 80 },
};

export const SKIN_IDS = Object.keys(SKINS);

/** 光晕配色（Board 渲染用） */
export const EFFECT_COLOR: Record<SkinEffect, string> = {
  gold: '#ffd700',
  red: '#ff5252',
  green: '#66bb6a',
  blue: '#29b6f6',
};
