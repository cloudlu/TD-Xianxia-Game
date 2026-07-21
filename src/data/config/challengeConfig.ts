import type { ChallengeDef } from '../../types';

/**
 * 每关可选挑战映射表
 * 挑战种类：
 *   speed       — 限时通关（params: { limit: 秒数 }）
 *   mono_school — 单流派（params: { allowed: 流派名 }）
 *   no_upgrade  — 禁止升级塔
 *   no_aura     — 禁止放置光环塔（聚灵阵）
 *   budget      — 总消费上限（params: { limit: 灵石 }，含建造+升级）
 */
const CHALLENGES: Record<string, ChallengeDef[]> = {
  // ════════════════════════════════════════════
  // 第一章 · 山门初劫（hpMul 1.0，教学关）
  // ════════════════════════════════════════════
  'ch1-l1': [
    { id: 'ch1-l1_speed', name: '迅雷不及掩耳', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 30 },
    { id: 'ch1-l1_noup', name: '不越雷池', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 25 },
  ],
  'ch1-l2': [
    { id: 'ch1-l2_speed', name: '松林疾行', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 35 },
    { id: 'ch1-l2_sword', name: '一剑破万法', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 30 },
  ],
  'ch1-l3': [
    { id: 'ch1-l3_speed', name: '关门打狗', desc: '60 秒内通关', kind: 'speed', params: { limit: 60 }, rewardContrib: 40 },
    { id: 'ch1-l3_budget', name: '精打细算', desc: '总消费不超过 500 灵石', kind: 'budget', params: { limit: 500 }, rewardContrib: 35 },
  ],

  // ════════════════════════════════════════════
  // 第二章 · 万妖攻山（hpMul 1.1，双路径）
  // ════════════════════════════════════════════
  'ch2-l1': [
    { id: 'ch2-l1_spear', name: '一枪双路', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 35 },
    { id: 'ch2-l1_speed', name: '北风扫叶', desc: '60 秒内通关', kind: 'speed', params: { limit: 60 }, rewardContrib: 40 },
  ],
  'ch2-l2': [
    { id: 'ch2-l2_speed', name: '蝠影穿梭', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 40 },
    { id: 'ch2-l2_magic', name: '雷霆万钧', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 35 },
  ],
  'ch2-l3': [
    { id: 'ch2-l3_budget', name: '以少胜多', desc: '总消费不超过 650 灵石', kind: 'budget', params: { limit: 650 }, rewardContrib: 40 },
    { id: 'ch2-l3_noup', name: '蛮力不入', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 35 },
  ],

  // ════════════════════════════════════════════
  // 第三章 · 魔修乱世（hpMul 1.2，魔修登场）
  // ════════════════════════════════════════════
  'ch3-l1': [
    { id: 'ch3-l1_speed', name: '破阵先锋', desc: '60 秒内通关', kind: 'speed', params: { limit: 60 }, rewardContrib: 40 },
    { id: 'ch3-l1_formation', name: '阵法大家', desc: '仅使用阵修塔通关', kind: 'mono_school', params: { allowed: 'formation' }, rewardContrib: 35 },
  ],
  'ch3-l2': [
    { id: 'ch3-l2_budget', name: '血池炼金', desc: '总消费不超过 700 灵石', kind: 'budget', params: { limit: 700 }, rewardContrib: 45 },
    { id: 'ch3-l2_noup', name: '血不染刃', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 40 },
  ],
  'ch3-l3': [
    { id: 'ch3-l3_speed', name: '斩首行动', desc: '65 秒内通关', kind: 'speed', params: { limit: 65 }, rewardContrib: 50 },
    { id: 'ch3-l3_sword', name: '剑气纵横', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 45 },
  ],

  // ════════════════════════════════════════════
  // 第四章 · 秘境凶兽（hpMul 1.25，隐身+分裂）
  // ════════════════════════════════════════════
  'ch4-l1': [
    { id: 'ch4-l1_speed', name: '秘境疾驰', desc: '65 秒内通关', kind: 'speed', params: { limit: 65 }, rewardContrib: 45 },
    { id: 'ch4-l1_noaura', name: '不用外物', desc: '不建造聚灵阵通关', kind: 'no_aura', rewardContrib: 35 },
  ],
  'ch4-l2': [
    { id: 'ch4-l2_bow', name: '千符镇妖', desc: '仅使用符修塔通关', kind: 'mono_school', params: { allowed: 'bow' }, rewardContrib: 40 },
    { id: 'ch4-l2_budget', name: '秘境节流', desc: '总消费不超过 800 灵石', kind: 'budget', params: { limit: 800 }, rewardContrib: 45 },
  ],
  'ch4-l3': [
    { id: 'ch4-l3_speed', name: '凶兽伏诛', desc: '60 秒内通关', kind: 'speed', params: { limit: 60 }, rewardContrib: 50 },
    { id: 'ch4-l3_magic', name: '法术破隐', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 45 },
  ],

  // ════════════════════════════════════════════
  // 第五章 · 血煞魔尊（hpMul 1.5，章末高潮）
  // ════════════════════════════════════════════
  'ch5-l1': [
    { id: 'ch5-l1_speed', name: '先锋破阵', desc: '70 秒内通关', kind: 'speed', params: { limit: 70 }, rewardContrib: 50 },
    { id: 'ch5-l1_spear', name: '长枪拒敌', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 45 },
  ],
  'ch5-l2': [
    { id: 'ch5-l2_budget', name: '血池淘金', desc: '总消费不超过 950 灵石', kind: 'budget', params: { limit: 950 }, rewardContrib: 50 },
    { id: 'ch5-l2_noup', name: '以弱胜强', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 45 },
  ],
  'ch5-l3': [
    { id: 'ch5-l3_speed', name: '魔尊伏法', desc: '75 秒内通关', kind: 'speed', params: { limit: 75 }, rewardContrib: 60 },
    { id: 'ch5-l3_sword', name: '剑斩血煞', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 55 },
  ],

  // ════════════════════════════════════════════
  // 第六章 · 域外篇（hpMul 1.5，高甲+护盾）
  // ════════════════════════════════════════════
  'ch6-l1': [
    { id: 'ch6-l1_speed', name: '域外疾行', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 45 },
    { id: 'ch6-l1_magic', name: '法术破甲', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 40 },
  ],
  'ch6-l2': [
    { id: 'ch6-l2_noaura', name: '独修之道', desc: '不建造聚灵阵通关', kind: 'no_aura', rewardContrib: 40 },
    { id: 'ch6-l2_budget', name: '域外节俭', desc: '总消费不超过 900 灵石', kind: 'budget', params: { limit: 900 }, rewardContrib: 45 },
  ],
  'ch6-l3': [
    { id: 'ch6-l3_speed', name: '裂隙封印', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 55 },
    { id: 'ch6-l3_spear', name: '枪破裂隙', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 50 },
  ],

  // ════════════════════════════════════════════
  // 第七章（hpMul 1.6）
  // ════════════════════════════════════════════
  'ch7-l1': [
    { id: 'ch7-l1_speed', name: '烽火连天', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 50 },
    { id: 'ch7-l1_sword', name: '剑扫八荒', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 45 },
  ],
  'ch7-l2': [
    { id: 'ch7-l2_budget', name: '稳扎稳打', desc: '总消费不超过 1000 灵石', kind: 'budget', params: { limit: 1000 }, rewardContrib: 50 },
    { id: 'ch7-l2_bow', name: '符镇八方', desc: '仅使用符修塔通关', kind: 'mono_school', params: { allowed: 'bow' }, rewardContrib: 45 },
  ],
  'ch7-l3': [
    { id: 'ch7-l3_speed', name: '兵贵神速', desc: '60 秒内通关', kind: 'speed', params: { limit: 60 }, rewardContrib: 55 },
    { id: 'ch7-l3_formation', name: '阵围妖王', desc: '仅使用阵修塔通关', kind: 'mono_school', params: { allowed: 'formation' }, rewardContrib: 50 },
  ],

  // ════════════════════════════════════════════
  // 第八章（hpMul 1.7）
  // ════════════════════════════════════════════
  'ch8-l1': [
    { id: 'ch8-l1_speed', name: '电光石火', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 50 },
    { id: 'ch8-l1_magic', name: '雷法通天', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 45 },
  ],
  'ch8-l2': [
    { id: 'ch8-l2_noup', name: '以逸待劳', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 45 },
    { id: 'ch8-l2_budget', name: '八荒敛财', desc: '总消费不超过 1100 灵石', kind: 'budget', params: { limit: 1100 }, rewardContrib: 50 },
  ],
  'ch8-l3': [
    { id: 'ch8-l3_speed', name: '斩妖除魔', desc: '60 秒内通关', kind: 'speed', params: { limit: 60 }, rewardContrib: 55 },
    { id: 'ch8-l3_spear', name: '枪出如龙', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 50 },
  ],

  // ════════════════════════════════════════════
  // 第九章（hpMul 1.8）
  // ════════════════════════════════════════════
  'ch9-l1': [
    { id: 'ch9-l1_speed', name: '风卷残云', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 50 },
    { id: 'ch9-l1_sword', name: '一剑西来', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 45 },
  ],
  'ch9-l2': [
    { id: 'ch9-l2_budget', name: '九转炼金', desc: '总消费不超过 1150 灵石', kind: 'budget', params: { limit: 1150 }, rewardContrib: 55 },
    { id: 'ch9-l2_bow', name: '万符归宗', desc: '仅使用符修塔通关', kind: 'mono_school', params: { allowed: 'bow' }, rewardContrib: 50 },
  ],
  'ch9-l3': [
    { id: 'ch9-l3_speed', name: '域外荡魔', desc: '60 秒内通关', kind: 'speed', params: { limit: 60 }, rewardContrib: 60 },
    { id: 'ch9-l3_noaura', name: '孤军奋战', desc: '不建造聚灵阵通关', kind: 'no_aura', rewardContrib: 50 },
  ],

  // ════════════════════════════════════════════
  // 第十章（hpMul 2.0，域外篇终章）
  // ════════════════════════════════════════════
  'ch10-l1': [
    { id: 'ch10-l1_speed', name: '主宰苏醒', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 55 },
    { id: 'ch10-l1_formation', name: '阵法困兽', desc: '仅使用阵修塔通关', kind: 'mono_school', params: { allowed: 'formation' }, rewardContrib: 50 },
  ],
  'ch10-l2': [
    { id: 'ch10-l2_budget', name: '裂隙精算', desc: '总消费不超过 1200 灵石', kind: 'budget', params: { limit: 1200 }, rewardContrib: 55 },
    { id: 'ch10-l2_magic', name: '法破虚空', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 50 },
  ],
  'ch10-l3': [
    { id: 'ch10-l3_speed', name: '封印主宰', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 65 },
    { id: 'ch10-l3_sword', name: '剑裂虚空', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 60 },
  ],

  // ════════════════════════════════════════════
  // 第十一章 · 大陆联盟（hpMul 2.1，骑兵+影杀）
  // ════════════════════════════════════════════
  'ch11-l1': [
    { id: 'ch11-l1_speed', name: '联盟疾驰', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 55 },
    { id: 'ch11-l1_noup', name: '铁甲未锻', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 50 },
  ],
  'ch11-l2': [
    { id: 'ch11-l2_budget', name: '联盟金库', desc: '总消费不超过 1300 灵石', kind: 'budget', params: { limit: 1300 }, rewardContrib: 55 },
    { id: 'ch11-l2_spear', name: '刺破铁甲', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 50 },
  ],
  'ch11-l3': [
    { id: 'ch11-l3_speed', name: '骑兵克星', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 60 },
    { id: 'ch11-l3_magic', name: '法术破骑', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 55 },
  ],

  // ════════════════════════════════════════════
  // 第十二章（hpMul 2.2）
  // ════════════════════════════════════════════
  'ch12-l1': [
    { id: 'ch12-l1_speed', name: '十二重楼', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 55 },
    { id: 'ch12-l1_sword', name: '剑影随行', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 50 },
  ],
  'ch12-l2': [
    { id: 'ch12-l2_noaura', name: '独行侠', desc: '不建造聚灵阵通关', kind: 'no_aura', rewardContrib: 50 },
    { id: 'ch12-l2_budget', name: '十二省钱', desc: '总消费不超过 1350 灵石', kind: 'budget', params: { limit: 1350 }, rewardContrib: 55 },
  ],
  'ch12-l3': [
    { id: 'ch12-l3_speed', name: '暗影追风', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 60 },
    { id: 'ch12-l3_bow', name: '符影追踪', desc: '仅使用符修塔通关', kind: 'mono_school', params: { allowed: 'bow' }, rewardContrib: 55 },
  ],

  // ════════════════════════════════════════════
  // 第十三章（hpMul 2.3）
  // ════════════════════════════════════════════
  'ch13-l1': [
    { id: 'ch13-l1_speed', name: '风驰电掣', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 55 },
    { id: 'ch13-l1_formation', name: '阵锁妖蛟', desc: '仅使用阵修塔通关', kind: 'mono_school', params: { allowed: 'formation' }, rewardContrib: 50 },
  ],
  'ch13-l2': [
    { id: 'ch13-l2_budget', name: '十三省金', desc: '总消费不超过 1400 灵石', kind: 'budget', params: { limit: 1400 }, rewardContrib: 60 },
    { id: 'ch13-l2_noup', name: '蛟龙不渡', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 55 },
  ],
  'ch13-l3': [
    { id: 'ch13-l3_speed', name: '困蛟于滩', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 65 },
    { id: 'ch13-l3_sword', name: '斩蛟剑', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 60 },
  ],

  // ════════════════════════════════════════════
  // 第十四章（hpMul 2.4）
  // ════════════════════════════════════════════
  'ch14-l1': [
    { id: 'ch14-l1_speed', name: '光影交错', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 60 },
    { id: 'ch14-l1_magic', name: '闪电链', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 55 },
  ],
  'ch14-l2': [
    { id: 'ch14-l2_bow', name: '符甲克星', desc: '仅使用符修塔通关', kind: 'mono_school', params: { allowed: 'bow' }, rewardContrib: 55 },
    { id: 'ch14-l2_budget', name: '十四俭修', desc: '总消费不超过 1450 灵石', kind: 'budget', params: { limit: 1450 }, rewardContrib: 60 },
  ],
  'ch14-l3': [
    { id: 'ch14-l3_speed', name: '先锋破阵', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 65 },
    { id: 'ch14-l3_spear', name: '长枪破影', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 60 },
  ],

  // ════════════════════════════════════════════
  // 第十五章 · 魔帅（hpMul 2.5，联盟篇终章）
  // ════════════════════════════════════════════
  'ch15-l1': [
    { id: 'ch15-l1_speed', name: '魔帅先锋', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 60 },
    { id: 'ch15-l1_noaura', name: '无阵之阵', desc: '不建造聚灵阵通关', kind: 'no_aura', rewardContrib: 55 },
  ],
  'ch15-l2': [
    { id: 'ch15-l2_budget', name: '军需官', desc: '总消费不超过 1500 灵石', kind: 'budget', params: { limit: 1500 }, rewardContrib: 60 },
    { id: 'ch15-l2_sword', name: '剑斩魔将', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 55 },
  ],
  'ch15-l3': [
    { id: 'ch15-l3_speed', name: '万军取首', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 70 },
    { id: 'ch15-l3_magic', name: '法术斩帅', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 65 },
  ],

  // ════════════════════════════════════════════
  // 第十六章 · 百族大战（hpMul 2.6，龙裔+鬼修）
  // ════════════════════════════════════════════
  'ch16-l1': [
    { id: 'ch16-l1_speed', name: '百族疾风', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 60 },
    { id: 'ch16-l1_spear', name: '屠龙枪', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 55 },
  ],
  'ch16-l2': [
    { id: 'ch16-l2_bow', name: '符射天敌', desc: '仅使用符修塔通关', kind: 'mono_school', params: { allowed: 'bow' }, rewardContrib: 55 },
    { id: 'ch16-l2_budget', name: '百族理财', desc: '总消费不超过 1550 灵石', kind: 'budget', params: { limit: 1550 }, rewardContrib: 60 },
  ],
  'ch16-l3': [
    { id: 'ch16-l3_speed', name: '龙裔伏诛', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 65 },
    { id: 'ch16-l3_noup', name: '远古神力', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 60 },
  ],

  // ════════════════════════════════════════════
  // 第十七章（hpMul 2.7）
  // ════════════════════════════════════════════
  'ch17-l1': [
    { id: 'ch17-l1_speed', name: '鬼影追风', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 60 },
    { id: 'ch17-l1_magic', name: '阳雷破鬼', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 55 },
  ],
  'ch17-l2': [
    { id: 'ch17-l2_sword', name: '正气剑诀', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 55 },
    { id: 'ch17-l2_budget', name: '十七省钱', desc: '总消费不超过 1600 灵石', kind: 'budget', params: { limit: 1600 }, rewardContrib: 60 },
  ],
  'ch17-l3': [
    { id: 'ch17-l3_speed', name: '鬼族剿灭', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 65 },
    { id: 'ch17-l3_formation', name: '镇鬼大阵', desc: '仅使用阵修塔通关', kind: 'mono_school', params: { allowed: 'formation' }, rewardContrib: 60 },
  ],

  // ════════════════════════════════════════════
  // 第十八章（hpMul 2.8）
  // ════════════════════════════════════════════
  'ch18-l1': [
    { id: 'ch18-l1_speed', name: '大步流星', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 60 },
    { id: 'ch18-l1_spear', name: '万夫莫敌', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 55 },
  ],
  'ch18-l2': [
    { id: 'ch18-l2_noaura', name: '不假外物', desc: '不建造聚灵阵通关', kind: 'no_aura', rewardContrib: 55 },
    { id: 'ch18-l2_budget', name: '十八积攒', desc: '总消费不超过 1650 灵石', kind: 'budget', params: { limit: 1650 }, rewardContrib: 60 },
  ],
  'ch18-l3': [
    { id: 'ch18-l3_speed', name: '百族之王', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 65 },
    { id: 'ch18-l3_bow', name: '箭雨遮天', desc: '仅使用符修塔通关', kind: 'mono_school', params: { allowed: 'bow' }, rewardContrib: 60 },
  ],

  // ════════════════════════════════════════════
  // 第十九章（hpMul 2.9）
  // ════════════════════════════════════════════
  'ch19-l1': [
    { id: 'ch19-l1_speed', name: '烽火狼烟', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 65 },
    { id: 'ch19-l1_sword', name: '剑荡群魔', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 60 },
  ],
  'ch19-l2': [
    { id: 'ch19-l2_budget', name: '十九精打', desc: '总消费不超过 1700 灵石', kind: 'budget', params: { limit: 1700 }, rewardContrib: 65 },
    { id: 'ch19-l2_magic', name: '雷火交加', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 60 },
  ],
  'ch19-l3': [
    { id: 'ch19-l3_speed', name: '万族朝宗', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 70 },
    { id: 'ch19-l3_noup', name: '上古余威', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 65 },
  ],

  // ════════════════════════════════════════════
  // 第二十章 · 天妖蛊王（hpMul 3.0，百族篇终章）
  // ════════════════════════════════════════════
  'ch20-l1': [
    { id: 'ch20-l1_speed', name: '蛊王先锋', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 65 },
    { id: 'ch20-l1_formation', name: '阵镇天妖', desc: '仅使用阵修塔通关', kind: 'mono_school', params: { allowed: 'formation' }, rewardContrib: 60 },
  ],
  'ch20-l2': [
    { id: 'ch20-l2_budget', name: '蛊王悬赏', desc: '总消费不超过 1800 灵石', kind: 'budget', params: { limit: 1800 }, rewardContrib: 65 },
    { id: 'ch20-l2_spear', name: '刺穿天妖', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 60 },
  ],
  'ch20-l3': [
    { id: 'ch20-l3_speed', name: '蛊王伏法', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 75 },
    { id: 'ch20-l3_sword', name: '剑斩蛊王', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 70 },
  ],

  // ════════════════════════════════════════════
  // 第二十一章 · 界域之战（hpMul 3.1，虚空+天魔）
  // ════════════════════════════════════════════
  'ch21-l1': [
    { id: 'ch21-l1_speed', name: '界域之门', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 65 },
    { id: 'ch21-l1_magic', name: '虚空雷法', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 60 },
  ],
  'ch21-l2': [
    { id: 'ch21-l2_bow', name: '符锁虚空', desc: '仅使用符修塔通关', kind: 'mono_school', params: { allowed: 'bow' }, rewardContrib: 60 },
    { id: 'ch21-l2_budget', name: '界域敛财', desc: '总消费不超过 1850 灵石', kind: 'budget', params: { limit: 1850 }, rewardContrib: 65 },
  ],
  'ch21-l3': [
    { id: 'ch21-l3_speed', name: '天魔退散', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 70 },
    { id: 'ch21-l3_noaura', name: '天魔独抗', desc: '不建造聚灵阵通关', kind: 'no_aura', rewardContrib: 65 },
  ],

  // ════════════════════════════════════════════
  // 第二十二章（hpMul 3.2）
  // ════════════════════════════════════════════
  'ch22-l1': [
    { id: 'ch22-l1_speed', name: '二十二快', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 65 },
    { id: 'ch22-l1_sword', name: '剑问天道', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 60 },
  ],
  'ch22-l2': [
    { id: 'ch22-l2_spear', name: '破虚之枪', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 60 },
    { id: 'ch22-l2_budget', name: '二十二省', desc: '总消费不超过 1900 灵石', kind: 'budget', params: { limit: 1900 }, rewardContrib: 65 },
  ],
  'ch22-l3': [
    { id: 'ch22-l3_speed', name: '界域守护', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 70 },
    { id: 'ch22-l3_magic', name: '天雷破界', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 65 },
  ],

  // ════════════════════════════════════════════
  // 第二十三章（hpMul 3.3）
  // ════════════════════════════════════════════
  'ch23-l1': [
    { id: 'ch23-l1_speed', name: '天外飞仙', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 65 },
    { id: 'ch23-l1_formation', name: '阵困虚空', desc: '仅使用阵修塔通关', kind: 'mono_school', params: { allowed: 'formation' }, rewardContrib: 60 },
  ],
  'ch23-l2': [
    { id: 'ch23-l2_noup', name: '界域之壁', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 60 },
    { id: 'ch23-l2_budget', name: '二十三俭', desc: '总消费不超过 1950 灵石', kind: 'budget', params: { limit: 1950 }, rewardContrib: 65 },
  ],
  'ch23-l3': [
    { id: 'ch23-l3_speed', name: '混沌退散', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 70 },
    { id: 'ch23-l3_bow', name: '符箭破虚', desc: '仅使用符修塔通关', kind: 'mono_school', params: { allowed: 'bow' }, rewardContrib: 65 },
  ],

  // ════════════════════════════════════════════
  // 第二十四章（hpMul 3.4）
  // ════════════════════════════════════════════
  'ch24-l1': [
    { id: 'ch24-l1_speed', name: '电光朝露', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 65 },
    { id: 'ch24-l1_sword', name: '天道之剑', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 60 },
  ],
  'ch24-l2': [
    { id: 'ch24-l2_spear', name: '破灭之枪', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 60 },
    { id: 'ch24-l2_budget', name: '二十四攒', desc: '总消费不超过 2000 灵石', kind: 'budget', params: { limit: 2000 }, rewardContrib: 65 },
  ],
  'ch24-l3': [
    { id: 'ch24-l3_speed', name: '界域终战', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 70 },
    { id: 'ch24-l3_magic', name: '万雷齐鸣', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 65 },
  ],

  // ════════════════════════════════════════════
  // 第二十五章 · 天劫化身（hpMul 3.5，界域篇终章）
  // ════════════════════════════════════════════
  'ch25-l1': [
    { id: 'ch25-l1_speed', name: '天劫先锋', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 70 },
    { id: 'ch25-l1_formation', name: '阵御天劫', desc: '仅使用阵修塔通关', kind: 'mono_school', params: { allowed: 'formation' }, rewardContrib: 65 },
  ],
  'ch25-l2': [
    { id: 'ch25-l2_budget', name: '天劫炼金', desc: '总消费不超过 2100 灵石', kind: 'budget', params: { limit: 2100 }, rewardContrib: 70 },
    { id: 'ch25-l2_sword', name: '剑指苍天', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 65 },
  ],
  'ch25-l3': [
    { id: 'ch25-l3_speed', name: '化身破灭', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 80 },
    { id: 'ch25-l3_noup', name: '逆天而行', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 75 },
  ],

  // ════════════════════════════════════════════
  // 第二十六章 · 飞升篇（hpMul 3.6，混沌古兽）
  // ════════════════════════════════════════════
  'ch26-l1': [
    { id: 'ch26-l1_speed', name: '飞升疾行', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 70 },
    { id: 'ch26-l1_spear', name: '屠兽之枪', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 65 },
  ],
  'ch26-l2': [
    { id: 'ch26-l2_magic', name: '天雷灭兽', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 65 },
    { id: 'ch26-l2_budget', name: '二十六精算', desc: '总消费不超过 2150 灵石', kind: 'budget', params: { limit: 2150 }, rewardContrib: 70 },
  ],
  'ch26-l3': [
    { id: 'ch26-l3_speed', name: '混沌退却', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 75 },
    { id: 'ch26-l3_bow', name: '符破混沌', desc: '仅使用符修塔通关', kind: 'mono_school', params: { allowed: 'bow' }, rewardContrib: 70 },
  ],

  // ════════════════════════════════════════════
  // 第二十七章（hpMul 3.7）
  // ════════════════════════════════════════════
  'ch27-l1': [
    { id: 'ch27-l1_speed', name: '天外飞星', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 70 },
    { id: 'ch27-l1_sword', name: '破天一剑', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 65 },
  ],
  'ch27-l2': [
    { id: 'ch27-l2_noaura', name: '天道独行', desc: '不建造聚灵阵通关', kind: 'no_aura', rewardContrib: 65 },
    { id: 'ch27-l2_budget', name: '二十七俭', desc: '总消费不超过 2200 灵石', kind: 'budget', params: { limit: 2200 }, rewardContrib: 70 },
  ],
  'ch27-l3': [
    { id: 'ch27-l3_speed', name: '天外之战', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 75 },
    { id: 'ch27-l3_formation', name: '天道之阵', desc: '仅使用阵修塔通关', kind: 'mono_school', params: { allowed: 'formation' }, rewardContrib: 70 },
  ],

  // ════════════════════════════════════════════
  // 第二十八章（hpMul 3.8）
  // ════════════════════════════════════════════
  'ch28-l1': [
    { id: 'ch28-l1_speed', name: '二十八宿', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 70 },
    { id: 'ch28-l1_spear', name: '天道之枪', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 65 },
  ],
  'ch28-l2': [
    { id: 'ch28-l2_budget', name: '二十八攒', desc: '总消费不超过 2250 灵石', kind: 'budget', params: { limit: 2250 }, rewardContrib: 70 },
    { id: 'ch28-l2_magic', name: '万法归宗', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 65 },
  ],
  'ch28-l3': [
    { id: 'ch28-l3_speed', name: '天道裁决', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 75 },
    { id: 'ch28-l3_sword', name: '终极之剑', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 70 },
  ],

  // ════════════════════════════════════════════
  // 第二十九章（hpMul 3.9）
  // ════════════════════════════════════════════
  'ch29-l1': [
    { id: 'ch29-l1_speed', name: '大限将至', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 70 },
    { id: 'ch29-l1_bow', name: '天外之符', desc: '仅使用符修塔通关', kind: 'mono_school', params: { allowed: 'bow' }, rewardContrib: 65 },
  ],
  'ch29-l2': [
    { id: 'ch29-l2_noup', name: '凡人之躯', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 65 },
    { id: 'ch29-l2_budget', name: '二十九省', desc: '总消费不超过 2300 灵石', kind: 'budget', params: { limit: 2300 }, rewardContrib: 70 },
  ],
  'ch29-l3': [
    { id: 'ch29-l3_speed', name: '末路之战', desc: '55 秒内通关', kind: 'speed', params: { limit: 55 }, rewardContrib: 75 },
    { id: 'ch29-l3_sword', name: '剑问终极', desc: '仅使用剑修塔通关', kind: 'mono_school', params: { allowed: 'sword' }, rewardContrib: 70 },
  ],

  // ════════════════════════════════════════════
  // 第三十章 · 道祖魔影（hpMul 4.0，最终章）
  // ════════════════════════════════════════════
  'ch30-l1': [
    { id: 'ch30-l1_speed', name: '最终序曲', desc: '50 秒内通关', kind: 'speed', params: { limit: 50 }, rewardContrib: 75 },
    { id: 'ch30-l1_magic', name: '天罚之雷', desc: '仅使用法修塔通关', kind: 'mono_school', params: { allowed: 'magic' }, rewardContrib: 70 },
  ],
  'ch30-l2': [
    { id: 'ch30-l2_budget', name: '孤注一掷', desc: '总消费不超过 2500 灵石', kind: 'budget', params: { limit: 2500 }, rewardContrib: 75 },
    { id: 'ch30-l2_spear', name: '终焉之枪', desc: '仅使用枪修塔通关', kind: 'mono_school', params: { allowed: 'spear' }, rewardContrib: 70 },
  ],
  'ch30-l3': [
    { id: 'ch30-l3_speed', name: '道祖伏法', desc: '60 秒内通关', kind: 'speed', params: { limit: 60 }, rewardContrib: 100 },
    { id: 'ch30-l3_noup', name: '凡人证道', desc: '不升级任何塔通关', kind: 'no_upgrade', rewardContrib: 90 },
  ],
};

export function getLevelChallenges(levelId: string): ChallengeDef[] {
  return CHALLENGES[levelId] ?? [];
}
