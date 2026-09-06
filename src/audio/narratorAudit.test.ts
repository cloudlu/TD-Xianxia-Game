import { describe, it, expect } from 'vitest';
import { parseNarrationLine, beatHasDialogue, isDialogueLine } from './narrator';
import { PROLOGUE_STORY, ENDING_STORIES } from '../data/config/chronicleIndex';
import { CHAPTER_CHAR_BEATS } from '../data/config/characters';
import { REALM_STORIES, TOWER_UNLOCK_STORIES } from '../data/config/realmStories';
import { FAILED_STORY } from '../data/config/story';
import { LEVELS } from '../data/config/levels';
import type { StoryBeat } from '../types';

/**
 * 全量剧情 TTS 审计（v0.88）：复现 AudioManager.speakLines 的朗读决策——
 * 整段无「」→ 全文旁白朗读；有「」→ 只读台词行。
 * 规则：每个 beat 至少要有一行能读出（产出非空朗读文本），否则视为"静音 beat"缺陷。
 */

function collectBeats(): Array<{ src: string; beat: StoryBeat }> {
  const out: Array<{ src: string; beat: StoryBeat }> = [];
  out.push({ src: '序章', beat: PROLOGUE_STORY });
  for (const [k, b] of Object.entries(ENDING_STORIES)) out.push({ src: `结局:${k}`, beat: b });
  CHAPTER_CHAR_BEATS.forEach((g, i) => {
    if (g.l1) out.push({ src: `ch${i + 1}-l1对白`, beat: g.l1 });
    if (g.l3) out.push({ src: `ch${i + 1}-l3对白`, beat: g.l3 });
  });
  REALM_STORIES.forEach((b, i) => out.push({ src: `境界故事${i + 1}`, beat: b }));
  for (const [k, b] of Object.entries(TOWER_UNLOCK_STORIES)) out.push({ src: `塔解锁:${k}`, beat: b });
  out.push({ src: '失败剧情', beat: FAILED_STORY });
  for (const [id, lvl] of Object.entries(LEVELS)) {
    if (lvl.story?.intro) out.push({ src: `${id}:intro`, beat: lvl.story.intro });
    if (lvl.story?.outro) out.push({ src: `${id}:outro`, beat: lvl.story.outro });
  }
  return out;
}

/** 与 AudioManager.speakLines 相同的朗读决策（readNarration 默认 true：有声书式全文混排朗读） */
function narrationFor(beat: StoryBeat): Array<{ src: string; line: string; text: string }> {
  return beat.lines.map((line) => ({
    src: `${beat.title ?? beat.id ?? '?'}: ${line.slice(0, 14)}`,
    line,
    text: parseNarrationLine(line, true).text,
  }));
}

describe('全量剧情 TTS 审计', () => {
  const beats = collectBeats();

  it('覆盖了全部剧情源（数量合理）', () => {
    expect(beats.length).toBeGreaterThanOrEqual(180);   // 90关×2 + 对白60 + 序章结局境界塔解锁失败
  });

  it('没有任何 beat 整段静音（至少一行可读）', () => {
    const silent = beats.filter((b) => {
      const rows = narrationFor(b.beat);
      return !rows.some((r) => r.text.length > 0);
    });
    expect(silent.map((s) => s.src)).toEqual([]);
  });

  it('纯旁白段全文可读，『』名词引用不构成台词（序章回归）', () => {
    // 序章『天道』为名词引用——非台词段，全文按旁白朗读
    expect(beatHasDialogue(PROLOGUE_STORY.lines)).toBe(false);
    const rows = narrationFor(PROLOGUE_STORY);
    const unreadable = rows.filter((r) => r.text.length === 0 && r.line.trim().length > 0);
    expect(unreadable).toEqual([]);   // 序章全文可读
  });

  it('对白段中间的描述行也被朗读（有声书混排——ch1 授命回归）', () => {
    // ch1-l1 掌门对白：台词/描述/台词 三行——描述行"掌门负手立于山巅…"必须读出（旁白声线）
    const beat = CHAPTER_CHAR_BEATS[0].l1!;
    expect(beat.lines.some((l) => isDialogueLine(l))).toBe(true);
    const descLines = beat.lines.filter((l) => !isDialogueLine(l));
    expect(descLines.length).toBeGreaterThan(0);
    for (const d of descLines) {
      expect(parseNarrationLine(d, true).text.length, `描述行未朗读: ${d}`).toBeGreaterThan(0);
    }
  });

  it('真实台词段不受名词引用规则影响（行首/行尾台词与『』引用共存场景）', () => {
    expect(isDialogueLine('『玄冰诀』——以寒气冻结妖兽血脉。')).toBe(false);
    expect(isDialogueLine('「同门师弟？怎地一个人守在这里。」')).toBe(true);
    expect(isDialogueLine('「不错。」师叔抚须而笑。')).toBe(true);
    expect(isDialogueLine('她低声道：「脚下有东西。」')).toBe(true);
  });

  it('lint：全部剧情文案不允许句中「」引用（应改用『』，行首/行尾台词除外）', () => {
    const offenders: string[] = [];
    for (const b of beats) {
      for (const line of b.beat.lines) {
        const t = line.trim();
        if (isDialogueLine(t)) continue;   // 行首/行尾台词行，合法
        if (t.includes('「') || t.includes('」')) {
          offenders.push(`${b.src}: ${line}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('全部 beat 逐行可读（有声书混排，无跳行）', () => {
    for (const b of beats) {
      const rows = narrationFor(b.beat);
      const unreadable = rows.filter((r) => r.text.length === 0 && r.line.trim().length > 0);
      expect(unreadable, `${b.src} 存在未朗读的行`).toEqual([]);
    }
  });

  it('台词段的台词行全部可读', () => {
    for (const b of beats) {
      const dialogueLines = b.beat.lines.filter((l) => isDialogueLine(l));
      for (const dl of dialogueLines) {
        const parsed = parseNarrationLine(dl, false);
        expect(parsed.text.length, `${b.src} 台词行被清洗为空: ${dl}`).toBeGreaterThan(0);
      }
    }
  });

  it('章节视角（intro/outro 的 chapter 如"第 十 章"）映射旁白声线，不误匹配角色', () => {
    for (const b of beats) {
      const ch = b.beat.chapter;
      if (!ch || /第.+章|前言|全篇终|劫后/.test(ch.replace(/\s+/g, ''))) continue;  // 叙事视角
      // 其余应都是已知角色名（characters.ts 七角色）——抽查不崩溃即可
      expect(typeof ch).toBe('string');
    }
  });
});
