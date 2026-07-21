// 寻仙 tab
import { EQUIPMENT, LIMITED_TREASURES } from '../data/config';
import { mulberry32 } from '../engine/PRNG';
import { app, GENERATED_EQUIPMENT } from './state';
import { drawGacha, FRAG_COST, type DrawResult } from '../data/config/gacha';
import { applyDraw, craftEquip, setGeneratedName } from '../repo/progressMeta';
import { generateRandomEquip } from '../data/config/equipment';
import { updateBalance } from './metaShared';

const GACHA_ICONS: Record<string, string> = {
  mythic_equip: '👑', random_equip: '⚔️', destiny3: '🔮', soul20: '✨',
  soul8: '💫', frags8: '🧩', destiny: '📜', soul3: '💫', frags3: '🧩',
  refund40: '💎', frags2: '🧩', soul2: '💫', refund20: '💎',
  frags: '🧩', soul: '💫', refund10: '💎', empty: '🎟️',
};
const PRIZE_LABELS: Record<string, string> = {
  mythic_equip: '★ 至宝', random_equip: '法宝', destiny3: '天命符 ×3', soul20: '仙魂碎片 ×20',
  soul8: '仙魂碎片 ×8', frags8: '碎片 ×8', destiny: '天命符 ×1', soul3: '仙魂碎片 ×3',
  frags3: '碎片 ×3', refund40: '贡献 +40', frags2: '碎片 ×2', soul2: '仙魂碎片 ×2',
  refund20: '贡献 +20', frags: '碎片 ×1', soul: '仙魂碎片 ×1', refund10: '贡献 +10',
  empty: '略备薄礼 +5 贡献',
};
const TIER_COLORS: Record<string, string> = {
  mythic_equip: '#ffd700,#b8860b',
  random_equip: '#c084fc,#7c3aed',
  destiny3: '#5fd3ff,#1e88e5',
  soul20: '#5fd3ff,#1e88e5',
  soul8: '#66bb6a,#2e7d32',
  frags8: '#66bb6a,#2e7d32',
  destiny: '#66bb6a,#2e7d32',
};
const TIER_NAMES: Record<string, string> = {
  mythic_equip: '特等奖', random_equip: '一等奖', destiny3: '二等奖', soul20: '二等奖',
  soul8: '三等奖', frags8: '三等奖', destiny: '三等奖',
};

let gachaRng = mulberry32(Date.now());

function gachaItemHtml(r: DrawResult): string {
  const icon = GACHA_ICONS[r.prize] ?? '🎁';
  let label = PRIZE_LABELS[r.prize] ?? '';
  if (r.prize === 'mythic_equip') {
    const t = r.grantedTreasureId ? LIMITED_TREASURES[r.grantedTreasureId] : null;
    label = t ? `★ 至宝「${t.name}」` : '★ 至宝';
  } else if (r.prize === 'random_equip') {
    const eq = r.grantedEquipId ? (EQUIPMENT[r.grantedEquipId] ?? GENERATED_EQUIPMENT[r.grantedEquipId]) : null;
    label = eq ? `法宝「${eq.name}」` : '法宝';
    if (r.frags > 0) label += '（重复→碎片+5）';
  } else if (r.contributionGain > 0) {
    label = `贡献 +${r.contributionGain}`;
  } else if (r.soulShards > 0) {
    label = `仙魂碎片 +${r.soulShards}`;
  } else if (r.frags > 0) {
    label = `装备碎片 +${r.frags}`;
  } else if (r.destinyScrolls > 0) {
    label = `天命符 +${r.destinyScrolls}`;
  }
  const colors = TIER_COLORS[r.prize];
  const tierName = TIER_NAMES[r.prize] ?? '';
  const tag = r.pityTriggered ? '保 底' : tierName;
  const borderStyle = colors ? `border:2px solid;border-image:linear-gradient(135deg,${colors}) 1;` : '';
  return `<div class="gacha-item" style="${borderStyle}"><span class="gi-icon">${icon}</span><span class="gi-label">${label}</span>${tag ? `<span class="gi-tag" style="${tierName === '特等奖' ? 'background:linear-gradient(135deg,#b8860b,#ffd700);color:#1a1a2a;' : ''}">${tag}</span>` : ''}</div>`;
}

