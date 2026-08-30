// 塔流派视觉配置（表现层数据驱动，设计文档 §1.1 "表现可替换" / §3.2 数值扩展零代码）
// 引擎只透传 school/tier，渲染参数全部在此表，策划/皮肤可直接替换。

/** 境界视觉档位：0=炼气~金丹(1-3级) 1=元婴~渡劫(4-6级) 2=大乘~飞升(7-8级) */
export function visualTier(level: number): 0 | 1 | 2 {
  if (level >= 6) return 2;
  if (level >= 3) return 1;
  return 0;
}

export interface TowerVisualSpec {
  /** 升级突破特效风格 */
  realmUp: 'sword' | 'talisman' | 'spear' | 'aura' | 'fire' | 'thunder' | 'ice' | 'earth';
  /** 弹道拖尾长度倍率 */
  trailMul: number;
  /** 弹道样式 */
  trail: 'blade' | 'paper' | 'beam' | 'bolt' | 'ice' | 'orb';
  /** 命中特效样式 */
  hit: 'slash' | 'ink' | 'impact' | 'ring' | 'spark' | 'frost' | 'crater';
  /** 升级特效强调色（叠金光之上） */
  accent: string;
}

/** 各流派视觉骨架（school → spec），未命中回退 sword */
export const TOWER_VISUALS: Record<string, TowerVisualSpec> = {
  sword: {
    realmUp: 'sword', trail: 'blade', hit: 'slash',
    trailMul: 1.4, accent: '#9fd0ff',
  },
  talisman: {
    realmUp: 'talisman', trail: 'paper', hit: 'ink',
    trailMul: 1.0, accent: '#c9a0ff',
  },
  spear: {
    realmUp: 'spear', trail: 'beam', hit: 'impact',
    trailMul: 1.6, accent: '#ffe082',
  },
  aura: {
    realmUp: 'aura', trail: 'orb', hit: 'ring',
    trailMul: 0.8, accent: '#a5d6a7',
  },
  fire: {
    realmUp: 'fire', trail: 'orb', hit: 'ring',
    trailMul: 1.2, accent: '#ff8a65',
  },
  thunder: {
    realmUp: 'thunder', trail: 'bolt', hit: 'spark',
    trailMul: 1.3, accent: '#b39ddb',
  },
  ice: {
    realmUp: 'ice', trail: 'ice', hit: 'frost',
    trailMul: 1.1, accent: '#81d4fa',
  },
  earth: {
    realmUp: 'earth', trail: 'orb', hit: 'crater',
    trailMul: 1.0, accent: '#bcaaa4',
  },
};

export function towerVisual(school: string): TowerVisualSpec {
  return TOWER_VISUALS[school] ?? TOWER_VISUALS.sword;
}
