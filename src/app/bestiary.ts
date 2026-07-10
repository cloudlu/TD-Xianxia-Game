// 妖兽录（敌人图鉴）：展示全部敌人详细属性与具体机制参数（数字来自代码实现）
import { ENEMIES } from '../data/config';
import type { EnemyConfig } from '../types';

export function renderBestiary(): string {
  const ids = Object.keys(ENEMIES);
  let html = '<h2>妖 兽 录</h2><div class="eq-desc" style="text-align:center;margin-bottom:14px;">全部敌人属性与具体机制参数（数值来自代码实现），辅助配塔决策。</div><div class="eq-grid bestiary-grid">';
  for (const id of ids) {
    const e = ENEMIES[id];
    html += enemyCard(e);
  }
  html += '</div>';
  return html;
}

function enemyCard(e: EnemyConfig): string {
  const desc = traitDesc(e);
  return `<div class="eq-card bestiary-card">
    <div class="eq-name">
      <span style="display:inline-block;width:30px;height:30px;line-height:30px;border-radius:6px;background:${e.color};color:#fff;font-weight:bold;text-align:center;margin-right:8px;font-size:16px;">${e.icon}</span>${e.name}
    </div>
    <div class="eq-desc" style="line-height:1.7;">
      HP <b>${e.hp}</b>　甲 <b>${e.armor}</b>（减伤 ${Math.round(100 - 10000/(100+e.armor))}%）　速 <b>${e.speed}</b> 格/秒　赏金 <b>${e.bounty}</b><br>
      ${desc}
    </div>
  </div>`;
}

function traitDesc(e: EnemyConfig): string {
  const t: string[] = [];

  // 飞行
  if (e.fly) t.push('飞行：仅"对空+对地"塔（符箓/火法/雷法/寒冰）可锁定攻击。地面塔（飞剑/长枪）无法选中飞行敌人。');
  // 护盾
  if (e.shield) t.push(`护盾 ${e.shield}：先扣盾再伤血。盾吃全额伤害（不受护甲减免），破盾后剩余伤害才穿甲。`);
  // 受击回血
  if (e.lifestealHp) t.push(`受击回血 ${e.lifestealHp}/次：每次命中造成血量损失时回复 ${e.lifestealHp} 点。小伤高频喂血（符箓18伤每击回8血净损10），大伤爆发克制（长枪15伤一次回8血净损7，多目标扫荡更优）。`);
  // 护甲（高甲提示）
  if (e.armor >= 40) t.push(`极高护甲 ${e.armor}：物理伤害仅造成 ${Math.round(10000/(100+e.armor))}%。法系塔/暴击/光环可穿透。`);
  else if (e.armor >= 20) t.push(`中高护甲 ${e.armor}：物理伤害减免 ${Math.round(100 - 10000/(100+e.armor))}%。法术塔或升级可补强。`);
  // 隐身
  if (e.stealth) t.push('隐身：仅在聚灵阵光环覆盖范围内可被锁定。未破隐时半透明渲染（攻击无法选中）。对策：布聚灵阵覆盖路径。');
  // 闪避
  if (e.dodge) t.push(`闪避 ${Math.round(e.dodge * 100)}%：每次受击 ${Math.round(e.dodge * 100)}% 概率完全规避（伤害/特效全免）。需高频攻击（符箓1.5攻速）或必中手段压制。`);
  // 撞塔
  if (e.knockback) t.push('撞塔：经过塔 **0.9 格** 以内时，瘫痪该塔 **2 秒**（变灰+「眩」）。光环阵法（聚灵阵）不受影响。同一塔被撞后有 **6 秒免疫**，不会连续被撞瘫。对策：布聚灵阵或把核心塔放在拐角后侧。');
  // 分裂
  if (e.split) {
    const child = ENEMIES[e.split.child];
    const childInfo = child ? `「${child.name}」（HP ${child.hp} / 甲 ${child.armor} / 速 ${child.speed} / 赏金 ${child.bounty}）` : '子体';
    t.push(`分裂：死亡时在**自身位置**生成 ${e.split.count} 个 ${childInfo}。子体沿同一路径继续前进。对策：AOE溅射（火法）或扫荡全范围（长枪）清场。`);
  }
  // BOSS
  if (e.bossAbility) {
    const ab = e.bossAbility;
    if (ab.charmRadius) t.push(`魅惑：每 **${ab.interval}s** 触发一次，**半径 ${ab.charmRadius} 格**内非阵法塔瘫痪 **${Math.min(3, ab.charmDuration ?? 2)}s**。聚灵阵免疫。同塔 6s 免疫护栏。对策：布聚灵阵或把塔散开放置。`);
    if (ab.summon) {
      const s = ab.summon;
      t.push(`召唤：每 ${ab.interval}s 在自身位置生成 **${s.count} 个** ${ENEMIES[s.enemy]?.name ?? s.enemy}` + (ab.enrageBelow ? `（狂暴后增至 ${ab.enrageBelow.summonCount ?? s.count} 个）` : '') + '。');
    }
    if (ab.enrageBelow) {
      t.push(`狂暴：血量低于 **${Math.round(ab.enrageBelow.hpPct * 100)}%** 时触发——移动速度 ×**${ab.enrageBelow.speedMul}**，召唤数量提升。需在此之前尽可能输出伤害。`);
    }
  }
  // 精英
  if (e.elite && !e.bossAbility) t.push('精英：体型加大、金色镶边、名字标牌渲染。无特殊 BOSS 技能，纯数值强化。');
  if (e.elite && e.bossAbility) t.push('精英渲染：加大体型 + 金色边框 + 名字标牌。');

  // 普通（无任何特殊能力）
  if (t.length === 0) t.push('无特殊能力。纯基础数值单位。');

  return `<span style="color:#ff9b6b;">${t.join('</span><br><span style="color:#ff9b6b;">')}</span>`;
}