function aggregatedHtml(results: DrawResult[]): string {
  type Entry = { count: number; label: string; icon: string; tier: string; color: string; items: string[] };
  const map = new Map<string, Entry>();
  for (const r of results) {
    const key = r.prize;
    if (!map.has(key)) {
      let label = PRIZE_LABELS[key] ?? key;
      let detail = '';
      if (key === 'mythic_equip') {
        const t = r.grantedTreasureId ? LIMITED_TREASURES[r.grantedTreasureId] : null;
        label = t ? `至宝·${t.name}` : '至宝';
      } else if (key === 'random_equip') {
        const eq = r.grantedEquipId ? (EQUIPMENT[r.grantedEquipId] ?? GENERATED_EQUIPMENT[r.grantedEquipId]) : null;
        label = eq ? eq.name : '法宝';
      }
      map.set(key, {
        count: 0, label, icon: GACHA_ICONS[key] ?? '🎁',
        tier: TIER_NAMES[key] ?? '', color: TIER_COLORS[key] ?? '', items: [detail],
      });
    }
    const e = map.get(key)!;
    e.count++;
    if (key === 'mythic_equip' || key === 'random_equip') {
      const t = key === 'mythic_equip' && r.grantedTreasureId ? LIMITED_TREASURES[r.grantedTreasureId] : null;
      const eq = key === 'random_equip' && r.grantedEquipId ? (EQUIPMENT[r.grantedEquipId] ?? GENERATED_EQUIPMENT[r.grantedEquipId]) : null;
      const name = t?.name ?? eq?.name ?? '';
      e.items.push(name);
    }
  }
  const tierOrder = ['mythic_equip', 'random_equip', 'destiny3', 'soul20', 'soul8', 'frags8', 'destiny', 'soul3', 'frags3', 'refund40', 'frags2', 'soul2', 'refund20', 'frags', 'soul', 'refund10', 'empty'];
  let html = `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">`;
  for (const key of tierOrder) {
    const e = map.get(key); if (!e) continue;
    const c = e.color.split(',')[0] || '#555';
    html += `<div style="flex:1;min-width:80px;border:1px solid ${c};border-radius:8px;padding:6px 8px;text-align:center;background:rgba(255,255,255,0.04);">
      <div style="font-size:22px;">${e.icon}</div>
      <div style="font-size:20px;font-weight:bold;color:#fff;margin:2px 0;">×${e.count}</div>
      <div style="font-size:10px;color:#aaa;">${e.tier || '其他'}</div>
      ${e.items.length > 1 ? `<div style="font-size:10px;color:#ffd93d;margin-top:2px;">${e.items.slice(1).join('、')}</div>` : ''}
    </div>`;
  }
  html += `</div>`;
  html += `<div style="max-height:260px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:4px;justify-content:center;padding:4px 0;">`;
  for (const r of results) {
    const icon = GACHA_ICONS[r.prize] ?? '🎁';
    let label = '';
    if (r.prize === 'mythic_equip') {
      const t = r.grantedTreasureId ? LIMITED_TREASURES[r.grantedTreasureId] : null;
      label = t ? t.name : '至宝';
    } else if (r.prize === 'random_equip') {
      const eq = r.grantedEquipId ? (EQUIPMENT[r.grantedEquipId] ?? GENERATED_EQUIPMENT[r.grantedEquipId]) : null;
      label = eq ? eq.name : '法宝';
      if (r.frags > 0) label += '→碎片';
    } else if (r.contributionGain > 0) { label =  `+${r.contributionGain}`; }
    else if (r.soulShards > 0) { label = `+${r.soulShards}`; }
    else if (r.frags > 0) { label = `+${r.frags}`; }
    else if (r.destinyScrolls > 0) { label = `+${r.destinyScrolls}`; }
    const c = TIER_COLORS[r.prize]?.split(',')[0] || 'rgba(255,255,255,0.15)';
    html += `<div style="border:1px solid ${c};border-radius:4px;padding:2px 7px;font-size:11px;display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,0.03);white-space:nowrap;"><span>${icon}</span><span>${label}</span></div>`;
  }
  html += `</div>`;
  return html;
}

