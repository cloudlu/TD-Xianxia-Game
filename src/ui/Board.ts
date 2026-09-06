// 表现层：Canvas 棋盘渲染 + 输入（设计文档 §1.3 ui/Board）
// 引擎不依赖 UI，UI 只读 snapshot 渲染、把输入转成玩家操作。

import type { GameState } from '../engine/Game';
import type { FormationTile, FormationType, GridPoint, BlockedCell } from '../types';
import { BACKGROUNDS, DEFAULT_BACKGROUND } from '../data/config/backgrounds';
import { towerVisual, visualTier } from '../data/config/towerVisuals';
import { shakeOffset, NO_SHAKE } from '../engine/pure/shake';
import { drawMoodLight, drawDayTint, drawLeakVignette, drawFinalWaveRite, zoomPulseScale, type FxCtx } from './boardFx';
import { towerRange } from '../engine/combat/effectiveRange';

const CELL = 60;

// 皮肤光晕配色（hex，用于 #RRGGBBAA 拼接）
const EFFECT_RGB: Record<string, string> = {
  gold: '#ffd700',
  red: '#ff5252',
  green: '#66bb6a',
  blue: '#29b6f6',
};

const FORMATION_STYLE: Record<FormationType, { color: string; label: string; desc: string }> = {
  wind: { color: '#4fc3f7', label: '风', desc: '射程 +1.5' },
  thunder: { color: '#ffd54f', label: '雷', desc: '攻速 ×1.4' },
  earth: { color: '#81c784', label: '地', desc: '伤害 ×1.5' },
  spirit: { color: '#ce93d8', label: '灵', desc: '相邻阵眼塔各 +15%' },
};

export class Board {
  private ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  private paths: GridPoint[][] = [];
  skinResolver: ((towerId: string) => { icon: string; color: string; effect?: string } | null) | null = null;
  rangeAdd = 0;
  hoverCol = -1;
  hoverRow = -1;
  activeBuild: string | null = null;
  private ambientParticles: { x: number; y: number; vy: number; size: number; alpha: number; speed: number; color: string }[] = [];
  private currentAmbientColor = '#fffff0';
  private currentPathGlow = '#4a6fa5';
  private currentActivePaths: ReadonlyArray<number> | null = null;
  formations: FormationTile[] | null = null;
  /** 连杀 zoom 脉冲触发时间（-1=无，main.ts 击杀事件驱动） */
  streakAt = -1;

  constructor(private canvas: HTMLCanvasElement, cols: number, rows: number) {
    this.ctx = canvas.getContext('2d')!;
    this.cols = cols;
    this.rows = rows;
    canvas.width = cols * CELL;
    canvas.height = rows * CELL;
  }

  /** 切换关卡时更新棋盘尺寸 + 路径（不同关卡可能不同网格/路径） */
  configure(cols: number, rows: number, paths: ReadonlyArray<ReadonlyArray<GridPoint>>, formations?: FormationTile[] | null): void {
    this.cols = cols;
    this.rows = rows;
    this.paths = paths.map((p) => p.map((pt) => ({ ...pt })));
    this.formations = formations ?? null;
    this.canvas.width = cols * CELL;
    this.canvas.height = rows * CELL;
  }

  cellAt(clientX: number, clientY: number): { col: number; row: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { col: Math.floor(x / CELL), row: Math.floor(y / CELL) };
  }

