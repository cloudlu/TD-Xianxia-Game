// 类型定义 —— 对应设计文档 §3-§5 的配置 schema
// P1 仅含数值/组合所需字段，behavior/ability 等随阶段扩展

export type TowerBehavior = 'projectile' | 'pierce' | 'aura' | 'aoe' | 'chain' | 'mine';

/** 保留类型向后兼容，不再使用 */
/** @deprecated l1/l2/l3 已取代全局难度；保留类型防止引用报错 */
export type Difficulty = 'simple' | 'normal' | 'hard';

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
  hitsBurrowed?: boolean; // 可攻击地下敌人（震地雷为 true）
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
  burrow?: { interval: number; surfDuration: number }; // 遁地：在地下游走 interval 秒后上浮 surfDuration 秒，循环
  bossAbility?: {                               // BOSS 周期技能（§5.4 护栏）
    interval: number;     // 触发周期（秒）
    charmRadius?: number; // 魅惑范围（格）：范围内塔瘫痪
    charmDuration?: number; // 魅惑时长（秒，≤3）
    summon?: { enemy: string; count: number }; // 召唤
    enrageBelow?: { hpPct: number; speedMul: number; summonCount?: number }; // 狂暴：血量低于阈值加速/多召唤
  };
  /** 出身/传说/典故（妖兽录叙事，纯展示） */
  lore?: string;
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

/** 锻炉运行时状态（三路经营战） */
export interface ForgeState {
  uid: number;
  col: number;
  row: number;
  level: number;        // 炉等级（0 起）
  progress: number;     // 0..1 锻造进度
  ready: boolean;       // 是否可收取伤害符
  selected: boolean;    // 合并操作第一步选中态
}

/** 御剑守城（v0.97）：真人可拾取的塔能力（塔系），攻击行为/冷却与对应塔同语义 */
export type HeroTowerSchool = 'sword' | 'talisman' | 'spear' | 'fire' | 'thunder' | 'ice';

/** 真人已拥有的一项塔能力 */
export interface HeroTowerAbility {
  school: HeroTowerSchool;
  level: number;   // 0 起；重复拾取 +1，伤害 ×1.4^level
  cd: number;      // 攻击冷却剩余秒（≤0 = 可攻击）
}

/** 御剑真人运行时状态（v0.97；只沿城墙战线横向移动，y 恒定） */
export interface HeroState {
  x: number;            // 格坐标（中心 +0.5 语义与敌人一致）
  y: number;
  facing: 1 | -1;       // 朝向（渲染翻转）
  targetX: number;      // 鼠标瞄准的 x 目标（无输入时 = x）
  abilities: HeroTowerAbility[];   // 已拥有塔能力（含本命飞剑）
  swingAt: number;      // 最近攻击时刻（表现层动画），-1=无
  focusUid?: number;    // 点击集火目标（敌人死亡/漏怪后清除）
}

/** 场上塔符（掉落物，激活后自动飞向真人，到达即授予对应塔能力） */
export interface TowerSigil {
  uid: number;
  x: number;   // 当前格坐标（小数，含中偏移：5.5 = 第 5 列中心）
  y: number;
  school: HeroTowerSchool;
  spawnAt: number;
  lifeSec: number;
}

/** 关卡模式（缺省 classic）；lane=车道防守；stream=连续流夜袭（纵向车道）；forge=三路经营战 */
export type LevelMode = 'classic' | 'lane' | 'stream' | 'forge';

/** 连续流（夜袭）模式配置：全屏随机列出怪 + 妖风变列 + 神雷锤击 */
export interface StreamConfig {
  /** 横扫符触发行（敌人 y ≥ row 时触发） */
  sweepRow: number;
  /** 连续流参数：波间准备秒数（0=清波即刻开下一波） */
  prepBetweenSec: number;
  /** 防线横扫符数量（按列随机布点，种子化） */
  sweeperCount: number;
  /** 妖风变列间隔秒（0=禁用）；触发时全场存活敌人横移 ±1~2 列 */
  windIntervalSec: number;
  /** 神雷锤击：每发伤害 = 关卡敌人基准血 × 此比例（建议 0.30） */
  hammerDmgPct?: number;
  /** 神雷锤击：每波弹药数（0=禁用锤击） */
  hammerAmmo?: number;
  /** 敌人冲锋速度倍率（夜袭冲阵感 + 压缩塔暴露时间，建议 1.4） */
  enemySpeedMul?: number;
  /** 本关塔数量上限（防"1-2 塔通关"，建议 6；缺省用全局 towerConfig） */
  maxTowers?: number;
  /** 御剑真人（v0.96 英雄模式）：是否启用（5 个夜袭关全开） */
  heroEnabled?: boolean;
  /** 御剑守城（v0.97 纯英雄）：彻底无塔，鼠标移动+拾取塔能力+点击集火 */
  pureHero?: boolean;
  /** 城墙行号覆盖（v0.98 御剑守城贴底：城墙在最后两行 rows-2；缺省用 wallRowOf = rows-5） */
  wallRow?: number;
}

