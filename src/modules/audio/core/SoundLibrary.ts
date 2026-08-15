/**
 * Kanto Audio Engineer - SoundLibrary (TypeScript definitions & 43 presets)
 */

import { ProceduralAudioEngine } from './ProceduralAudioEngine';

const engine = ProceduralAudioEngine.getInstance();
const ctx = engine.ctx;
const master = engine.masterGain;

export const SFX_PRESETS: Record<string, (customCtx?: AudioContext | OfflineAudioContext, customDest?: AudioNode) => void> = {
  // ==========================================
  // 1. TRANSITIONS & MOVEMENT (8 SFX)
  // ==========================================
  
  // 01. Fast Whoosh
  fast_whoosh: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = engine.createNoiseBuffer(0.3, 'white', c);
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3, t);
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(3000, t + 0.12);
    filter.frequency.exponentialRampToValueAtTime(150, t + 0.3);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.8, t + 0.12);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.3);

    src.connect(filter).connect(gain).connect(dest);
    src.start(t); src.stop(t + 0.3);
  },

  // 02. Heavy Whoosh
  heavy_whoosh: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = engine.createNoiseBuffer(0.6, 'brown', c);
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + 0.25);
    filter.frequency.exponentialRampToValueAtTime(60, t + 0.6);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(1.0, t + 0.25);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.6);

    src.connect(filter).connect(gain).connect(dest);
    src.start(t); src.stop(t + 0.6);
  },

  // 03. Clean Swoosh
  clean_swoosh: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = engine.createNoiseBuffer(0.2, 'pink', c);
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(4500, t + 0.1);
    filter.frequency.exponentialRampToValueAtTime(500, t + 0.2);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.08);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.2);

    src.connect(filter).connect(gain).connect(dest);
    src.start(t); src.stop(t + 0.2);
  },

  // 04. Whip Pan
  whip_pan: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = engine.createNoiseBuffer(0.18, 'white', c);
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(6000, t + 0.08);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.18);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.9, t + 0.06);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.18);

    src.connect(filter).connect(gain).connect(dest);
    src.start(t); src.stop(t + 0.18);
  },

  // 05. Glitch Transition
  glitch_transition: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.setValueAtTime(880, t + 0.04);
    osc.frequency.setValueAtTime(220, t + 0.08);
    osc.frequency.setValueAtTime(1400, t + 0.12);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.setValueAtTime(0, t + 0.03);
    gain.gain.setValueAtTime(0.6, t + 0.04);
    gain.gain.setValueAtTime(0, t + 0.07);
    gain.gain.setValueAtTime(0.4, t + 0.08);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 0.18);
  },

  // 06. Spin Whoosh
  spin_whoosh: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = engine.createNoiseBuffer(0.45, 'pink', c);
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(2500, t + 0.15);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.3);
    filter.frequency.exponentialRampToValueAtTime(1800, t + 0.38);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.45);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.7, t + 0.15);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.3);
    gain.gain.linearRampToValueAtTime(0.6, t + 0.38);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.45);

    src.connect(filter).connect(gain).connect(dest);
    src.start(t); src.stop(t + 0.45);
  },

  // 07. Zoom In Whoosh
  zoom_in_whoosh: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = engine.createNoiseBuffer(0.35, 'brown', c);
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, t);
    filter.frequency.exponentialRampToValueAtTime(3500, t + 0.35);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.9, t + 0.32);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.35);

    src.connect(filter).connect(gain).connect(dest);
    src.start(t); src.stop(t + 0.35);
  },

  // 08. Zoom Out Whoosh
  zoom_out_whoosh: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = engine.createNoiseBuffer(0.35, 'brown', c);
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3500, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.35);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    src.connect(filter).connect(gain).connect(dest);
    src.start(t); src.stop(t + 0.35);
  },

  // ==========================================
  // 2. UI & TECHNOLOGY (16 SFX)
  // ==========================================

  // 09. Mouse Click
  mouse_click: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.02);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    osc.connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 0.02);
  },

  // 10. Keyboard Typing
  keyboard_typing: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450 + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.03);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);

    osc.connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 0.03);
  },

  // 11. Phone Notification Ping
  phone_ping: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    [1046.50, 1318.51].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.4, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);

      osc.connect(gain).connect(dest);
      osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.4);
    });
  },

  // 12. Camera Shutter
  camera_shutter: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const src1 = c.createBufferSource();
    src1.buffer = engine.createNoiseBuffer(0.04, 'white', c);
    const gain1 = c.createGain();
    gain1.gain.setValueAtTime(0.6, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
    src1.connect(gain1).connect(dest);
    src1.start(t);

    const src2 = c.createBufferSource();
    src2.buffer = engine.createNoiseBuffer(0.06, 'white', c);
    const gain2 = c.createGain();
    gain2.gain.setValueAtTime(0.7, t + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    src2.connect(gain2).connect(dest);
    src2.start(t + 0.06);
  },

  // 13. Video Game Coin
  game_coin: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, t);
    osc.frequency.setValueAtTime(1318.51, t + 0.08);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.setValueAtTime(0.25, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 0.35);
  },

  // 14. Error Buzz
  error_buzz: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.setValueAtTime(125, t + 0.12);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.setValueAtTime(0.05, t + 0.11);
    gain.gain.setValueAtTime(0.4, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 0.28);
  },

  // 15. Success Chime
  success_chime: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.3, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.5);

      osc.connect(gain).connect(dest);
      osc.start(t + idx * 0.06); osc.stop(t + idx * 0.06 + 0.5);
    });
  },

  // 16. Tech Glitch
  tech_glitch: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.setValueAtTime(320, t + 0.02);
    osc.frequency.setValueAtTime(1800, t + 0.05);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 0.09);
  },

  // 17. Laser Gun
  laser_gun: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 0.18);
  },

  // 18. Pop-up Window
  popup_window: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 0.1);
  },

  // 38. Continuous 5-Second Mechanical Keyboard Typing
  keyboard_typing_5s: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const duration = 5.0;
    let elapsed = 0;

    while (elapsed < duration) {
      const strikeTime = t + elapsed;
      const isSpacebar = Math.random() < 0.15;
      const baseFreq = isSpacebar ? 220 + Math.random() * 40 : 500 + Math.random() * 200;
      const keyVolume = isSpacebar ? 0.35 : 0.2 + Math.random() * 0.15;

      const osc = c.createOscillator();
      osc.type = isSpacebar ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseFreq, strikeTime);
      osc.frequency.exponentialRampToValueAtTime(80, strikeTime + 0.025);

      const gain = c.createGain();
      gain.gain.setValueAtTime(keyVolume, strikeTime);
      gain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.025);

      osc.connect(gain).connect(dest);
      osc.start(strikeTime);
      osc.stop(strikeTime + 0.025);

      const noise = c.createBufferSource();
      noise.buffer = engine.createNoiseBuffer(0.02, 'pink', c);

      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isSpacebar ? 1200 : 3200 + Math.random() * 800, strikeTime);
      filter.Q.setValueAtTime(2.5, strikeTime);

      const nGain = c.createGain();
      nGain.gain.setValueAtTime(keyVolume * 0.6, strikeTime);
      nGain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.02);

      noise.connect(filter).connect(nGain).connect(dest);
      noise.start(strikeTime);
      noise.stop(strikeTime + 0.02);

      const pause = Math.random() < 0.08 ? 0.22 + Math.random() * 0.15 : 0.055 + Math.random() * 0.07;
      elapsed += pause;
    }
  },

  // 39. UI Pop 1: Bright Cork Pop
  ui_pop_bright: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(2200, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.07);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.07);
  },

  // 40. UI Pop 2: Wooden Clack Pop
  ui_pop_wooden: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(820, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.035);

    const noise = c.createBufferSource();
    noise.buffer = engine.createNoiseBuffer(0.035, 'brown', c);
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.setValueAtTime(4.0, t);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    noise.connect(filter).connect(gain).connect(dest);

    osc.start(t);
    noise.start(t);
    osc.stop(t + 0.035);
    noise.stop(t + 0.035);
  },

  // 41. UI Pop 3: Sub Card Pop
  ui_pop_sub: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.12);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.12);
  },

  // 42. UI Pop 4: Digital Snap Pop
  ui_pop_snap: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2800, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.025);

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3500, t);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    osc.connect(filter).connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.025);
  },

  // 43. UI Pop 5: Soft Pill/Badge Pop
  ui_pop_soft: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.linearRampToValueAtTime(950, t + 0.03);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.06);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.06);
  },

  // ==========================================
  // 3. CINEMATIC & IMPACTS (9 SFX)
  // ==========================================

  // 19. Cinematic Sub Bass Drop
  sub_bass_drop: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 1.8);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

    osc.connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 2.0);
  },

  // 20. Dramatic Tension Riser
  dramatic_riser: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 2.5);

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, t);
    filter.frequency.exponentialRampToValueAtTime(4000, t + 2.5);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0.8, t + 2.4);
    gain.gain.linearRampToValueAtTime(0.001, t + 2.5);

    osc.connect(filter).connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 2.5);
  },

  // 21. Heavy Impact Boom
  heavy_impact: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.8);

    const noise = c.createBufferSource();
    noise.buffer = engine.createNoiseBuffer(0.8, 'brown', c);
    const nFilter = c.createBiquadFilter();
    nFilter.type = 'lowpass';
    nFilter.frequency.setValueAtTime(600, t);
    nFilter.frequency.exponentialRampToValueAtTime(50, t + 0.7);

    const gain = c.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc.connect(gain);
    noise.connect(nFilter).connect(gain).connect(dest);

    osc.start(t); osc.stop(t + 0.9);
    noise.start(t); noise.stop(t + 0.9);
  },

  // 22. Metal Clang
  metal_clang: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    [450, 680, 1150, 1850].forEach(f => {
      const osc = c.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, t);
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(gain).connect(dest);
      osc.start(t); osc.stop(t + 0.8);
    });
  },

  // 23. Short Explosion
  short_explosion: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = engine.createNoiseBuffer(0.7, 'pink', c);

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(80, t + 0.7);

    const gain = c.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    src.connect(filter).connect(gain).connect(dest);
    src.start(t); src.stop(t + 0.7);
  },

  // 24. Heartbeat Slow
  heartbeat_slow: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    [0, 0.22].forEach(offset => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, t + offset);
      osc.frequency.exponentialRampToValueAtTime(35, t + offset + 0.12);

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.8, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.12);

      osc.connect(gain).connect(dest);
      osc.start(t + offset); osc.stop(t + offset + 0.12);
    });
  },

  // 25. Heartbeat Fast
  heartbeat_fast: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    [0, 0.14].forEach(offset => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, t + offset);
      osc.frequency.exponentialRampToValueAtTime(45, t + offset + 0.09);

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.9, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.09);

      osc.connect(gain).connect(dest);
      osc.start(t + offset); osc.stop(t + offset + 0.09);
    });
  },

  // 26. Clock Tick Tock
  clock_tick: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.015);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    osc.connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 0.015);
  },

  // 27. Thunder Strike
  thunder_strike: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = engine.createNoiseBuffer(1.6, 'brown', c);

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(90, t + 1.6);

    const gain = c.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

    src.connect(filter).connect(gain).connect(dest);
    src.start(t); src.stop(t + 1.6);
  },

  // ==========================================
  // 4. COMEDY & CARTOON (6 SFX)
  // ==========================================

  // 28. Vine Boom
  vine_boom: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.9);

    const distortion = c.createWaveShaper();
    distortion.curve = engine.makeDistortionCurve(45);

    const gain = c.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

    osc.connect(distortion).connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 1.1);
  },

  // 29. Air Horn
  air_horn: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    [466.16, 587.33, 700.00].forEach(freq => {
      const osc = c.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.setValueAtTime(0.2, t + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain).connect(dest);
      osc.start(t); osc.stop(t + 0.45);
    });
  },

  // 30. Cartoon Boing
  cartoon_boing: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(650, t + 0.3);

    const mod = c.createOscillator();
    mod.frequency.setValueAtTime(28, t);
    const modGain = c.createGain();
    modGain.gain.setValueAtTime(60, t);
    mod.connect(modGain).connect(osc.frequency);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain).connect(dest);
    mod.start(t); osc.start(t);
    mod.stop(t + 0.35); osc.stop(t + 0.35);
  },

  // 31. Cartoon Slip
  cartoon_slip: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(900, t + 0.15);
    osc.frequency.linearRampToValueAtTime(300, t + 0.3);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 0.32);
  },

  // 32. Slap / Punch
  cartoon_punch: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

    const src = c.createBufferSource();
    src.buffer = engine.createNoiseBuffer(0.12, 'white', c);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain); src.connect(gain).connect(dest);

    osc.start(t); src.start(t);
    osc.stop(t + 0.14); src.stop(t + 0.14);
  },

  // 33. Sad Trombone
  sad_trombone: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const notes = [293.66, 277.18, 261.63, 246.94];
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      osc.type = 'sawtooth';
      const startTime = t + i * 0.35;
      osc.frequency.setValueAtTime(freq, startTime);
      if (i === 3) {
        osc.frequency.linearRampToValueAtTime(freq - 25, startTime + 0.7);
      }

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + (i === 3 ? 0.75 : 0.3));

      osc.connect(gain).connect(dest);
      osc.start(startTime); osc.stop(startTime + (i === 3 ? 0.75 : 0.3));
    });
  },

  // ==========================================
  // 5. FOLEY & EVERYDAY (4 SFX)
  // ==========================================

  // 34. Door Creak
  door_creak: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(320, t + 0.2);
    osc.frequency.linearRampToValueAtTime(160, t + 0.45);

    const mod = c.createOscillator();
    mod.frequency.setValueAtTime(35, t);
    const modGain = c.createGain();
    modGain.gain.setValueAtTime(45, t);
    mod.connect(modGain).connect(osc.frequency);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(gain).connect(dest);
    mod.start(t); osc.start(t);
    mod.stop(t + 0.5); osc.stop(t + 0.5);
  },

  // 35. Match Strike
  match_strike: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = engine.createNoiseBuffer(0.25, 'white', c);

    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3500, t);
    filter.frequency.exponentialRampToValueAtTime(900, t + 0.25);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    src.connect(filter).connect(gain).connect(dest);
    src.start(t); src.stop(t + 0.25);
  },

  // 36. Service Bell
  service_bell: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    [2093.00, 4186.01].forEach(freq => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain).connect(dest);
      osc.start(t); osc.stop(t + 1.2);
    });
  },

  // 37. Pop Bubble
  pop_bubble: (customCtx, customDest) => {
    const c = customCtx || ctx;
    const dest = customDest || master;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.05);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain).connect(dest);
    osc.start(t); osc.stop(t + 0.06);
  }
};