  render(state: GameState, buildable: boolean[][]): void {
    const ctx = this.ctx;
    this.lastBuildable = buildable;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 连杀 zoom 脉冲（与震动互斥：zoom 激活时跳过 shake）
    const zoom = zoomPulseScale(this.streakAt, state.elapsed);
    let shake2x = 0, shake2y = 0;
    ctx.save();
    if (zoom > 1) {
      const cxp = this.canvas.width / 2, cyp = this.canvas.height / 2;
      ctx.translate(cxp, cyp); ctx.scale(zoom, zoom); ctx.translate(-cxp, -cyp);
    } else {
      // 屏幕震动：确定性相位偏移，整帧平移
      const shake = shakeOffset((state as any).shake ?? NO_SHAKE, state.elapsed);
      shake2x = shake.x; shake2y = shake.y;
      ctx.translate(shake.x, shake.y);
    }

    const bg = BACKGROUNDS[state.backgroundId ?? ''] ?? DEFAULT_BACKGROUND;
    this.currentAmbientColor = bg.ambient?.color ?? '#fffff0';
    this.currentPathGlow = bg.pathGlow;
    this.currentActivePaths = state.activePaths ?? null;

    // 格子底色
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * CELL, y = r * CELL;
        if (!buildable[r][c]) {
          ctx.fillStyle = bg.pathColor;
        } else {
          ctx.fillStyle = (c + r) % 2 === 0 ? bg.cellA : bg.cellB;
        }
        ctx.fillRect(x, y, CELL, CELL);
      }
    }

    // 地形障碍（在格子之上，路径之下）
    if (state.blocked) {
      for (const b of state.blocked) {
        this.drawTerrain(b.col, b.row, b.terrain);
      }
    }

    // 宗门基地
    if (state.base) {
      this.drawBase(state.base.x, state.base.y, bg.baseGlow, state.elapsed);
    }

    // 网格线（仅可建区，淡）
    ctx.strokeStyle = 'rgba(95,211,255,0.05)'; ctx.lineWidth = 1;
    for (let c = 0; c <= this.cols; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, this.rows * CELL); ctx.stroke(); }
    for (let r = 0; r <= this.rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(this.cols * CELL, r * CELL); ctx.stroke(); }

    // 路径发光缎带
    this.drawPath();

    // 阵眼标记
    if (this.formations) {
      for (const ft of this.formations) {
        const style = FORMATION_STYLE[ft.type];
        const cx = ft.col * CELL + CELL / 2;
        const cy = ft.row * CELL + CELL / 2;
        ctx.save();
        // 外圈光晕
        ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = style.color + '20';
        ctx.fill();
        ctx.strokeStyle = style.color + '88';
        ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
        // 内圈
        ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = '#0d1120cc';
        ctx.fill();
        ctx.strokeStyle = style.color + 'aa';
        ctx.lineWidth = 1.5; ctx.stroke();
        // 文字
        ctx.fillStyle = style.color;
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(style.label, cx, cy);
        ctx.restore();
      }
    }

    // 悬停预览
    this.drawHover(state);

    // 塔
    for (const t of state.towers) this.drawTower(t, state.elapsed);

    // —— 辅助塔特效层（塔身之上）——
    // ① 聚灵阵：常驻呼吸法阵（双圈反转 + 境界圈层）+ 射程淡虚线常显
    const auraTowersAll = state.towers.filter((t) => t.def.behavior === 'aura');
    for (const t of auraTowersAll) {
      const cx = (t.col + 0.5) * CELL, cy = (t.row + 0.5) * CELL;
      const lv = t.def.levels[t.level];
      const r = towerRange(lv.range, this.rangeAdd, t.onFormation) * CELL;
      const phase = state.elapsed;
      ctx.save();
      // 射程淡虚线常显
      ctx.strokeStyle = '#81c78433';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 7]);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // 呼吸法阵：外圈顺时针 / 内圈逆时针，圈数 = 境界档（tier+1）
      const tier = visualTier(t.level);
      const rings = 1 + tier;
      for (let ring = 0; ring < rings; ring++) {
        const rr = CELL * (0.45 + ring * 0.22);
        const dir = ring % 2 === 0 ? 1 : -1;
        const rot = phase * 0.8 * dir + ring * 0.8;
        const breathe = 0.5 + 0.5 * Math.sin(phase * 2 + ring);
        ctx.strokeStyle = `rgba(165,214,150,${0.25 + breathe * 0.25})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.arc(cx, cy, rr, rot, rot + Math.PI * 1.6); ctx.stroke();
        ctx.setLineDash([]);
      }
      // 中心太极纹（小圆双色，慢转）
      const tr = CELL * 0.16;
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(phase * 0.5);
      ctx.fillStyle = '#a5d6a766';
      ctx.beginPath(); ctx.arc(0, 0, tr, 0, Math.PI / 2); ctx.arc(-tr / 2, 0, tr / 2, Math.PI / 2, Math.PI * 1.5); ctx.fill();
      ctx.fillStyle = '#1b5e2066';
      ctx.beginPath(); ctx.arc(0, 0, tr, Math.PI / 2, Math.PI); ctx.arc(tr / 2, 0, tr / 2, Math.PI * 1.5, Math.PI / 2); ctx.fill();
      ctx.restore();
      ctx.restore();   // 法阵外层 save（v0.87 修复：此前漏掉导致 save 栈泄漏、画面滑动）
    }

    // ② buff 链接线：聚灵阵 → 范围内被增益塔，极淡流动光点
    for (const a of auraTowersAll) {
      const alv = a.def.levels[a.level];
      const ar = towerRange(alv.range, this.rangeAdd, a.onFormation);
      for (const t of state.towers) {
        if (t.uid === a.uid || t.def.behavior === 'aura') continue;
        const dx = t.x - a.x, dy = t.y - a.y;
        if (dx * dx + dy * dy > ar * ar) continue;
        const ax = a.x * CELL, ay = a.y * CELL;
        const bx = t.x * CELL, by = t.y * CELL;
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#a5d6a7';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        ctx.setLineDash([]);
        // 流动光点（相位沿线往返）
        ctx.globalAlpha = 0.5;
        const flow = (state.elapsed * 0.6 + (a.uid + t.uid) * 0.37) % 1;
        const px = ax + (bx - ax) * flow, py = ay + (by - ay) * flow;
        ctx.fillStyle = '#dcedc8';
        ctx.beginPath(); ctx.arc(px, py, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }

    // ③ 受增益塔绿环标记
    for (const t of state.towers) {
      if (t.def.behavior === 'aura') continue;
      const buffed = auraTowersAll.some((a) => {
        const alv = a.def.levels[a.level];
        const ar = towerRange(alv.range, this.rangeAdd, a.onFormation);
        const dx = t.x - a.x, dy = t.y - a.y;
        return a.uid !== t.uid && dx * dx + dy * dy <= ar * ar;
      });
      if (!buffed) continue;
      const cx = (t.col + 0.5) * CELL, cy = (t.row + 0.5) * CELL;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#a5d6a7';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.42, state.elapsed * 0.8, state.elapsed * 0.8 + Math.PI * 1.8); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // ④ 震地雷待机标识：半埋雷体 + 引信闪烁 + 触发范围暗圈
    for (const t of state.towers) {
      if (t.def.behavior !== 'mine') continue;
      const cx = (t.col + 0.5) * CELL, cy = (t.row + 0.5) * CELL;
      const lv = t.def.levels[t.level];
      const r = towerRange(lv.range, this.rangeAdd, t.onFormation) * CELL;
      const tier = visualTier(t.level);
      ctx.save();
      // 触发范围暗圈（土色极淡）
      ctx.fillStyle = '#8d6e6314';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8d6e6344';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // 半埋雷体（深色圆盘 + 埋土边缘）
      ctx.fillStyle = '#3e2723';
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5d4037';
      ctx.beginPath(); ctx.arc(cx, cy - 2, CELL * 0.18, 0, Math.PI * 2); ctx.fill();
      // 引信红点（相位闪烁，tier 越高越快）
      const blink = 0.5 + 0.5 * Math.sin(state.elapsed * (6 + tier * 3));
      ctx.fillStyle = `rgba(255,82,82,${0.4 + blink * 0.6})`;
      ctx.beginPath(); ctx.arc(cx, cy - CELL * 0.22, 2.5, 0, Math.PI * 2); ctx.fill();
      // 开火瞬间引信白热（flashTimer 高时引信变白亮 + 微光晕）
      if (t.flashTimer > 0) {
        ctx.globalAlpha = Math.min(1, t.flashTimer / 0.12) * 0.8;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx, cy - CELL * 0.22, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffab9144';
        ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    // 敌人（隐身敌人按是否在光环内决定可见度）
    const auraTowers = state.towers.filter((t) => t.def.behavior === 'aura');
    for (const e of state.enemies) this.drawEnemy(e, auraTowers);

    // BOSS 顶部大血条 + 狂暴全屏红光
    const boss = state.enemies.find((e) => !e.dead && e.def.bossAbility);
    if (boss) {
      const enraged = boss.def.bossAbility?.enrageBelow && boss.hp / boss.maxHp < boss.def.bossAbility.enrageBelow.hpPct;
      // 狂暴全屏红光脉冲（相位驱动）
      if (enraged) {
        const pulse2 = 0.5 + 0.5 * Math.sin(state.elapsed * 5);
        ctx.fillStyle = `rgba(255,40,40,${0.06 + pulse2 * 0.05})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
      const bw = this.canvas.width * 0.6, bh = 12;
      const bx = (this.canvas.width - bw) / 2, by = 10;
      ctx.fillStyle = '#000a';
      ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      const ratio = Math.max(0, boss.hp / boss.maxHp);
      const hpGrad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      hpGrad.addColorStop(0, enraged ? '#ff1744' : '#ff5252');
      hpGrad.addColorStop(1, enraged ? '#ff8a80' : '#ffab91');
      ctx.fillStyle = hpGrad;
      ctx.fillRect(bx, by, bw * ratio, bh);
      // 狂暴阈值刻度线
      const threshold = boss.def.bossAbility?.enrageBelow?.hpPct;
      if (threshold) {
        ctx.strokeStyle = '#ffd700aa';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx + bw * threshold, by); ctx.lineTo(bx + bw * threshold, by + bh); ctx.stroke();
      }
      ctx.fillStyle = enraged ? '#ff6b6b' : '#ffd93d';
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(`${boss.def.name}${enraged ? ' · 狂暴' : ''}`, this.canvas.width / 2, by - 4);
    }

    // 弹道（流派形状化：剑形/符纸/枪形/冰晶/火球/电弧）+ faint 主次区分
    for (const p of state.projectiles) {
      const cx = p.x * CELL, cy = p.y * CELL;
      const spec = towerVisual(p.school ?? 'sword');
      const tier = p.tier ?? 0;
      const faint = !!p.faint;
      // 飞行方向：发射点 → 当前位置（剑尖/枪头朝前）
      const fdx = (p.fromX ?? p.x) - p.x, fdy = (p.fromY ?? p.y) - p.y;
      const flen = Math.hypot(fdx, fdy) || 1;
      const ux = fdx / flen, uy = fdy / flen;         // 指向后方（拖尾方向）
      const ang = Math.atan2(-uy, -ux);                // 飞行朝向角
      const trailLen = (10 + tier * 5) * spec.trailMul;
      const tx = cx + ux * trailLen, ty = cy + uy * trailLen;
      ctx.save();
      if (faint) { ctx.globalAlpha = 0.45; }
      // 高境界残影分身：tier2 在轨迹后段画两个渐隐副本
      if (tier >= 2 && !faint) {
        for (let g = 1; g <= 2; g++) {
          const gd = g * trailLen * 0.22;
          ctx.globalAlpha = 0.25 / g;
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(cx + ux * gd, cy + uy * gd, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      if (spec.trail === 'blade') {
        // 剑形弹道：剑身菱形长条 + 剑柄横档 + 剑尖朝飞行方向，tier2 带剑穗
        const bladeLen = 16 + tier * 4;
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(ang);
        // 拖尾光
        const grad = ctx.createLinearGradient(-bladeLen * 1.6, 0, 0, 0);
        grad.addColorStop(0, p.color + '00');
        grad.addColorStop(1, p.color + 'aa');
        ctx.strokeStyle = grad; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-bladeLen * 1.6, 0); ctx.lineTo(0, 0); ctx.stroke();
        // 剑身（细长菱形）
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(bladeLen * 0.5, 0);                 // 剑尖
        ctx.lineTo(0, -2.5);
        ctx.lineTo(-bladeLen * 0.4, -1.5);
        ctx.lineTo(-bladeLen * 0.4, 1.5);
        ctx.lineTo(0, 2.5);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ffffff99'; ctx.lineWidth = 0.8; ctx.stroke();
        // 剑柄横档 + 柄
        ctx.strokeStyle = '#cfa76b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-bladeLen * 0.4, -4); ctx.lineTo(-bladeLen * 0.4, 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-bladeLen * 0.4, 0); ctx.lineTo(-bladeLen * 0.62, 0); ctx.stroke();
        // 高境界剑穗（相位摆动）
        if (tier >= 2) {
          const sway = Math.sin(state.elapsed * 20) * 2;
          ctx.strokeStyle = '#ffd700bb'; ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-bladeLen * 0.62, 0);
          ctx.quadraticCurveTo(-bladeLen * 0.75, sway, -bladeLen * 0.85, sway * 1.5);
          ctx.stroke();
        }
        ctx.restore();
      } else if (spec.trail === 'bolt') {
        // 雷电：锯齿折线（faint 时更细）
        ctx.strokeStyle = tier >= 2 ? '#eaeaff' : p.color;
        ctx.lineWidth = faint ? 1.2 : 2;
        ctx.beginPath(); ctx.moveTo(tx, ty);
        const segs = 4;
        for (let i = 1; i < segs; i++) {
          const f = i / segs;
          const nx = tx + (cx - tx) * f - uy * ((i % 2 === 0 ? 1 : -1) * 3);
          const ny = ty + (cy - ty) * f + ux * ((i % 2 === 0 ? 1 : -1) * 3);
          ctx.lineTo(nx, ny);
        }
        ctx.lineTo(cx, cy); ctx.stroke();
      } else if (spec.trail === 'ice') {
        // 六棱冰晶：旋转雪花本体 + 淡蓝拖尾
        const grad = ctx.createLinearGradient(tx, ty, cx, cy);
        grad.addColorStop(0, '#81d4fa00');
        grad.addColorStop(1, '#81d4fabb');
        ctx.strokeStyle = grad; ctx.lineWidth = faint ? 1.5 : 3;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(cx, cy); ctx.stroke();
        // 雪花（六向冰枝，相位旋转）
        const rot = state.elapsed * 6;
        const r = 5 + tier;
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(rot);
        ctx.strokeStyle = faint ? '#b3e5fc88' : '#e1f5fe';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.stroke();
          // 冰枝小杈
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
          ctx.lineTo(Math.cos(a + 0.5) * r * 0.85, Math.sin(a + 0.5) * r * 0.85);
          ctx.stroke();
        }
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (spec.trail === 'paper') {
        // 符纸：竖长矩形 + 朱砂符文点 + 飘动（相位摆动，随飞行方向旋转）
        const sway = Math.sin(state.elapsed * 12) * 0.25;
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(ang + sway);
        ctx.globalAlpha *= 0.9;
        // 纸体
        ctx.fillStyle = '#f5e9c8';
        ctx.fillRect(-5, -3.5, 10, 7);
        ctx.strokeStyle = p.color + 'cc'; ctx.lineWidth = 1;
        ctx.strokeRect(-5, -3.5, 10, 7);
        // 朱砂符文点（三点竖排）
        ctx.fillStyle = '#c62828';
        ctx.beginPath(); ctx.arc(-2, 0, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(1, 0, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3.5, 0, 0.8, 0, Math.PI * 2); ctx.fill();
        // 残影（后方淡色副本）
        ctx.globalAlpha *= 0.35;
        ctx.fillStyle = p.color;
        ctx.fillRect(-5, -3.5 + uy * 8, 10, 7);
        ctx.restore();
      } else if (spec.trail === 'beam') {
        // 枪形：长杆细线 + 三角枪镞 + 拖尾光带
        const spearLen = 22 + tier * 5;
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(ang);
        // 光带拖尾
        const grad = ctx.createLinearGradient(-spearLen * 1.5, 0, 0, 0);
        grad.addColorStop(0, p.color + '00');
        grad.addColorStop(1, p.color + (faint ? '66' : 'aa'));
        ctx.strokeStyle = grad; ctx.lineWidth = faint ? 2 : 4;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-spearLen * 1.5, 0); ctx.lineTo(-spearLen * 0.2, 0); ctx.stroke();
        // 枪杆
        ctx.strokeStyle = faint ? '#8d6e6399' : '#a1887f';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-spearLen * 0.55, 0); ctx.lineTo(spearLen * 0.2, 0); ctx.stroke();
        // 枪镞（三角）
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(spearLen * 0.5, 0);
        ctx.lineTo(spearLen * 0.15, -3);
        ctx.lineTo(spearLen * 0.15, 3);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 0.8; ctx.stroke();
        // 红缨（相位摆动）
        const sway2 = Math.sin(state.elapsed * 18) * 1.5;
        ctx.strokeStyle = '#e53935cc'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(spearLen * 0.15, 0);
        ctx.quadraticCurveTo(spearLen * 0.05, sway2, -spearLen * 0.02, sway2 * 1.6);
        ctx.stroke();
        ctx.restore();
      } else {
        // orb → 火球：核心圆 + 外焰摇摆（相位驱动），tier 越大外焰越大
        const grad = ctx.createLinearGradient(tx, ty, cx, cy);
        grad.addColorStop(0, p.color + '00');
        grad.addColorStop(1, p.color + '88');
        ctx.strokeStyle = grad; ctx.lineWidth = faint ? 1.5 : 3;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(cx, cy); ctx.stroke();
        // 外焰（三层不规则爪形，相位摇摆）
        const flameR = 5 + tier * 1.5;
        for (let layer = 0; layer < 2; layer++) {
          const lr = flameR * (layer === 0 ? 1 : 0.6);
          ctx.fillStyle = layer === 0 ? p.color + '88' : '#ffcc80cc';
          ctx.beginPath();
          for (let i = 0; i <= 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const wob = 1 + 0.35 * Math.sin(a * 3 + state.elapsed * (14 + layer * 5));
            const px = cx + Math.cos(a) * lr * wob;
            const py = cy + Math.sin(a) * lr * wob;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.fill();
        }
        // 核心
        ctx.fillStyle = '#fff3e0';
        ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      // 核心亮点（非形状化弹道用；形状化的也无害）
      if (spec.trail === 'bolt') {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff88';
        ctx.beginPath(); ctx.arc(cx, cy, 1.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // 战斗特效：飘字伤害 + 死亡消散 + BOSS 冲击波 + 升级爆发
    for (const fx of state.effects) {
      if (fx.maxLife <= 0) continue;
      const t = Math.min(1, fx.life / fx.maxLife);   // 1→0；life>maxLife（延迟启动）视为 1 前不渲染
      if (fx.life > fx.maxLife) continue;
      if (fx.kind === 'dmg') {
        ctx.globalAlpha = Math.max(0, t);
        const isCrit = (fx as any).crit;
        ctx.fillStyle = fx.color;
        ctx.font = isCrit ? 'bold 16px sans-serif' : 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (isCrit) {
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          ctx.strokeText(fx.text ?? '', fx.x * CELL, fx.y * CELL);
        }
        ctx.fillText(fx.text ?? '', fx.x * CELL, fx.y * CELL);
        ctx.globalAlpha = 1;
      } else if (fx.kind === 'shockwave') {
        const progress = 1 - t;
        const rad = CELL * (0.2 + progress * 1.2);
        ctx.globalAlpha = Math.max(0, (1 - progress) * 0.7);
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 4 - progress * 3;
        ctx.beginPath(); ctx.arc(fx.x * CELL, fx.y * CELL, rad, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = fx.color + '22';
        ctx.beginPath(); ctx.arc(fx.x * CELL, fx.y * CELL, rad, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (fx.kind === 'burst') {
        const progress = 1 - t;
        const rad = CELL * (0.1 + progress * 0.6);
        ctx.globalAlpha = Math.max(0, 1 - progress);
        // 外圈金光
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3 - progress * 2;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + progress * 2;
          const x1 = fx.x * CELL + Math.cos(angle) * rad * 0.3;
          const y1 = fx.y * CELL + Math.sin(angle) * rad * 0.3;
          const x2 = fx.x * CELL + Math.cos(angle) * rad;
          const y2 = fx.y * CELL + Math.sin(angle) * rad;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
        // 中心光晕
        ctx.fillStyle = '#ffd70055';
        ctx.beginPath(); ctx.arc(fx.x * CELL, fx.y * CELL, rad * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff44';
        ctx.beginPath(); ctx.arc(fx.x * CELL, fx.y * CELL, rad * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (fx.kind === 'realmup') {
        // 境界突破：流派差异化华丽特效
        const progress = 1 - t;
        const spec = towerVisual(fx.school ?? 'sword');
        const tier = fx.tier ?? 0;
        const x = fx.x * CELL, y = fx.y * CELL;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress);
        const accent = spec.accent;
        if (spec.realmUp === 'sword') {
          // 剑：环形剑气旋转后炸开
          const rad = CELL * (0.3 + progress * 0.9);
          for (let i = 0; i < 3 + tier; i++) {
            const a0 = progress * 5 + (i / (3 + tier)) * Math.PI * 2;
            ctx.strokeStyle = i % 2 === 0 ? accent : '#ffd700';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(x, y, rad, a0, a0 + 1.1);
            ctx.stroke();
          }
        } else if (spec.realmUp === 'talisman') {
          // 符：符文文字盘旋上升
          const glyphs = ['敕', '令', '罡', '气'];
          for (let i = 0; i < 4; i++) {
            const a = progress * 4 + (i / 4) * Math.PI * 2;
            const gx = x + Math.cos(a) * CELL * 0.6;
            const gy = y + Math.sin(a) * CELL * 0.35 - progress * CELL * 0.8;
            ctx.fillStyle = accent;
            ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(glyphs[i], gx, gy);
          }
        } else if (spec.realmUp === 'spear') {
          // 枪：十字贯穿光束
          const len = CELL * (0.4 + progress * 1.4);
          ctx.strokeStyle = accent; ctx.lineWidth = 3.5 - progress * 2; ctx.lineCap = 'round';
          for (let i = 0; i < 2; i++) {
            const a = i * Math.PI / 2 + progress * 0.6;
            ctx.beginPath();
            ctx.moveTo(x - Math.cos(a) * len, y - Math.sin(a) * len);
            ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
            ctx.stroke();
          }
        } else if (spec.realmUp === 'aura') {
          // 阵：六边形法阵描线展开
          const rad = CELL * (0.2 + progress * 0.8);
          ctx.strokeStyle = accent; ctx.lineWidth = 2;
          for (let ring = 0; ring < 1 + tier; ring++) {
            const rr = rad * (1 - ring * 0.25);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (i / 6) * Math.PI * 2 + progress * 2;
              const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
              i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath(); ctx.stroke();
          }
        } else if (spec.realmUp === 'fire') {
          // 火：火柱冲天 + 火星
          const h = CELL * (1.2 - progress * 0.6);
          const grad = ctx.createLinearGradient(x, y + CELL * 0.3, x, y - h);
          grad.addColorStop(0, '#ff8a65cc'); grad.addColorStop(0.6, accent + '88'); grad.addColorStop(1, accent + '00');
          ctx.fillStyle = grad;
          ctx.fillRect(x - CELL * 0.14, y - h, CELL * 0.28, h + CELL * 0.3);
          for (let i = 0; i < 5 + tier * 3; i++) {
            const a = (i / (5 + tier * 3)) * Math.PI * 2;
            ctx.fillStyle = '#ffab91';
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * CELL * 0.5 * progress, y + Math.sin(a) * CELL * 0.5 * progress - progress * 14, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (spec.realmUp === 'thunder') {
          // 雷：落雷劈身 + 闪白
          ctx.strokeStyle = tier >= 2 ? '#ffffff' : accent; ctx.lineWidth = 3;
          ctx.beginPath();
          let lx = x + (progress - 0.5) * 20, ly = y - CELL * 1.6;
          ctx.moveTo(lx, ly);
          for (let i = 0; i < 4; i++) {
            lx += (i % 2 === 0 ? 1 : -1) * 8;
            ly += CELL * 0.4;
            ctx.lineTo(lx, ly);
          }
          ctx.lineTo(x, y); ctx.stroke();
          ctx.globalAlpha = Math.max(0, 0.35 - progress * 0.5);
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          ctx.globalAlpha = Math.max(0, 1 - progress);
        } else if (spec.realmUp === 'ice') {
          // 冰：冰晶绽放（六向尖晶）
          const len = CELL * (0.3 + progress * 0.9);
          ctx.strokeStyle = accent; ctx.lineWidth = 2.5;
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * len, y + Math.sin(a) * len, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#e1f5fe'; ctx.fill();
          }
        } else {
          // earth：地裂纹路蔓延
          ctx.strokeStyle = accent; ctx.lineWidth = 2;
          for (let i = 0; i < 5 + tier * 2; i++) {
            const a = (i / (5 + tier * 2)) * Math.PI * 2 + 0.4;
            const len = CELL * (0.3 + progress * 1.1);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5);
            ctx.lineTo(x + Math.cos(a + 0.3) * len, y + Math.sin(a + 0.3) * len);
            ctx.stroke();
          }
        }
        // 共通：金色中心光晕（保留原突破金光感）
        const rad = CELL * (0.15 + progress * 0.5);
        ctx.fillStyle = '#ffd70055';
        ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff66';
        ctx.beginPath(); ctx.arc(x, y, rad * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
      } else if (fx.kind === 'hit') {
        // 命中特效：流派差异化（查表渲染，样式在 towerVisuals.hit）
        const progress = 1 - t;
        const spec = towerVisual(fx.school ?? 'sword');
        const tier = fx.tier ?? 0;
        const x = fx.x * CELL, y = fx.y * CELL;
        const scale = (fx.crit ? 1.6 : 1) * (1 + tier * 0.2);
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress);
        if (spec.hit === 'slash') {
          // 剑：斜切闪光（两道交叉短线）
          const len = CELL * 0.35 * scale;
          ctx.strokeStyle = fx.crit ? '#ffd700' : '#ffffff';
          ctx.lineWidth = 2.5 - progress * 1.5;
          ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - len, y - len); ctx.lineTo(x + len, y + len); ctx.stroke();
          ctx.globalAlpha *= 0.6;
          ctx.beginPath(); ctx.moveTo(x + len * 0.7, y - len * 0.7); ctx.lineTo(x - len * 0.7, y + len * 0.7); ctx.stroke();
        } else if (spec.hit === 'ink') {
          // 符：墨点晕开
          const rad = CELL * 0.3 * scale * progress;
          ctx.fillStyle = (fx.crit ? '#ffd700' : spec.accent) + 'aa';
          ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = spec.accent;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(x, y, rad * 1.3, 0, Math.PI * 2); ctx.stroke();
        } else if (spec.hit === 'impact') {
          // 枪/地：撞击星芒
          const len = CELL * 0.3 * scale;
          ctx.strokeStyle = fx.crit ? '#ffd700' : spec.accent;
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * len * 0.3, y + Math.sin(a) * len * 0.3);
            ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
            ctx.stroke();
          }
        } else if (spec.hit === 'ring') {
          // 火/阵：爆炸圈（有 radius 时按实际 AOE 半径渲染，无则小圈）
          const baseR = fx.radius ? fx.radius * CELL : CELL * 0.2;
          const rad = baseR * (0.4 + progress * 0.8);
          ctx.strokeStyle = fx.crit ? '#ffd700' : spec.accent;
          ctx.lineWidth = 3.5 - progress * 2.5;
          ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
          // 内焰填充
          const grad2 = ctx.createRadialGradient(x, y, 0, x, y, rad);
          grad2.addColorStop(0, (fx.crit ? '#ffd700' : spec.accent) + '66');
          grad2.addColorStop(1, spec.accent + '00');
          ctx.fillStyle = grad2;
          ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
        } else if (spec.hit === 'crater') {
          // 地雷爆炸：按实际 aoeRadius 画弹坑裂纹圈 + 土块飞溅（相位推算轨迹，无随机）
          const baseR = fx.radius ? fx.radius * CELL : CELL * 0.8;
          const rad = baseR * (0.5 + progress * 0.7);
          // 弹坑主体（暗色填充 + 土色描边）
          ctx.fillStyle = '#3e272388';
          ctx.beginPath(); ctx.arc(x, y, rad * 0.8, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = spec.accent;
          ctx.lineWidth = 3.5 - progress * 2;
          ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
          // 放射裂纹（6 条锯齿线，相位展开）
          ctx.strokeStyle = '#5d4037cc';
          ctx.lineWidth = 1.8;
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + 0.3;
            const clen = rad * (0.9 + 0.25 * Math.sin(i * 2.7));
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * rad * 0.3, y + Math.sin(a) * rad * 0.3);
            ctx.lineTo(x + Math.cos(a + 0.2) * clen * 0.65, y + Math.sin(a + 0.2) * clen * 0.65);
            ctx.lineTo(x + Math.cos(a) * clen, y + Math.sin(a) * clen);
            ctx.stroke();
          }
          // 尘土外环（扩散淡圈）
          ctx.globalAlpha *= 0.5;
          ctx.strokeStyle = '#8d6e63';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y, rad * (1.1 + progress * 0.3), 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = Math.max(0, 1 - progress);
          // 土块飞溅（8 块抛物线，相位推算）
          ctx.fillStyle = '#6d4c41';
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + 0.4;
            const d = rad * (0.5 + progress * 1.1);
            const h = Math.sin(progress * Math.PI) * 10;   // 抛物线高度
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d - h, 2.5 - progress * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (spec.hit === 'spark') {
          // 雷：电火花分支
          ctx.strokeStyle = fx.crit ? '#ffd700' : '#eaeaff';
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2 + progress * 3;
            let px = x, py = y;
            ctx.beginPath(); ctx.moveTo(px, py);
            for (let s = 0; s < 3; s++) {
              px += Math.cos(a + s * 0.5) * CELL * 0.12 * scale;
              py += Math.sin(a + s * 0.5) * CELL * 0.12 * scale;
              ctx.lineTo(px, py);
            }
            ctx.stroke();
          }
        } else {
          // frost：冰霜碎晶
          ctx.fillStyle = fx.crit ? '#ffd700' : '#b3e5fc';
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            const d = CELL * 0.15 * scale * (0.5 + progress);
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d - progress * 5, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      } else { // poof：击杀消散（按敌人类型分化）
        const style = fx.style ?? 'normal';
        const x = fx.x * CELL, y = fx.y * CELL;
        if (style === 'boss') {
          // BOSS：多层爆散（三层扩散环 + 径向碎片）
          const progress = 1 - t;
          for (let ring = 0; ring < 3; ring++) {
            const rad = CELL * (0.25 + progress * (1.2 + ring * 0.5));
            ctx.globalAlpha = Math.max(0, (1 - progress) * (0.8 - ring * 0.2));
            ctx.strokeStyle = ring === 1 ? '#ffd700' : fx.color;
            ctx.lineWidth = 4 - ring - progress * 2;
            ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.globalAlpha = Math.max(0, 1 - progress);
          ctx.fillStyle = fx.color;
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            const d = CELL * 0.4 + progress * CELL * 1.3;
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d - progress * 10, 3 - progress * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (style === 'feather') {
          // 飞行怪：羽毛飘落（轻羽下沉 + 摇摆）
          const progress = 1 - t;
          ctx.globalAlpha = Math.max(0, t * 0.9);
          for (let i = 0; i < 5; i++) {
            const sway = Math.sin(progress * 5 + i * 1.7) * 8;
            const px = x + (i - 2) * 7 + sway;
            const py = y + progress * (18 + i * 5);
            ctx.fillStyle = i % 2 === 0 ? fx.color : '#ffffffbb';
            ctx.beginPath();
            ctx.ellipse(px, py, 2, 4, sway * 0.05, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (style === 'elite') {
          // 精英：金色星散
          const rad = CELL * (0.3 + (1 - t) * 0.7);
          ctx.globalAlpha = Math.max(0, t * 0.9);
          ctx.strokeStyle = '#ffd93d';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#ffd93daa';
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const d = rad * 0.8;
            ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 2, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          // 普通：原扩散消散圈
          const rad = CELL * (0.3 + (1 - t) * 0.5);
          ctx.globalAlpha = Math.max(0, t * 0.8);
          ctx.strokeStyle = fx.color;
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = fx.color + '33';
          ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    // 终点/起点标记（波次开场 1.5s 内入口聚气光柱演出）
    this.drawEndpoints(state);

    // 波次开场演出：入口聚气光柱 + 环形收束（1.5s）
    const waveAge = state.elapsed - (state.waveStartTime ?? -999);
    if (state.waveActive && waveAge >= 0 && waveAge < 1.5) {
      const t2 = waveAge / 1.5;
      for (let pi = 0; pi < this.paths.length; pi++) {
        const isActive = !this.currentActivePaths || this.currentActivePaths.includes(pi);
        if (!isActive) continue;
        const p0 = this.paths[pi][0];
        const cx = (p0.x + 0.5) * CELL, cy = (p0.y + 0.5) * CELL;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t2) * 0.8;
        // 聚气光柱（上升渐隐）
        const grad3 = ctx.createLinearGradient(cx, cy, cx, cy - CELL * 1.6 * t2);
        grad3.addColorStop(0, '#ff646466');
        grad3.addColorStop(1, '#ff646400');
        ctx.strokeStyle = grad3;
        ctx.lineWidth = 4 - t2 * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - CELL * 1.6 * t2); ctx.stroke();
        // 环形收束（半径从大到小收向入口）
        ctx.strokeStyle = '#ff8a80';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, CELL * (1.2 - t2 * 1.0), 0, Math.PI * 2); ctx.stroke();
        // 妖气粒子（相位推算，无随机）
        for (let i = 0; i < 4; i++) {
          const a = t2 * 6 + i * Math.PI / 2;
          const d = CELL * (0.8 - t2 * 0.6);
          ctx.fillStyle = '#ffab91aa';
          ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }

    // 环境粒子（灵气）
    this.updateAmbient(state.status);
    for (const p of this.ambientParticles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- 全屏特效层（v0.87 boardFx）：时段色温 → 灵气光照 → 漏怪红晕 → 最后一波仪式 ----
    const fxCtx: FxCtx = { ctx, w: this.canvas.width, h: this.canvas.height, elapsed: state.elapsed };
    drawDayTint(fxCtx, state.waveIndex, state.totalWaves);
    const bossAliveNow = state.enemies.some((e) => !e.dead && !!e.def.bossAbility);
    drawMoodLight(fxCtx, state.status === 'won' ? 'won' : state.status === 'lost' ? 'lost' : state.status === 'prep' ? 'prep' : 'wave', bossAliveNow);
    drawLeakVignette(fxCtx, state.lastLeakAt ?? -1);
    drawFinalWaveRite(fxCtx, state.finalWaveAt ?? -1,
      state.waveActive && state.totalWaves > 0 && state.waveIndex === state.totalWaves - 1);

    // 暗角（vignette）
    const vg = ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.3, this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.restore(); // 震动/zoom 变换结束
  }

  /** 环境灵气粒子更新 */
  private updateAmbient(status: string): void {
    const w = this.canvas.width, h = this.canvas.height;
    const spawnRate = status === 'prep' ? 0.4 : 0.15;
    if (Math.random() < spawnRate) {
      this.ambientParticles.push({
        x: Math.random() * w,
        y: h + 5,
        vy: -(0.3 + Math.random() * 0.5),
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.15 + Math.random() * 0.2,
        speed: 0.3 + Math.random() * 0.5,
        color: this.currentAmbientColor,
      });
    }
    for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
      const p = this.ambientParticles[i];
      p.y += p.vy * p.speed;
      p.alpha -= 0.002;
      if (p.y < -10 || p.alpha <= 0) {
        this.ambientParticles.splice(i, 1);
      }
    }
  }

  private drawPath(): void {
    const ctx = this.ctx;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const trace = (path: GridPoint[]) => {
      ctx.beginPath();
      ctx.moveTo((path[0].x + 0.5) * CELL, (path[0].y + 0.5) * CELL);
      for (let i = 1; i < path.length; i++) ctx.lineTo((path[i].x + 0.5) * CELL, (path[i].y + 0.5) * CELL);
    };
    for (let pi = 0; pi < this.paths.length; pi++) {
      const isActive = !this.currentActivePaths || this.currentActivePaths.includes(pi);
      const path = this.paths[pi];
      if (path.length < 2) continue;
      if (!isActive) {
        trace(path);
        ctx.strokeStyle = 'rgba(120,120,120,0.08)'; ctx.lineWidth = CELL * 0.85; ctx.stroke();
        trace(path);
        ctx.strokeStyle = 'rgba(100,100,100,0.25)'; ctx.lineWidth = CELL * 0.6; ctx.stroke();
        trace(path);
        ctx.strokeStyle = 'rgba(140,140,140,0.25)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    for (let pi = 0; pi < this.paths.length; pi++) {
      const isActive = !this.currentActivePaths || this.currentActivePaths.includes(pi);
      const path = this.paths[pi];
      if (path.length < 2) continue;
      if (isActive) {
        trace(path);
        ctx.strokeStyle = 'rgba(200,160,90,0.12)'; ctx.lineWidth = CELL * 0.85; ctx.stroke();
        trace(path);
        ctx.strokeStyle = 'rgba(140,100,45,0.55)'; ctx.lineWidth = CELL * 0.6; ctx.stroke();
        trace(path);
        ctx.strokeStyle = this.currentPathGlow + '66'; ctx.lineWidth = 2; ctx.setLineDash([8, 10]); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }
  private lastBuildable: boolean[][] = [];

  private drawHover(state: GameState): void {
    const ctx = this.ctx;
    const { hoverCol: c, hoverRow: r } = this;
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return;
    const x = c * CELL, y = r * CELL;
    const tower = state.towers.find((t) => t.col === c && t.row === r);

    if (tower) {
      // 显示该塔射程：原始范围（淡）+ 加成范围（亮，若有加成）
      const lv = tower.def.levels[tower.level];
      const baseR = lv.range * CELL;
      const finalR = towerRange(lv.range, this.rangeAdd, tower.onFormation) * CELL;
      ctx.fillStyle = tower.def.color + '22';
      ctx.strokeStyle = tower.def.color + 'aa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tower.x * CELL, tower.y * CELL, baseR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (finalR > baseR + 0.001) {
        ctx.strokeStyle = '#ffd93d';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(tower.x * CELL, tower.y * CELL, finalR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // 选中描边
      ctx.strokeStyle = '#ffd93d';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
    } else if (this.lastBuildable[r][c] && this.activeBuild) {
      // 建塔预览
      ctx.strokeStyle = '#5fd3ff88';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4);
      const def = this.activeBuildDef;
      if (def) {
        const lv = def.levels[0];
        const fmt = this.formations?.find((f) => f.col === c && f.row === r)?.type ?? null;
        const baseR = lv.range * CELL;
        const finalR = towerRange(lv.range, this.rangeAdd, fmt) * CELL;
        ctx.fillStyle = def.color + '18';
        ctx.strokeStyle = def.color + '66';
        ctx.beginPath();
        ctx.arc((c + 0.5) * CELL, (r + 0.5) * CELL, baseR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (finalR > baseR + 0.001) {
          ctx.strokeStyle = '#ffd93d';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.arc((c + 0.5) * CELL, (r + 0.5) * CELL, finalR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // 阵眼悬停说明
    const ft = this.formations?.find((f) => f.col === c && f.row === r);
    if (ft && !tower) {
      const style = FORMATION_STYLE[ft.type];
      const tooltip = `${style.label}眼 · ${style.desc}`;
      const tw = tooltip.length * 9;
      const tx = Math.min(x, this.canvas.width - tw - 8);
      const ty = y + CELL + 6;
      ctx.save();
      ctx.fillStyle = 'rgba(13,17,32,0.92)';
      ctx.strokeStyle = style.color + 'aa';
      ctx.lineWidth = 1;
      this.roundRect(tx, ty, tw + 10, 24, 4);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = style.color;
      ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(tooltip, tx + 6, ty + 12);
      ctx.restore();
    }
  }
  private activeBuildDef: { levels: { range: number }[]; color: string } | null = null;
  setActiveBuild(id: string | null, def: { levels: { range: number }[]; color: string } | null) {
    this.activeBuild = id;
    this.activeBuildDef = def;
  }

  private drawTower(t: GameState['towers'][number], now: number): void {
    const ctx = this.ctx;
    // 开火后坐：发射瞬间（flashTimer 高）塔身向发射反方向回弹 2px，随衰减恢复
    const fireKick = t.flashTimer > 0 ? Math.min(1, t.flashTimer / 0.12) : 0;
    const kickX = fireKick > 0 ? Math.sin(now * 31.7) * 2 * fireKick : 0;
    const kickY = fireKick > 0 ? Math.cos(now * 27.9) * 2 * fireKick : 0;
    const cx = (t.col + 0.5) * CELL + kickX, cy = (t.row + 0.5) * CELL + kickY;
    const x = t.col * CELL, y = t.row * CELL;
    const disabled = t.disabledUntil > now;
    const skin = this.skinResolver?.(t.def.id) ?? null;
    const color = skin?.color ?? t.def.color;
    const icon = skin?.icon ?? t.def.icon;
    const effectColor = skin?.effect ? EFFECT_RGB[skin.effect] ?? null : null;
    ctx.save();
    if (effectColor) {
      const pulse = 0.5 + 0.5 * Math.sin(now * 4);
      ctx.fillStyle = effectColor + Math.floor(40 + 50 * pulse).toString(16).padStart(2, '0');
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = disabled ? 0.4 : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(cx, y + CELL - 3, CELL * 0.3, 5, 0, 0, Math.PI * 2); ctx.fill();
    const baseY = y + CELL - 4;
    const tiers = Math.min(t.level + 1, 3);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(cx - CELL * 0.34, baseY - 3, CELL * 0.68, 5);
    ctx.fillStyle = '#795548';
    ctx.fillRect(cx - CELL * 0.28, baseY - 6, CELL * 0.56, 3);
    for (let i = 0; i < tiers; i++) {
      const s = 1 - i * 0.18;
      const tw = CELL * 0.26 * s;
      const th = CELL * 0.16;
      const ty = baseY - 6 - i * (th + 10) - th;
      ctx.fillStyle = color;
      ctx.fillRect(cx - tw, ty, tw * 2, th);
      ctx.strokeStyle = '#0003'; ctx.lineWidth = 1; ctx.strokeRect(cx - tw, ty, tw * 2, th);
      ctx.fillStyle = '#ffd70022';
      ctx.fillRect(cx - tw * 0.25, ty + 2, tw * 0.5, th - 4);
      const rw = tw + 6 + i * 1;
      ctx.fillStyle = i === tiers - 1 ? '#6d4c41' : '#8d6e63';
      ctx.beginPath();
      ctx.moveTo(cx - rw, ty);
      ctx.quadraticCurveTo(cx - rw + 4, ty - 3, cx - rw + 7, ty);
      ctx.lineTo(cx - tw, ty - 7);
      ctx.lineTo(cx + tw, ty - 7);
      ctx.lineTo(cx + rw - 7, ty);
      ctx.quadraticCurveTo(cx + rw - 4, ty - 3, cx + rw, ty);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#a1887f55'; ctx.lineWidth = 0.5; ctx.stroke();
    }
    const topY = baseY - 6 - tiers * (CELL * 0.16 + 10) - 7;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.moveTo(cx, topY - 10); ctx.lineTo(cx - 4, topY - 3); ctx.lineTo(cx + 4, topY - 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd70066';
    ctx.beginPath(); ctx.arc(cx, topY - 12, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(icon, cx, cy - 1);
    ctx.globalAlpha = 1;
    for (let i = 0; i <= t.level; i++) {
      ctx.fillStyle = '#000a'; ctx.beginPath(); ctx.arc(x + 6 + i * 6, y + 6, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd93d'; ctx.beginPath(); ctx.arc(x + 6 + i * 6, y + 6, 2, 0, Math.PI * 2); ctx.fill();
    }
    if (disabled) {
      ctx.fillStyle = '#ff9b6b'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('眩', cx, y + 12);
    }
    if (t.flashTimer > 0 && !disabled) {
      const intensity = Math.min(1, t.flashTimer / 0.12);
      ctx.globalAlpha = intensity * 0.6;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.2, 0, Math.PI * 2); ctx.fill();
    }
    // 塔闲置 idle 动画（v0.87 批次3）：按流派微动效，相位驱动无随机
    if (!disabled) {
      const school = t.def.school;
      const ph = now;
      if (school === 'talisman') {
        // 符塔：顶上飘小符字（循环上浮渐隐）
        const glyphs = ['敕', '令'];
        for (let i = 0; i < 2; i++) {
          const cyc = ((ph * 0.5 + i * 0.5) % 1);
          ctx.globalAlpha = (1 - cyc) * 0.6;
          ctx.fillStyle = '#c9a0ff';
          ctx.font = '10px "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(glyphs[i], cx + (i === 0 ? -6 : 6), y + 10 - cyc * 16);
        }
        ctx.globalAlpha = 1;
      } else if (school === 'thunder') {
        // 雷塔：塔顶电弧游走（短折线，相位跳动）
        if (Math.sin(ph * 7) > 0.2) {
          ctx.strokeStyle = '#eaeaffcc'; ctx.lineWidth = 1.2;
          ctx.beginPath();
          let ax2 = cx - 5, ay2 = y + 8;
          ctx.moveTo(ax2, ay2);
          for (let s = 0; s < 3; s++) {
            ax2 += 3.5 + Math.sin(ph * 13 + s) * 2;
            ay2 -= 3;
            ctx.lineTo(ax2, ay2);
          }
          ctx.stroke();
        }
      } else if (school === 'ice') {
        // 冰塔：塔底霜雾（淡蓝呼吸圈）
        const br = 0.5 + 0.5 * Math.sin(ph * 1.8);
        ctx.globalAlpha = 0.12 + br * 0.12;
        ctx.fillStyle = '#81d4fa';
        ctx.beginPath(); ctx.ellipse(cx, y + CELL - 6, CELL * 0.3, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (school === 'sword') {
        // 剑塔：环身微光（旋转小弧）
        ctx.strokeStyle = '#9fd0ff88'; ctx.lineWidth = 1.2;
        const a0 = ph * 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.34, a0, a0 + 1.2); ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawEnemy(e: GameState['enemies'][number], auraTowers: GameState['towers'][number][]): void {
    const ctx = this.ctx;
    // 隐身敌人：仅在光环内"现形"，否则半透明 + 虚线提示
    const stealth = !!e.def.stealth;
    const revealed = !stealth || auraTowers.some((t) => {
      const lv = t.def.levels[t.level];
      const r = towerRange(lv.range, this.rangeAdd, t.onFormation);
      const dx = t.x - e.x, dy = t.y - e.y;
      return dx * dx + dy * dy <= r * r;
    });
    const fly = !!e.def.fly;
    const burrowed = !!e.burrowed;
    const lift = fly ? CELL * 0.18 : (burrowed ? -CELL * 0.1 : 0);
    const cx = e.x * CELL, cy = e.y * CELL - lift;
    const elite = !!e.def.elite;
    const isBoss = !!e.def.bossAbility;
    const rad = CELL * (elite || isBoss ? 0.44 : 0.32);
    ctx.globalAlpha = stealth && !revealed ? 0.3 : 1;
    // 飞行阴影
    if (fly) {
      ctx.fillStyle = '#0006';
      ctx.beginPath();
      ctx.ellipse(e.x * CELL, e.y * CELL, rad * 0.8, rad * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 精英/首领光环底
    if (elite || isBoss) {
      ctx.fillStyle = (isBoss ? '#ff444422' : '#ffd93322');
      ctx.beginPath();
      ctx.arc(cx, cy, rad + 8, 0, Math.PI * 2);
      ctx.fill();
    }
    // 本体形状：飞→菱形，首领→六边，普通→圆
    const drawShape = (r: number, fill?: string, stroke?: string, lw?: number) => {
      ctx.beginPath();
      if (fly) {
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r * 0.75, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r * 0.75, cy);
        ctx.closePath();
      } else if (isBoss) {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
      } else {
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      }
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw ?? 2; ctx.stroke(); }
    };
    drawShape(rad, e.def.color);
    if (e.hitFlash > 0) {
      ctx.globalAlpha = (stealth && !revealed ? 0.3 : 1) * Math.min(1, e.hitFlash / 0.12);
      drawShape(rad, '#ffffff');
    ctx.globalAlpha = stealth && !revealed ? 0.3 : (burrowed ? 0.5 : 1);
    // 遁地波纹（地下敌人脚底涟漪）
    if (burrowed) {
      const rippleT = (e.hitFlash > 0 ? e.hitFlash : 0.3);
      ctx.strokeStyle = '#88aa88';
      ctx.lineWidth = 2;
      const ripple = (rippleT * 3) % (CELL * 0.6);
      for (let i = 0; i < 2; i++) {
        const r = ripple + i * CELL * 0.3;
        ctx.globalAlpha = 0.4 - i * 0.15;
        ctx.beginPath();
        ctx.arc(e.x * CELL, e.y * CELL + 4, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.5;
    }
    }
    if (elite || isBoss) {
      drawShape(rad, undefined, '#ffd93d', isBoss ? 4 : 3);
    }
    if (e.shield > 0) {
      drawShape(rad + 4, undefined, '#5fd3ff', 2);
    }
    if (e.slowFactor < 1) {
      ctx.fillStyle = 'rgba(100,200,255,0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, rad + 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // 图标字
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${elite || isBoss ? 20 : 16}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.def.icon, cx, cy);
    // 精英/首领名称标牌
    if (elite || isBoss) {
      ctx.fillStyle = isBoss ? '#ff6b6b' : '#ffd93d';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(e.def.name, cx, cy + rad + 12);
    }
    // 血条
    const w = CELL * (elite || isBoss ? 0.9 : 0.7), h = (elite || isBoss) ? 7 : 6;
    const bx = cx - w / 2, by = cy - rad - ((elite || isBoss) ? 14 : 12);
    ctx.fillStyle = '#0008';
    ctx.fillRect(bx, by, w, h);
    ctx.fillStyle = e.hp / e.maxHp > 0.4 ? '#5fd35f' : '#ff6b6b';
    ctx.fillRect(bx, by, w * Math.max(0, e.hp / e.maxHp), h);
    ctx.globalAlpha = 1;
  }

  // ---------- 地形障碍 ----------
  private drawTerrain(col: number, row: number, terrain: string): void {
    const ctx = this.ctx;
    const cx = (col + 0.5) * CELL, cy = (row + 0.5) * CELL;
    ctx.save();
    if (terrain === 'rock') {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(cx + 5, cy + 5, CELL * 0.32, CELL * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a3728';
      ctx.strokeStyle = '#2a1f14';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - CELL * 0.4, cy + CELL * 0.2);
      ctx.lineTo(cx - CELL * 0.25, cy - CELL * 0.34);
      ctx.lineTo(cx + CELL * 0.1, cy - CELL * 0.4);
      ctx.lineTo(cx + CELL * 0.4, cy - CELL * 0.1);
      ctx.lineTo(cx + CELL * 0.34, cy + CELL * 0.28);
      ctx.lineTo(cx + CELL * 0.05, cy + CELL * 0.32);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8d7a6688';
      ctx.beginPath(); ctx.arc(cx + CELL * 0.05, cy - CELL * 0.18, CELL * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6d5a4488';
      ctx.beginPath(); ctx.arc(cx - CELL * 0.12, cy - CELL * 0.28, CELL * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2718';
      ctx.beginPath(); ctx.arc(cx + CELL * 0.2, cy - CELL * 0.05, CELL * 0.15, 0, Math.PI * 2); ctx.fill();
    } else if (terrain === 'tree') {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(cx + 4, cy + 5, CELL * 0.3, CELL * 0.08, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3e2a1a';
      ctx.fillRect(cx - CELL * 0.07, cy + CELL * 0.02, CELL * 0.14, CELL * 0.34);
      ctx.fillStyle = '#5d403788';
      ctx.fillRect(cx - CELL * 0.02, cy + CELL * 0.02, CELL * 0.05, CELL * 0.34);
      ctx.fillStyle = '#1b5e20';
      ctx.beginPath(); ctx.arc(cx, cy - CELL * 0.1, CELL * 0.36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath(); ctx.arc(cx - CELL * 0.18, cy + CELL * 0.02, CELL * 0.24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#388e3c';
      ctx.beginPath(); ctx.arc(cx + CELL * 0.16, cy - CELL * 0.16, CELL * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#43a047';
      ctx.beginPath(); ctx.arc(cx - CELL * 0.06, cy - CELL * 0.28, CELL * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#66bb6a77';
      ctx.beginPath(); ctx.arc(cx - CELL * 0.22, cy - CELL * 0.12, CELL * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#81c78466';
      ctx.beginPath(); ctx.arc(cx + CELL * 0.08, cy - CELL * 0.32, CELL * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a5d6a744';
      ctx.beginPath(); ctx.arc(cx + CELL * 0.2, cy - CELL * 0.08, CELL * 0.06, 0, Math.PI * 2); ctx.fill();
    } else if (terrain === 'water') {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.arc(cx + 3, cy + 4, CELL * 0.42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0d1b2a';
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.44, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a3a5c88';
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1565c044';
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#64b5f644';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const phase = i * 0.9 + (Date.now() * 0.001) % (Math.PI * 2);
        const wy = cy - CELL * 0.18 + i * CELL * 0.18;
        ctx.globalAlpha = 0.3 + 0.2 * Math.sin(phase);
        ctx.beginPath();
        ctx.moveTo(cx - CELL * 0.3 + Math.sin(phase) * 4, wy);
        ctx.quadraticCurveTo(cx, wy - CELL * 0.04 + Math.sin(phase + 1) * 3, cx + CELL * 0.32 + Math.sin(phase + 2) * 4, wy);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#90caf9';
      ctx.beginPath(); ctx.arc(cx - CELL * 0.08, cy - CELL * 0.1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  private drawBase(col: number, row: number, glowColor: string, elapsed: number): void {
    const ctx = this.ctx;
    const cx = (col + 0.5) * CELL, cy = (row + 0.5) * CELL;
    const pulse = Math.sin(elapsed * 2) * 0.15 + 0.85;
    ctx.save();

    ctx.fillStyle = '#ffd700' + Math.round(200 * pulse).toString(16).padStart(2, '0');
    ctx.font = 'bold 11px "Microsoft YaHei",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('『 玄天宗门 』', cx, cy - CELL * 0.58);

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL);
    grad.addColorStop(0, 'rgba(255,215,0,0.12)');
    grad.addColorStop(0.5, 'rgba(255,215,0,0.04)');
    grad.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, CELL, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(cx - CELL * 0.45, cy + CELL * 0.42);
    ctx.lineTo(cx - CELL * 0.08, cy + CELL * 0.15);
    ctx.lineTo(cx + CELL * 0.08, cy + CELL * 0.15);
    ctx.lineTo(cx + CELL * 0.45, cy + CELL * 0.42);
    ctx.lineTo(cx + CELL * 0.3, cy + CELL * 0.52);
    ctx.lineTo(cx - CELL * 0.3, cy + CELL * 0.52);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = glowColor + Math.round(160 * pulse).toString(16).padStart(2, '0');
    ctx.lineWidth = 2; ctx.stroke();

    // Left side hall
    ctx.fillStyle = '#1e1e32';
    ctx.beginPath();
    ctx.moveTo(cx - CELL * 0.48, cy + CELL * 0.1);
    ctx.lineTo(cx - CELL * 0.36, cy - CELL * 0.02);
    ctx.lineTo(cx - CELL * 0.2, cy - CELL * 0.02);
    ctx.lineTo(cx - CELL * 0.2, cy + CELL * 0.18);
    ctx.lineTo(cx - CELL * 0.44, cy + CELL * 0.18);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6d4c41';
    ctx.beginPath();
    ctx.moveTo(cx - CELL * 0.44, cy - CELL * 0.02);
    ctx.lineTo(cx - CELL * 0.38, cy - CELL * 0.1);
    ctx.lineTo(cx - CELL * 0.22, cy - CELL * 0.02);
    ctx.closePath(); ctx.fill();

    // Right side hall
    ctx.fillStyle = '#1e1e32';
    ctx.beginPath();
    ctx.moveTo(cx + CELL * 0.48, cy + CELL * 0.1);
    ctx.lineTo(cx + CELL * 0.36, cy - CELL * 0.02);
    ctx.lineTo(cx + CELL * 0.2, cy - CELL * 0.02);
    ctx.lineTo(cx + CELL * 0.2, cy + CELL * 0.18);
    ctx.lineTo(cx + CELL * 0.44, cy + CELL * 0.18);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6d4c41';
    ctx.beginPath();
    ctx.moveTo(cx + CELL * 0.44, cy - CELL * 0.02);
    ctx.lineTo(cx + CELL * 0.38, cy - CELL * 0.1);
    ctx.lineTo(cx + CELL * 0.22, cy - CELL * 0.02);
    ctx.closePath(); ctx.fill();

    // Main hall body
    ctx.fillStyle = '#2a2a44';
    ctx.fillRect(cx - CELL * 0.22, cy - CELL * 0.1, CELL * 0.44, CELL * 0.25);
    ctx.fillStyle = glowColor;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.moveTo(cx - CELL * 0.3, cy - CELL * 0.1);
    ctx.lineTo(cx, cy - CELL * 0.38);
    ctx.lineTo(cx + CELL * 0.3, cy - CELL * 0.1);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffd700aa';
    ctx.lineWidth = 2; ctx.stroke();

    // Main hall door
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#3d2b1f';
    ctx.fillRect(cx - CELL * 0.08, cy + CELL * 0.02, CELL * 0.16, CELL * 0.13);
    ctx.fillStyle = '#8d6e6344';
    ctx.fillRect(cx - CELL * 0.04, cy + CELL * 0.02, CELL * 0.08, CELL * 0.13);
    ctx.fillStyle = '#ffd70033';
    ctx.beginPath(); ctx.arc(cx, cy + CELL * 0.04, 3, 0, Math.PI * 2); ctx.fill();

    // Steps
    ctx.fillStyle = '#555';
    ctx.fillRect(cx - CELL * 0.18, cy + CELL * 0.15, CELL * 0.36, 3);
    ctx.fillRect(cx - CELL * 0.15, cy + CELL * 0.18, CELL * 0.3, 2);

    // Decorative lanterns
    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(cx - CELL * 0.25, cy - CELL * 0.05, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + CELL * 0.25, cy - CELL * 0.05, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd70044';
    ctx.beginPath(); ctx.arc(cx - CELL * 0.25, cy - CELL * 0.05, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + CELL * 0.25, cy - CELL * 0.05, 7, 0, Math.PI * 2); ctx.fill();

    // Stone lions
    ctx.fillStyle = '#757575';
    ctx.beginPath(); ctx.arc(cx - CELL * 0.32, cy + CELL * 0.22, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + CELL * 0.32, cy + CELL * 0.22, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(cx - CELL * 0.32, cy + CELL * 0.19, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + CELL * 0.32, cy + CELL * 0.19, 3, 0, Math.PI * 2); ctx.fill();

    // Heaven light pillar
    ctx.globalAlpha = (Math.sin(elapsed * 3) * 0.3 + 0.3) * 0.35;
    const grad2 = ctx.createRadialGradient(cx, cy - CELL * 0.4, 0, cx, cy - CELL * 0.4, CELL * 0.45);
    grad2.addColorStop(0, 'rgba(255,215,0,0.5)');
    grad2.addColorStop(0.5, 'rgba(255,215,0,0.15)');
    grad2.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = grad2;
    ctx.beginPath(); ctx.arc(cx, cy - CELL * 0.4, CELL * 0.45, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff33';
    ctx.globalAlpha = (Math.sin(elapsed * 5) * 0.5 + 0.5) * 0.2;
    ctx.fillRect(cx - 2, cy - CELL * 0.55, 4, CELL * 0.2);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawEndpoints(state?: GameState): void {
    if (this.paths.length === 0) return;
    for (let pi = 0; pi < this.paths.length; pi++) {
      const isActive = !this.currentActivePaths || this.currentActivePaths.includes(pi);
      const path = this.paths[pi];
      if (path.length === 0) continue;
      this.drawEntrance(path[0], pi, isActive, state);
    }
  }

  private drawEntrance(p: GridPoint, index: number, active: boolean, _state?: GameState): void {
    const ctx = this.ctx;
    const cx = (p.x + 0.5) * CELL, cy = (p.y + 0.5) * CELL;
    const pulse = Math.sin(index * 2.7 + Date.now() * 0.003) * 0.2 + 0.8;
    ctx.save();
    if (active) {
      ctx.fillStyle = '#0a0a0e';
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.42, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(180,40,40,0.12)';
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.5, 0, Math.PI * 2); ctx.fill();
      const grad = ctx.createRadialGradient(cx, cy - 6, 0, cx, cy - 6, CELL * 0.3);
      grad.addColorStop(0, `rgba(180,50,50,${0.15 * pulse})`);
      grad.addColorStop(1, 'rgba(180,50,50,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy - 6, CELL * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(220,60,60,${0.5 * pulse})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.4, Math.PI, 0); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#ff6464';
      ctx.font = 'bold 16px "Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('入', cx, cy - 3);
      ctx.fillStyle = `rgba(255,100,80,${0.2 * pulse})`;
      ctx.beginPath(); ctx.arc(cx, cy - 6, CELL * 0.08 + (1 - pulse) * 6, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#1a1a1e';
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.42, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a2a2e';
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.38, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.4, Math.PI, 0); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#666';
      ctx.font = 'bold 14px "Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('封', cx, cy - 3);
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const angle = (i / 3) * Math.PI;
        ctx.moveTo(cx - CELL * 0.25 * Math.cos(angle), cy - 10 - CELL * 0.25 * Math.sin(angle));
        ctx.lineTo(cx + CELL * 0.25 * Math.cos(angle), cy - 10 + CELL * 0.25 * Math.sin(angle));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
