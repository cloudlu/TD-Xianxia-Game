import type { TowerConfig } from '../../types';

// 4 种塔（飞剑/符箓/长枪/聚灵阵），数值取自设计文档 v0.4 §4.2/§4.3
export const TOWERS: Record<string, TowerConfig> = {
  flying_sword: {
    id: 'flying_sword', name: '飞剑修士', icon: '剑', color: '#7fb3ff', school: 'sword',
    cost: 80, sellRatio: 0.6, behavior: 'projectile', targetPolicy: 'first',
    desc: '单体均衡·剑修',
    levels: [
      { realm: '炼气', dmg: 20, rate: 1.0, range: 2.5 },
      { realm: '筑基', dmg: 40, rate: 1.2, range: 2.7, upgradeCost: 60 },
      { realm: '金丹', dmg: 80, rate: 1.5, range: 3.0, upgradeCost: 100, crit: 0.20 },
      { realm: '元婴', dmg: 150, rate: 1.8, range: 3.3, upgradeCost: 170, crit: 0.20, pierce: 1 },
      { realm: '化神', dmg: 260, rate: 2.2, range: 3.6, upgradeCost: 280, crit: 0.25, pierce: 1 },
    ],
  },
  talisman: {
    id: 'talisman', name: '符箓修士', icon: '符', color: '#b388ff', school: 'talisman',
    cost: 70, sellRatio: 0.6, behavior: 'projectile', targetPolicy: 'first', hitsAir: true,
    desc: '远程速射·符修',
    levels: [
      { realm: '炼气', dmg: 18, rate: 1.5, range: 3.5 },
      { realm: '筑基', dmg: 36, rate: 1.7, range: 3.7, upgradeCost: 55 },
      { realm: '金丹', dmg: 72, rate: 2.0, range: 4.0, upgradeCost: 90, crit: 0.15 },
      { realm: '元婴', dmg: 135, rate: 2.3, range: 4.3, upgradeCost: 150, crit: 0.15 },
      { realm: '化神', dmg: 240, rate: 2.6, range: 4.6, upgradeCost: 250, crit: 0.20 },
    ],
  },
  spear: {
    id: 'spear', name: '长枪兵修', icon: '枪', color: '#ffd54f', school: 'spear',
    cost: 75, sellRatio: 0.6, behavior: 'pierce', targetPolicy: 'first',
    desc: '直线穿透·枪修',
    levels: [
      { realm: '炼气', dmg: 22, rate: 1.0, range: 2.5, pierce: 2 },
      { realm: '筑基', dmg: 44, rate: 1.2, range: 2.7, upgradeCost: 56, pierce: 2 },
      { realm: '金丹', dmg: 88, rate: 1.4, range: 3.0, upgradeCost: 95, pierce: 3, crit: 0.15 },
      { realm: '元婴', dmg: 165, rate: 1.6, range: 3.3, upgradeCost: 160, pierce: 3, crit: 0.15 },
      { realm: '化神', dmg: 285, rate: 1.9, range: 3.6, upgradeCost: 265, pierce: 4, crit: 0.20 },
    ],
  },
  aura: {
    id: 'aura', name: '聚灵阵', icon: '阵', color: '#81c784', school: 'aura',
    cost: 90, sellRatio: 0.6, behavior: 'aura', targetPolicy: 'nearest',
    desc: '光环增益·阵法',
    levels: [
      { realm: '炼气', dmg: 0, rate: 0, range: 2.5, auraBuff: { dmgMul: 0.20, rateMul: 0.20 } },
      { realm: '筑基', dmg: 0, rate: 0, range: 2.7, upgradeCost: 70, auraBuff: { dmgMul: 0.25, rateMul: 0.25 } },
      { realm: '金丹', dmg: 0, rate: 0, range: 3.0, upgradeCost: 110, auraBuff: { dmgMul: 0.32, rateMul: 0.32 } },
      { realm: '元婴', dmg: 0, rate: 0, range: 3.3, upgradeCost: 180, auraBuff: { dmgMul: 0.40, rateMul: 0.40 } },
      { realm: '化神', dmg: 0, rate: 0, range: 3.6, upgradeCost: 290, auraBuff: { dmgMul: 0.50, rateMul: 0.50 } },
    ],
  },
  fire_mage: {
    id: 'fire_mage', name: '火法修士', icon: '火', color: '#ff7043', school: 'magic',
    cost: 130, sellRatio: 0.6, behavior: 'aoe', targetPolicy: 'strongest', hitsAir: true,
    desc: '范围溅射·法修',
    levels: [
      { realm: '炼气', dmg: 28, rate: 0.8, range: 2.5, aoeRadius: 1.2 },
      { realm: '筑基', dmg: 54, rate: 0.9, range: 2.7, upgradeCost: 95, aoeRadius: 1.3 },
      { realm: '金丹', dmg: 105, rate: 1.0, range: 3.0, upgradeCost: 120, aoeRadius: 1.4, crit: 0.10 },
      { realm: '元婴', dmg: 195, rate: 1.1, range: 3.3, upgradeCost: 190, aoeRadius: 1.5, crit: 0.10 },
      { realm: '化神', dmg: 340, rate: 1.2, range: 3.6, upgradeCost: 300, aoeRadius: 1.6, crit: 0.15 },
    ],
  },
  thunder_mage: {
    id: 'thunder_mage', name: '雷法修士', icon: '雷', color: '#7986cb', school: 'magic',
    cost: 150, sellRatio: 0.6, behavior: 'chain', targetPolicy: 'first', hitsAir: true,
    desc: '链电跳跃·法修',
    levels: [
      { realm: '炼气', dmg: 30, rate: 0.7, range: 2.8, chainRange: 2.0, chainCount: 3 },
      { realm: '筑基', dmg: 58, rate: 0.8, range: 3.0, upgradeCost: 110, chainRange: 2.1, chainCount: 3 },
      { realm: '金丹', dmg: 112, rate: 0.9, range: 3.2, upgradeCost: 140, chainRange: 2.2, chainCount: 4, crit: 0.10 },
      { realm: '元婴', dmg: 210, rate: 1.0, range: 3.4, upgradeCost: 210, chainRange: 2.3, chainCount: 4, crit: 0.10 },
      { realm: '化神', dmg: 360, rate: 1.1, range: 3.6, upgradeCost: 320, chainRange: 2.4, chainCount: 5, crit: 0.15 },
    ],
  },
};