function showGachaResult(results: DrawResult[], onDone: () => void): void {
  const overlay = document.getElementById('gachaResultOverlay')!;
  const container = document.getElementById('gachaItems')!;
  const title = document.getElementById('gachaTitle')!;
  const btn = document.getElementById('gachaNextBtn') as HTMLButtonElement;
  overlay.classList.add('show');
  container.innerHTML = '';
  if (results.length > 20) {
    title.textContent = `百 连 寻 仙 结 果（${results.length} 抽）`;
    container.innerHTML = aggregatedHtml(results);
  } else {
    title.textContent = '寻 仙 结 果';
    container.innerHTML = results.map(gachaItemHtml).join('');
  }
  btn.textContent = '收 下';
  btn.className = 'final';
  btn.style.display = 'inline-block';
  btn.onclick = () => { overlay.classList.remove('show'); onDone(); };
}

function drawAndShow(cost: number, count: number): void {
  let cur = app.progression;
  if (cur.contribution < cost) return;
  let pity = cur.gachaPity;
  const results: DrawResult[] = [];
  for (let i = 0; i < count; i++) {
    const res = drawGacha(pity, () => { gachaRng = mulberry32(gachaRng() * 1e9 | 0); return gachaRng(); });
    const next = applyDraw(cur, i === 0 ? cost : 0, res.result, res.newPity);
    if (!next) break;
    if (res.result.grantedEquipId) {
      const eq = EQUIPMENT[res.result.grantedEquipId];
      if (eq && !GENERATED_EQUIPMENT[res.result.grantedEquipId]) {
        GENERATED_EQUIPMENT[res.result.grantedEquipId] = eq;
      }
      if (cur.ownedEquipment.includes(res.result.grantedEquipId)) {
        res.result.frags = 5;
      }
    }
    cur = next;
    pity = res.newPity;
    results.push(res.result);
  }
  app.progression = cur;
  showGachaResult(results, () => renderGachaTab());
}

