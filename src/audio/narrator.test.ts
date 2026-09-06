import { describe, it, expect } from 'vitest';
import { voiceFor, parseNarrationLine, NARRATOR_PROFILE, VOICE_PROFILES } from './narrator';

describe('voiceFor（角色声线分派）', () => {
  it('maps known characters (spaces stripped) to distinct profiles', () => {
    const leader = voiceFor('掌 门');
    const qingshuang = voiceFor('林 清 霜');
    const boss = voiceFor('血 煞 魔 尊');
    expect(leader).toEqual(VOICE_PROFILES['掌门']);
    expect(qingshuang.gender).toBe('female');
    expect(boss.pitch).toBeLessThan(NARRATOR_PROFILE.pitch);
  });

  it('falls back to narrator profile for unknown/empty chapter', () => {
    expect(voiceFor(undefined)).toBe(NARRATOR_PROFILE);
    expect(voiceFor('路人甲')).toBe(NARRATOR_PROFILE);
    expect(voiceFor('')).toBe(NARRATOR_PROFILE);
  });
});

describe('parseNarrationLine（台词/描述行解析）', () => {
  it('dialogue lines are read with quotes and spaces stripped', () => {
    const r = parseNarrationLine('「同门师弟？ 怎地一个人守在这里。」', false);
    expect(r.isDialogue).toBe(true);
    expect(r.text).toBe('同门师弟？怎地一个人守在这里。');
  });

  it('mid-sentence noun reference uses 『』 and is narration, not dialogue', () => {
    // 句中『天道』引用（格式约定）：非台词行；readNarration=false 时跳过，true 时旁白朗读
    const skipped = parseNarrationLine('无数劫难，皆源于那道『天道』的影子。', false);
    expect(skipped.isDialogue).toBe(false);
    expect(skipped.text).toBe('');
    const read = parseNarrationLine('无数劫难，皆源于那道『天道』的影子。', true);
    expect(read.text).toContain('天道');
  });

  it('line-start or line-end quote is dialogue（行首台词 / 动作+台词行尾）', () => {
    expect(parseNarrationLine('「不错。」师叔抚须而笑。', false).isDialogue).toBe(true);
    expect(parseNarrationLine('她低声道：「脚下有东西。」', false).isDialogue).toBe(true);
    expect(parseNarrationLine('「同门师弟？怎地一个人守在这里。」', false).isDialogue).toBe(true);
  });

  it('description lines skipped when readNarration=false (default)', () => {
    const r = parseNarrationLine('掌门负手立于山巅，目光望向山下。', false);
    expect(r.isDialogue).toBe(false);
    expect(r.text).toBe('');
  });

  it('description lines read with narrator voice when readNarration=true', () => {
    const r = parseNarrationLine('她收剑回首，眼中带着笑意。', true);
    expect(r.isDialogue).toBe(false);
    expect(r.text).toContain('她收剑回首');
  });

  it('empty/whitespace-only line yields empty text', () => {
    expect(parseNarrationLine('', false).text).toBe('');
    expect(parseNarrationLine('　', false).text).toBe('');
  });

  it('prologue-style pure narration (no dialogue quotes) should be fully read when caller passes readNarration=true（AudioManager 无台词段回退逻辑）', () => {
    // AudioManager.speakLines 的规则：整段无「」→ readNarration 强制 true。
    // 此处验证纯旁白行在 readNarration=true 时全部产出朗读文本。
    const prologue = [
      '苍茫修真界，天外有天。',
      '传说在上古时代，一位飞升者踏入天门前，留下了一道影子守护人间。',
    ];
    const noDialogue = !prologue.some((l) => l.includes('「') || l.includes('」'));
    expect(noDialogue).toBe(true);   // 序章确实无台词行 → 触发全文旁白朗读
    for (const l of prologue) {
      expect(parseNarrationLine(l, true).text.length).toBeGreaterThan(0);
    }
  });
});
