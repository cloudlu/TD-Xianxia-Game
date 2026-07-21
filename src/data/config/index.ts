// 配置 barrel：策划改数值的总入口（P2 之后会迁移为 JSON + ConfigLoader 校验）
export { TOWERS } from './towers';
export { ENEMIES } from './enemies';
export { LEVELS, MANIFEST } from './levels';
export { FAILED_STORY } from './story';
export { EQUIPMENT, EQUIPMENT_IDS, SLOTS } from './equipment';
export { VIP_LEVELS, VIP_MAX_LEVEL } from './vip';
export { SKINS, SKIN_IDS, EFFECT_COLOR } from './skins';
export { TALENTS, TALENT_IDS, talentCost, talentMods } from './talents';
export { TITLES, resolveTitle, completedChapters } from './titles';
export type { TitleStatus } from './titles';
export type { SkinEffect } from './skins';
export type { StoryBeat } from '../../types';
export { LIMITED_TREASURES, LIMITED_TREASURE_IDS } from './limited_treasures';
export { REALM_STORIES, TOWER_UNLOCK_STORIES } from './realmStories';
export type { LimitedTreasureConfig } from './limited_treasures';
