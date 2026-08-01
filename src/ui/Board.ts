// 表现层：Canvas 棋盘渲染 + 输入（设计文档 §1.3 ui/Board）
// 引擎不依赖 UI，UI 只读 snapshot 渲染、把输入转成玩家操作。

import type { GameState } from '../engine/Game';
import type { FormationTile, FormationType, GridPoint, BlockedCell } from '../types';
import { BACKGROUNDS, DEFAULT_BACKGROUND } from '../data/config/backgrounds';
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

    // 敌人（隐身敌人按是否在光环内决定可见度）
    const auraTowers = state.towers.filter((t) => t.def.behavior === 'aura');
    for (const e of state.enemies) this.drawEnemy(e, auraTowers);

    // 弹道（拖尾线段 + 光晕）
    for (const p of state.projectiles) {
      const cx = p.x * CELL, cy = p.y * CELL;
      // 拖尾：反向拉一条渐变线段
      const grad = ctx.createLinearGradient(cx - 12, cy - 12, cx, cy);
      grad.addColorStop(0, p.color + '00');
      grad.addColorStop(1, p.color + '88');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx, cy); ctx.stroke();
      // 核心亮点
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff88';
      ctx.beginPath(); ctx.arc(cx, cy, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    // 战斗特效：飘字伤害 + 死亡消散 + BOSS 冲击波 + 升级爆发
    for (const fx of state.effects) {
      const t = fx.life / fx.maxLife;   // 1→0
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
      } else { // poof：扩散消散圈
        const rad = CELL * (0.3 + (1 - t) * 0.5);
        ctx.globalAlpha = Math.max(0, t * 0.8);
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(fx.x * CELL, fx.y * CELL, rad, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = fx.color + '33';
        ctx.beginPath(); ctx.arc(fx.x * CELL, fx.y * CELL, rad, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // 终点/起点标记
    this.drawEndpoints();

    // 环境粒子（灵气）
    this.updateAmbient(state.status);
    for (const p of this.ambientParticles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 暗角（vignette）
    const vg = ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.3, this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
    const cx = (t.col + 0.5) * CELL, cy = (t.row + 0.5) * CELL;
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
      ctx.strokeStyle = '#88aa88';
      ctx.lineWidth = 2;
      const ripple = (this.waveTimer * 3) % (CELL * 0.6);
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

  private drawEndpoints(): void {
    if (this.paths.length === 0) return;
    for (let pi = 0; pi < this.paths.length; pi++) {
      const isActive = !this.currentActivePaths || this.currentActivePaths.includes(pi);
      const path = this.paths[pi];
      if (path.length === 0) continue;
      this.drawEntrance(path[0], pi, isActive);
    }
  }

  private drawEntrance(p: GridPoint, index: number, active: boolean): void {
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
