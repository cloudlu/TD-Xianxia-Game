// 音频管理（设计文档 §1.3 ui 之外的"反馈层"）
// 用 Web Audio API 现场合成，无需外部音频文件：
// - 背景乐：C 大五声音阶（古风/仙侠感）慢速 pad + 低音 drone
// - 音效：建塔/升级/出售/击杀/漏怪/开波/胜负
//
// 注意：音频属反馈层，不参与引擎确定性模拟（引擎不调用音频），故可自由用 Math.random。

import { voiceFor, parseNarrationLine, NARRATOR_PROFILE } from './narrator';

type SfxType = 'place' | 'upgrade' | 'sell' | 'kill' | 'kill_elite' | 'kill_boss' | 'leak' | 'wave' | 'win' | 'lose' | 'promote' | 'click' | 'boss'
  | 'realmup0' | 'realmup1' | 'realmup2';

/** 击杀音风格分档（v0.87 批次3）：normal/elite/boss 三档音色 */
export type KillStyle = 'normal' | 'elite' | 'boss';

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private droneOsc: OscillatorNode | null = null;
  private lastKill = 0;
  private killCombo = 0;
  muted = false;

  /** 必须在用户手势（如点击）中调用，浏览器才允许发声 */
  init(): void {
    if (this.ctx) return;
    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.master);
  }

  resume(): void { void this.ctx?.resume(); }

  // ---------- 动态混音（v0.87 批次1） ----------

  private baseMusicVol = 0.5;
  private battlePressure = false;
  private heartbeatTimer: number | null = null;

  /** sting 让位：音乐瞬时压低再恢复（混音礼让） */
  duckMusic(duration: number, toVol: number): void {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    const target = this.baseMusicVol * (this.battlePressure ? 0.8 : 1);
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setTargetAtTime(Math.min(target, toVol), t, 0.05);
    this.musicGain.gain.setTargetAtTime(target, t + duration, 0.2);
  }

  /** 战斗压力：敌数 >15 自动压音乐 20%（探测到压力回落即恢复） */
  setBattleIntensity(enemyCount: number): void {
    const pressure = enemyCount > 15;
    if (pressure === this.battlePressure) return;
    this.battlePressure = pressure;
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(this.baseMusicVol * (pressure ? 0.8 : 1), this.ctx.currentTime, 0.4);
    }
  }

  /** 危机心跳：lives ≤1 时低频心跳 drone（55Hz 双脉冲循环） */
  startHeartbeat(): void {
    if (this.heartbeatTimer !== null) return;
    const beat = () => {
      this.blip(55, 0.12, 'sine', 0.14);
      window.setTimeout(() => this.blip(55, 0.10, 'sine', 0.10), 180);
    };
    beat();
    this.heartbeatTimer = window.setInterval(beat, 900);
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
  }

  /** 切后台暂停/恢复（由 visibilitychange 驱动） */
  setSuspended(suspended: boolean): void {
    if (suspended) this.stopNarration();
    if (!this.ctx) return;
    if (suspended) { this.stopHeartbeat(); void this.ctx.suspend(); }
    else void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.stopNarration();
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    }
  }

  // ---------- 剧情旁白 TTS（v0.88） ----------

  /** 语音旁白开关（设置面板持久化，默认开） */
  narratorEnabled = true;
  /** 描述行是否朗读（默认开：有声书式混排——台词用角色声线、描述用旁白声线，整段完整朗读） */
  readNarration = true;
  private voicesReady = false;
  private voicesLogged = false;
  /** 男声锁定音色名（调试面板可设；空=自动）。女声不锁定（自动匹配 Huihui/Xiaoxiao） */
  maleVoiceOverride = '';
  /** 诊断开关：朗读时不设置 pitch/rate（用引擎默认值）——排查非默认参数触发 SAPI 音色回落的怪癖 */
  ttsPlainParams = false;
  private get voiceOverride(): string | undefined { return this.maleVoiceOverride || undefined; }

  /** 朗读一段剧情：链式逐条播放（台词用角色声线、描述用旁白声线）。
   * 不一次性 speak 排队——Chromium 已知 bug：队列中从第二条起 voice 属性被丢弃回落默认音色
   * （症状即"日志选中 Kangkang 但听感女声"）。改为 onend 链：前一条读完再 speak 下一条。 */
  speakLines(lines: readonly string[], chapter?: string): void {
    if (!this.narratorEnabled || this.muted) return;
    if (typeof speechSynthesis === 'undefined') return;
    // 有声书式混排：台词行用角色声线、描述行用旁白声线，整段完整朗读（readNarration 默认 true）
    const readNarration = this.readNarration;
    const profile = voiceFor(chapter);
    const synth = speechSynthesis;
    synth.cancel();
    const doSpeak = (): void => {
      // 调试：首次朗读时在控制台列出可用 zh 音色与男女声命中结果（便于用户报告环境）
      if (!this.voicesLogged && typeof console !== 'undefined') {
        this.voicesLogged = true;
        const zh = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('zh'));
        console.info(`[narrator] zh 音色 ${zh.length} 个：${zh.map((v) => v.name).join(' / ') || '无'}；男声→${this.pickVoice('male')?.name ?? '默认'}，女声→${this.pickVoice('female')?.name ?? '默认'}`);
      }
      // 构造待播队列（解析 + 声线分配），链式逐条播放
      const queue: SpeechSynthesisUtterance[] = [];
      for (const raw of lines) {
        const parsed = parseNarrationLine(raw, readNarration);
        if (!parsed.text) continue;
        const u = new SpeechSynthesisUtterance(parsed.text);
        const p = parsed.isDialogue ? profile : NARRATOR_PROFILE;
        if (!this.ttsPlainParams) {
          u.pitch = p.pitch;
          u.rate = p.rate;
        }
        const v = this.pickVoice(p.gender, this.voiceOverride);
        // 诊断模式（ttsPlainParams）：只设 voice 不设 pitch/rate，且优先选中单独的音色名
        const diagVoice = this.ttsPlainParams
          ? speechSynthesis.getVoices().find((x) => x.name.includes('Kangkang')) ?? v
          : v;
        if (diagVoice) {
          u.voice = diagVoice;
          u.lang = diagVoice.lang;
        } else {
          u.lang = 'zh-CN';
        }
        // 调试：每行打印实际声线（info 级别，确保 DevTools 默认过滤器可见）
        if (typeof console !== 'undefined') {
          console.info(`[narrator] ${parsed.isDialogue ? `角色(${chapter ?? '?'})` : '旁白'} → ${diagVoice?.name ?? '默认'}(${diagVoice?.lang ?? 'zh-CN'}${diagVoice?.localService ? ',本地' : ',网络'}) pitch=${u.pitch} rate=${u.rate}${this.ttsPlainParams ? ' [诊断:默认参数]' : ''}`);
          u.onerror = (ev) => console.warn(`[narrator] 朗读失败: ${(ev as SpeechSynthesisErrorEvent).error}`);
        }
        queue.push(u);
      }
      const speakNext = (): void => {
        const u = queue.shift();
        if (!u) return;
        u.onend = () => speakNext();   // 前一条完成后才 speak 下一条（防 Chromium 队列丢 voice）
        synth.speak(u);
      };
      speakNext();
    };
    if (this.voicesReady) { doSpeak(); return; }
    // Chrome 音色异步加载：voices 为空时等一次 voiceschanged
    if (synth.getVoices().length > 0) { this.voicesReady = true; doSpeak(); return; }
    const onReady = (): void => { this.voicesReady = true; doSpeak(); synth.removeEventListener('voiceschanged', onReady); };
    synth.addEventListener('voiceschanged', onReady);
    // 兜底：500ms 仍未就绪则直接尝试（部分浏览器不触发事件）
    window.setTimeout(() => { if (!this.voicesReady) { this.voicesReady = true; synth.removeEventListener('voiceschanged', onReady); doSpeak(); } }, 500);
  }

  /** 诊断：直接用指定音色朗读一句测试文本（控制台可手动调用 audio.voiceSelfTest()） */
  voiceSelfTest(voiceName?: string): void {
    const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('zh'));
    console.info(`[narrator] 自检：${voices.length} 个 zh 音色，逐个测试 1 秒发声`);
    voices.forEach((v, i) => {
      window.setTimeout(() => {
        const u = new SpeechSynthesisUtterance(voiceName && v.name !== voiceName ? '。' : '这是音色测试');
        u.voice = v;
        u.lang = v.lang;
        u.rate = 1;
        console.info(`[narrator] 试听 ${v.name}（${v.localService ? '本地' : '网络'}）—— 听到的声音就是它`);
        speechSynthesis.speak(u);
      }, i * 1500);
    });
  }

  stopNarration(): void {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }

  private pickVoice(gender: 'male' | 'female', override?: string): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('zh'));
    if (voices.length === 0) return null;
    // 手动锁定音色（调试面板下拉）：直接按名匹配，忽略 gender
    if (override) {
      const hit = voices.find((v) => v.name === override);
      if (hit) return hit;
    }
    // 关键字匹配（Edge/Chrome 常见 zh 音色名）：
    // 女声 Xiaoxiao/Huihui/Yaoyao…；男声 Kangkang/Yunyang/Yunjian/Yunxi…
    // 优先本地音色（localService）：Google 网络音色在远程会话/离线环境会静默不出声
    const femaleKeys = ['xiaoxiao', 'huihui', 'yaoyao', 'female', 'xiaoyi', 'yunxia', 'mei', 'ting'];
    const maleKeys = ['kangkang', 'yunyang', 'yunjian', 'yunxi', 'yunya', 'male', 'liang'];
    const byKeys = (keys: string[]): SpeechSynthesisVoice | undefined => {
      const hits = voices.filter((v) => keys.some((k) => v.name.toLowerCase().includes(k)));
      return hits.find((v) => v.localService) ?? hits[0];
    };
    const femaleV = byKeys(femaleKeys);
    const maleV = byKeys(maleKeys);
    const femaleHit = femaleV ? voices.indexOf(femaleV) : -1;
    const maleHit = maleV ? voices.indexOf(maleV) : -1;
    if (gender === 'female') {
      if (femaleHit >= 0) return voices[femaleHit];
      // 无独立女声：若存在明确的男声则用第一个非男声（避免全员一个声）；否则高 pitch 单声色（由调用方 pitch 区分）
      if (maleHit >= 0 && voices.length > 1) return voices[voices.indexOf(voices.find((_, i) => i !== maleHit)!)];
      return voices[0];
    }
    if (maleHit >= 0) return voices[maleHit];
    // 无独立男声：避开明确的女声；否则单音色（pitch 区分）
    if (femaleHit >= 0 && voices.length > 1) {
      const other = voices.find((_, i) => i !== femaleHit);
      if (other) return other;
    }
    return voices[0];
  }

  setMusicVolume(v: number): void {
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  setSfxVolume(v: number): void {
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  // ---------- 背景乐 ----------
  private musicTension: 'prep' | 'wave' | 'boss' = 'prep';

  setMusicTension(tension: 'prep' | 'wave' | 'boss'): void {
    if (tension === this.musicTension) return;
    this.musicTension = tension;
    if (!this.ctx || !this.musicGain || this.musicTimer === null) return;
    // 调整 drone 音量：wave/boss 更厚重
    const droneVol = tension === 'prep' ? 0.06 : tension === 'boss' ? 0.12 : 0.09;
    try { (this.droneOsc?.frequency as any) && (this.droneOsc!.frequency.value = tension === 'boss' ? 98 : 130.81); } catch { /* noop */ }
    if (this.droneGain) this.droneGain.gain.setTargetAtTime(droneVol, this.ctx.currentTime, 0.3);
    // 重新调度让下一轮 step 使用新参数
  }

  startMusic(): void {
    if (!this.ctx || this.musicTimer !== null) return;
    this.startDrone(130.81);
    const step = () => {
      const t = this.musicTension;
      const scale = t === 'prep'
        ? [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33]
        : t === 'boss'
          ? [196, 220, 261.63, 311.13, 392.0, 466.16, 523.25]
          : [261.63, 311.13, 392.0, 440.0, 523.25, 587.33, 659.25];
      const f = scale[Math.floor(Math.random() * scale.length)];
      const waveType: OscillatorType = t === 'prep' ? 'triangle' : t === 'boss' ? 'sawtooth' : 'square';
      const dur = t === 'prep' ? 1.9 : t === 'boss' ? 0.9 : 1.3;
      const vol = t === 'prep' ? 0.10 : t === 'boss' ? 0.18 : 0.14;
      this.playNote(f, waveType, dur, vol);
      if (t !== 'prep' && Math.random() < 0.4) {
        this.playNote(f * (t === 'boss' ? 1.5 : 2), 'sine', dur * 0.6, vol * 0.4);
      }
    };
    step();
    const interval = this.musicTension === 'prep' ? 1700 : this.musicTension === 'boss' ? 800 : 1200;
    if (this.musicTimer !== null) clearInterval(this.musicTimer);
    this.musicTimer = window.setInterval(step, interval);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) { clearInterval(this.musicTimer); this.musicTimer = null; }
    try { this.droneOsc?.stop(); } catch { /* noop */ }
    this.droneOsc = null;
  }

  private droneGain: GainNode | null = null;

  private startDrone(freq: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.value = 0.06;
    osc.connect(g); g.connect(this.musicGain);
    osc.start();
    this.droneOsc = osc;
    this.droneGain = g;
  }

  private playNote(freq: number, type: OscillatorType, dur: number, vol: number): void {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // ---------- 音效 ----------
  sfx(type: SfxType): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    switch (type) {
      case 'place':
        this.blip(660, 0.12, 'sine', 0.25);
        break;
      case 'upgrade':
        this.blip(523, 0.10, 'triangle', 0.25);
        window.setTimeout(() => this.blip(784, 0.16, 'triangle', 0.25), 90);
        break;
      case 'realmup0':
        // 低境界突破：短促双音
        this.blip(587, 0.12, 'triangle', 0.22);
        window.setTimeout(() => this.blip(880, 0.15, 'triangle', 0.2), 80);
        break;
      case 'realmup1':
        // 元婴~渡劫：三音和弦 + 低音垫（音乐 duck 让位）
        this.duckMusic(0.5, 0.45);
        [523, 659, 784].forEach((f, i) => this.blip(f, 0.3, 'triangle', 0.18 + i * 0.02));
        this.blip(131, 0.5, 'sine', 0.15);
        break;
      case 'realmup2':
        // 大乘/飞升：五音上行 arpeggio + 长尾（音乐 duck 让位）
        this.duckMusic(0.8, 0.4);
        [523, 659, 784, 1046, 1318].forEach((f, i) =>
          window.setTimeout(() => this.blip(f, 0.4, 'triangle', 0.22), i * 90));
        window.setTimeout(() => this.sweep(1318, 523, 0.9, 'sine', 0.1), 480);
        this.blip(98, 0.9, 'sine', 0.16);
        break;
      case 'sell':
        this.blip(330, 0.12, 'sine', 0.2);
        break;
      case 'kill': {
        const t = this.ctx.currentTime;
        if (t - this.lastKill < 0.05) break;
        // 连击音调递增：2 秒内连续击杀每杀 +1 半音，最高 +12（清群爽感）
        const combo = t - this.lastKill < 2 ? Math.min(12, this.killCombo + 1) : 0;
        this.killCombo = combo;
        this.lastKill = t;
        const semitone = Math.pow(2, (combo + (Math.random() - 0.5)) / 12);
        this.sweep(440 * semitone, 180 * semitone, 0.13, 'triangle', 0.16);
        break;
      }
      case 'kill_elite': {
        // 精英：金属 clang（高频方波短击 + 泛音）
        this.blip(1244, 0.08, 'square', 0.12);
        this.blip(1865, 0.12, 'sine', 0.08);
        const t = this.ctx.currentTime;
        this.lastKill = t;
        break;
      }
      case 'kill_boss': {
        // BOSS：低音 sting + 下坠轰鸣
        this.blip(82, 0.5, 'sawtooth', 0.22);
        this.sweep(330, 55, 0.6, 'triangle', 0.18);
        this.blip(55, 1.0, 'sine', 0.12);
        const t = this.ctx.currentTime;
        this.lastKill = t;
        break;
      }
      case 'leak':
        this.sweep(180, 70, 0.4, 'sawtooth', 0.3);
        this.blip(90, 0.4, 'sine', 0.2);
        break;
      case 'wave':
        this.blip(196, 0.9, 'sine', 0.3);
        this.blip(294, 0.9, 'sine', 0.15);
        break;
      case 'win':
        [523, 659, 784, 1046].forEach((f, i) =>
          window.setTimeout(() => this.blip(f, 0.32, 'triangle', 0.25), i * 140));
        window.setTimeout(() => {
          this.blip(1046, 0.8, 'triangle', 0.12);
          this.blip(1318, 0.6, 'triangle', 0.08);
        }, 560);
        break;
      case 'lose':
        [392, 330, 262, 196].forEach((f, i) =>
          window.setTimeout(() => this.blip(f, 0.45, 'sine', 0.25), i * 180));
        window.setTimeout(() => {
          this.blip(165, 1.6, 'sawtooth', 0.06);
          this.blip(130, 2.2, 'sine', 0.04);
        }, 720);
        break;
      case 'promote':
        [523, 659, 784, 1046, 1318].forEach((f, i) =>
          window.setTimeout(() => this.blip(f, 0.5, 'triangle', 0.22), i * 110));
        break;
      case 'boss':
        this.blip(110, 0.8, 'sawtooth', 0.15);
        this.blip(55, 1.0, 'sine', 0.08);
        break;
      case 'click':
        this.blip(880, 0.04, 'sine', 0.10);
        break;
    }
  }

  private blip(freq: number, dur: number, type: OscillatorType, vol: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  private sweep(f1: number, f2: number, dur: number, type: OscillatorType, vol: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }
}

export const audio = new AudioManager();
