import type { EnemyConfig } from '../../types';

// 敌人，数值取自设计文档 §5.2
export const ENEMIES: Record<string, EnemyConfig> = {
  wolf: { id: 'wolf', name: '妖狼', icon: '狼', hp: 60, speed: 1.2, armor: 0, bounty: 6, color: '#e57373' },
  boar: { id: 'boar', name: '山猪妖', icon: '猪', hp: 180, speed: 0.7, armor: 8, bounty: 18, color: '#a1887f' },
  // 小头目（isBoss=false，有赏金，不给通关贡献）—— 设计文档 §5.1/关卡剧情 ch1-3
  boar_king: { id: 'boar_king', name: '山猪王', icon: '王', hp: 800, speed: 0.6, armor: 10, bounty: 80, color: '#8d6e63', elite: true },

  // —— 第二章 ——
  // 蝙蝠群：飞行，仅对空塔（符箓/法术）可命中
  bat: { id: 'bat', name: '蝙蝠', icon: '蝠', hp: 30, speed: 1.8, armor: 0, bounty: 3, color: '#9575cd', fly: true },
  // 蛮牛巨兽：撞塔，经过塔时短暂瘫痪（带 6s 免疫护栏）
  bull: { id: 'bull', name: '蛮牛', icon: '牛', hp: 600, speed: 0.6, armor: 15, bounty: 55, color: '#6d4c41', knockback: true },

  // —— 第三章 · 魔修乱世 ——
  // 魔修喽啰：护体魔气（护盾层，先破盾再掉血）
  magic_minion: { id: 'magic_minion', name: '魔修喽啰', icon: '魔', hp: 250, speed: 0.9, armor: 0, bounty: 25, color: '#7e57c2', shield: 50 },
  // 血修：受击回血，需爆发伤害（长枪/重击）而非高频小伤
  blood_cultist: { id: 'blood_cultist', name: '血修', icon: '血', hp: 220, speed: 0.9, armor: 5, bounty: 22, color: '#c62828', lifestealHp: 8 },
  // 魔甲傀儡：极高护甲，物理刮痧（需靠暴击/数量/法术堆叠）
  magic_puppet: { id: 'magic_puppet', name: '魔甲傀儡', icon: '甲', hp: 400, speed: 0.6, armor: 40, bounty: 50, color: '#757575' },
  // 魔修统领（章末小头目）：厚盾 + 中甲，精英渲染
  mage_lord: { id: 'mage_lord', name: '魔修统领', icon: '帅', hp: 1500, speed: 0.6, armor: 15, bounty: 150, color: '#5e35b1', shield: 100, elite: true },

  // —— 第四章 · 秘境凶兽 ——
  // 隐身狐妖：仅在聚灵阵（光环）范围内可被锁定
  shadow_fox: { id: 'shadow_fox', name: '隐身狐妖', icon: '狐', hp: 150, speed: 1.1, armor: 0, bounty: 15, color: '#9ccc65', stealth: true },
  // 分身妖：死亡分裂 2 个子体（子体赏金 0，防刷钱）
  splitter: { id: 'splitter', name: '分身妖', icon: '分', hp: 120, speed: 1.0, armor: 0, bounty: 12, color: '#ff8a65', split: { child: 'splitter_child', count: 2 } },
  splitter_child: { id: 'splitter_child', name: '分身子体', icon: '小', hp: 50, speed: 1.2, armor: 0, bounty: 0, color: '#ffab91' },
  // 狐妖小兵（被九尾天狐召唤）
  fox_minion: { id: 'fox_minion', name: '狐妖', icon: '妖', hp: 80, speed: 1.2, armor: 0, bounty: 5, color: '#ce93d8' },
  // 九尾天狐（章末 BOSS）：周期魅惑（范围内塔瘫痪）+ 召唤狐妖，精英渲染，§5.4 护栏
  nine_tails: {
    id: 'nine_tails', name: '九尾天狐', icon: '天', hp: 3000, speed: 0.7, armor: 20, bounty: 0, color: '#e040fb', elite: true,
    bossAbility: { interval: 11, charmRadius: 3, charmDuration: 2, summon: { enemy: 'fox_minion', count: 2 } },
  },

  // —— 第五章 · 血煞魔尊 ——
  // 魔尊血煞（终极 BOSS，多阶段）：一阶段厚盾 → 二阶段狂暴（血<40% 加速 + 多召唤血修），精英渲染
  blood_lord: {
    id: 'blood_lord', name: '魔尊血煞', icon: '尊', hp: 8000, speed: 0.6, armor: 40, bounty: 0, color: '#b71c1c', elite: true, shield: 300,
    bossAbility: {
      interval: 9, charmRadius: 3.5, charmDuration: 2.5,
      summon: { enemy: 'blood_cultist', count: 2 },
      enrageBelow: { hpPct: 0.4, speedMul: 1.6, summonCount: 4 },
    },
  },

  // —— 第六章 · 域外篇 ——
  sand_scorpion: { id: 'sand_scorpion', name: '沙蝎', icon: '蝎', hp: 280, speed: 0.9, armor: 20, bounty: 28, color: '#d4a017' },
  barbarian: { id: 'barbarian', name: '域外蛮修', icon: '蛮', hp: 450, speed: 0.6, armor: 0, bounty: 45, color: '#8b4513', shield: 80 },
  mist_wraith: { id: 'mist_wraith', name: '雾妖', icon: '雾', hp: 350, speed: 1.0, armor: 25, bounty: 35, color: '#b0bec5' },
  rift_lord: {
    id: 'rift_lord', name: '裂隙领主', icon: '裂', hp: 6000, speed: 0.6, armor: 15, bounty: 0, color: '#ff6f00', elite: true, shield: 200,
    bossAbility: { interval: 10, summon: { enemy: 'sand_scorpion', count: 3 } },
    split: { child: 'mist_wraith', count: 2 },
  },
};
