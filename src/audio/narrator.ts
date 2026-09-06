// 剧情旁白 TTS 声线配置与文本清洗（v0.88）：纯函数，可单测。
// Web Speech 本地音色有限（通常男/女各一），角色区分靠 gender + pitch/rate 拉开。
// 第二步（配音文件阶段）此表将升级为 voice 文件映射。

export interface VoiceProfile {
  gender: 'male' | 'female';
  pitch: number;   // 0-2
  rate: number;    // 0.1-10（1=正常）
}

/** 角色声线表：key = StoryBeat.chapter（去空格后匹配） */
export const VOICE_PROFILES: Record<string, VoiceProfile> = {
  // 固定角色（characters.ts CHARACTER_NAMES）
  '掌门': { gender: 'male', pitch: 0.7, rate: 0.85 },      // 威严苍老
  '师叔': { gender: 'male', pitch: 0.8, rate: 0.9 },       // 慈和
  '林清霜': { gender: 'female', pitch: 1.15, rate: 1.0 },  // 清亮少女
  '神秘人': { gender: 'male', pitch: 0.6, rate: 0.8 },     // 沙哑低缓
  '血煞魔尊': { gender: 'male', pitch: 0.5, rate: 0.85 },  // 阴沉威压
  '魔帅': { gender: 'male', pitch: 0.55, rate: 0.85 },     // 阴沉（略轻于魔尊）
  '天道': { gender: 'female', pitch: 1.3, rate: 0.9 },     // 非人感（高音+缓）
};

/** 默认旁白：低沉说书人（男声） */
export const NARRATOR_PROFILE: VoiceProfile = { gender: 'male', pitch: 0.9, rate: 0.95 };

/** chapter 名（可能含空格如「掌 门」）→ 声线；未知角色回退旁白 */
export function voiceFor(chapter: string | undefined): VoiceProfile {
  if (!chapter) return NARRATOR_PROFILE;
  return VOICE_PROFILES[chapter.replace(/\s+/g, '')] ?? NARRATOR_PROFILE;
}

export interface NarrationLine {
  text: string;          // 清洗后的朗读文本（空串=跳过）
  isDialogue: boolean;   // true=「」内角色台词
}

/**
 * 台词行判定（格式约定 v0.88）：
 * - 「」块出现在**行首**（允许前导空白/破折号）或**行尾**（动作描述后接台词，如 `她低声道：「…」`）→ 台词行
 * - 句中纯名词/书名引用一律用『』（如 皆源于那道『天道』的影子）→ 不构成台词行
 * 由 lint 测试（narratorAudit）保证全部文案遵守约定，这里只做一条简单规则、不做启发式。
 */
export function isDialogueLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith('「') || t.endsWith('」');
}

/** 整段是否为对白段（存在任一台词行）——决定描述行读不读（AudioManager 回退逻辑用） */
export function beatHasDialogue(lines: readonly string[]): boolean {
  return lines.some((l) => isDialogueLine(l));
}

/**
 * 台词行解析：一行可能混合台词与描述（「…」她笑了）。
 * 规则：台词行（行首/行尾「」）→ 角色声线整行读；描述行 → 旁白声线读（readNarration 默认 true，
 * 有声书式混排：对白段中间的描述如"掌门负手立于山巅…"用旁白声线补全叙事，不再跳过）。
 * 朗读文本统一去空白（「林 清 霜」→「林清霜」）与引号。
 */
export function parseNarrationLine(line: string, readNarration: boolean): NarrationLine {
  const isDialogue = isDialogueLine(line);
  if (!isDialogue && !readNarration) return { text: '', isDialogue: false };
  const text = line.replace(/\s+/g, '').replace(/「|」/g, '');
  return { text: text.length > 0 ? text : '', isDialogue };
}
