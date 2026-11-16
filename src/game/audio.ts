import { DEFAULT_SETTINGS } from './characters';
import { GameSettings, PowerType } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private musicTimer: number | null = null;
  private stepIndex = 0;
  private settings: GameSettings = { ...DEFAULT_SETTINGS };
  private isPlayingMusic = false;
  private crowdExcitement = 0.2;
  private lastBounceTime = 0;
  private lastFootstepTime = 0;
  private lastDribbleTime = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.ambienceGain = this.ctx.createGain();
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      this.ambienceGain.connect(this.ctx.destination);
      this.applyGains();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureContext();
  }

  public updateSettings(next: GameSettings) {
    this.settings = { ...next };
    this.applyGains();
    if (!this.settings.musicEnabled && this.isPlayingMusic) {
      this.stopMusic();
    }
    if (!this.settings.soundEnabled) {
      this.stopCrowdAmbience();
    }
  }

  public setCrowdExcitement(level: number) {
    this.crowdExcitement = Math.max(0.1, Math.min(1, level));
    if (!this.ctx || !this.ambienceGain) return;
    const target = this.settings.soundEnabled
      ? this.settings.sfxVolume * (0.04 + this.crowdExcitement * 0.14)
      : 0;
    this.ambienceGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.15);
  }

  private applyGains() {
    if (!this.ctx || !this.musicGain || !this.sfxGain || !this.ambienceGain) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime(
      this.settings.musicEnabled ? this.settings.musicVolume * 0.26 : 0,
      now,
      0.03
    );
    this.sfxGain.gain.setTargetAtTime(
      this.settings.soundEnabled ? this.settings.sfxVolume * 0.85 : 0,
      now,
      0.02
    );
    this.ambienceGain.gain.setTargetAtTime(
      this.settings.soundEnabled ? this.settings.sfxVolume * (0.04 + this.crowdExcitement * 0.14) : 0,
      now,
      0.08
    );
  }

  public startCrowdAmbience() {
    if (!this.settings.soundEnabled || this.ambienceSource) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.ambienceGain) return;

    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2) * 0.25;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 640;
    filter.Q.value = 0.7;

    src.connect(filter);
    filter.connect(this.ambienceGain);
    src.start();
    this.ambienceSource = src;
  }

  public stopCrowdAmbience() {
    if (this.ambienceSource) {
      try {
        this.ambienceSource.stop();
        this.ambienceSource.disconnect();
      } catch {
        // Ignore
      }
      this.ambienceSource = null;
    }
  }

  public startMusic() {
    if (this.isPlayingMusic || !this.settings.musicEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.isPlayingMusic = true;
    this.stepIndex = 0;

    const bassPattern = [110, 110, 146.83, 110, 164.81, 146.83, 130.81, 98];
    const leadPattern = [
      440, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25,
      440, 0, 392, 440, 523.25, 659.25, 783.99, 659.25,
    ];

    const tick = () => {
      if (!this.isPlayingMusic || !this.settings.musicEnabled) return;
      const c = this.ctx;
      if (!c || !this.musicGain || c.state !== 'running') return;

      const now = c.currentTime;
      const bassFreq = bassPattern[this.stepIndex % bassPattern.length];
      const leadFreq = leadPattern[this.stepIndex % leadPattern.length];

      if (this.stepIndex % 2 === 0) {
        const kickOsc = c.createOscillator();
        const kickGain = c.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(125, now);
        kickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.11);
        kickGain.gain.setValueAtTime(0.32, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.14);
      }

      if (this.stepIndex % 2 === 1) {
        this.playNoiseBurst(0.03, 0.08, 4500, this.musicGain);
      }

      const bassOsc = c.createOscillator();
      const bassGain = c.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      bassGain.gain.setValueAtTime(0.18, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.18);

      if (leadFreq > 0) {
        const leadOsc = c.createOscillator();
        const leadGain = c.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadFreq, now);
        leadGain.gain.setValueAtTime(0.05, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        leadOsc.connect(leadGain);
        leadGain.connect(this.musicGain);
        leadOsc.start(now);
        leadOsc.stop(now + 0.17);
      }

      this.stepIndex++;
    };

    tick();
    this.musicTimer = window.setInterval(tick, 195);
  }

  public stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playNoiseBurst(duration: number, gainLevel: number, filterFreq: number, dest: AudioNode | null) {
    if (!this.ctx || !dest) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = filterFreq;

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(now);
    noise.stop(now + duration);
  }

  public playClick() {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.055);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playFootstep() {
    if (!this.settings.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastFootstepTime < 110) return;
    this.lastFootstepTime = nowMs;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    this.playNoiseBurst(0.032, 0.065, 450, this.sfxGain);
  }

  public playDribbleTouch() {
    if (!this.settings.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastDribbleTime < 90) return;
    this.lastDribbleTime = nowMs;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(78, now + 0.045);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
    this.playNoiseBurst(0.02, 0.05, 800, this.sfxGain);
  }

  public playJump() {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(460, now + 0.11);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playLand() {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.06);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playKick(
    strong = false,
    sweetSpot = false,
    style: 'normal' | 'curved' | 'emergency' | 'perfect' = 'normal'
  ) {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    if (style === 'emergency') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.08);
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
      this.playNoiseBurst(0.04, 0.16, 600, this.sfxGain);
      return;
    }

    const isPerfect = style === 'perfect' || sweetSpot;
    osc.type = isPerfect ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isPerfect ? 340 : style === 'curved' ? 245 : strong ? 260 : 185, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + (isPerfect ? 0.15 : 0.11));
    g.gain.setValueAtTime(isPerfect ? 0.68 : strong ? 0.56 : 0.34, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (isPerfect ? 0.17 : 0.13));
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);

    this.playNoiseBurst(
      isPerfect ? 0.07 : 0.05,
      isPerfect ? 0.42 : strong ? 0.28 : 0.14,
      style === 'curved' ? 1450 : isPerfect ? 1200 : 900,
      this.sfxGain
    );

    if (style === 'curved') {
      const swish = ctx.createOscillator();
      const sg = ctx.createGain();
      swish.type = 'sine';
      swish.frequency.setValueAtTime(380, now);
      swish.frequency.exponentialRampToValueAtTime(980, now + 0.12);
      sg.gain.setValueAtTime(0.14, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      swish.connect(sg);
      sg.connect(this.sfxGain);
      swish.start(now);
      swish.stop(now + 0.14);
    }

    if (style === 'perfect') {
      [987.77, 1318.5].forEach((freq, idx) => {
        const ping = ctx.createOscillator();
        const pg = ctx.createGain();
        ping.type = 'triangle';
        ping.frequency.setValueAtTime(freq, now + idx * 0.025);
        pg.gain.setValueAtTime(0.14, now + idx * 0.025);
        pg.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.025 + 0.12);
        ping.connect(pg);
        pg.connect(this.sfxGain!);
        ping.start(now + idx * 0.025);
        ping.stop(now + idx * 0.025 + 0.13);
      });
    }
  }

  public playHeader() {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(92, now + 0.08);
    g.gain.setValueAtTime(0.32, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playTackle() {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    this.playNoiseBurst(0.16, 0.22, 650, this.sfxGain);
  }

  public playBlock(incredibleSave = false, timedParry = false) {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(timedParry ? 235 : incredibleSave ? 175 : 140, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.11);
    g.gain.setValueAtTime(incredibleSave || timedParry ? 0.5 : 0.38, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);

    if (timedParry) {
      const ring = ctx.createOscillator();
      const rg = ctx.createGain();
      ring.type = 'sine';
      ring.frequency.setValueAtTime(740, now);
      ring.frequency.exponentialRampToValueAtTime(1120, now + 0.09);
      rg.gain.setValueAtTime(0.16, now);
      rg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      ring.connect(rg);
      rg.connect(this.sfxGain);
      ring.start(now);
      ring.stop(now + 0.15);
    }

    this.playCrowdReaction(incredibleSave ? 0.78 : timedParry ? 0.58 : 0.45, incredibleSave ? 0.32 : 0.2);
  }

  public playFinalTick() {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.06);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playOvertimeHorn() {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    [130.81, 196.0, 261.63].forEach((freq) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.01, now);
      g.gain.linearRampToValueAtTime(0.14, now + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.72);
    });
    this.playCrowdReaction(0.95, 0.3);
  }

  public playBounce() {
    if (!this.settings.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastBounceTime < 65) return;
    this.lastBounceTime = nowMs;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(66, now + 0.065);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playNetSwish() {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const dur = 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1450, now);
    filter.frequency.exponentialRampToValueAtTime(680, now + dur);
    filter.Q.value = 1.2;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + dur + 0.02);
  }

  public playPostClang() {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    [540, 810, 1180].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.18 / (idx + 1), now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.34);
    });
    this.playCrowdReaction(0.55, 0.24);
  }

  public playCrowdReaction(duration = 0.65, peak = 0.24) {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(880, now);
    filter.Q.value = 0.85;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + duration + 0.02);
  }

  public playWhistle(long = false) {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const dur = long ? 0.56 : 0.25;

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const g = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2650, now);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(38, now);
    lfoGain.gain.setValueAtTime(110, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.24, now + 0.025);
    g.gain.setValueAtTime(0.24, now + dur - 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + dur + 0.02);
    lfo.stop(now + dur + 0.02);
  }

  public playCountdownBeep(isGo = false) {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    g.gain.setValueAtTime(0.26, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.28 : 0.14));
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (isGo ? 0.3 : 0.15));
  }

  public playSpecial(power: PowerType) {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    if (power === 'fire') {
      this.playNoiseBurst(0.32, 0.4, 300, this.sfxGain);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.28);
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (power === 'ice') {
      [980, 1320, 1760].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);
        g.gain.setValueAtTime(0.18, now + idx * 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.22);
        osc.connect(g);
        g.connect(this.sfxGain!);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.24);
      });
    } else if (power === 'lightning') {
      this.playNoiseBurst(0.22, 0.38, 2200, this.sfxGain);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.2);
      g.gain.setValueAtTime(0.24, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.24);
    } else {
      [180, 360, 540, 720].forEach((f) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 1.4, now + 0.26);
        g.gain.setValueAtTime(0.13, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(g);
        g.connect(this.sfxGain!);
        osc.start(now);
        osc.stop(now + 0.32);
      });
    }
    this.playCrowdReaction(0.55, 0.22);
  }

  public playGoalCelebration() {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.58);
    });

    this.playCrowdReaction(1.15, 0.38);
  }

  public playVictoryFanfare(isSeriesChampion = false) {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const melody = isSeriesChampion
      ? [
          { f: 523.25, t: 0, d: 0.13 },
          { f: 659.25, t: 0.12, d: 0.13 },
          { f: 783.99, t: 0.24, d: 0.13 },
          { f: 1046.5, t: 0.36, d: 0.22 },
          { f: 1318.51, t: 0.54, d: 0.65 },
        ]
      : [
          { f: 523.25, t: 0, d: 0.14 },
          { f: 659.25, t: 0.14, d: 0.14 },
          { f: 783.99, t: 0.28, d: 0.14 },
          { f: 1046.5, t: 0.44, d: 0.55 },
        ];
    melody.forEach((n) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      g.gain.setValueAtTime(0.24, now + n.t);
      g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    });
    this.playCrowdReaction(isSeriesChampion ? 1.55 : 1.25, isSeriesChampion ? 0.42 : 0.34);
  }

  public playDefeatSting() {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    [
      { f: 329.63, t: 0, d: 0.18 },
      { f: 293.66, t: 0.16, d: 0.18 },
      { f: 220.0, t: 0.34, d: 0.42 },
    ].forEach((n) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      g.gain.setValueAtTime(0.11, now + n.t);
      g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    });
  }
}

export const soundEngine = new SoundEngine();
