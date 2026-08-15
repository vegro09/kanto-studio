// PlayheadScrubber.js: 60FPS Interactive Bidirectional Playhead Scrubbing Engine

export class PlayheadScrubber {
  constructor(options = {}) {
    this.pxPerSecond = options.pxPerSecond || 80;
    this.getTotalDuration = options.getTotalDuration || (() => 10);
    this.isPlaying = options.isPlaying || false;
    this.onSetCurrentTime = options.onSetCurrentTime || (() => {});
    this.onScrubProgress = options.onScrubProgress || (() => {});
    this.onTogglePlay = options.onTogglePlay || (() => {});

    this.isScrubbing = false;
    this.wasPlayingBeforeScrub = false;
  }

  updateConfig({ pxPerSecond, getTotalDuration, isPlaying, onSetCurrentTime, onScrubProgress, onTogglePlay }) {
    if (pxPerSecond !== undefined) this.pxPerSecond = pxPerSecond;
    if (getTotalDuration !== undefined) this.getTotalDuration = getTotalDuration;
    if (isPlaying !== undefined) this.isPlaying = isPlaying;
    if (onSetCurrentTime !== undefined) this.onSetCurrentTime = onSetCurrentTime;
    if (onScrubProgress !== undefined) this.onScrubProgress = onScrubProgress;
    if (onTogglePlay !== undefined) this.onTogglePlay = onTogglePlay;
  }

  startScrub(e, containerRef) {
    if (e.button !== 0) return; // Left mouse click only
    e.preventDefault();
    e.stopPropagation();

    this.isScrubbing = true;
    this.wasPlayingBeforeScrub = this.isPlaying;
    if (this.isPlaying && this.onTogglePlay) {
      this.onTogglePlay(); // Pause while scrubbing
    }

    this.updateFromMouse(e, containerRef);

    const onMouseMove = (moveEvent) => {
      if (!this.isScrubbing) return;
      moveEvent.preventDefault();
      this.updateFromMouse(moveEvent, containerRef);
    };

    const onMouseUp = () => {
      if (!this.isScrubbing) return;
      this.isScrubbing = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (this.wasPlayingBeforeScrub && this.onTogglePlay) {
        this.onTogglePlay(); // Resume playback if it was playing before
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', onMouseUp);
  }

  updateFromMouse(e, containerRef) {
    const container = containerRef && containerRef.current ? containerRef.current : null;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const totalDur = Math.max(0.1, this.getTotalDuration());
    const targetSec = Math.max(0, Math.min(clickX / this.pxPerSecond, totalDur));
    const progress = targetSec / totalDur;

    this.onSetCurrentTime(targetSec);
    this.onScrubProgress(progress);
  }
}
