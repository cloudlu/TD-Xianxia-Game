// 宗门编年史索引：集中登记所有带 id 的剧情，供编年史回看页查询全文
import type { StoryBeat } from '../../types';
import { CHAPTER_TITLES } from './chapterTitles';
import { CHAPTER_CHAR_BEATS } from './characters';

/** 章节分组信息：编年史按章展示 */
export interface ChronicleGroup {
  chapterId: string;      // 'ch1' ... 'ch30'
  title: string;          // 回目名
  beats: StoryBeat[];
}

/** 序章 */
export const PROLOGUE_STORY: StoryBeat = {
  id: 'prologue',
  chapter: '前 言',
  title: '序 · 守 山 人',
  lines: [
    '苍茫修真界，天外有天。',
    '传说在上古时代，一位飞升者踏入天门前，留下了一道影子守护人间——那是天道最初的模样。',
    '而它的影子，成了万年后的心魔。',
    '妖潮、魔修、裂隙、界域之乱……无数劫难，皆源于那道『天道』的影子。',
    '你，山门外的一名小小弟子，被掌门选中，接下了守护山门的重任。',
    '自此，你的一生将与这座山、这片天、以及一个人的约定，紧紧相连。',
  ],
  btn: '开 卷',
};

/** 结局剧情 */
export const ENDING_STORIES: Record<string, StoryBeat> = {
  ending_ascend: {
    id: 'ending_ascend',
    chapter: '全 篇 终',
    title: '成 道',
    lines: [
      '你踏上天门，接掌天道。',
      '道祖魔影消散，万道俯首。你成了新的天道。',
      '可当你回望人间——山门下那道青色剑光，早已等了你三千年。',
      '「我等你，等得好苦啊。」她笑着说，声音却像在哭。',
      '你终于明白：天道，是最孤独的路。',
    ],
    btn: '执 道',
  },
  ending_wander: {
    id: 'ending_wander',
    chapter: '全 篇 终',
    title: '执 子 之 手',
    lines: [
      '道祖魔影消散，天外天归于宁静。',
      '天道的声音再次响起：「你愿意成为新的天道吗？」',
      '你看着山门下那道等你许久的倩影，笑着摇头：',
      '「这人间烟火，比天道更有意思。」',
      '你转身走下天门，牵起她的手，浪迹天涯。',
      '——修真界的故事结束，你们的故事，才刚刚开始。',
    ],
    btn: '浪 迹 天 涯',
  },
  ending_reincarnate: {
    id: 'ending_reincarnate',
    chapter: '全 篇 终',
    title: '轮 回 重 逢',
    lines: [
      '这一世，你已轮回数世，仙魂通透。',
      '再次站在道祖魔影前，你忽然想起很久以前，有人说过——',
      '「无论你最后成了谁，都别忘了等我。」',
      '道祖魔影消散。天道问你：「可愿接掌？」',
      '你闭上眼，再次摇头：',
      '「我答应过一个人，要在这人间等她。」',
      '山门深处，一个青色衣裙的少女正抬头看你，眉眼间是跨越几世的熟悉。',
      '「这一次，终于……等到你了。」',
    ],
    btn: '重 逢',
  },
};

/** 全部带 id 剧情的查询表 */
const INDEX: Record<string, StoryBeat> = {};

function register(beat: StoryBeat | undefined): void {
  if (beat?.id) INDEX[beat.id] = beat;
}

register(PROLOGUE_STORY);
for (const e of [ENDING_STORIES]) for (const k of Object.keys(e)) register(e[k]);
for (const g of CHAPTER_CHAR_BEATS) { register(g.l1); register(g.l3); }

// 每章下回预告（ch30 无）
CHAPTER_TITLES.forEach((ct, i) => {
  const n = i + 1;
  if (!ct.preview) return;
  register({
    id: `ch${n}_preview`,
    chapter: `第 ${['一','二','三','四','五','六','七','八','九','十'][Math.floor((n-1)/10)]}${['','一','二','三','四','五','六','七','八','九'][(n-1)%10]} 章 完`,
    title: '下 回 预 告',
    lines: [ct.preview],
    btn: '待 续',
  });
});

/** 按 id 查询剧情（未登记返回 undefined） */
export function storyById(id: string): StoryBeat | undefined {
  return INDEX[id];
}

/** 编年史分组：按 30 章聚合角色对白（l1/l3）与下回预告 */
export function chronicleGroups(): ChronicleGroup[] {
  const groups: ChronicleGroup[] = CHAPTER_TITLES.map((ct, i) => {
    const beats: StoryBeat[] = [];
    const chars = CHAPTER_CHAR_BEATS[i];
    if (chars.l1) beats.push(chars.l1);
    if (chars.l3) beats.push(chars.l3);
    const preview = INDEX[`ch${i + 1}_preview`];
    if (preview) beats.push(preview);
    return { chapterId: `ch${i + 1}`, title: ct.title, beats };
  });
  return groups;
}

/** 全剧章节名（供选关卡片显示回目） */
export function chapterTitleByIndex(i: number): string {
  return CHAPTER_TITLES[i]?.title ?? '';
}

/**
 * 老存档编年史回填：按已通关关卡（cleared）补全对应章的剧情 id（l1/l3 对白 + 下回预告）。
 * 纯函数，只回填 id（不存全文），幂等；不清空已有记录。结局不自动回填（由玩家在终章选择）。
 */
export function backfillChronicle(
  cleared: Record<string, unknown>,
  existing: string[],
  prologueSeen: boolean,
): string[] {
  const seen = new Set(existing);
  const isOld = prologueSeen || Object.keys(cleared ?? {}).length > 0;
  if (isOld) seen.add('prologue');
  const clearedIds = new Set<string>();
  for (const key of Object.keys(cleared ?? {})) {
    const id = key.split(':')[0];
    clearedIds.add(id);
    seen.add(`${id}_intro`);  // 已通关关卡的开场旁白视为已读（复刷不再弹）
  }
  for (let i = 0; i < 30; i += 1) {
    const n = i + 1;
    const l1Key = `ch${n}-l1`;
    const l3Key = `ch${n}-l3`;
    // l1 对白：该章 l1 已通（或 l3 已通——顺序解锁，必先通 l1）
    if (clearedIds.has(l1Key) || clearedIds.has(l3Key)) {
      const b = CHAPTER_CHAR_BEATS[i].l1;
      if (b?.id) seen.add(b.id);
    }
    if (clearedIds.has(l3Key)) {
      const b = CHAPTER_CHAR_BEATS[i].l3;
      if (b?.id) seen.add(b.id);
      const preview = INDEX[`ch${n}_preview`];
      if (preview?.id) seen.add(preview.id);
    }
  }
  return [...seen];
}
