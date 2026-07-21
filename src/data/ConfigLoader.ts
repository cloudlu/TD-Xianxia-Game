// ConfigLoader —— 启动时配置校验（设计文档 §3）
// P1 阶段直接从 TS 常量子段加载，启动时校验必填字段 + ID 引用一致性；
// P2 迁移为 JSON 加载后，本模块同时负责解析与校验。

import { TOWERS, ENEMIES, SKINS, LEVELS, MANIFEST } from './config';
import type {
  TowerConfig, TowerLevelConfig, EnemyConfig, LevelConfig,
  TowerBehavior, TargetPolicy, ManifestEntry,
} from '../types';
import type { SkinConfig } from './config/skins';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_BEHAVIORS: TowerBehavior[] = ['projectile', 'pierce', 'aura', 'aoe', 'chain'];
const VALID_TARGETS: TargetPolicy[] = ['first', 'last', 'strongest', 'nearest'];
const VALID_SCHOOLS = ['sword', 'talisman', 'spear', 'magic', 'aura', 'fire', 'thunder', 'ice'];

function err(msg: string): string {
  return `[配置错误] ${msg}`;
}

// ---------- 塔校验 ----------

function validateTowerLevel(lv: TowerLevelConfig, towerId: string, idx: number, behavior: TowerBehavior, errors: string[]): void {
  if (!lv.realm) errors.push(err(`塔[${towerId}] 第${idx + 1}级 realm 为空`));
  if (lv.dmg < 0) errors.push(err(`塔[${towerId}] 第${idx + 1}级 dmg(${lv.dmg}) < 0`));
  // aura 塔没有攻击行为，允许 rate=0
  if (behavior !== 'aura' && lv.rate <= 0) errors.push(err(`塔[${towerId}] 第${idx + 1}级 rate(${lv.rate}) ≤ 0`));
  if (behavior === 'aura' && lv.rate !== 0) {
    errors.push(err(`塔[${towerId}] 第${idx + 1}级 非攻击塔 rate 应为 0，实际为 ${lv.rate}`));
  }
  if (lv.range < 0) errors.push(err(`塔[${towerId}] 第${idx + 1}级 range(${lv.range}) < 0`));
  if (lv.crit !== undefined && (lv.crit < 0 || lv.crit > 1)) {
    errors.push(err(`塔[${towerId}] 第${idx + 1}级 crit(${lv.crit}) 不在 [0,1] 范围`));
  }
  if (lv.pierce !== undefined && lv.pierce < 0) {
    errors.push(err(`塔[${towerId}] 第${idx + 1}级 pierce(${lv.pierce}) < 0`));
  }
  if (lv.aoeRadius !== undefined && lv.aoeRadius <= 0) {
    errors.push(err(`塔[${towerId}] 第${idx + 1}级 aoeRadius(${lv.aoeRadius}) ≤ 0`));
  }
  if (lv.chainCount !== undefined && lv.chainCount <= 0) {
    errors.push(err(`塔[${towerId}] 第${idx + 1}级 chainCount(${lv.chainCount}) ≤ 0`));
  }
  if (lv.chainRange !== undefined && lv.chainRange <= 0) {
    errors.push(err(`塔[${towerId}] 第${idx + 1}级 chainRange(${lv.chainRange}) ≤ 0`));
  }
  if (lv.upgradeCost !== undefined && lv.upgradeCost < 0) {
    errors.push(err(`塔[${towerId}] 第${idx + 1}级 upgradeCost(${lv.upgradeCost}) < 0`));
  }
}

