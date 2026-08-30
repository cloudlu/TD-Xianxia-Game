import type { EnemyConfig } from '../../types';

// 敌人，数值取自设计文档 §5.2
export const ENEMIES: Record<string, EnemyConfig> = {
  wolf: { id: 'wolf', name: '妖狼', icon: '妖狼', hp: 60, speed: 1.2, armor: 0, bounty: 6, color: '#e57373',
    lore: '山门脚下最常见的野兽。每逢月圆，妖气自荒林涌出，狼群便成群结队扑向山门。传闻它们本是山神的看门犬，因道祖陨落失了约束，才堕落为妖。' },
  boar: { id: 'boar', name: '山猪妖', icon: '山猪', hp: 180, speed: 0.7, armor: 8, bounty: 18, color: '#a1887f',
    lore: '以灵气为食的野猪，常年在灵田里拱食，皮糙肉厚。传说它曾拱开过一处上古墓穴，肚里藏着半卷失传的炼体功法——可惜无人敢去取。' },
  // 小头目（isBoss=false，有赏金，不给通关贡献）—— 设计文档 §5.1/关卡剧情 ch1-3
  boar_king: { id: 'boar_king', name: '山猪王', icon: '猪王', hp: 800, speed: 0.6, armor: 10, bounty: 80, color: '#8d6e63', elite: true,
    lore: '猪群之王，体型如小山。它浑身披着铜铁般的鬃毛，寻常飞剑砍上去直冒火星。相传它曾与一位金丹真人搏斗三天三夜，最后是那位真人先饿败退。' },

  // —— 第二章 ——
  // 蝙蝠群：飞行，仅对空塔（符箓/法术）可命中
  bat: { id: 'bat', name: '蝙蝠', icon: '蝙蝠', hp: 30, speed: 1.8, armor: 0, bounty: 3, color: '#9575cd', fly: true,
    lore: '栖居在藏经阁屋顶的夜行妖物。它们以修士打盹时逸散的灵气为食，群起而攻时遮天蔽日。老修士说，蝙蝠眼盲心却明，专挑灵气最浓的地方去。' },
  // 蛮牛巨兽：撞塔，经过塔时短暂瘫痪（带 6s 免疫护栏）
  bull: { id: 'bull', name: '蛮牛', icon: '蛮牛', hp: 600, speed: 0.6, armor: 15, bounty: 55, color: '#6d4c41', knockback: true,
    lore: '被魔气侵蚀的荒原蛮牛，性子暴烈，见塔就撞。它的双角号称能撞开山门阵基。有经验的守山人从不把塔布在它必经的直道上。' },

  // —— 第三章 · 魔修乱世 ——
  // 魔修喽啰：护体魔气（护盾层，先破盾再掉血）
  magic_minion: { id: 'magic_minion', name: '魔修喽啰', icon: '魔修', hp: 250, speed: 0.9, armor: 0, bounty: 25, color: '#7e57c2', shield: 50,
    lore: '血煞魔尊麾下最底层的魔修，修行歪门邪道以快制胜。他们人人身披一层护体魔气，寻常术法打在上面先被化去一半。' },
  // 血修：受击回血，需爆发伤害（长枪/重击）而非高频小伤
  blood_cultist: { id: 'blood_cultist', name: '血修', icon: '血修', hp: 220, speed: 0.9, armor: 5, bounty: 22, color: '#c62828', lifestealHp: 8,
    lore: '以人血祭炼己身的邪修，伤口愈合极快。他们信奉「血即真元」，越是受伤越要吸血。对付他们只能用雷霆一击，拖久了只会被生生耗死。' },
  // 魔甲傀儡：极高护甲，物理刮痧（需靠暴击/数量/法术堆叠）
  magic_puppet: { id: 'magic_puppet', name: '魔甲傀儡', icon: '傀儡', hp: 400, speed: 0.6, armor: 40, bounty: 50, color: '#757575',
    lore: '由魔修驱使的机关傀儡，外壳以千年玄铁铸就，刀枪不入。它们没有痛觉，只会机械地向前推进。据说魔修统领的傀儡师，就藏在队伍最深处。' },
  // 魔修统领（章末小头目）：厚盾 + 中甲，精英渲染
  mage_lord: { id: 'mage_lord', name: '魔修统领', icon: '统领', hp: 1500, speed: 0.6, armor: 15, bounty: 150, color: '#5e35b1', shield: 100, elite: true,
    lore: '魔修中的一方统领，曾是一派掌门的弃徒。他叛出师门时偷走了镇派魔典，如今以魔气护体，麾下喽啰成群。据说他心中唯一忌惮的，是那位姓林的女子。' },

  // —— 第四章 · 秘境凶兽 ——
  // 隐身狐妖：仅在聚灵阵（光环）范围内可被锁定
  shadow_fox: { id: 'shadow_fox', name: '隐身狐妖', icon: '隐狐', hp: 150, speed: 1.1, armor: 0, bounty: 15, color: '#9ccc65', stealth: true,
    lore: '九尾天狐的远房子嗣，天生精通隐匿之术。它们融入草木光影之间，只有聚灵阵的灵光才能照破其身形。狐族自古记仇，若伤其同类，必遭报复。' },
  // 分身妖：死亡分裂 2 个子体（子体赏金 0，防刷钱）
  splitter: { id: 'splitter', name: '分身妖', icon: '分身', hp: 120, speed: 1.0, armor: 0, bounty: 12, color: '#ff8a65', split: { child: 'splitter_child', count: 2 },
    lore: '一具没有实体的妖物，被击中时会分裂成两个更小的自己。相传它是上古修士试验「身外化身」失败的残渣，散落秘境后自成妖种。' },
  splitter_child: { id: 'splitter_child', name: '分身子体', icon: '子体', hp: 50, speed: 1.2, armor: 0, bounty: 0, color: '#ffab91',
    lore: '分身妖分裂后的小个子体，体弱却更迅捷。它们没有独立神智，只会本能地向前爬行，直至消散成灵气。' },
  // 狐妖小兵（被九尾天狐召唤）
  fox_minion: { id: 'fox_minion', name: '狐妖', icon: '狐妖', hp: 80, speed: 1.2, armor: 0, bounty: 5, color: '#ce93d8',
    lore: '九尾天狐以灵力点化的狐子狐孙，毛色或青或紫。它们对天狐言听计从，是天狐最忠诚的护身符。' },
  // 九尾天狐（章末 BOSS）：周期魅惑（范围内塔瘫痪）+ 召唤狐妖，精英渲染，§5.4 护栏
  nine_tails: {
    id: 'nine_tails', name: '九尾天狐', icon: '天狐', hp: 3000, speed: 0.7, armor: 20, bounty: 0, color: '#e040fb', elite: true,
    bossAbility: { interval: 11, charmRadius: 3, charmDuration: 2, summon: { enemy: 'fox_minion', count: 2 } },
    lore: '秘境之主，修行千年生就九尾。它通人言、懂人心，一颦一笑间便可魅惑方圆之内的修士。传闻它曾问过一名守山人：「若我化为人形，你可愿娶我？」——那人至今没有回答。',
  },

  // —— 第五章 · 血煞魔尊 ——
  // 魔尊血煞（终极 BOSS，多阶段）：一阶段厚盾 → 二阶段狂暴（血<40% 加速 + 多召唤血修），精英渲染
  blood_lord: {
    id: 'blood_lord', name: '魔尊血煞', icon: '血尊', hp: 8000, speed: 0.6, armor: 40, bounty: 0, color: '#b71c1c', elite: true, shield: 300,
    bossAbility: {
      interval: 9, charmRadius: 3.5, charmDuration: 2.5,
      summon: { enemy: 'blood_cultist', count: 2 },
      enrageBelow: { hpPct: 0.4, speedMul: 1.6, summonCount: 4 },
    },
    lore: '魔道百年来最凶戾的尊主，曾以一己之力屠尽中原三派。他以血为道，以杀证果。世人皆道他无情，却无人知晓——他成魔那夜，正是被挚爱之人亲手背叛。',
  },

  // —— 第六章 · 域外篇 ——
  sand_scorpion: { id: 'sand_scorpion', name: '沙蝎', icon: '沙蝎', hp: 280, speed: 0.9, armor: 20, bounty: 28, color: '#d4a017',
    lore: '域外荒漠的剧毒之物，甲壳如砂金般坚硬。它们蛰伏沙下，专猎过路的修士。裂隙主宰将整支沙蝎群收编，作为攻山的第一波先锋。' },
  barbarian: { id: 'barbarian', name: '域外蛮修', icon: '蛮修', hp: 450, speed: 0.6, armor: 0, bounty: 45, color: '#8b4513', shield: 80,
    lore: '来自裂缝彼端的蛮荒修士，以兽骨为甲、以战血为盾。他们不信天道，只信拳头。在他们看来，这片丰饶的大陆，本就该归强者所有。' },
  // 穿山甲：遁地 3s → 上浮 2s 循环，需震地雷反隐 & 打击
  pangolin: { id: 'pangolin', name: '穿山甲', icon: '穿山', hp: 350, speed: 1.0, armor: 20, bounty: 35, color: '#a1887f', burrow: { interval: 3, surfDuration: 2 },
    lore: '擅长遁地的域外异兽，能穿行于山石之间。它上浮换气的那一刻，是唯一的破绽。震地雷恰好能震出它藏身的位置。' },
  mist_wraith: { id: 'mist_wraith', name: '雾妖', icon: '雾妖', hp: 350, speed: 1.0, armor: 25, bounty: 35, color: '#b0bec5',
    lore: '裂隙泄露的雾气凝成的妖灵，没有实体，寻常攻击只能让它愈发浓密。它随风飘荡，似在低语着裂缝彼岸的秘密。' },
  rift_lord: {
    id: 'rift_lord', name: '裂隙领主', icon: '领主', hp: 6000, speed: 0.6, armor: 15, bounty: 0, color: '#ff6f00', elite: true, shield: 200,
    bossAbility: { interval: 10, summon: { enemy: 'sand_scorpion', count: 3 } },
    split: { child: 'mist_wraith', count: 2 },
    lore: '裂隙中孕育的高阶妖王，身周缠绕着不散的黑色裂缝。它一挥手便能撕开空间召唤沙蝎，被击杀时自身也会裂成两团雾妖——仿佛永远杀不尽。',
  },
  // 裂隙主宰（ch10 章末 BOSS）：裂隙源头的真正主人，周期召唤沙蝎群 + 狂暴加速
  rift_sovereign: {
    id: 'rift_sovereign', name: '裂隙主宰', icon: '主宰', hp: 10000, speed: 0.5, armor: 20, bounty: 0, color: '#e65100', elite: true, shield: 300,
    bossAbility: {
      interval: 8, charmRadius: 3, charmDuration: 2,
      summon: { enemy: 'sand_scorpion', count: 4 },
      enrageBelow: { hpPct: 0.35, speedMul: 1.8, summonCount: 6 },
    },
    lore: '裂隙源头的真正主人，其存在本身便维系着那道裂缝。它不是妖、不是魔，而是天穹「裂开」这一事实的具象化。打碎它，只会让更大的存在从裂口探出头来。',
  },

  // —— 第十一章~十五章 · 大陆联盟篇 ——
  // 魔甲骑兵：极高甲 + 快速冲锋，物理刮痧
  demon_knight: { id: 'demon_knight', name: '魔甲骑兵', icon: '骑兵', hp: 700, speed: 1.2, armor: 50, bounty: 70, color: '#5d4037',
    lore: '魔界精英骑兵，连人带马披着三层魔甲。它们冲锋时大地震颤，寻常箭矢石塔如隔靴搔痒。唯有法术与暴击，方能撕开那层铁壳。' },
  // 影杀者：隐身 + 30% 闪避，需聚灵阵破隐 + 高频攻击压闪避
  shadow_assassin: { id: 'shadow_assassin', name: '影杀者', icon: '影杀', hp: 300, speed: 1.4, armor: 0, bounty: 30, color: '#37474f', stealth: true, dodge: 0.30,
    lore: '魔帅豢养的暗杀者，生于阴影、死于阴影。它们的刀快得几乎看不清，身影在月光下毫无倒影。传说没有人见过影杀者的真容——见到的都死了。' },
  // 遁地刺客：隐身 + 遁地 4s → 上浮 1.5s，极难锁定
  burrow_assassin: { id: 'burrow_assassin', name: '遁地刺客', icon: '遁刺', hp: 250, speed: 1.5, armor: 0, bounty: 35, color: '#263238', stealth: true, dodge: 0.25, burrow: { interval: 4, surfDuration: 1.5 },
    lore: '比影杀者更难缠的遁地刺客，只在地面短暂现身的间隙出手。它们专挑阵眼薄弱处突进，是聚灵阵的死敌。' },
  // 魔蛟：高血中甲，坚韧的中坚单位（原设计毒雾简化为纯数值）
  demon_serpent: { id: 'demon_serpent', name: '魔蛟', icon: '魔蛟', hp: 550, speed: 0.8, armor: 15, bounty: 55, color: '#1b5e20',
    lore: '魔界黑水中的巨蛟，鳞甲如墨玉，能吞江吐雾。传说它们本是龙族的弃子，被魔帅收留后，成了魔界大军最皮糙肉厚的中坚。' },
  // 魔帅（ch15 章末 BOSS）：召唤魔甲骑兵 + 狂暴 + 魅惑
  demon_general: {
    id: 'demon_general', name: '魔帅', icon: '魔帅', hp: 12000, speed: 0.5, armor: 20, bounty: 0, color: '#b71c1c', elite: true, shield: 300,
    bossAbility: {
      interval: 8, charmRadius: 3.5, charmDuration: 2.5,
      summon: { enemy: 'demon_knight', count: 2 },
      enrageBelow: { hpPct: 0.3, speedMul: 1.5, summonCount: 4 },
    },
    lore: '魔界三军统帅，名号修罗。他不是嗜杀的疯子，而是精于算计的枭雄——他曾对人说：「我攻的不是山，是人心。」直到那对并肩的身影，让他的算计第一次落空。',
  },

  // —— 第十六章~二十章 · 百族大战篇 ——
  // 龙裔幼龙：飞行 + 极高甲，需对空法术
  dragon_young: { id: 'dragon_young', name: '龙裔幼龙', icon: '幼龙', hp: 500, speed: 0.9, armor: 45, bounty: 50, color: '#1565c0', fly: true,
    lore: '龙族遗留在人间的幼龙，鳞甲已初具真龙气象。它们生性高傲，不屑落地，只在高空俯冲。百族大战中，连龙族长老也压不住它们的战意。' },
  // 地龙：遁地 boss，遁地 5s → 上浮 3s，精英渲染
  earth_dragon: { id: 'earth_dragon', name: '地龙', icon: '地龙', hp: 5000, speed: 0.5, armor: 30, bounty: 0, color: '#4e342e', elite: true, shield: 150, burrow: { interval: 5, surfDuration: 3 },
    lore: '沉眠于大地深处的古龙，翻身便山崩地裂。它常年遁地而行，只有进食时才会短暂浮出地面。地龙的苏醒，往往预示着大战的来临。' },
  // 鬼修：高闪避50%（近似物理免疫），需高频攻击压制
  ghost_cultivator: { id: 'ghost_cultivator', name: '鬼修', icon: '鬼修', hp: 350, speed: 1.1, armor: 0, bounty: 35, color: '#6a1b9a', dodge: 0.50,
    lore: '以魂炼道的异修，肉身早已化作半透明的虚影。刀剑穿身而过，术法十击九空。对付它们，唯有密如雨点般的攻击，才能让虚影无处可遁。' },
  // 天妖蛊王（ch20 章末 BOSS）：吸血 + 召唤血修 + 狂暴
  parasite_king: {
    id: 'parasite_king', name: '天妖蛊王', icon: '蛊王', hp: 9000, speed: 0.5, armor: 15, bounty: 0, color: '#33691e', elite: true, shield: 200,
    bossAbility: {
      interval: 9, charmRadius: 3, charmDuration: 2,
      summon: { enemy: 'blood_cultist', count: 3 },
      enrageBelow: { hpPct: 0.3, speedMul: 1.6, summonCount: 5 },
    },
    lore: '天妖一族的至尊，万蛊之母。它以宿主的精血为食，身周永远环绕着蠕动的蛊虫。百族大战那场大疫，据说正是它的一枚虫卵所为。',
  },

  // —— 第二十一章~二十五章 · 界域之战篇 ——
  // 虚空行者：高速 + 高闪避，近似"瞬移"（简化，不实现真正的传送机制）
  void_walker: { id: 'void_walker', name: '虚空行者', icon: '虚空', hp: 400, speed: 1.6, armor: 0, bounty: 40, color: '#455a64', dodge: 0.40,
    lore: '行走于虚空夹缝的异界生灵，身影时隐时现。它们的速度快到几乎脱离常理，只有最密集的火力网才能让它现出真身。' },
  // 天魔使者：厚盾中甲，坚韧的推进单位（原设计"混乱"简化为纯数值）
  celestial_demon: { id: 'celestial_demon', name: '天魔使者', icon: '天魔', hp: 600, speed: 0.7, armor: 10, bounty: 60, color: '#4a148c', shield: 150,
    lore: '天道化身座下的传令之魔，一身黑袍，身覆厚重的法相盾。它们不以杀戮为职，只负责在战场上游走——但谁挡它的路，谁就得死。' },
  // 混沌幼虫：死亡大量分裂弱子体（近似指数增长，子体不再分裂防爆炸）
  chaos_larva: { id: 'chaos_larva', name: '混沌幼虫', icon: '幼虫', hp: 200, speed: 1.3, armor: 0, bounty: 20, color: '#bf360c', split: { child: 'splitter_child', count: 3 },
    lore: '混沌古兽产下的幼虫，嗜血成性。被击杀时会爆开成更多幼虫——若不及早清理，混沌的瘟疫将指数般蔓延。' },
  // 天劫化身（ch25 章末 BOSS）：超大范围魅惑（近似全屏）+ 召唤混沌幼虫 + 狂暴
  tribulation_avatar: {
    id: 'tribulation_avatar', name: '天劫化身', icon: '天劫', hp: 25000, speed: 0.4, armor: 30, bounty: 0, color: '#1a237e', elite: true, shield: 400,
    bossAbility: {
      interval: 7, charmRadius: 5, charmDuration: 3,
      summon: { enemy: 'chaos_larva', count: 4 },
      enrageBelow: { hpPct: 0.3, speedMul: 1.5, summonCount: 8 },
    },
    lore: '天道降下的劫罚之影，执掌天雷与法则。它既不是生灵也不是器物，而是「天意」借以惩罚逆命之人的刀。渡劫者面对它，其实是在与整片天对话。',
  },

  // —— 第二十六章~三十章 · 飞升篇 ——
  // 混沌古兽：全机制混合（高甲+盾+分裂），终极杂兵
  chaos_beast: { id: 'chaos_beast', name: '混沌古兽', icon: '古兽', hp: 1000, speed: 0.7, armor: 40, bounty: 100, color: '#3e2723', shield: 100, split: { child: 'chaos_larva', count: 2 },
    lore: '混沌初开时的古兽遗种，身躯由最原始的混沌之气凝成。它既是盾也是源，高甲护体，死后还会孕育出混沌幼虫。' },
  // 天道执法者：高闪避+高甲，终极坦克（原设计反伤简化为纯数值）
  law_enforcer: { id: 'law_enforcer', name: '天道执法者', icon: '执法', hp: 800, speed: 0.8, armor: 30, bounty: 80, color: '#0d47a1', dodge: 0.40,
    lore: '天道意志的化身执法者，身披法则织就的光甲。它们不怒不悲，只是执行——任何违背「天规」者，皆是它们的猎物。' },
  // 虚空吞噬者：撞塔 + 高血，推进型毁灭者
  void_devourer: { id: 'void_devourer', name: '虚空吞噬者', icon: '吞噬', hp: 1500, speed: 0.6, armor: 20, bounty: 150, color: '#000000', knockback: true,
    lore: '虚空深处的吞噬之兽，连光芒都能吞入腹中。它不认敌友，只循着灵气最浓的方向横冲直撞——遇上它，再坚固的塔也会被撞塌。' },
  // 道祖魔影（终极 BOSS）：50000 血 / 三阶段（盾→狂暴→多召唤）+ 超大范围魅惑
  dao_ancestor: {
    id: 'dao_ancestor', name: '道祖魔影', icon: '魔影', hp: 50000, speed: 0.3, armor: 40, bounty: 0, color: '#000000', elite: true, shield: 500,
    bossAbility: {
      interval: 6, charmRadius: 5, charmDuration: 3,
      summon: { enemy: 'chaos_beast', count: 2 },
      enrageBelow: { hpPct: 0.3, speedMul: 2.0, summonCount: 4 },
    },
    lore: '最后也是最初的敌人——上一任飞升者留下的影子，天道最初的模样。它不是魔，而是「天」本身。打碎它，便是打碎这片天加于你身上的宿命。',
  },
};
