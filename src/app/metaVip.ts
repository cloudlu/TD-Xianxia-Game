import { VIP_LEVELS, VIP_MAX_LEVEL, type VipLevelConfig } from '../data/config/vip';
import { app } from './state';
import {
  claimVipDaily,
  claimVipWeekly,
  claimVipOneTime,
  upgradeVip,
  todayKey,
  weekKey,
} from '../repo/progressMeta';
import { updateBalance } from './metaShared';

function renderVipProgressBar(curLevel: number): string {
  let html = '<div class="vip-progress-bar">';
  for (let i = 0; i <= VIP_MAX_LEVEL; i++) {
    const c = VIP_LEVELS[i];
    const cls = i < curLevel ? 'done' : i === curLevel ? 'current' : '';
    html += `<span class="vip-node ${cls}" title="${c.name} ${c.perks.join('、')}">${c.icon || i}</span>`;
  }
  html += '</div>';
  return html;
}

function rewardHtml(r: NonNullable<VipLevelConfig['dailyReward']> | undefined): string {
  if (!r) return '';
  const parts: string[] = [];
  if (r.jade) parts.push(`${r.jade} 仙玉`);
  if (r.contribution) parts.push(`${r.contribution} 贡献`);
  if (r.destinyScrolls) parts.push(`${r.destinyScrolls} 天命符`);
  if (r.soulShards) parts.push(`${r.soulShards} 仙魂`);
  return parts.join(' + ');
}

function featureHtml(features: string[] | undefined): string {
  if (!features?.length) return '';
  const map: Record<string, string> = {
    autoBattle2x: '2× 自动战斗',
    skipWave: '跳过波次',
    offlineIdle: '离线挂机',
    extraDestinySlot: '额外天命符位',
  };
  return features.map(f => `<span class="vip-feature-tag">${map[f] || f}</span>`).join('');
}

export function renderVipTab(): void {
  updateBalance();
  const p = app.progression;
  const cur = VIP_LEVELS[p.vipLevel];
  const next = VIP_LEVELS[p.vipLevel + 1];

  let html = '';

  // 当前等级头部
  html += `
    <div class="vip-header" style="border-color:${cur.color}">
      <span class="vip-icon">${cur.icon}</span>
      <div class="vip-title">
        <span class="vip-name">${cur.name}</span>
        <span class="vip-level">LV.${p.vipLevel}</span>
      </div>
    </div>
  `;

  // 当前特权
  html += `<div class="vip-section"><h4>当前特权</h4><ul class="vip-perks">`;
  for (const pk of cur.perks) html += `<li>✦ ${pk}</li>`;
  html += `</ul>`;
  if (cur.unlockFeatures?.length) {
    html += `<div class="vip-features">${featureHtml(cur.unlockFeatures)}</div>`;
  }
  if (cur.extraDestinySlots) {
    html += `<div class="vip-extra-destiny">额外天命符位 +${cur.extraDestinySlots}</div>`;
  }
  html += `</div>`;

  // 每日奖励
  if (cur.dailyReward) {
    const claimed = p.vipDailyClaimed.includes(todayKey());
    html += `
      <div class="vip-section">
        <h4>每日奖励 ${claimed ? '<span class="claimed">已领取</span>' : ''}</h4>
        <div class="vip-reward">${rewardHtml(cur.dailyReward)}</div>
        <button id="vipDailyBtn" ${claimed ? 'disabled' : ''}>${claimed ? '已领取' : '领取每日奖励'}</button>
      </div>
    `;
  }

  // 每周奖励
  if (cur.weeklyReward) {
    const claimed = p.vipWeeklyClaimed.includes(weekKey());
    html += `
      <div class="vip-section">
        <h4>每周奖励 ${claimed ? '<span class="claimed">已领取</span>' : ''}</h4>
        <div class="vip-reward">${rewardHtml(cur.weeklyReward)}</div>
        <button id="vipWeeklyBtn" ${claimed ? 'disabled' : ''}>${claimed ? '已领取' : '领取每周奖励'}</button>
      </div>
    `;
  }

  // 升级一次性礼包
  if (cur.oneTimeReward && !p.vipOneTimeClaimed.includes(p.vipLevel)) {
    html += `
      <div class="vip-section">
        <h4>升级礼包</h4>
        <div class="vip-reward">${rewardHtml(cur.oneTimeReward)}</div>
        <button id="vipOneTimeBtn">领取礼包</button>
      </div>
    `;
  }

  // 下一级预览
  if (next) {
    const can = p.totalRecharged >= next.upgradeJade;
    html += `
      <div class="vip-section next-level">
        <h4>下一级：${next.name} <span style="color:${next.color}">（累计充值 ≥ ${next.upgradeJade} 仙玉）</span></h4>
        <ul class="vip-perks">
          ${next.perks.map(pk => `<li>✦ ${pk}</li>`).join('')}
        </ul>
        ${next.unlockFeatures?.length ? `<div class="vip-features">${featureHtml(next.unlockFeatures)}</div>` : ''}
        <button id="vipUpBtn" ${can ? '' : 'disabled'}>晋升（累计 ${next.upgradeJade} 仙玉）</button>
      </div>
    `;
  } else {
    html += `<div class="vip-section max-level">已达最高天命阶</div>`;
  }

  // 进度条
  html += `<div class="vip-section">${renderVipProgressBar(p.vipLevel)}</div>`;

  const el = document.getElementById('metaContent')!;
  el.innerHTML = html;

  // 事件绑定
  const dailyBtn = document.getElementById('vipDailyBtn');
  if (dailyBtn) dailyBtn.onclick = () => {
    const u = claimVipDaily(app.progression);
    if (u) { app.progression = u; renderVipTab(); }
  };

  const weeklyBtn = document.getElementById('vipWeeklyBtn');
  if (weeklyBtn) weeklyBtn.onclick = () => {
    const u = claimVipWeekly(app.progression);
    if (u) { app.progression = u; renderVipTab(); }
  };

  const oneTimeBtn = document.getElementById('vipOneTimeBtn');
  if (oneTimeBtn) oneTimeBtn.onclick = () => {
    const u = claimVipOneTime(app.progression, p.vipLevel);
    if (u) { app.progression = u; renderVipTab(); }
  };

  const upBtn = document.getElementById('vipUpBtn');
  if (upBtn) upBtn.onclick = () => {
    const u = upgradeVip(app.progression, next!.upgradeJade, VIP_MAX_LEVEL);
    if (u) { app.progression = u; renderVipTab(); }
  };
}