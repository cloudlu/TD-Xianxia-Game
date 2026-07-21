// 仙魂商店：不封顶永久加成（消耗仙魂碎片）
import { app } from './state';
import { updateBalance } from './metaShared';

export type SoulShopStat = 
  | 'swordDmg' | 'spearDmg' | 'bowDmg' | 'staffDmg' | 'fistDmg' | 'shieldDmg'
  | 'rate' | 'bountyMul' | 'range' | 'crit';

export const SOUL_SHOP_STATS: Record<SoulShopStat, { name: string; baseCost: number; costGrowth: number; perLevel: number; maxLevel?: number }> = {
  swordDmg:    { name: '剑修伤害',     baseCost: 100, costGrowth: 50,  perLevel: 0.01, maxLevel: 50 },
  spearDmg:    { name: '枪修伤害',     baseCost: 100, costGrowth: 50,  perLevel: 0.01, maxLevel: 50 },
  bowDmg:      { name: '弓修伤害',     baseCost: 100, costGrowth: 50,  perLevel: 0.01, maxLevel: 50 },
  staffDmg:    { name: '法修伤害',     baseCost: 100, costGrowth: 50,  perLevel: 0.01, maxLevel: 50 },
  fistDmg:     { name: '体修伤害',     baseCost: 100, costGrowth: 50,  perLevel: 0.01, maxLevel: 50 },
  shieldDmg:   { name: '盾修伤害',     baseCost: 100, costGrowth: 50,  perLevel: 0.01, maxLevel: 50 },
  rate:        { name: '攻速加成',     baseCost: 200, costGrowth: 80,  perLevel: 0.005, maxLevel: 40 },
  bountyMul:   { name: '灵石获取',     baseCost: 200, costGrowth: 80,  perLevel: 0.005, maxLevel: 40 },
  range:       { name: '攻击射程',     baseCost: 300, costGrowth: 100, perLevel: 0.1,  maxLevel: 20 },
  crit:        { name: '暴击率',       baseCost: 300, costGrowth: 100, perLevel: 0.005, maxLevel: 40 },
};

export function renderSoulShopTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  const p = app.progression;
  const soulMul = Math.sqrt(p.soulShards) * 0.008;
  const shop = p.soulShopLevels ?? {};

  let html = `
    <div class="eq-desc">
      仙魂碎片：<b style="color:#ffd93d">${p.soulShards}</b>　
      独立乘数：<b style="color:#5fd3ff">+${Math.round(soulMul * 10000) / 100}%</b>（不封顶，√碎片 × 0.8%）
    </div>
    <div class="eq-desc">消耗仙魂碎片购买永久加成（不封顶，每级递增价格）。</div>
    <div class="eq-grid">`;

  for (const [id, cfg] of Object.entries(SOUL_SHOP_STATS)) {
    const lvl = shop[id] ?? 0;
    const maxed = cfg.maxLevel && lvl >= cfg.maxLevel;
    const cost = Math.floor(cfg.baseCost + lvl * cfg.costGrowth);
    const canBuy = p.soulShards >= cost && !maxed;
    const totalBonus = lvl * cfg.perLevel;
    const totalTxt = id === 'range' 
      ? `+${totalBonus.toFixed(1)}`
      : `+${Math.round(totalBonus * 100)}%`;

    const cls = maxed ? 'equipped' : lvl > 0 ? 'owned' : '';
    const btnHtml = maxed
      ? '<button disabled>已满级</button>'
      : `<button data-buy="${id}" ${canBuy ? '' : 'disabled'}>购买 ${cost} 碎片</button>`;

    html += `
      <div class="eq-card ${cls}">
        <div class="eq-name">${cfg.name} <span style="color:#ffd93d;font-size:13px">Lv ${lvl}${cfg.maxLevel ? '/' + cfg.maxLevel : ''}</span></div>
        <div class="eq-desc">当前加成：${totalTxt}${maxed ? '' : ` → 下级 +${id === 'range' ? cfg.perLevel.toFixed(1) : Math.round(cfg.perLevel * 100)}%`}</div>
        ${btnHtml}
      </div>`;
  }

  html += '</div>';
  el.innerHTML = html;

  el.querySelectorAll('[data-buy]').forEach((b) => {
    (b as HTMLElement).onclick = () => {
      const id = (b as HTMLElement).dataset.buy!;
      buySoulShop(id as SoulShopStat);
    };
  });
}

function buySoulShop(id: SoulShopStat): void {
  const p = app.progression;
  const cfg = SOUL_SHOP_STATS[id];
  const lvl = (p.soulShopLevels ?? {})[id] ?? 0;
  const cost = Math.floor(cfg.baseCost + lvl * cfg.costGrowth);
  if (p.soulShards < cost) return;

  const newShop = { ...p.soulShopLevels, [id]: lvl + 1 };
  app.progression = { ...p, soulShards: p.soulShards - cost, soulShopLevels: newShop };
  renderSoulShopTab();
}