export function renderGachaTab(): void {
  updateBalance();
  const el = document.getElementById('metaContent')!;
  const p = app.progression;
  const frags = p.equipFragments;
  const canCraft = frags >= FRAG_COST;
  app.progression = p;

  const soulMul = Math.sqrt(p.soulShards) * 0.008;
  const soulStr = soulMul > 0 ? `（+${Math.round(soulMul * 100)}% 独立乘数，不封顶）` : '';

  const remaining = 299 - p.gachaPity;
  const pityStr = remaining === 0
    ? '<span style="color:#ff6b6b">下次必出法宝保底（一等奖）</span>'
    : `<span style="color:#5fd3ff">再抽 <b>${remaining}</b> 次必出法宝（一等奖保底）</span>`;

  const html = `<div class="eq-desc" style="text-align:center;margin-bottom:10px;">
    仙魂碎片 <b style="color:#ffd93d">${p.soulShards}</b>${soulStr}　·
    天命符 <b style="color:#ffd93d">${p.destinyScrolls}</b>（消耗1张 = 下关 +8% 伤害）　·
    装备碎片 <b style="color:#ffd93d">${frags}</b>
    ${canCraft ? '<br><button id="craftBtn" style="margin-top:6px;">合成随机法宝（消耗 ' + FRAG_COST + ' 碎片）</button>' : ''}
  </div>
  <div class="eq-desc" style="text-align:center;margin-bottom:8px;font-size:13px;">
    ${pityStr}
  </div>
  <div class="eq-grid">
    <div class="eq-card" style="text-align:center;">
      <div class="eq-name">单抽</div>
      <div class="eq-desc" style="font-size:12px">120 贡献</div>
      <button id="singleDraw" ${p.contribution < 120 ? 'disabled' : ''}>寻 仙</button>
    </div>
    <div class="eq-card" style="text-align:center;">
      <div class="eq-name">十连</div>
      <div class="eq-desc" style="font-size:12px">1000 贡献</div>
      <button id="tenDraw" ${p.contribution < 1000 ? 'disabled' : ''}>十 连 寻 仙</button>
    </div>
    <div class="eq-card" style="text-align:center;">
      <div class="eq-name">百连</div>
      <div class="eq-desc" style="font-size:12px">8000 贡献（80/抽）</div>
      <button id="hundredDraw" ${p.contribution < 8000 ? 'disabled' : ''}>百 连 寻 仙</button>
    </div>
  </div>
  <div class="eq-desc" style="text-align:center;font-size:11px;color:#8b8ba0;margin-top:8px;">
    奖池：特等奖 0.01%（至宝）｜一等奖 0.09%（法宝）｜二等奖 0.9%｜三四五六 4~25%｜空奖 40%（5 贡献）
  </div>
  <div id="drawResult" style="text-align:center;margin-top:10px;font-size:14px;color:#ffd93d;min-height:20px;"></div>`;

  el.innerHTML = html;

  const craftBtn = document.getElementById('craftBtn');
  if (craftBtn) craftBtn.onclick = () => {
    if (frags < FRAG_COST) return;
    const existing = new Set([...Object.keys(EQUIPMENT), ...Object.keys(GENERATED_EQUIPMENT)]);
    const { config, generatedName } = generateRandomEquip(existing, () => { gachaRng = mulberry32(gachaRng() * 1e9 | 0); return gachaRng(); });
    GENERATED_EQUIPMENT[config.id] = config;
    let next = craftEquip(app.progression, config.id);
    if (!next) return;
    next = setGeneratedName(next, config.id, generatedName);
    next = { ...next, generatedEquipData: { ...next.generatedEquipData, [config.id]: config } };
    if (next) {
      app.progression = next;
      const overlay = document.getElementById('gachaResultOverlay')!;
      const container = document.getElementById('gachaItems')!;
      const btn = document.getElementById('gachaNextBtn') as HTMLButtonElement;
      overlay.classList.add('show');
      container.innerHTML = `<div class="gacha-item" style="border-color:#5fd3ff;box-shadow:0 0 20px rgba(95,211,255,0.35);">
        <span class="gi-icon">🧩</span>
        <span class="gi-label">消耗碎片 ${FRAG_COST} → 合成：<b style="color:#ffd93d">${generatedName}</b></span>
        <span class="gi-tag" style="background:#5fd3ff;color:#1a1a2a;">新 获</span>
      </div>
      <div class="gacha-item" style="margin-top:8px;">
        <span class="gi-icon">⚔️</span>
        <span class="gi-label">前往 <b style="color:#ffe9b8">法宝阁</b> 查看并装备</span>
      </div>`;
      btn.textContent = '收 下';
      btn.className = 'final';
      btn.style.display = 'inline-block';
      btn.onclick = () => { overlay.classList.remove('show'); renderGachaTab(); };
    }
  };

  document.getElementById('singleDraw')!.onclick = () => {
    if (p.contribution < 120) return;
    drawAndShow(120, 1);
  };

  document.getElementById('tenDraw')!.onclick = () => {
    if (p.contribution < 1000) return;
    drawAndShow(1000, 10);
  };

  document.getElementById('hundredDraw')!.onclick = () => {
    if (p.contribution < 8000) return;
    drawAndShow(8000, 100);
  };
}
