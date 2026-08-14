// SFX & VOICE FILTERS AUDIO ENGINE FOR KANTO MOTION
// Ported & Enhanced from mp3makar Web Audio Synthesis Pipeline

export const VOICE_FILTERS = [
  { id: 'Megaphone', name: 'Megaphone', desc: 'Bandpass distortion with horn resonance' },
  { id: 'Muffled Room', name: 'Muffled Room', desc: 'Heavy lowpass dampening' },
  { id: 'Walkie-Talkie', name: 'Walkie-Talkie', desc: 'Highpass + Lowpass + Overdrive radio crunch' },
  { id: 'Titan Beast', name: 'Titan Beast', desc: 'Deep sub-bass shelf + heavy saturation' },
  { id: 'Deep Dive', name: 'Deep Dive', desc: 'Resonant sub-underwater lowpass' },
  { id: 'Vintage Radio', name: 'Vintage Radio', desc: '1920s AM Radio narrow bandpass' },
  { id: 'Anonymous Hacker', name: 'Anonymous Hacker', desc: 'Cyber robotic voice pitch modulation' },
  { id: 'Poltergeist', name: 'Poltergeist', desc: 'Ethereal ghostly reverb + pitch shift' },
  { id: 'Spacewalk', name: 'Spacewalk', desc: 'Zero-G vacuum highpass echo' },
  { id: 'Micro Creature', name: 'Micro Creature', desc: 'High-pitched formant shift' }
];

export const SFX_CATEGORIES = ['ALL', 'MEME', 'IMPACT', 'RISER', 'UI', 'FOLEY', 'GAME', 'CROWD', 'AMBIENT', 'SCI-FI'];

const RAW_SFX = [
  ["Vine Boom", "MEME", 1.2],
  ["Sigma Riser", "RISER", 3.4],
  ["Anime Wow", "MEME", 0.9],
  ["Glitch Stutter", "GLITCH", 1.1],
  ["Swoosh Transition", "SWOOSH", 0.7],
  ["Meme Pop", "POP", 0.4],
  ["Bass Drop", "IMPACT", 2.8],
  ["Cinematic Boom", "IMPACT", 2.2],
  ["Emotional Damage", "MEME", 1.6],
  ["Rizz Sound", "MEME", 1.0],
  ["Sad Violin", "MUSIC", 4.0],
  ["Discord Ping", "UI", 0.6],
  ["iPhone Alarm", "UI", 2.0],
  ["Camera Shutter", "FOLEY", 0.3],
  ["Typewriter Keys", "FOLEY", 1.4],
  ["Whoosh Reverse", "SWOOSH", 0.9],
  ["Tape Stop", "GLITCH", 1.0],
  ["VHS Rewind", "GLITCH", 1.8],
  ["Record Scratch", "GLITCH", 1.2],
  ["Airhorn", "MEME", 1.5],
  ["Crickets", "AMBIENT", 3.0],
  ["Fart Reverb", "MEME", 1.1],
  ["Bruh", "MEME", 0.8],
  ["Oh No No No", "MEME", 2.4],
  ["Suspense Ticks", "TENSION", 4.5],
  ["Heartbeat Low", "TENSION", 2.6],
  ["Metal Pipe Fall", "IMPACT", 1.7],
  ["Windows Error", "UI", 1.0],
  ["Coin Collect", "GAME", 0.5],
  ["Level Up", "GAME", 1.3],
  ["Game Over", "GAME", 2.0],
  ["Keyboard Click", "UI", 0.2],
  ["Notification Chime", "UI", 0.9],
  ["Crowd Applause", "CROWD", 3.5],
  ["Laugh Track", "CROWD", 2.7],
  ["Boo Crowd", "CROWD", 2.1],
  ["Slow Motion Drop", "RISER", 3.2],
  ["Trap Hi-Hat Roll", "MUSIC", 1.6],
  ["808 Sub Hit", "IMPACT", 1.9],
  ["Vinyl Crackle", "AMBIENT", 5.0],
  ["Neon Buzz", "AMBIENT", 4.2],
  ["Rain Loop", "AMBIENT", 6.0],
  ["Sword Slash", "FOLEY", 0.6],
  ["Punch Impact", "FOLEY", 0.5],
  ["Glass Shatter", "FOLEY", 1.4],
  ["Door Creak", "FOLEY", 2.3],
  ["Time Warp", "RISER", 3.8],
  ["Alien Transmission", "SCI-FI", 2.9],
  ["Hacker Terminal", "SCI-FI", 2.5],
  ["Drone Takeoff", "SCI-FI", 3.1]
];

