/**
 * Kanto Audio Engineer - PlayheadScrubber
 * Interactive 60FPS bidirectional playhead scrubbing engine
 */

import { AudioTimelineEngine } from './AudioTimelineEngine';

export class PlayheadScrubber {
  private timeline: AudioTimelineEngine;
  private isScrubbing: boolean = false;
  private wasPlayingBeforeScrub: boolean = false;
  private onSeekCallback?: (time: number) => void;

  constructor(timeline: AudioTimelineEngine, onSeekCallback?: (time: number) => void) {
    this.timeline = timeline;
    this.onSeekCallback = onSeekCallback;
    this.attachScrubListeners();
  }

  private attachScrubListeners() {
    const ruler = document.getElementById('timeline-ruler');
    const viewport = document.getElementById('tracks-viewport');
    const playheadHandle = document.getElementById('playhead-handle');

    const startScrub = (e: MouseEvent) => {
      this.isScrubbing = true;
      this.wasPlayingBeforeScrub = this.timeline.isPlaying;
      this.updatePlayheadFromMouse(e);

      window.addEventListener('mousemove', onScrubMove);
      window.addEventListener('mouseup', onScrubEnd);
    };

    const onScrubMove = (e: MouseEvent) => {
      if (!this.isScrubbing) return;
      this.updatePlayheadFromMouse(e);
    };

    const onScrubEnd = () => {
      if (!this.isScrubbing) return;
      this.isScrubbing = false;
      window.removeEventListener('mousemove', onScrubMove);
      window.removeEventListener('mouseup', onScrubEnd);
    };

    ruler?.addEventListener('mousedown', startScrub);
    playheadHandle?.addEventListener('mousedown', startScrub);
    viewport?.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).closest('.timeline-clip-card')) return;
      startScrub(e);
    });
  }

  private updatePlayheadFromMouse(e: MouseEvent) {
    const viewport = document.getElementById('tracks-viewport') || document.getElementById('timeline-tracks-area');
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const scrollOffset = viewport.scrollLeft;
    const clickX = e.clientX - rect.left + scrollOffset;
    const targetTime = Math.max(0, clickX / this.timeline.pixelsPerSecond);

    this.timeline.currentTime = targetTime;
    if (this.onSeekCallback) {
      this.onSeekCallback(targetTime);
    }
  }
}
