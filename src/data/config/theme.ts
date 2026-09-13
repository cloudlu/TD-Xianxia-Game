// 卡通主题（v0.89）：色阶提亮映射 + 主题持久化（纯函数，可单测）
// 设计：色相保持（保 30 章氛围差异：ch2 血月→糖果红、ch3 紫雾→香芋紫、ch4 森林→抹茶绿），
// 只做亮度/饱和重映射——暗色写实 → 明亮卡通（PvZ 式可读性）。

export type Theme = 'classic' | 'cartoon';
const THEME_KEY = 'xianxia_theme';

/** 卡通描边宽（px）——卡通的灵魂是描边 */
export const TOON_OUTLINE = 2;

/** 卡通 vignette 强度（写实 0.45 → 卡通轻晕染） */
export const TOON_VIGNETTE = 0.15;

/** Q 版表情色表 */
export const TOON_FACE = {
  eyeWhite: '#ffffff',
  pupil: '#222222',
  glint: '#ffffff',
  blush: 'rgba(255,120,120,0.4)',
  outline: '#2a2a35',
} as const;

/** hex → HSL（h: 0-360, s/l: 0-1） */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

/** HSL → hex */
export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const to = (v: number): string => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * 卡通化映射：亮度提升至 45-70 区间（过暗拉亮、过亮微降），饱和 ×1.35（钳 0.85），色相不变。
 * 非法/带透明度的输入原样返回（特效色如 #ffd70055 不做映射）。
 */
export function toon(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const { h, s, l } = hexToHsl(hex);
  let nl = l;
  if (nl < 0.45) nl = 0.45 + (l / 0.45) * 0.06;        // 暗（含极暗）→ 0.45-0.51
  else if (nl > 0.85) nl = 0.70 + ((1 - nl) / 0.15) * 0.15;  // 极亮微降
  else nl = Math.min(0.70, nl * 1.1);                   // 中间提亮
  const ns = Math.min(0.85, s * 1.35);
  return hslToHex(h, ns, nl);
}

/** 读取主题（localStorage；默认 cartoon——玩家诉求导向） */
export function loadTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'classic' ? 'classic' : 'cartoon';
  } catch { return 'cartoon'; }
}

export function saveTheme(t: Theme): void {
  try { localStorage.setItem(THEME_KEY, t); } catch { /* quota：本会话生效 */ }
}

/** 应用主题到 DOM（body class，驱动 CSS 卡通样式） */
export function applyThemeDom(t: Theme): void {
  document.body.classList.toggle('cartoon', t === 'cartoon');
}
