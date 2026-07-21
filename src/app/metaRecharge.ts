// 充值 tab
import { app, iap } from './state';
import { grantJade, redeemJade, upgradeVip } from '../repo/progressMeta';
import { VIP_LEVELS, VIP_MAX_LEVEL } from '../data/config/vip';
import { updateBalance } from './metaShared';

const DEV_PASSWORD = 'td2026';

export function renderRechargeTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  const RATES: Array<{ jade: number; contrib: number }> = [
    { jade: 10, contrib: 16 },
    { jade: 50, contrib: 90 },
    { jade: 100, contrib: 200 },
    { jade: 500, contrib: 1100 },
    { jade: 1000, contrib: 2500 },
    { jade: 5000, contrib: 15000 },
  ];
  let html = `<div class="eq-desc">充值功能（测试版，需开发密码）。</div>
    <div class="eq-grid">`;
  for (const p of iap.getProducts()) {
    html += `<div class="eq-card"><div class="eq-name">${p.label}</div>
      <div class="eq-desc">￥${p.priceCny}</div>
      <button data-iap="${p.id}">充值</button></div>`;
  }
  html += `</div>`;
  html += `<div class="eq-desc" style="margin-top:14px">仙玉兑换宗门贡献：</div><div class="eq-grid">`;
  for (const r of RATES) {
    html += `<div class="eq-card"><div class="eq-name">${r.contrib} 贡献</div>
      <div class="eq-desc">消耗 ${r.jade} 仙玉</div>
      <button data-redeem="${r.jade}/${r.contrib}" ${app.progression.jade < r.jade ? 'disabled' : ''}>兑换</button></div>`;
  }
  el.innerHTML = `${html}</div>`;
  el.querySelectorAll('[data-iap]').forEach((b) => { (b as HTMLElement).onclick = async () => {
    const pwd = prompt('请输入开发测试密码：');
    if (pwd !== DEV_PASSWORD) { if (pwd !== null) alert('密码错误'); return; }
    const r = await iap.purchase((b as HTMLElement).dataset.iap!);
    if (r.jade > 0) { 
      let p = grantJade(app.progression, r.jade);
      // 累计充值达标自动升 VIP（不扣仙玉）
      while (true) {
        const next = VIP_LEVELS[p.vipLevel + 1];
        if (!next || p.totalRecharged < next.upgradeJade) break;
        const u = upgradeVip(p, next.upgradeJade, VIP_MAX_LEVEL);
        if (!u) break;
        p = u;
      }
      app.progression = p; 
      renderRechargeTab(); 
      // 同步刷新 VIP 标签页（如果当前打开）
      const metaContent = document.getElementById('metaContent');
      if (metaContent?.querySelector('#vipUpBtn')) {
        import('./metaVip').then(m => m.renderVipTab());
      }
    }
  }; });
  el.querySelectorAll('[data-redeem]').forEach((b) => { (b as HTMLElement).onclick = () => {
    const [jade, contrib] = (b as HTMLElement).dataset.redeem!.split('/').map(Number);
    const next = redeemJade(app.progression, jade, contrib);
    if (next) { app.progression = next; renderRechargeTab(); }
  }; });
}
