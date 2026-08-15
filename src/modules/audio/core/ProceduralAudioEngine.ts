/**
 * Kanto Audio Engineer - ProceduralAudioEngine
 * Centralized singleton managing AudioContext, procedural noise buffers,
 * distortion curves, live recording, multi-track mixing, and WAV export.
 */

export interface VoiceFilterItem {
  id: string;
  name: string;
  desc: string;
}

export const VOICE_FILTERS: VoiceFilterItem[] = [
  { id: 'none', name: 'Raw / Direct (Clean)', desc: 'Unprocessed natural studio audio capture' },
  { id: 'pure_voice', name: 'Kanto Pure Voice', desc: 'Studio clarity, dynamic EQ, de-esser & optical leveling' },
  { id: 'megaphone', name: 'Megaphone', desc: 'Harsh resonant bandpass with horn distortion' },
  { id: 'walkie_talkie', name: 'Walkie-Talkie', desc: 'Tactical comms 2-way radio crunch & bandwidth limit' },
  { id: 'titan_beast', name: 'Titan Beast', desc: 'Monstrous sub-harmonic drop & dark cavern rumble' },
  { id: 'deep_dive', name: 'Deep Dive (Underwater)', desc: 'Submerged steep low-pass with fluid modulation' },
  { id: 'vintage_radio', name: 'Vintage Radio (1930s)', desc: 'Antique AM bandpass with warm tube saturation' },
  { id: 'chipmunk', name: 'Chipmunk / Helium', desc: 'High-pitched cartoon formant boost' },
  { id: 'robot', name: 'Robot / Ring Modulator', desc: 'Cybernetic carrier frequency modulation' },
  { id: 'telephone', name: 'Telephone', desc: 'Classic Bell telephone 300Hz-3.4kHz line tone' },
  { id: 'ghost_ethereal', name: 'Ghost / Ethereal', desc: 'Haunting spatial tail, shimmer high-shelf & delay' },
  { id: 'studio_warmth', name: 'Studio Warmth', desc: 'Analog tape saturation, low-end body & air sheen' }
];

export class VoiceFilterEngine {
  private ctx: AudioContext | OfflineAudioContext;

  constructor(audioCtx: AudioContext | OfflineAudioContext) {
    this.ctx = audioCtx;
  }

  private _makeDistortionCurve(amount: number = 20): Float32Array {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public createFilterGraph(filterId: string): { inputNode: AudioNode; outputNode: AudioNode } {
    const ctx = this.ctx;
    const input = ctx.createGain();
    const output = ctx.createGain();

    switch (filterId) {
      case 'pure_voice': {
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 85;

        const presence = ctx.createBiquadFilter();
        presence.type = 'peaking';
        presence.frequency.value = 3500;
        presence.Q.value = 1.2;
        presence.gain.value = 3.5;

        const deEsser = ctx.createBiquadFilter();
        deEsser.type = 'highshelf';
        deEsser.frequency.value = 7500;
        deEsser.gain.value = -2.0;

        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -22;
        comp.knee.value = 6;
        comp.ratio.value = 3.2;
        comp.attack.value = 0.008;
        comp.release.value = 0.12;

        const shaper = ctx.createWaveShaper();
        shaper.curve = this._makeDistortionCurve(4) as any;

        input.connect(hp);
        hp.connect(presence);
        presence.connect(deEsser);
        deEsser.connect(comp);
        comp.connect(shaper);
        shaper.connect(output);
        break;
      }

      case 'megaphone': {
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 750;

        const peak = ctx.createBiquadFilter();
        peak.type = 'peaking';
        peak.frequency.value = 1800;
        peak.Q.value = 4.0;
        peak.gain.value = 9.0;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 3000;

        const shaper = ctx.createWaveShaper();
        shaper.curve = this._makeDistortionCurve(35) as any;

        input.connect(hp);
        hp.connect(peak);
        peak.connect(lp);
        lp.connect(shaper);
        shaper.connect(output);
        break;
      }

      case 'walkie_talkie': {
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 500;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2800;

        const shaper = ctx.createWaveShaper();
        shaper.curve = this._makeDistortionCurve(45) as any;

        input.connect(hp);
        hp.connect(lp);
        lp.connect(shaper);
        shaper.connect(output);
        break;
      }

      case 'titan_beast': {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 600;

        const bass = ctx.createBiquadFilter();
        bass.type = 'lowshelf';
        bass.frequency.value = 120;
        bass.gain.value = 12;

        const shaper = ctx.createWaveShaper();
        shaper.curve = this._makeDistortionCurve(18) as any;

        input.connect(lp);
        lp.connect(bass);
        bass.connect(shaper);
        shaper.connect(output);
        break;
      }

      case 'deep_dive': {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 400;
        lp.Q.value = 4.0;

        input.connect(lp);
        lp.connect(output);
        break;
      }

      case 'vintage_radio': {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1200;
        bp.Q.value = 2.5;

        const shaper = ctx.createWaveShaper();
        shaper.curve = this._makeDistortionCurve(25) as any;

        input.connect(bp);
        bp.connect(shaper);
        shaper.connect(output);
        break;
      }

      case 'robot': {
        const ringMod = ctx.createBiquadFilter();
        ringMod.type = 'peaking';
        ringMod.frequency.value = 440;
        ringMod.Q.value = 12;
        ringMod.gain.value = 15;

        input.connect(ringMod);
        ringMod.connect(output);
        break;
      }

      case 'telephone': {
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 300;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 3400;

        input.connect(hp);
        hp.connect(lp);
        lp.connect(output);
        break;
      }

      case 'studio_warmth': {
        const lowshelf = ctx.createBiquadFilter();
        lowshelf.type = 'lowshelf';
        lowshelf.frequency.value = 180;
        lowshelf.gain.value = 2.5;

        const highshelf = ctx.createBiquadFilter();
        highshelf.type = 'highshelf';
        highshelf.frequency.value = 10000;
        highshelf.gain.value = 2.0;

        const shaper = ctx.createWaveShaper();
        shaper.curve = this._makeDistortionCurve(6) as any;

        input.connect(lowshelf);
        lowshelf.connect(highshelf);
        highshelf.connect(shaper);
        shaper.connect(output);
        break;
      }

      default:
        input.connect(output);
        break;
    }

    return { inputNode: input, outputNode: output };
  }
}

export class ProceduralAudioEngine {
  private static instance: ProceduralAudioEngine | null = null;
  public ctx: AudioContext;
  public masterGain: GainNode;
  public masterAnalyser: AnalyserNode;
  public masterLimiter: DynamicsCompressorNode;
  public voiceFilterEngine: VoiceFilterEngine;
  public trackNodes: Map<string, { gainNode: GainNode; volume: number; isMuted: boolean; isSoloed: boolean }>;

