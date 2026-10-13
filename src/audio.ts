import type { SoundName } from "../shared/types";

export class Sfx {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  muted = false;

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      const count = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, count, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < count; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buffer;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  play(name: SoundName) {
    if (this.muted) return;
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    if (name === "swing") this.blip(t, 520, 180, "triangle", 0.04, 0.07);
    else if (name === "hit") {
      this.burst(t, 0.09, 0.22);
      this.blip(t, 180, 70, "sine", 0.12, 0.12);
    } else if (name === "block") {
      this.blip(t, 740, 420, "square", 0.05, 0.06);
      this.burst(t, 0.04, 0.08);
    } else if (name === "special") {
      this.blip(t, 240, 720, "sawtooth", 0.05, 0.18);
    } else if (name === "ko") {
      this.burst(t, 0.25, 0.28);
      this.blip(t, 320, 60, "sine", 0.16, 0.4);
    } else if (name === "land") this.burst(t, 0.05, 0.08);
    else if (name === "round") this.blip(t, 440, 440, "square", 0.05, 0.1);
    else if (name === "fight") {
      this.blip(t, 523, 523, "square", 0.06, 0.12);
      this.blip(t + 0.09, 659, 659, "square", 0.06, 0.14);
    } else if (name === "clash") this.blip(t, 880, 220, "sawtooth", 0.06, 0.12);
    else if (name === "win") {
      this.blip(t, 392, 392, "triangle", 0.06, 0.12);
      this.blip(t + 0.1, 523, 784, "triangle", 0.06, 0.22);
    }
  }

  private blip(time: number, from: number, to: number, type: OscillatorType, gain: number, dur: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, time);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), time + dur);
    amp.gain.setValueAtTime(gain, time);
    amp.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private burst(time: number, dur: number, gain: number) {
    const ctx = this.ctx;
    if (!ctx || !this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, time);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, time);
    amp.gain.exponentialRampToValueAtTime(0.001, time + dur);
    src.connect(filter).connect(amp).connect(ctx.destination);
    src.start(time);
    src.stop(time + dur);
  }
}
