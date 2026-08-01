/** 塔流派（school）中文名映射，用于挑战提示等用户可见文案 */
export const SCHOOL_LABELS: Record<string, string> = {
  sword: '剑修',
  talisman: '符修',
  spear: '枪修',
  magic: '法修',
  aura: '聚灵',
  fire: '火法',
  thunder: '雷法',
  ice: '冰法',
  earth: '雷法',
};

export function schoolLabel(school: string): string {
  return SCHOOL_LABELS[school] ?? school;
}