function validateTowerConfig(def: TowerConfig, key: string, errors: string[]): void {
  if (!def.id) errors.push(err(`塔 key[${key}] 缺少 id`));
  if (def.id !== key) errors.push(err(`塔 key[${key}] 与 id[${def.id}] 不匹配`));
  if (!def.name) errors.push(err(`塔[${def.id}] name 为空`));
  if (!def.icon) errors.push(err(`塔[${def.id}] icon 为空`));
  if (def.cost <= 0) errors.push(err(`塔[${def.id}] cost(${def.cost}) ≤ 0`));
  if (def.sellRatio < 0 || def.sellRatio > 1) {
    errors.push(err(`塔[${def.id}] sellRatio(${def.sellRatio}) 不在 [0,1] 范围`));
  }
  if (!VALID_BEHAVIORS.includes(def.behavior)) {
    errors.push(err(`塔[${def.id}] behavior(${def.behavior}) 无效，合法值: ${VALID_BEHAVIORS.join('/')}`));
  }
  if (!VALID_SCHOOLS.includes(def.school)) {
    errors.push(err(`塔[${def.id}] school(${def.school}) 未知`));
  }
  if (!VALID_TARGETS.includes(def.targetPolicy)) {
    errors.push(err(`塔[${def.id}] targetPolicy(${def.targetPolicy}) 无效`));
  }
  if (!def.color) errors.push(err(`塔[${def.id}] color 为空`));
  if (!def.desc) errors.push(err(`塔[${def.id}] desc 为空`));
  if (!def.levels || def.levels.length === 0) {
    errors.push(err(`塔[${def.id}] levels 为空`));
    return;
  }
    for (let i = 0; i < def.levels.length; i++) {
    validateTowerLevel(def.levels[i], def.id, i, def.behavior, errors);
    }
}

// ---------- 敌人校验 ----------

function validateEnemyConfig(def: EnemyConfig, key: string, errors: string[], enemyIds: Set<string>): void {
  if (!def.id) errors.push(err(`敌人 key[${key}] 缺少 id`));
  if (def.id !== key) errors.push(err(`敌人 key[${key}] 与 id[${def.id}] 不匹配`));
  if (!def.name) errors.push(err(`敌人[${def.id}] name 为空`));
  if (!def.icon) errors.push(err(`敌人[${def.id}] icon 为空`));
  if (def.hp <= 0) errors.push(err(`敌人[${def.id}] hp(${def.hp}) ≤ 0`));
  if (def.speed <= 0) errors.push(err(`敌人[${def.id}] speed(${def.speed}) ≤ 0`));
  if (def.armor < 0) errors.push(err(`敌人[${def.id}] armor(${def.armor}) < 0`));
  if (def.bounty < 0) errors.push(err(`敌人[${def.id}] bounty(${def.bounty}) < 0`));
  if (!def.color) errors.push(err(`敌人[${def.id}] color 为空`));
  if (def.dodge !== undefined && (def.dodge < 0 || def.dodge > 1)) {
    errors.push(err(`敌人[${def.id}] dodge(${def.dodge}) 不在 [0,1] 范围`));
  }
  if (def.shield !== undefined && def.shield < 0) {
    errors.push(err(`敌人[${def.id}] shield(${def.shield}) < 0`));
  }
  if (def.lifestealHp !== undefined && def.lifestealHp < 0) {
    errors.push(err(`敌人[${def.id}] lifestealHp(${def.lifestealHp}) < 0`));
  }

  // split 子体引用
  if (def.split) {
    if (!def.split.child) {
      errors.push(err(`敌人[${def.id}] split.child 为空`));
    } else if (!enemyIds.has(def.split.child)) {
      errors.push(err(`敌人[${def.id}] split.child[${def.split.child}] 不存在于 ENEMIES`));
    }
    if (def.split.count <= 0) {
      errors.push(err(`敌人[${def.id}] split.count(${def.split.count}) ≤ 0`));
    }
  }

  // bossAbility 引用
  if (def.bossAbility) {
    if (def.bossAbility.interval <= 0) {
      errors.push(err(`敌人[${def.id}] bossAbility.interval(${def.bossAbility.interval}) ≤ 0`));
    }
    if (def.bossAbility.charmRadius !== undefined && def.bossAbility.charmRadius <= 0) {
      errors.push(err(`敌人[${def.id}] bossAbility.charmRadius(${def.bossAbility.charmRadius}) ≤ 0`));
    }
    if (def.bossAbility.charmDuration !== undefined && (def.bossAbility.charmDuration <= 0 || def.bossAbility.charmDuration > 3)) {
      errors.push(err(`敌人[${def.id}] bossAbility.charmDuration(${def.bossAbility.charmDuration}) 不在 (0,3] 范围`));
    }
    if (def.bossAbility.summon) {
      if (!def.bossAbility.summon.enemy) {
        errors.push(err(`敌人[${def.id}] bossAbility.summon.enemy 为空`));
      } else if (!enemyIds.has(def.bossAbility.summon.enemy)) {
        errors.push(err(`敌人[${def.id}] bossAbility.summon.enemy[${def.bossAbility.summon.enemy}] 不存在于 ENEMIES`));
      }
      if (def.bossAbility.summon.count <= 0) {
        errors.push(err(`敌人[${def.id}] bossAbility.summon.count(${def.bossAbility.summon.count}) ≤ 0`));
      }
    }
    if (def.bossAbility.enrageBelow) {
      if (def.bossAbility.enrageBelow.hpPct <= 0 || def.bossAbility.enrageBelow.hpPct >= 1) {
        errors.push(err(`敌人[${def.id}] bossAbility.enrageBelow.hpPct(${def.bossAbility.enrageBelow.hpPct}) 不在 (0,1) 范围`));
      }
      if (def.bossAbility.enrageBelow.speedMul <= 0) {
        errors.push(err(`敌人[${def.id}] bossAbility.enrageBelow.speedMul(${def.bossAbility.enrageBelow.speedMul}) ≤ 0`));
      }
    }
  }
}

