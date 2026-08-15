/**
 * Kanto Audio Engineer - AudioTimelineEngine & Snapping Engine
 */

export interface AudioClip {
  id: string;
  name: string;
  trackId: string;
  startTime: number;    // In seconds
  duration: number;     // In seconds
  buffer: AudioBuffer | null;
  volume: number;
  pitchShift?: number;
  speed?: number;
  trimStart?: number;
  fadeIn?: number;
  fadeOut?: number;
  filterId?: string;
  sfxId?: string;
  src?: string;
  url?: string;
}

export interface SnapPoint {
  time: number;
  type: 'clip_start' | 'clip_end' | 'playhead';
}

export class TimelineSnappingEngine {
  private snapThresholdPx: number = 8; // Detection range in pixels

  constructor(snapThresholdPx: number = 8) {
    this.snapThresholdPx = snapThresholdPx;
  }

  public calculateSnappedTime(
    targetTime: number,
    clipDuration: number,
    allTrackClips: Array<{ start?: number; startTime?: number; startTimeSec?: number; duration?: number; id: string }>,
    currentClipId: string,
    playheadTime: number,
    pixelsPerSecond: number
  ): number {
    const pps = Math.max(1, pixelsPerSecond || 50);
    const snapThresholdTime = this.snapThresholdPx / pps;
    let closestDelta = Infinity;
    let snappedTime = targetTime;

    // Collect candidate snap targets
    const snapTargets: number[] = [playheadTime];

    allTrackClips.forEach((clip) => {
      if (clip.id !== currentClipId) {
        const start = clip.startTime !== undefined 
          ? clip.startTime 
          : (clip.startTimeSec !== undefined ? clip.startTimeSec : (clip.start || 0));
        const dur = clip.duration || 1.0;
        snapTargets.push(start);            // Target Clip Start
        snapTargets.push(start + dur);      // Target Clip End
      }
    });

    // Test dragging clip's Left Edge & Right Edge against all targets
    snapTargets.forEach((target) => {
      // 1. Snap Left Edge to Target
      const leftDelta = Math.abs(target - targetTime);
      if (leftDelta < snapThresholdTime && leftDelta < Math.abs(closestDelta)) {
        closestDelta = target - targetTime;
        snappedTime = target;
      }

      // 2. Snap Right Edge to Target
      const rightDelta = Math.abs(target - (targetTime + clipDuration));
      if (rightDelta < snapThresholdTime && rightDelta < Math.abs(closestDelta)) {
        closestDelta = target - (targetTime + clipDuration);
        snappedTime = target - clipDuration;
      }
    });

    return Math.max(0, snappedTime);
  }
}

export class AudioTimelineEngine {
  public clips: AudioClip[] = [];
  public currentTime: number = 0;
  public isPlaying: boolean = false;
  public loop: boolean = true;
  public pixelsPerSecond: number = 100;
  public minDuration: number = 2.0;
  public bufferPadding: number = 0.5;

  private audioCtx: AudioContext;
  private startPlaybackTime: number = 0;
  private animationFrameId: number | null = null;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor(audioContext: AudioContext) {
    this.audioCtx = audioContext;
  }

  public getTotalDuration(videoDuration?: number): number {
    let maxClipEnd = 0;
    if (this.clips.length > 0) {
      maxClipEnd = Math.max(...this.clips.map((c) => (c.startTime || 0) + (c.duration / (c.speed || 1))));
    }
    const baseMin = Math.max(this.minDuration, (videoDuration && videoDuration > 0) ? videoDuration : this.minDuration);
    if (maxClipEnd <= 0) return baseMin;
    return Math.max(baseMin, maxClipEnd + this.bufferPadding);
  }

  public setZoom(zoomFactor: number) {
    const factor = Math.max(0, Math.min(1.0, zoomFactor));
    this.pixelsPerSecond = 20 + factor * 480;
  }

  public setClips(clips: AudioClip[]) {
    this.clips = clips;
  }

  public stopActiveSources() {
    this.activeSources.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch (_) {}
    });
    this.activeSources = [];
  }
}
