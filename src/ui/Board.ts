// 表现层：Canvas 棋盘渲染 + 输入（设计文档 §1.3 ui/Board）
// 引擎不依赖 UI，UI 只读 snapshot 渲染、把输入转成玩家操作。

import type { GameState } from '../engine/Game';
import type { GridPoint } from '../types';

const CELL = 80;

// 皮肤光晕配色（hex，用于 #RRGGBBAA 拼接）
const EFFECT_RGB: Record<string, string> = {
  gold: '#ffd700',
  red: '#ff5252',
  green: '#66bb6a',
  blue: '#29b6f6',
};

export class Board {
  private ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  private paths: GridPoint[][] = [];
  skinResolver: ((towerId: string) => { icon: string; color: string; effect?: string } | null) | null = null;
  hoverCol = -1;
  hoverRow = -1;
  activeBuild: string | null = null;
  private ambientParticles: { x: number; y: number; vy: number; size: number; alpha: number; speed: number }[] = [];

  constructor(private canvas: HTMLCanvasElement, cols: number, rows: number) {
    this.ctx = canvas.getContext('2d')!;
    this.cols = cols;
    this.rows = rows;
    canvas.width = cols * CELL;
    canvas.height = rows * CELL;
  }

  /** 切换关卡时更新棋盘尺寸 + 路径（不同关卡可能不同网格/路径） */
  configure(cols: number, rows: number, paths: ReadonlyArray<ReadonlyArray<GridPoint>>): void {
    this.cols = cols;
    this.rows = rows;
    this.paths = paths.map((p) => p.map((pt) => ({ ...pt })));
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

    // 格子底色
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * CELL, y = r * CELL;
        if (!buildable[r][c]) {
          ctx.fillStyle = '#2a1f12';       // 路径底
        } else {
          ctx.fillStyle = (c + r) % 2 === 0 ? '#141a2e' : '#181f36';
        }
        ctx.fillRect(x, y, CELL, CELL);
      }
    }
    // 网格线（仅可建区，淡）
    ctx.strokeStyle = 'rgba(95,211,255,0.05)'; ctx.lineWidth = 1;
    for (let c = 0; c <= this.cols; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, this.rows * CELL); ctx.stroke(); }
    for (let r = 0; r <= this.rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(this.cols * CELL, r * CELL); ctx.stroke(); }

    // 路径发光缎带
    this.drawPath();

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
        ctx.fillStyle = fx.color;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
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
      ctx.fillStyle = `rgba(255,255,240,${p.alpha})`;
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
    for (const path of this.paths) {
      if (path.length < 2) continue;
      const trace = () => {
        ctx.beginPath();
        ctx.moveTo((path[0].x + 0.5) * CELL, (path[0].y + 0.5) * CELL);
        for (let i = 1; i < path.length; i++) ctx.lineTo((path[i].x + 0.5) * CELL, (path[i].y + 0.5) * CELL);
      };
      trace();
      ctx.strokeStyle = 'rgba(200,160,90,0.12)'; ctx.lineWidth = CELL * 0.85; ctx.stroke();
      trace();
      ctx.strokeStyle = 'rgba(140,100,45,0.55)'; ctx.lineWidth = CELL * 0.6; ctx.stroke();
      trace();
      ctx.strokeStyle = 'rgba(255,217,130,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([8, 10]); ctx.stroke();
      ctx.setLineDash([]);
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
      // 显示该塔射程
      const lv = tower.def.levels[tower.level];
      ctx.fillStyle = tower.def.color + '22';
      ctx.strokeStyle = tower.def.color + 'aa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tower.x * CELL, tower.y * CELL, lv.range * CELL, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
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
        ctx.fillStyle = def.color + '18';
        ctx.strokeStyle = def.color + '66';
        ctx.beginPath();
        ctx.arc((c + 0.5) * CELL, (r + 0.5) * CELL, lv.range * CELL, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }
  private activeBuildDef: { levels: { range: number }[]; color: string } | null = null;
  setActiveBuild(id: string | null, def: { levels: { range: number }[]; color: string } | null) {
    this.activeBuild = id;
    this.activeBuildDef = def;
  }

  private drawTower(t: GameState['towers'][number], now: number): void {
    const ctx = this.ctx;
    const x = t.col * CELL, y = t.row * CELL;
    const disabled = t.disabledUntil > now;
    const skin = this.skinResolver?.(t.def.id) ?? null;
    const color = skin?.color ?? t.def.color;
    const icon = skin?.icon ?? t.def.icon;
    const effectColor = skin?.effect ? EFFECT_RGB[skin.effect] ?? null : null;

    // 皮肤光晕（脉动）
    if (effectColor) {
      const pulse = 0.5 + 0.5 * Math.sin(now * 4);
      ctx.fillStyle = effectColor + Math.floor(40 + 50 * pulse).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc((t.col + 0.5) * CELL, (t.row + 0.5) * CELL, CELL * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // 塔身（瘫痪时灰显）
    ctx.globalAlpha = disabled ? 0.4 : 1;
    ctx.fillStyle = color;
    this.roundRect(x + 4, y + 4, CELL - 8, CELL - 8, 6);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 瘫痪标记
    if (disabled) {
      ctx.fillStyle = '#ff9b6b';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('眩', (t.col + 0.5) * CELL, y + 12);
    }

    // 图标字
    ctx.fillStyle = '#0f1320';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, (t.col + 0.5) * CELL, (t.row + 0.5) * CELL);

    // 境界等级 pips（level+1 个点，加深色底圈保证在任何塔色上都可见）
    for (let i = 0; i <= t.level; i++) {
      ctx.fillStyle = '#000a';
      ctx.beginPath();
      ctx.arc(x + 11 + i * 10, y + 11, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath();
      ctx.arc(x + 11 + i * 10, y + 11, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 开火 muzzle flash
    if (t.flashTimer > 0 && !disabled) {
      const intensity = Math.min(1, t.flashTimer / 0.12);
      ctx.save();
      ctx.globalAlpha = intensity * 0.6;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc((t.col + 0.5) * CELL, (t.row + 0.5) * CELL, CELL * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc((t.col + 0.5) * CELL, (t.row + 0.5) * CELL, CELL * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawEnemy(e: GameState['enemies'][number], auraTowers: GameState['towers'][number][]): void {
    const ctx = this.ctx;
    // 隐身敌人：仅在光环内"现形"，否则半透明 + 虚线提示
    const stealth = !!e.def.stealth;
    const revealed = !stealth || auraTowers.some((t) => {
      const r = t.def.levels[t.level].range;
      const dx = t.x - e.x, dy = t.y - e.y;
      return dx * dx + dy * dy <= r * r;
    });
    const fly = !!e.def.fly;
    const lift = fly ? CELL * 0.18 : 0;
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
      ctx.globalAlpha = stealth && !revealed ? 0.3 : 1;
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
    ctx.font = `bold ${elite || isBoss ? 30 : 24}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.def.icon, cx, cy);
    // 精英/首领名称标牌
    if (elite || isBoss) {
      ctx.fillStyle = isBoss ? '#ff6b6b' : '#ffd93d';
      ctx.font = 'bold 13px sans-serif';
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

  private drawEndpoints(): void {
    const ctx = this.ctx;
    if (this.paths.length === 0) return;
    for (const path of this.paths) {
      if (path.length === 0) continue;
      const draw = (p: GridPoint, color: string, label: string) => {
        const cx = (p.x + 0.5) * CELL, cy = (p.y + 0.5) * CELL;
        ctx.fillStyle = color + '55';
        ctx.beginPath();
        ctx.arc(cx, cy, CELL * 0.46, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy - CELL * 0.62);
      };
      draw(path[0], '#e57373', '入');
      draw(path[path.length - 1], '#ffd93d', '宗');
    }
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