/** 锻炉（三路经营战）模式配置 */
export interface ForgeConfig {  /** 锻炉格坐标（丹炉/剑炉经营位，不可建塔） */
  forges: GridPoint[];
  /** 每级锻造时长（秒，index=炉等级，最后一档循环用） */
  forgeSecPerLevel: number[];
  /** 收取伤害符的加成：每级 +dmgPct（全塔伤害，加法叠入封顶池） */
  collectDmgPctPerLevel: number;
  /** 伤害符加成封顶（防止无限囤） */
  maxTotalDmgPct: number;
  /** 合并：点击一炉再点相邻同级炉 → 合并为 1 个 level+1（占用 2 格释放 1 格） */
  mergeEnabled: boolean;
}

/** 车道模式配置 */
export interface LaneConfig {
  /** 一次性横扫符触发线（敌人 x ≤ col 时触发，清空该道敌人）；每个车道 1 次/关 */
  sweepCol: number;
  /** 灵石拾取：value=单颗价值，intervalSec=平均间隔秒，maxPerWave=每波上限 */
  pickup: { value: number; intervalSec: number; maxPerWave: number };
}

/** 灵石拾取物运行时状态（表现层渲染 + 点击拾取） */
export interface PickupStone {
  uid: number;
  col: number;        // 所在列（格）
  row: number;        // 所在行（车道行）
  value: number;
  spawnAt: number;    // 引擎 elapsed（落地时间）
  lifeSec: number;    // 存活时长（超时消失，防囤积）
  collected: boolean;
}

export interface GridPoint { x: number; y: number; } // 格坐标 (col, row)

export type TerrainType = 'rock' | 'tree' | 'water';

export interface BlockedCell {
  col: number;
  row: number;
  terrain: TerrainType;
}

export interface ChapterBackground {
  id: string;
  cellA: string;           // 棋盘两色格 A
  cellB: string;           // 棋盘两色格 B
  pathColor: string;       // 路径底色
  pathGlow: string;        // 路径发光色
  baseGlow: string;        // 宗门光效色
  ambient?: { color: string; count: number };  // 飘浮粒子
}

/** 章节共享地图配置：每章一份，l1/l2/l3 引用 */
export interface ChapterMapConfig {
  id: string;              // 'ch1'
  cols: number;
  rows: number;
  paths: GridPoint[][];    // 所有路径，汇聚到 base
  base: GridPoint;         // 宗门入口坐标
  blocked?: BlockedCell[];
  backgroundId: string;
  actives: { l1: number[]; l2: number[]; l3: number[] };  // 每关开放的路径 index
}

/** 剧情片段（设计文档 §8.4，弹窗渲染层消费） */
export interface StoryBeat {
  /** 剧情唯一 ID（编年史打点/回看索引；缺省不记录） */
  id?: string;
  chapter?: string;
  title: string;
  lines: string[];
  btn: string;
}

/** 挑战玩法：速通/单流派/禁升级/禁光环/经济约束（选关时可选） */
export type ChallengeKind = 'speed' | 'mono_school' | 'no_upgrade' | 'no_aura' | 'budget';

export interface ChallengeDef {
  id: string;
  name: string;
  desc: string;
  kind: ChallengeKind;
  params?: Record<string, number | string>;
  rewardContrib: number;
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
  /** 此处可选的挑战列表（选关时显示供玩家选一个） */
  challenges?: ChallengeDef[];
  /** 阵眼布局（无尽或普通关卡均可使用） */
  formations?: FormationTile[];
  /** 背景主题 id */
  backgroundId?: string;
  /** 宗门入口坐标（汇聚路径的终点） */
  base?: GridPoint;
  /** 本关开放的路径 index（不出兵的路径地图上隐藏） */
  activePaths?: number[];
  /** 不可建区域（岩石/树木/水域） */
  blocked?: BlockedCell[];
  /** 关卡模式（缺省 classic）；lane=车道防守；stream=连续流夜袭（纵向车道）；forge=三路经营战 */
  mode?: LevelMode;
  /** 车道模式参数（mode==='lane' 时生效） */
  lane?: LaneConfig;
  /** 连续流模式参数（mode==='stream' 时生效） */
  stream?: StreamConfig;
  /** 锻炉模式参数（mode==='forge' 时生效） */
  forge?: ForgeConfig;
}

/** 阵眼类型 */
export type FormationType = 'wind' | 'thunder' | 'earth' | 'spirit';

/** 阵眼格定义 */
export interface FormationTile {
  col: number;
  row: number;
  type: FormationType;
}

/** 波次快照（战斗记录用） */
export interface WaveSnapshot {
  wave: number;
  isBoss: boolean;
  clearTime: number;
  skipped: boolean;
  spawnCount: number;
  killed: number;
  leaked: number;
  stonesBefore: number;
  stonesGained: number;
  towerDps: { towerId: string; damage: number; kills: number }[];
}

/** 塔战斗总结（战报用） */
export interface TowerSummary {
  towerId: string;
  level: number;
  col: number;
  row: number;
  onFormation: FormationType | null;
  totalDamage: number;
  totalKills: number;
  placedAtWave: number;
}

/** 单局战报 */
export interface BattleReport {
  date: string;
  mode: 'endless' | 'campaign';
  totalWaves: number;
  score: number;
  finalStones: number;
  blessings: string[];
  waves: WaveSnapshot[];
  towers: TowerSummary[];
}

/** 章节清单条目（设计文档 §8.2 manifest） */
export interface ManifestEntry {
  levelId: string;
  chapterId: string;
  chapterTitle: string;
}
