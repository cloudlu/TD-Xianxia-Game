// 音频管理（设计文档 §1.3 ui 之外的"反馈层"）
// 用 Web Audio API 现场合成，无需外部音频文件：
// - 背景乐：C 大五声音阶（古风/仙侠感）慢速 pad + 低音 drone
// - 音效：建塔/升级/出售/击杀/漏怪/开波/胜负
//
// 注意：音频属反馈层，不参与引擎确定性模拟（引擎不调用音频），故可自由用 Math.random。

type SfxType = 'place' | 'upgrade' | 'sell' | 'kill' | 'leak' | 'wave' | 'win' | 'lose' | 'promote' | 'click' | 'boss';

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private droneOsc: OscillatorNode | null = null;
  private lastKill = 0;
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

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    }
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
      case 'sell':
        this.blip(330, 0.12, 'sine', 0.2);
        break;
      case 'kill': {
        const t = this.ctx.currentTime;
        if (t - this.lastKill < 0.05) break;
        this.lastKill = t;
        const semitone = Math.pow(2, (Math.random() - 0.5) * 2 / 12);
        this.sweep(440 * semitone, 180 * semitone, 0.13, 'triangle', 0.16);
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
