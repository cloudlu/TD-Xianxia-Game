import { describe, it, expect } from 'vitest';
import { ENEMIES } from './enemies';
import { CHAPTER_TITLES } from './chapterTitles';
import { CHAPTER_CHAR_BEATS, REALM_CHAR_LINES } from './characters';
import { chronicleGroups, storyById, PROLOGUE_STORY, ENDING_STORIES, backfillChronicle } from './chronicleIndex';

describe('妖兽录叙事（enemy lore）', () => {
  it('全部 38 个敌人均有 lore 传说', () => {
    const ids = Object.keys(ENEMIES);
    expect(ids.length).toBeGreaterThanOrEqual(38);
    for (const id of ids) {
      expect(ENEMIES[id].lore, `enemy ${id} 缺 lore`).toBeTruthy();
    }
  });
});

describe('章节回目与人物对白', () => {
  it('30 章均有独立回目名', () => {
    expect(CHAPTER_TITLES.length).toBe(30);
    const titles = CHAPTER_TITLES.map((c) => c.title);
    expect(new Set(titles).size).toBe(30);
  });

  it('30 章 l1/l3 对白齐全（ch30 仅 l1）', () => {
    expect(CHAPTER_CHAR_BEATS.length).toBe(30);
    for (let i = 0; i < 30; i += 1) {
      expect(CHAPTER_CHAR_BEATS[i].l1?.id, `ch${i + 1} 缺 l1 对白`).toBeTruthy();
      if (i < 29) expect(CHAPTER_CHAR_BEATS[i].l3?.id, `ch${i + 1} 缺 l3 对白`).toBeTruthy();
    }
  });

  it('人物对白按章配置且 l1/l3 id 唯一——每关不会重复同一段', () => {
    const ids: string[] = [];
    for (const c of CHAPTER_CHAR_BEATS) {
      if (c.l1?.id) ids.push(c.l1.id);
      if (c.l3?.id) ids.push(c.l3.id);
    }
    expect(new Set(ids).size).toBe(ids.length);
    // 同一章 l1/l3 对白 id 不同（避免同章各关弹同一段）
    for (const c of CHAPTER_CHAR_BEATS) {
      if (c.l1 && c.l3) expect(c.l1.id).not.toBe(c.l3.id);
    }
  });

  it('境界突破台词数量与境界数一致（8 个）', () => {
    expect(REALM_CHAR_LINES.length).toBe(8);
  });
});

describe('编年史索引', () => {
  it('ch30 无下回预告，其余 29 章均有', () => {
    for (let i = 1; i <= 30; i += 1) {
      const beat = storyById(`ch${i}_preview`);
      if (i === 30) expect(beat).toBeUndefined();
      else expect(beat?.title).toBe('下 回 预 告');
    }
  });

  it('序章与三个结局均已登记', () => {
    expect(storyById('prologue')).toBe(PROLOGUE_STORY);
    expect(storyById('ending_ascend')).toBeTruthy();
    expect(storyById('ending_wander')).toBeTruthy();
    expect(storyById('ending_reincarnate')).toBeTruthy();
  });

  it('编年史分组聚合 l1/l3/预告', () => {
    const groups = chronicleGroups();
    expect(groups.length).toBe(30);
    expect(groups[0].chapterId).toBe('ch1');
    expect(groups[0].beats.length).toBeGreaterThanOrEqual(2);
    // ch30 组：l1 对白（无 l3、无预告）≥1
    expect(groups[29].beats.length).toBeGreaterThanOrEqual(1);
  });

  it('结局互斥：finalEnding 三态互不相同', () => {
    const keys = Object.keys(ENDING_STORIES).sort();
    expect(keys).toEqual(['ending_ascend', 'ending_reincarnate', 'ending_wander']);
  });
});

describe('老存档编年史回填（backfillChronicle）', () => {
  it('无通关记录且未看序章：保持为空', () => {
    expect(backfillChronicle({}, [], false)).toEqual([]);
  });

  it('老档（有通关记录）补入序章标记', () => {
    const r = backfillChronicle({ 'ch1-l1': { stars: 3 } }, [], false);
    expect(r).toContain('prologue');
  });

  it('通关某章 l1 补该章章首对白；通关 l3 补章末对白 + 下回预告', () => {
    const cleared = { 'ch2-l1': { stars: 3 }, 'ch2-l2': { stars: 2 }, 'ch2-l3': { stars: 1 } };
    const r = backfillChronicle(cleared, [], true);
    expect(r).toContain('ch2_l1_char');
    expect(r).toContain('ch2_l3_char');
    expect(r).toContain('ch2_preview');
    // 未通关 ch1 的对白不补
    expect(r).not.toContain('ch1_l1_char');
    expect(r).not.toContain('ch1_preview');
  });

  it('已通关关卡的开场旁白（{levelId}_intro）一并回填，复刷不重播', () => {
    const r = backfillChronicle({ 'ch5-l3': { stars: 1 } }, [], true);
    expect(r).toContain('ch5-l3_intro');
    expect(r).toContain('ch5_l3_char');
    expect(r).not.toContain('ch5-l2_intro');
  });

  it('ch30 通关 l3 不补下回预告（无预告）', () => {
    const r = backfillChronicle({ 'ch30-l3': { stars: 3 } }, [], true);
    expect(r).toContain('ch30_l1_char');
    expect(r).not.toContain('ch30_preview');
  });

  it('保留已有记录（幂等，不重复不丢失）', () => {
    const r1 = backfillChronicle({ 'ch1-l1': { stars: 3 } }, ['ch1_l1_char'], true);
    expect(r1.filter((x) => x === 'ch1_l1_char').length).toBe(1);
    const r2 = backfillChronicle({ 'ch1-l1': { stars: 3 }, 'ch2-l1': { stars: 3 } }, r1, true);
    expect(r2).toContain('ch1_l1_char');
    expect(r2).toContain('ch2_l1_char');
  });
});