// ---------- 关卡校验 ----------

function validateLevelConfig(
  def: LevelConfig, key: string, errors: string[], warnings: string[], enemyIds: Set<string>,
): void {
  if (!def.id) errors.push(err(`关卡 key[${key}] 缺少 id`));
  if (def.id !== key) errors.push(err(`关卡 key[${key}] 与 id[${def.id}] 不匹配`));
  if (!def.name) errors.push(err(`关卡[${def.id}] name 为空`));
  if (def.startStones < 0) errors.push(err(`关卡[${def.id}] startStones(${def.startStones}) < 0`));
  if (def.lives <= 0) errors.push(err(`关卡[${def.id}] lives(${def.lives}) ≤ 0`));
  if (def.cols <= 0) errors.push(err(`关卡[${def.id}] cols(${def.cols}) ≤ 0`));
  if (def.rows <= 0) errors.push(err(`关卡[${def.id}] rows(${def.rows}) ≤ 0`));

  if (!def.paths || def.paths.length === 0) {
    errors.push(err(`关卡[${def.id}] paths 为空`));
  } else {
    for (let i = 0; i < def.paths.length; i++) {
      if (def.paths[i].length < 2) {
        errors.push(err(`关卡[${def.id}] paths[${i}] 路点不足 2 个`));
      }
    }
  }

  if (!def.buildable || def.buildable.length === 0) {
    errors.push(err(`关卡[${def.id}] buildable 为空`));
  } else if (def.buildable.length !== def.rows) {
    warnings.push(`关卡[${def.id}] buildable 行数(${def.buildable.length}) ≠ rows(${def.rows})`);
  }

  if (!def.waves || def.waves.length === 0) {
    errors.push(err(`关卡[${def.id}] waves 为空`));
  } else {
    for (let i = 0; i < def.waves.length; i++) {
      const w = def.waves[i];
      if (w.clearBonus < 0) {
        errors.push(err(`关卡[${def.id}] 第${i + 1}波 clearBonus(${w.clearBonus}) < 0`));
      }
      if (!w.spawns || w.spawns.length === 0) {
        errors.push(err(`关卡[${def.id}] 第${i + 1}波 spawns 为空`));
        continue;
      }
      for (let j = 0; j < w.spawns.length; j++) {
        const sp = w.spawns[j];
        if (!sp.enemy) {
          errors.push(err(`关卡[${def.id}] 第${i + 1}波 第${j + 1}个 spawn 缺少 enemy`));
        } else if (!enemyIds.has(sp.enemy)) {
          errors.push(err(`关卡[${def.id}] 第${i + 1}波 spawn enemy[${sp.enemy}] 不存在于 ENEMIES`));
        }
        if (sp.count <= 0) {
          errors.push(err(`关卡[${def.id}] 第${i + 1}波 spawn count(${sp.count}) ≤ 0`));
        }
        if (sp.gap < 0) {
          errors.push(err(`关卡[${def.id}] 第${i + 1}波 spawn gap(${sp.gap}) < 0`));
        }
        if (sp.delay < 0) {
          errors.push(err(`关卡[${def.id}] 第${i + 1}波 spawn delay(${sp.delay}) < 0`));
        }
        if (sp.path !== undefined && (sp.path < 0 || sp.path >= def.paths.length)) {
          errors.push(err(`关卡[${def.id}] 第${i + 1}波 spawn path(${sp.path}) 超出 paths 范围`));
        }
      }
    }
  }

  if (def.hpMul !== undefined && def.hpMul <= 0) {
    errors.push(err(`关卡[${def.id}] hpMul(${def.hpMul}) ≤ 0`));
  }
  if (def.maxTowerLevel !== undefined && def.maxTowerLevel < 0) {
    errors.push(err(`关卡[${def.id}] maxTowerLevel(${def.maxTowerLevel}) < 0`));
  }
}