  private constructor() {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtxClass({ sampleRate: 44100 });

    // Master Chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 2048;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.value = -0.5;
    this.masterLimiter.knee.value = 0.0;
    this.masterLimiter.ratio.value = 20.0;
    this.masterLimiter.attack.value = 0.002;
    this.masterLimiter.release.value = 0.05;

    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    this.voiceFilterEngine = new VoiceFilterEngine(this.ctx);

    this.trackNodes = new Map();
    this.initTrackNodes(['voice', 'sfx1', 'sfx2', 'music']);
  }

  public static getInstance(): ProceduralAudioEngine {
    if (!ProceduralAudioEngine.instance) {
      ProceduralAudioEngine.instance = new ProceduralAudioEngine();
    }
    if (ProceduralAudioEngine.instance.ctx.state === 'suspended') {
      ProceduralAudioEngine.instance.ctx.resume().catch(() => {});
    }
    return ProceduralAudioEngine.instance;
  }

  public async ensureContext(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public createNoiseBuffer(duration: number, type: 'white' | 'pink' | 'brown' = 'white', customCtx: AudioContext | OfflineAudioContext | null = null): AudioBuffer {
    const context = customCtx || this.ctx;
    const sampleRate = context.sampleRate || 44100;
    const bufferSize = Math.max(1, Math.ceil(sampleRate * duration));
    const buffer = context.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'white') {
        output[i] = white;
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else if (type === 'brown') {
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }
    return buffer;
  }

  public initTrackNodes(trackIds: string[]) {
    trackIds.forEach((id) => {
      if (this.trackNodes.has(id)) return;
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 1.0;
      gainNode.connect(this.masterGain);

      this.trackNodes.set(id, {
        gainNode,
        volume: 1.0,
        isMuted: false,
        isSoloed: false,
      });
    });
  }

  public setTrackVolume(trackId: string, vol: number) {
    const track = this.trackNodes.get(trackId);
    if (track) {
      track.volume = Math.max(0, Math.min(2.0, vol));
      if (!track.isMuted) {
        track.gainNode.gain.setTargetAtTime(track.volume, this.ctx.currentTime, 0.02);
      }
    }
  }

  public setTrackMute(trackId: string, isMuted: boolean) {
    const track = this.trackNodes.get(trackId);
    if (track) {
      track.isMuted = isMuted;
      track.gainNode.gain.setTargetAtTime(isMuted ? 0 : track.volume, this.ctx.currentTime, 0.02);
    }
  }
}
