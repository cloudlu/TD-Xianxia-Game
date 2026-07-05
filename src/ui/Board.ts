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
  private paths: GridPoint[][] = [];   // 当前关卡多条路径（画入口/出口用）
  /** 皮肤解析：towerId → { icon, color, effect? }；由 main 注入，返回 null 用塔默认外观 */
  skinResolver: ((towerId: string) => { icon: string; color: string; effect?: string } | null) | null = null;
  hoverCol = -1;
  hoverRow = -1;
  activeBuild: string | null = null;   // 当前选中要建的塔 id

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

    // 弹道（带尾焰光晕）
    for (const p of state.projectiles) {
      ctx.fillStyle = p.color + '55';
      ctx.beginPath(); ctx.arc(p.x * CELL, p.y * CELL, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x * CELL, p.y * CELL, 4, 0, Math.PI * 2); ctx.fill();
    }

    // 战斗特效：飘字伤害 + 死亡消散
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

    // 暗角（vignette）
    const vg = ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.3, this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
      ctx.strokeStyle = 'rgba(200,160,90,0.12)'; ctx.lineWidth = CELL * 0.85; ctx.stroke();  // 外光晕
      trace();
      ctx.strokeStyle = 'rgba(140,100,45,0.55)'; ctx.lineWidth = CELL * 0.6; ctx.stroke();   // 缎带
      trace();
      ctx.strokeStyle = 'rgba(255,217,130,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([8, 10]); ctx.stroke(); // 中线虚线
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
    const lift = fly ? CELL * 0.18 : 0;          // 飞行抬高
    const cx = e.x * CELL, cy = e.y * CELL - lift;
    const elite = !!e.def.elite;
    const rad = CELL * (elite ? 0.44 : 0.32);
    ctx.globalAlpha = stealth && !revealed ? 0.3 : 1;
    // 飞行阴影（地面投影）
    if (fly) {
      ctx.fillStyle = '#0006';
      ctx.beginPath();
      ctx.ellipse(e.x * CELL, e.y * CELL, rad * 0.8, rad * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 精英光环底
    if (elite) {
      ctx.fillStyle = '#ffd93322';
      ctx.beginPath();
      ctx.arc(cx, cy, rad + 8, 0, Math.PI * 2);
      ctx.fill();
    }
    // 本体（受击闪白时叠加白色）
    ctx.fillStyle = e.def.color;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
    if (e.hitFlash > 0) {
      ctx.globalAlpha = (stealth && !revealed ? 0.3 : 1) * Math.min(1, e.hitFlash / 0.12);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = stealth && !revealed ? 0.3 : 1;
    }
    // 精英金边
    if (elite) {
      ctx.strokeStyle = '#ffd93d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 护盾层（蓝环）
    if (e.shield > 0) {
      ctx.strokeStyle = '#5fd3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rad + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 减速效果（冰蓝光环）
    if (e.slowFactor < 1) {
      ctx.fillStyle = 'rgba(100,200,255,0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, rad + 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // 图标字
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${elite ? 30 : 24}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.def.icon, cx, cy);
    // 精英名称标牌
    if (elite) {
      ctx.fillStyle = '#ffd93d';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(e.def.name, cx, cy + rad + 12);
    }
    // 血条
    const w = CELL * (elite ? 0.9 : 0.7), h = elite ? 7 : 6;
    const bx = cx - w / 2, by = cy - rad - (elite ? 14 : 12);
    ctx.fillStyle = '#0008';
    ctx.fillRect(bx, by, w, h);
    ctx.fillStyle = e.hp / e.maxHp > 0.4 ? '#5fd35f' : '#ff6b6b';
    ctx.fillRect(bx, by, w * Math.max(0, e.hp / e.maxHp), h);
    ctx.globalAlpha = 1;   // 复位，避免影响后续绘制
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
