import { AudioBufferRegistry } from '../core/AudioBufferRegistry';
import { ProceduralAudioEngine } from '../core/ProceduralAudioEngine';

interface ActiveAudioSource {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

export class TimelinePlaybackEngine {
  private static instance: TimelinePlaybackEngine;
  private engine = ProceduralAudioEngine.getInstance();
  private registry = AudioBufferRegistry.getInstance();
  private activeSources: ActiveAudioSource[] = [];

  private constructor() {}

  public static getInstance(): TimelinePlaybackEngine {
    if (!TimelinePlaybackEngine.instance) {
      TimelinePlaybackEngine.instance = new TimelinePlaybackEngine();
    }
    return TimelinePlaybackEngine.instance;
  }

  public stopAllActiveSources(): void {
    this.activeSources.forEach(({ source, gain }) => {
      try {
        source.stop();
        source.disconnect();
        gain.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
  }

  public scheduleTimelineClips(
    clips: Array<{
      id: string;
      soundId?: string;
      sfxId?: string;
      startTime?: number;
      startTimeSec?: number;
      duration: number;
      speed?: number;
      volume?: number;
      fadeIn?: number;
      fadeOut?: number;
      trackId?: string;
    }>,
    currentTimelineTime: number
  ): void {
    this.stopAllActiveSources();

    if (this.engine.ctx.state === 'suspended') {
      this.engine.ctx.resume().catch(() => {});
    }

    const now = this.engine.ctx.currentTime;

    clips.forEach((clip) => {
      const targetId = clip.soundId || clip.sfxId || clip.id;
      const buffer = this.registry.get(targetId);
      if (!buffer) return;

      const clipStart = typeof clip.startTime === 'number' ? clip.startTime : (clip.startTimeSec || 0);
      const speed = clip.speed || 1.0;
      const playbackDuration = clip.duration / speed;
      const clipEndTime = clipStart + playbackDuration;

      if (clipEndTime > currentTimelineTime) {
        const source = this.engine.ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = speed;

        const gainNode = this.engine.ctx.createGain();
        const baseVolume = clip.volume ?? 1.0;

        const offsetWithinClip = Math.max(0, currentTimelineTime - clipStart);
        const delayUntilStart = Math.max(0, clipStart - currentTimelineTime);
        const startAudioTime = now + delayUntilStart;

        gainNode.gain.setValueAtTime(0.001, startAudioTime);

        if (clip.fadeIn && clip.fadeIn > 0) {
          gainNode.gain.exponentialRampToValueAtTime(baseVolume, startAudioTime + clip.fadeIn);
        } else {
          gainNode.gain.setValueAtTime(baseVolume, startAudioTime);
        }

        if (clip.fadeOut && clip.fadeOut > 0) {
          const fadeOutStart = startAudioTime + (playbackDuration - offsetWithinClip) - clip.fadeOut;
          if (fadeOutStart > startAudioTime) {
            gainNode.gain.setValueAtTime(baseVolume, fadeOutStart);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startAudioTime + (playbackDuration - offsetWithinClip));
          }
        }

        const trackNode = this.engine.trackNodes.get(clip.trackId || 'sfx_1') || { gainNode: this.engine.masterGain };
        source.connect(gainNode);
        gainNode.connect(trackNode.gainNode);

        try {
          source.start(startAudioTime, offsetWithinClip * speed);
          this.activeSources.push({ source, gain: gainNode });
        } catch (e) {
          console.warn('[TimelinePlaybackEngine] Failed to start source:', e);
        }
      }
    });
  }
}
