// 宗门头衔（修真地位系统）：随通关章节自动晋升，纯展示型成就，非付费墙。
import type { ManifestEntry } from '../../types';
import type { Progression } from '../../repo/progress';

/** 头衔阶梯（按"已通关章节数"晋升） */
export const TITLES = [
  '外门弟子', '内门弟子', '护阵执事', '护阵长老', '传功长老', '太上长老',
  '域外使', '镇域使', '域主', '封域真人', '大域巡察使',
  '联盟护法', '联盟长老', '联盟统帅', '联盟元帅', '大陆守护者',
  '百族尊者', '镇天将', '护界者', '镇界使者', '万族共主',
  '界域将军', '界主', '守界圣人', '镇界天尊', '万界守护',
  '飞升者', '天人', '仙尊', '道君', '道祖',
] as const;

export interface TitleStatus {
  index: number;
  title: string;
  nextTitle: string | null;     // 下一阶头衔（已封顶为 null）
  completedChapters: number;    // 当前已通关章节数
  nextAt: number | null;        // 晋升下一阶所需的通关章节数
}

/** 由已通关章节数解析当前头衔状态 */
export function resolveTitle(completedChapters: number): TitleStatus {
  const index = Math.min(completedChapters, TITLES.length - 1);
  const nextAt = index < TITLES.length - 1 ? index + 1 : null;
  return {
    index,
    title: TITLES[index],
    nextTitle: nextAt !== null ? TITLES[index + 1] : null,
    completedChapters,
    nextAt,
  };
}

/** 统计已"完整通关"的章节数（该章所有关卡均已通关） */
export function completedChapters(manifest: ReadonlyArray<ManifestEntry>, p: Progression): number {
  const byChapter = new Map<string, { total: number; cleared: number }>();
  for (const e of manifest) {
    const c = byChapter.get(e.chapterId) ?? { total: 0, cleared: 0 };
    c.total += 1;
    if (p.cleared[e.levelId]) c.cleared += 1;
    byChapter.set(e.chapterId, c);
  }
  let n = 0;
  for (const c of byChapter.values()) if (c.cleared >= c.total) n += 1;
  return n;
}
