// 全局色板（v0.87 视觉语言统一）：灵气色阶（塔/友方）+ 妖气色阶（敌方）
// 所有特效取色收敛到此表——统一"作品感"，策划/皮肤可直接替换。
// 色阶与境界视觉档对齐：tier0 青（炼气~金丹）/ tier1 金（元婴~渡劫）/ tier2 紫金（大乘~飞升）。

/** 灵气色阶：按境界视觉档取主色 */
export const SPIRIT_TIERS = ['#7fd8ff', '#ffd700', '#e1a3ff'] as const;

/** 灵气色阶对应的高光色（爆闪/核心亮点） */
export const SPIRIT_HI = ['#d7f4ff', '#fff3c4', '#f6e6ff'] as const;

/** 妖气色阶：普通 / 精英 / BOSS */
export const FIEND_TIERS = ['#ff7043', '#ffa726', '#e53935'] as const;

/** 全屏光照滤镜（灵气光照）：按战斗状态叠加的色温 */
export const MOOD_LIGHT = {
  prep: { color: '#4fc3f7', alpha: 0.05 },   // 备战：蓝青
  wave: { color: '#ffb74d', alpha: 0.04 },   // 战斗：微暖
  boss: { color: '#e53935', alpha: 0.08 },   // BOSS：偏红
  won:  { color: '#ffd700', alpha: 0.10 },   // 胜利：金
  lost: { color: '#263238', alpha: 0.18 },   // 失败：灰暗
} as const;

export type MoodLightKey = keyof typeof MOOD_LIGHT;

/** 境界档取灵气主色（越界钳到首尾） */
export function spiritColor(tier: number): string {
  const i = Math.max(0, Math.min(SPIRIT_TIERS.length - 1, Math.round(tier)));
  return SPIRIT_TIERS[i];
}

/** 境界档取灵气高光色 */
export function spiritHi(tier: number): string {
  const i = Math.max(0, Math.min(SPIRIT_HI.length - 1, Math.round(tier)));
  return SPIRIT_HI[i];
}

/** 敌人档次取妖气色（0 普通 / 1 精英 / 2 BOSS） */
export function fiendColor(rank: number): string {
  const i = Math.max(0, Math.min(FIEND_TIERS.length - 1, Math.round(rank)));
  return FIEND_TIERS[i];
}