export const SFX_LIBRARY = RAW_SFX.map(([name, tag, duration]) => ({
  id: `sfx_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
  name,
  tag,
  duration
}));

let sharedAudioCtx = null;

function getAudioContext() {
  if (!sharedAudioCtx) {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) {
      sharedAudioCtx = new AudioCtxClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

/**
 * Soft-clipping overdrive curve for Web Audio WaveShaper
 */
function makeDistortionCurve(amount = 20, samples = 44100) {
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/**
 * Synthesize AudioBuffer for any SFX by name
 */
export function synthesizeSfxBuffer(name, duration = 2.0) {
  const ctx = getAudioContext();
  if (!ctx) return null;

  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  const lower = name.toLowerCase();

  if (lower.includes("vine boom") || lower.includes("bass drop") || lower.includes("808")) {
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = Math.max(28, 140 * Math.exp(-t * 3.5));
      const phase = 2 * Math.PI * freq * t;
      const env = Math.exp(-t * 2.2);
      const sine = Math.sin(phase);
      const sat = Math.tanh(sine * 2.2);
      data[i] = sat * env * 0.9;
    }
  } else if (lower.includes("riser") || lower.includes("slow motion drop") || lower.includes("time warp")) {
    const isDrop = lower.includes("drop");
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const freq = isDrop ? 600 * Math.exp(-progress * 2.5) + 30 : 80 + 1200 * Math.pow(progress, 2.2);
      const saw = 2 * ((freq * t) % 1) - 1;
      const noise = (Math.random() * 2 - 1) * progress * 0.4;
      const env = isDrop ? Math.exp(-t * 1.5) : Math.min(1, progress * 1.2);
      data[i] = (saw * 0.5 + noise) * env * 0.7;
    }
  } else if (lower.includes("wow") || lower.includes("rizz") || lower.includes("emotional")) {
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = 220 + 200 * Math.sin(t * 5) + (lower.includes("wow") ? 180 * Math.sin(t * 3) : 0);
      const sine = Math.sin(2 * Math.PI * freq * t);
      const harmonic = 0.3 * Math.sin(4 * Math.PI * freq * t);
      const env = Math.exp(-t * 1.8);
      data[i] = (sine + harmonic) * env * 0.8;
    }
  } else if (lower.includes("glitch") || lower.includes("stutter") || lower.includes("tape") || lower.includes("vhs")) {
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const step = Math.floor(t * 18);
      const gate = step % 2 === 0 ? 1 : 0.15;
      const freq = 120 + ((step * 97) % 400);
      const square = Math.sin(2 * Math.PI * freq * t) > 0 ? 0.6 : -0.6;
      const noise = (Math.random() * 2 - 1) * 0.3;
      const env = Math.exp(-t * 1.2);
      data[i] = (square + noise) * gate * env * 0.7;
    }
  } else if (lower.includes("swoosh") || lower.includes("whoosh") || lower.includes("reverse")) {
    const isRev = lower.includes("reverse");
    let last = 0;
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = isRev ? t / duration : 1 - t / duration;
      const noise = Math.random() * 2 - 1;
      const coeff = Math.min(0.95, Math.max(0.05, progress));
      last = last + coeff * (noise - last);
      const env = Math.sin((t / duration) * Math.PI);
      data[i] = last * env * 0.9;
    }
  } else if (lower.includes("pop") || lower.includes("click") || lower.includes("shutter") || lower.includes("typewriter")) {
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = Math.max(80, 900 * Math.exp(-t * 50));
      const sine = Math.sin(2 * Math.PI * freq * t);
      const snap = (Math.random() * 2 - 1) * Math.exp(-t * 80);
      const env = Math.exp(-t * 25);
      data[i] = (sine * 0.7 + snap * 0.5) * env;
    }
  } else if (lower.includes("airhorn")) {
    const f1 = 466.16;
    const f2 = 587.33;
    const f3 = 698.46;
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const s1 = 2 * ((f1 * t) % 1) - 1;
      const s2 = 2 * ((f2 * t) % 1) - 1;
      const s3 = 2 * ((f3 * t) % 1) - 1;
      const env = Math.min(1, t * 20) * Math.exp(-t * 1.5);
      data[i] = (s1 + s2 + s3) * 0.25 * env;
    }
  } else {
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = 200 + 300 * Math.sin(t * 10);
      const sine = Math.sin(2 * Math.PI * freq * t);
      const env = Math.exp(-t * (2.5 / duration));
      data[i] = sine * env * 0.8;
    }
  }

  return buffer;
}

/**
 * Instant live preview playback of any SFX by name
 */
export function playSfxPreview(name, duration = 1.5) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const buffer = synthesizeSfxBuffer(name, duration);
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.7;

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  } catch (err) {
    console.warn("SFX Preview Error:", err);
  }
}

/**
 * Generate synthetic peaks array for waveform visualization
 */
export function generateWaveformPeaks(seed, count = 120) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const peaks = [];
  for (let i = 0; i < count; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const v = Math.abs((h % 1000) / 1000);
    const env = Math.sin((i / count) * Math.PI);
    peaks.push(Math.min(1, 0.15 + v * env * 0.85));
  }
  return peaks;
}