export interface SFXItem {
  id: string;
  name: string;
  category: 'Transitions' | 'UI' | 'Cinematic' | 'Comedy' | 'Foley';
  duration?: number;
  description?: string;
  trigger: (customCtx?: AudioContext | OfflineAudioContext, customDest?: AudioNode) => void;
}

export const SFX_CATALOG: SFXItem[] = [
  // 1. Transitions & Movement (8 SFX)
  { id: 'fast_whoosh', name: 'Fast Whoosh', category: 'Transitions', duration: 0.3, description: 'High-velocity aerodynamic white-noise whoosh', trigger: SFX_PRESETS.fast_whoosh },
  { id: 'heavy_whoosh', name: 'Heavy Whoosh', category: 'Transitions', duration: 0.6, description: 'Deep low-end brown noise transition', trigger: SFX_PRESETS.heavy_whoosh },
  { id: 'clean_swoosh', name: 'Clean Swoosh', category: 'Transitions', duration: 0.2, description: 'Snappy pink-noise bandpass swoosh', trigger: SFX_PRESETS.clean_swoosh },
  { id: 'whip_pan', name: 'Whip Pan', category: 'Transitions', duration: 0.18, description: 'Highpass camera whip transition', trigger: SFX_PRESETS.whip_pan },
  { id: 'glitch_transition', name: 'Glitch Transition', category: 'Transitions', duration: 0.18, description: 'Stuttering digital pitch jump transition', trigger: SFX_PRESETS.glitch_transition },
  { id: 'spin_whoosh', name: 'Spin Whoosh', category: 'Transitions', duration: 0.45, description: 'Modulated dual-sweep whoosh', trigger: SFX_PRESETS.spin_whoosh },
  { id: 'zoom_in_whoosh', name: 'Zoom In Whoosh', category: 'Transitions', duration: 0.35, description: 'Rising frequency zoom acceleration', trigger: SFX_PRESETS.zoom_in_whoosh },
  { id: 'zoom_out_whoosh', name: 'Zoom Out Whoosh', category: 'Transitions', duration: 0.35, description: 'Falling frequency zoom deceleration', trigger: SFX_PRESETS.zoom_out_whoosh },
  
  // 2. UI & Technology (16 SFX)
  { id: 'mouse_click', name: 'Mouse Click', category: 'UI', duration: 0.02, description: 'Tactile triangle wave mouse click', trigger: SFX_PRESETS.mouse_click },
  { id: 'keyboard_typing', name: 'Keyboard Typing', category: 'UI', duration: 0.03, description: 'Randomized sine frequency key tap', trigger: SFX_PRESETS.keyboard_typing },
  { id: 'keyboard_typing_5s', name: 'Keyboard Typing (5s Burst)', category: 'UI', duration: 5.0, description: 'Continuous 5-second realistic humanized mechanical typing sequence', trigger: SFX_PRESETS.keyboard_typing_5s },
  { id: 'ui_pop_bright', name: 'UI Pop (Bright Cork)', category: 'UI', duration: 0.07, description: 'Bright cork pop for instant badges & toggles', trigger: SFX_PRESETS.ui_pop_bright },
  { id: 'ui_pop_wooden', name: 'UI Pop (Tactile Wood)', category: 'UI', duration: 0.035, description: 'Natural tactile wooden clack feedback', trigger: SFX_PRESETS.ui_pop_wooden },
  { id: 'ui_pop_sub', name: 'UI Pop (Sub Card Impact)', category: 'UI', duration: 0.12, description: 'Deep low sub card pop for modal reveals', trigger: SFX_PRESETS.ui_pop_sub },
  { id: 'ui_pop_snap', name: 'UI Pop (Digital Snap)', category: 'UI', duration: 0.025, description: 'Sharp clean digital motion graphic pop', trigger: SFX_PRESETS.ui_pop_snap },
  { id: 'ui_pop_soft', name: 'UI Pop (Soft Badge)', category: 'UI', duration: 0.06, description: 'Smooth rounded container badge pop', trigger: SFX_PRESETS.ui_pop_soft },
  { id: 'phone_ping', name: 'Notification Ping', category: 'UI', duration: 0.48, description: 'Soft marimba two-tone notification', trigger: SFX_PRESETS.phone_ping },
  { id: 'camera_shutter', name: 'Camera Shutter', category: 'UI', duration: 0.12, description: 'Mechanical dual-click lens snap', trigger: SFX_PRESETS.camera_shutter },
  { id: 'game_coin', name: 'Video Game Coin', category: 'UI', duration: 0.35, description: 'Classic 8-bit dual square wave chime', trigger: SFX_PRESETS.game_coin },
  { id: 'error_buzz', name: 'Error Buzz', category: 'UI', duration: 0.28, description: 'Low dissonance error alert', trigger: SFX_PRESETS.error_buzz },
  { id: 'success_chime', name: 'Success Chime', category: 'UI', duration: 0.56, description: 'Ascending major chord fanfare', trigger: SFX_PRESETS.success_chime },
  { id: 'tech_glitch', name: 'Tech Glitch', category: 'UI', duration: 0.09, description: 'High-speed square frequency burst', trigger: SFX_PRESETS.tech_glitch },
  { id: 'laser_gun', name: 'Laser Gun', category: 'UI', duration: 0.18, description: 'Downward saw wave sci-fi blaster', trigger: SFX_PRESETS.laser_gun },
  { id: 'popup_window', name: 'Pop-up Window', category: 'UI', duration: 0.1, description: 'Upward bubble modal popup', trigger: SFX_PRESETS.popup_window },

  // 3. Cinematic & Impacts (9 SFX)
  { id: 'sub_bass_drop', name: 'Sub Bass Drop', category: 'Cinematic', duration: 2.0, description: 'Deep 808 sine decay into sub frequencies', trigger: SFX_PRESETS.sub_bass_drop },
  { id: 'dramatic_riser', name: 'Dramatic Riser', category: 'Cinematic', duration: 2.5, description: 'Long saw wave suspense tension build', trigger: SFX_PRESETS.dramatic_riser },
  { id: 'heavy_impact', name: 'Heavy Impact Boom', category: 'Cinematic', duration: 0.9, description: 'Sub impact with low-end rumble body', trigger: SFX_PRESETS.heavy_impact },
  { id: 'metal_clang', name: 'Metal Clang', category: 'Cinematic', duration: 0.8, description: 'Resonant harmonic steel strike', trigger: SFX_PRESETS.metal_clang },
  { id: 'short_explosion', name: 'Short Explosion', category: 'Cinematic', duration: 0.7, description: 'Pink noise blast with lowpass roll-off', trigger: SFX_PRESETS.short_explosion },
  { id: 'heartbeat_slow', name: 'Heartbeat Slow', category: 'Cinematic', duration: 0.34, description: 'Sub-bass lub-dub pulse', trigger: SFX_PRESETS.heartbeat_slow },
  { id: 'heartbeat_fast', name: 'Heartbeat Fast', category: 'Cinematic', duration: 0.23, description: 'Accelerated high-tension cardiac pulse', trigger: SFX_PRESETS.heartbeat_fast },
  { id: 'clock_tick', name: 'Clock Tick', category: 'Cinematic', duration: 0.015, description: 'Crisp acoustic tick-tock transient', trigger: SFX_PRESETS.clock_tick },
  { id: 'thunder_strike', name: 'Thunder Strike', category: 'Cinematic', duration: 1.6, description: 'Rolling atmospheric thunder crack', trigger: SFX_PRESETS.thunder_strike },

  // 4. Comedy & Memes (6 SFX)
  { id: 'vine_boom', name: 'Vine Boom', category: 'Comedy', duration: 1.1, description: 'Distorted 808 bass drop meme boom', trigger: SFX_PRESETS.vine_boom },
  { id: 'air_horn', name: 'Air Horn', category: 'Comedy', duration: 0.45, description: 'Triple detuned brassy hype blast', trigger: SFX_PRESETS.air_horn },
  { id: 'cartoon_boing', name: 'Cartoon Boing', category: 'Comedy', duration: 0.35, description: 'Spring pitch-modulated jump bounce', trigger: SFX_PRESETS.cartoon_boing },
  { id: 'cartoon_slip', name: 'Cartoon Slip', category: 'Comedy', duration: 0.32, description: 'Sliding pitch banana peel wipeout', trigger: SFX_PRESETS.cartoon_slip },
  { id: 'cartoon_punch', name: 'Cartoon Punch', category: 'Comedy', duration: 0.14, description: 'Punchy transient noise face smack', trigger: SFX_PRESETS.cartoon_punch },
  { id: 'sad_trombone', name: 'Sad Trombone', category: 'Comedy', duration: 1.8, description: 'Classic wah-wah-wah-wahhh fail phrase', trigger: SFX_PRESETS.sad_trombone },

  // 5. Foley & Everyday (4 SFX)
  { id: 'door_creak', name: 'Door Creak', category: 'Foley', duration: 0.5, description: 'Creaky hinge wood friction modulation', trigger: SFX_PRESETS.door_creak },
  { id: 'match_strike', name: 'Match Strike', category: 'Foley', duration: 0.25, description: 'Friction phosphorus match head scrape', trigger: SFX_PRESETS.match_strike },
  { id: 'service_bell', name: 'Service Bell', category: 'Foley', duration: 1.2, description: 'Hotel reception counter bell ding', trigger: SFX_PRESETS.service_bell },
  { id: 'pop_bubble', name: 'Pop Bubble', category: 'Foley', duration: 0.06, description: 'Clean acoustic soap bubble pop', trigger: SFX_PRESETS.pop_bubble }
];

const cachedBuffers = new Map<string, AudioBuffer>();

/**
 * Asynchronously renders an AudioBuffer for a given SFX preset ID
 * Used for timeline clips, waveforms, and offline WAV rendering
 */
export async function getProceduralSFXBuffer(sfxId: string): Promise<AudioBuffer | null> {
  if (cachedBuffers.has(sfxId)) {
    return cachedBuffers.get(sfxId)!;
  }

  const item = SFX_CATALOG.find((x) => x.id === sfxId);
  if (!item || !item.trigger) return null;

  const duration = item.duration || 1.0;
  const sampleRate = engine.ctx.sampleRate || 44100;
  const length = Math.max(1, Math.ceil(sampleRate * duration));

  const offlineCtx = new OfflineAudioContext(2, length, sampleRate);
  const offlineMaster = offlineCtx.createGain();
  offlineMaster.gain.setValueAtTime(0.9, 0);
  offlineMaster.connect(offlineCtx.destination);

  // Invoke procedural synthesizer on offline audio context
  item.trigger(offlineCtx, offlineMaster);

  const renderedBuffer = await offlineCtx.startRendering();
  cachedBuffers.set(sfxId, renderedBuffer);
  return renderedBuffer;
}

