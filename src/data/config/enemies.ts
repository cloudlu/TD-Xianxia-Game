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
  // 裂隙主宰（ch10 章末 BOSS）：裂隙源头的真正主人，周期召唤沙蝎群 + 狂暴加速
  rift_sovereign: {
    id: 'rift_sovereign', name: '裂隙主宰', icon: '主', hp: 10000, speed: 0.5, armor: 20, bounty: 0, color: '#e65100', elite: true, shield: 300,
    bossAbility: {
      interval: 8, charmRadius: 3, charmDuration: 2,
      summon: { enemy: 'sand_scorpion', count: 4 },
      enrageBelow: { hpPct: 0.35, speedMul: 1.8, summonCount: 6 },
    },
  },

  // —— 第十一章~十五章 · 大陆联盟篇 ——
  // 魔甲骑兵：极高甲 + 快速冲锋，物理刮痧
  demon_knight: { id: 'demon_knight', name: '魔甲骑兵', icon: '骑', hp: 700, speed: 1.2, armor: 50, bounty: 70, color: '#5d4037' },
  // 影杀者：隐身 + 30% 闪避，需聚灵阵破隐 + 高频攻击压闪避
  shadow_assassin: { id: 'shadow_assassin', name: '影杀者', icon: '影', hp: 300, speed: 1.4, armor: 0, bounty: 30, color: '#37474f', stealth: true, dodge: 0.30 },
  // 魔蛟：高血中甲，坚韧的中坚单位（原设计毒雾简化为纯数值）
  demon_serpent: { id: 'demon_serpent', name: '魔蛟', icon: '蛟', hp: 550, speed: 0.8, armor: 15, bounty: 55, color: '#1b5e20' },
  // 魔帅（ch15 章末 BOSS）：召唤魔甲骑兵 + 狂暴 + 魅惑
  demon_general: {
    id: 'demon_general', name: '魔帅', icon: '帅', hp: 12000, speed: 0.5, armor: 20, bounty: 0, color: '#b71c1c', elite: true, shield: 300,
    bossAbility: {
      interval: 8, charmRadius: 3.5, charmDuration: 2.5,
      summon: { enemy: 'demon_knight', count: 2 },
      enrageBelow: { hpPct: 0.3, speedMul: 1.5, summonCount: 4 },
    },
  },

  // —— 第十六章~二十章 · 百族大战篇 ——
  // 龙裔幼龙：飞行 + 极高甲，需对空法术
  dragon_young: { id: 'dragon_young', name: '龙裔幼龙', icon: '龙', hp: 500, speed: 0.9, armor: 45, bounty: 50, color: '#1565c0', fly: true },
  // 鬼修：高闪避50%（近似物理免疫），需高频攻击压制
  ghost_cultivator: { id: 'ghost_cultivator', name: '鬼修', icon: '鬼', hp: 350, speed: 1.1, armor: 0, bounty: 35, color: '#6a1b9a', dodge: 0.50 },
  // 天妖蛊王（ch20 章末 BOSS）：吸血 + 召唤血修 + 狂暴
  parasite_king: {
    id: 'parasite_king', name: '天妖蛊王', icon: '蛊', hp: 9000, speed: 0.5, armor: 15, bounty: 0, color: '#33691e', elite: true, shield: 200,
    bossAbility: {
      interval: 9, charmRadius: 3, charmDuration: 2,
      summon: { enemy: 'blood_cultist', count: 3 },
      enrageBelow: { hpPct: 0.3, speedMul: 1.6, summonCount: 5 },
    },
  },

  // —— 第二十一章~二十五章 · 界域之战篇 ——
  // 虚空行者：高速 + 高闪避，近似"瞬移"（简化，不实现真正的传送机制）
  void_walker: { id: 'void_walker', name: '虚空行者', icon: '虚', hp: 400, speed: 1.6, armor: 0, bounty: 40, color: '#455a64', dodge: 0.40 },
  // 天魔使者：厚盾中甲，坚韧的推进单位（原设计"混乱"简化为纯数值）
  celestial_demon: { id: 'celestial_demon', name: '天魔使者', icon: '魔', hp: 600, speed: 0.7, armor: 10, bounty: 60, color: '#4a148c', shield: 150 },
  // 混沌幼虫：死亡大量分裂弱子体（近似指数增长，子体不再分裂防爆炸）
  chaos_larva: { id: 'chaos_larva', name: '混沌幼虫', icon: '虫', hp: 200, speed: 1.3, armor: 0, bounty: 20, color: '#bf360c', split: { child: 'splitter_child', count: 3 } },
  // 天劫化身（ch25 章末 BOSS）：超大范围魅惑（近似全屏）+ 召唤混沌幼虫 + 狂暴
  tribulation_avatar: {
    id: 'tribulation_avatar', name: '天劫化身', icon: '劫', hp: 25000, speed: 0.4, armor: 30, bounty: 0, color: '#1a237e', elite: true, shield: 400,
    bossAbility: {
      interval: 7, charmRadius: 5, charmDuration: 3,
      summon: { enemy: 'chaos_larva', count: 4 },
      enrageBelow: { hpPct: 0.3, speedMul: 1.5, summonCount: 8 },
    },
  },

  // —— 第二十六章~三十章 · 飞升篇 ——
  // 混沌古兽：全机制混合（高甲+盾+分裂），终极杂兵
  chaos_beast: { id: 'chaos_beast', name: '混沌古兽', icon: '兽', hp: 1000, speed: 0.7, armor: 40, bounty: 100, color: '#3e2723', shield: 100, split: { child: 'chaos_larva', count: 2 } },
  // 天道执法者：高闪避+高甲，终极坦克（原设计反伤简化为纯数值）
  law_enforcer: { id: 'law_enforcer', name: '天道执法者', icon: '法', hp: 800, speed: 0.8, armor: 30, bounty: 80, color: '#0d47a1', dodge: 0.40 },
  // 虚空吞噬者：撞塔 + 高血，推进型毁灭者
  void_devourer: { id: 'void_devourer', name: '虚空吞噬者', icon: '吞', hp: 1500, speed: 0.6, armor: 20, bounty: 150, color: '#000000', knockback: true },
  // 道祖魔影（终极 BOSS）：50000 血 / 三阶段（盾→狂暴→多召唤）+ 超大范围魅惑
  dao_ancestor: {
    id: 'dao_ancestor', name: '道祖魔影', icon: '祖', hp: 50000, speed: 0.3, armor: 40, bounty: 0, color: '#000000', elite: true, shield: 500,
    bossAbility: {
      interval: 6, charmRadius: 5, charmDuration: 3,
      summon: { enemy: 'chaos_beast', count: 2 },
      enrageBelow: { hpPct: 0.3, speedMul: 2.0, summonCount: 4 },
    },
  },
};