// ---------- 皮肤校验 ----------

function validateSkinConfig(def: SkinConfig, towerIds: Set<string>, errors: string[]): void {
  if (!def.id) { errors.push(err(`皮肤缺少 id`)); return; }
  if (!def.target) {
    errors.push(err(`皮肤[${def.id}] target 为空`));
  } else if (!towerIds.has(def.target)) {
    errors.push(err(`皮肤[${def.id}] target[${def.target}] 不存在于 TOWERS`));
  }
  if (!def.name) errors.push(err(`皮肤[${def.id}] name 为空`));
  if (def.price < 0) errors.push(err(`皮肤[${def.id}] price(${def.price}) < 0`));
}

// ---------- Manifest 校验 ----------

function validateManifest(manifest: ManifestEntry[], levelIds: Set<string>, errors: string[]): void {
  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    if (!entry.levelId) {
      errors.push(err(`MANIFEST[${i}] levelId 为空`));
    } else if (!levelIds.has(entry.levelId)) {
      errors.push(err(`MANIFEST[${i}] levelId[${entry.levelId}] 不存在于关卡配置`));
    }
    if (!entry.chapterId) errors.push(err(`MANIFEST[${i}] chapterId 为空`));
    if (!entry.chapterTitle) errors.push(err(`MANIFEST[${i}] chapterTitle 为空`));
  }
}

// ---------- 主入口 ----------

export function validateConfigs(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 收集所有合法 ID
  const towerIds = new Set(Object.keys(TOWERS));
  const enemyIds = new Set(Object.keys(ENEMIES));
  const levelIds = new Set(Object.keys(LEVELS));

  // 1. 塔
  for (const key of Object.keys(TOWERS)) {
    const def = TOWERS[key];
    if (!def) { errors.push(err(`TOWERS[${key}] 为 undefined`)); continue; }
    validateTowerConfig(def, key, errors);
  }

  // 2. 敌人
  for (const key of Object.keys(ENEMIES)) {
    const def = ENEMIES[key];
    if (!def) { errors.push(err(`ENEMIES[${key}] 为 undefined`)); continue; }
    validateEnemyConfig(def, key, errors, enemyIds);
  }

  // 3. 关卡
  for (const key of Object.keys(LEVELS)) {
    const def = LEVELS[key];
    if (!def) { errors.push(err(`LEVELS[${key}] 为 undefined`)); continue; }
    validateLevelConfig(def, key, errors, warnings, enemyIds);
  }

  // 4. 皮肤
  if (SKINS) {
    for (const key of Object.keys(SKINS)) {
      const def = SKINS[key];
      if (!def) continue;
      validateSkinConfig(def, towerIds, errors);
    }
  }

  // 5. Manifest
  if (MANIFEST && MANIFEST.length > 0) {
    validateManifest(MANIFEST, levelIds, errors);
  }

  return { ok: errors.length === 0, errors, warnings };
}
