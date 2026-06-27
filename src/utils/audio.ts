/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // AudioContext is initialized lazily on first user interaction to comply with browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Play a soft bubble pop sound
  public playPop() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      const now = this.ctx.currentTime;
      osc.type = 'sine';
      
      // Sweet frequency sweep upwards
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

      // Cute bubble pop volume envelope
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }

  // Play a cheerful chime/ding arpeggio for grouping
  public playDing() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        // Soft bell envelope
        const noteStart = now + idx * 0.06;
        gainNode.gain.setValueAtTime(0, noteStart);
        gainNode.gain.linearRampToValueAtTime(0.2, noteStart + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);

        osc.start(noteStart);
        osc.stop(noteStart + 0.35);
      });
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }

  // Play a descending slide for breaking rings
  public playBreak() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      const now = this.ctx.currentTime;
      osc.type = 'sawtooth';
      
      // Low pass filter to make it softer and squishy
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.25);

      osc.disconnect(gainNode);
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      // Slide frequency downwards
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

      gainNode.gain.setValueAtTime(0.25, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }

  // Play a short organic wooden tick for individual dot additions
  public playTick() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);

      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }

  // Play a beautiful win melody for big milestones (e.g. 10, 20, 30...)
  public playCelebration() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Melody: C5, E5, G5, C6, G5, C6
      const melody = [
        { freq: 523.25, duration: 0.1, delay: 0 },
        { freq: 659.25, duration: 0.1, delay: 0.1 },
        { freq: 783.99, duration: 0.1, delay: 0.2 },
        { freq: 1046.50, duration: 0.15, delay: 0.3 },
        { freq: 783.99, duration: 0.1, delay: 0.45 },
        { freq: 1046.50, duration: 0.3, delay: 0.55 },
      ];

      melody.forEach((note) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.delay);

        const noteStart = now + note.delay;
        gainNode.gain.setValueAtTime(0, noteStart);
        gainNode.gain.linearRampToValueAtTime(0.25, noteStart + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + note.duration);

        osc.start(noteStart);
        osc.stop(noteStart + note.duration + 0.05);
      });
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }
}

export const synth = new AudioSynthesizer();
export default synth;
