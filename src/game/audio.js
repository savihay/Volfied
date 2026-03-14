/**
 * Audio manager using Web Audio API synthesis.
 * All sounds are generated procedurally - no external files needed.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.3;
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._initialized = true;
    } catch (e) {
      console.warn('Web Audio not available');
    }
  }

  // Must be called from a user gesture to unlock audio
  unlock() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.muted = !this.muted;
    return this.muted;
  }

  _gain(vol = 1) {
    if (!this.ctx || this.muted) return null;
    const g = this.ctx.createGain();
    g.gain.value = this.volume * vol;
    g.connect(this.ctx.destination);
    return g;
  }

  _osc(type, freq, dur, vol = 1, dest = null) {
    if (!this.ctx || this.muted) return;
    const g = dest || this._gain(vol);
    if (!g) return;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    o.start(this.ctx.currentTime);
    o.stop(this.ctx.currentTime + dur);
    if (!dest) g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);
  }

  // Short click when starting a cut
  cutStart() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.4);
    if (!g) return;
    this._osc('square', 220, 0.05, 1, g);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
  }

  // Rising tone when completing a cut
  cutComplete() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.3);
    if (!g) return;
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(300, this.ctx.currentTime);
    o.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.15);
    o.connect(g);
    o.start(this.ctx.currentTime);
    o.stop(this.ctx.currentTime + 0.15);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.15);
  }

  // Satisfying claim sound
  territoryClaim() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.25);
    if (!g) return;
    const t = this.ctx.currentTime;
    const o1 = this.ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(400, t);
    o1.frequency.linearRampToValueAtTime(800, t + 0.2);
    o1.connect(g);
    o1.start(t);
    o1.stop(t + 0.2);

    const o2 = this.ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(500, t + 0.05);
    o2.frequency.linearRampToValueAtTime(1000, t + 0.25);
    o2.connect(g);
    o2.start(t + 0.05);
    o2.stop(t + 0.25);
    g.gain.linearRampToValueAtTime(0, t + 0.3);
  }

  // Pop sound for enemy death
  enemyDeath() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.3);
    if (!g) return;
    const t = this.ctx.currentTime;
    // Noise burst + pitch down
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(500, t);
    o.frequency.linearRampToValueAtTime(100, t + 0.12);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.12);
    g.gain.linearRampToValueAtTime(0, t + 0.12);
  }

  // Descending crash for player death
  playerDeath() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.4);
    if (!g) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(400 - i * 60, t + i * 0.06);
      o.frequency.linearRampToValueAtTime(60, t + i * 0.06 + 0.15);
      o.connect(g);
      o.start(t + i * 0.06);
      o.stop(t + i * 0.06 + 0.15);
    }
    g.gain.setValueAtTime(this.volume * 0.4, t);
    g.gain.linearRampToValueAtTime(0, t + 0.45);
  }

  // Impact sound for boss hit
  bossHit() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.35);
    if (!g) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(150, t);
    o.frequency.linearRampToValueAtTime(80, t + 0.2);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.2);
    g.gain.linearRampToValueAtTime(0, t + 0.2);
  }

  // Explosion for boss death
  bossDeath() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.5);
    if (!g) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 8; i++) {
      const o = this.ctx.createOscillator();
      o.type = i % 2 === 0 ? 'sawtooth' : 'square';
      o.frequency.setValueAtTime(200 + Math.random() * 300, t + i * 0.04);
      o.frequency.linearRampToValueAtTime(40, t + i * 0.04 + 0.2);
      o.connect(g);
      o.start(t + i * 0.04);
      o.stop(t + i * 0.04 + 0.2);
    }
    g.gain.setValueAtTime(this.volume * 0.5, t);
    g.gain.linearRampToValueAtTime(0, t + 0.5);
  }

  // Cheerful chime for power-up
  powerUpCollect() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.3);
    if (!g) return;
    const t = this.ctx.currentTime;
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g);
      o.start(t + i * 0.08);
      o.stop(t + i * 0.08 + 0.12);
    });
    g.gain.setValueAtTime(this.volume * 0.3, t);
    g.gain.linearRampToValueAtTime(0, t + 0.4);
  }

  // Crackling flame sound
  flameTraveling() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.15);
    if (!g) return;
    const t = this.ctx.currentTime;
    // White noise-like crackle
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / data.length);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(g);
    src.start(t);
    g.gain.linearRampToValueAtTime(0, t + 0.15);
  }

  // Pew pew laser
  laserFire() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.2);
    if (!g) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(800, t);
    o.frequency.linearRampToValueAtTime(200, t + 0.1);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.1);
    g.gain.linearRampToValueAtTime(0, t + 0.1);
  }

  // Fanfare for level complete
  levelComplete() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.3);
    if (!g) return;
    const t = this.ctx.currentTime;
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g);
      o.start(t + i * 0.15);
      o.stop(t + i * 0.15 + 0.3);
    });
    g.gain.setValueAtTime(this.volume * 0.3, t);
    g.gain.linearRampToValueAtTime(0, t + 0.9);
  }

  // Sad descending tones for game over
  gameOver() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.3);
    if (!g) return;
    const t = this.ctx.currentTime;
    const notes = [392, 349, 330, 262]; // G4, F4, E4, C4
    notes.forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g);
      o.start(t + i * 0.25);
      o.stop(t + i * 0.25 + 0.4);
    });
    g.gain.setValueAtTime(this.volume * 0.3, t);
    g.gain.linearRampToValueAtTime(0, t + 1.3);
  }

  // Short warning beep for boss telegraph
  bossTelegraph() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.15);
    if (!g) return;
    this._osc('sine', 880, 0.08, 1, g);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.08);
  }

  // Menu click
  menuSelect() {
    if (!this.ctx || this.muted) return;
    const g = this._gain(0.2);
    if (!g) return;
    this._osc('sine', 660, 0.06, 1, g);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.06);
  }
}

// Singleton
export const audio = new AudioManager();
