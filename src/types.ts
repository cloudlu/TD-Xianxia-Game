// 类型定义 —— 对应设计文档 §3-§5 的配置 schema
// P1 仅含数值/组合所需字段，behavior/ability 等随阶段扩展

export type TowerBehavior = 'projectile' | 'pierce' | 'aura' | 'aoe' | 'chain';

/** 难度模式（独立命名，不用境界名避免混淆） */
export type Difficulty = 'simple' | 'normal' | 'hard';

/** 难度乘数配置 */
export const DIFFICULTY_MUL: Record<Difficulty, { hp: number; bounty: number; label: string }> = {
  simple: { hp: 0.8, bounty: 1.1, label: '简单' },
  normal: { hp: 1.0, bounty: 1.0, label: '普通' },
  hard:   { hp: 1.5, bounty: 0.85, label: '困难' },
};

/** 装备槽位（设计文档 §9.2） */
export type EquipSlot = 'weapon' | 'armor' | 'accessory';

export type TargetPolicy = 'first' | 'last' | 'strongest' | 'nearest';

export interface TowerLevelConfig {
  realm: string;          // 境界名
  dmg: number;            // 单发伤害（aura 塔为 0）
  rate: number;           // 每秒攻击次数
  range: number;          // 射程（格）
  upgradeCost?: number;   // 升到本境界的费用（炼气为建造费 cost）
  crit?: number;          // 暴击率 0..1
  pierce?: number;        // 穿透目标数（pierce 行为用）
  aoeRadius?: number;     // 溅射半径（aoe 行为用，以主目标为中心）
  chainRange?: number;    // 链电跳跃范围（chain 行为用）
  chainCount?: number;    // 链电跳跃次数（chain 行为用）
  auraBuff?: { dmgMul: number; rateMul: number }; // 光环加成（aura 行为用）
  slow?: { mul: number; duration: number };        // 减速（命中后敌人移速 ×mul，持续 duration 秒）
}

export interface TowerConfig {
  id: string;
  name: string;
  icon: string;
  cost: number;           // 建造费
  sellRatio: number;      // 出售返还比例
  behavior: TowerBehavior;
  school: string;         // 流派：sword/talisman/spear/magic（决定装备加成命中的伤害 stat）
  targetPolicy: TargetPolicy;
  color: string;
  hitsAir?: boolean;      // 对空：可攻击飞行敌人（符箓/法术为 true）
  desc: string;
  levels: TowerLevelConfig[];
}

export interface EnemyConfig {
  id: string;
  name: string;
  icon: string;
  hp: number;
  speed: number;          // 格/秒
  armor: number;
  bounty: number;
  color: string;
  elite?: boolean;        // 精英/小头目：渲染时加大 + 特殊标记
  fly?: boolean;          // 飞行：仅对空塔可命中
  shield?: number;        // 护盾层：先破盾再掉血
  lifestealHp?: number;   // 受击回血（每次被命中且掉血时回 N 点，鼓励爆发）
  knockback?: boolean;    // 撞塔：经过塔时短暂瘫痪（带 §5.4 免疫护栏）
  dodge?: number;         // 闪避概率 0..1：每次受击有概率完全规避
  stealth?: boolean;      // 隐身：仅在"破隐"光环（聚灵阵）范围内可被锁定
  split?: { child: string; count: number };   // 死亡分裂：生成 count 个 child（子体赏金应为 0）
  bossAbility?: {                               // BOSS 周期技能（§5.4 护栏）
    interval: number;     // 触发周期（秒）
    charmRadius?: number; // 魅惑范围（格）：范围内塔瘫痪
    charmDuration?: number; // 魅惑时长（秒，≤3）
    summon?: { enemy: string; count: number }; // 召唤
    enrageBelow?: { hpPct: number; speedMul: number; summonCount?: number }; // 狂暴：血量低于阈值加速/多召唤
  };
}

export interface SpawnEntry {
  enemy: string;          // enemy id
  count: number;
  gap: number;            // 间隔秒
  delay: number;          // 起始延迟秒
  path?: number;          // 走第几条路径（缺省 0）
}

export interface WaveConfig {
  spawns: SpawnEntry[];
  clearBonus: number;
}

export interface GridPoint { x: number; y: number; } // 格坐标 (col, row)

/** 剧情片段（设计文档 §8.4，弹窗渲染层消费） */
export interface StoryBeat {
  chapter?: string;
  title: string;
  lines: string[];
  btn: string;
}

/** 关卡剧情：开场/结局 */
export interface LevelStory {
  intro?: StoryBeat;
  outro?: StoryBeat;
}

export interface LevelConfig {
  id: string;
  name: string;
  startStones: number;
  lives: number;
  cols: number;
  rows: number;
  paths: GridPoint[][];        // 多条路径（每条是路点序列，正交连接）
  buildable: boolean[][];      // [row][col]
  waves: WaveConfig[];
  story?: LevelStory;
  /** 本关允许的塔最高境界索引（0=炼气...4=化神）；缺省=不限制 */
  maxTowerLevel?: number;
  /** 敌人血量缩放（默认 1.0）；towerMul/bountyMul 自动推导为 sqrt(hpMul) */
  hpMul?: number;
}

/** 章节清单条目（设计文档 §8.2 manifest） */
export interface ManifestEntry {
  levelId: string;
  chapterId: string;
  chapterTitle: string;
}
