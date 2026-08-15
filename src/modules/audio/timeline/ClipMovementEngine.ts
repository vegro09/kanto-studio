/**
 * Kanto Audio Engineer - ClipMovementEngine
 * Freeform multi-track clip manipulation engine across time (X-axis) and track lanes (Y-axis)
 */

import { AudioTimelineEngine, TimelineSnappingEngine, AudioClip } from './AudioTimelineEngine';

export interface DragState {
  clipId: string;
  startX: number;
  startY: number;
  initialStartTime: number;
  initialTrackId: string;
}

export class ClipMovementEngine {
  private timeline: AudioTimelineEngine;
  private snapEngine: TimelineSnappingEngine;
  private activeDrag: DragState | null = null;

  constructor(timeline: AudioTimelineEngine, snapEngine: TimelineSnappingEngine) {
    this.timeline = timeline;
    this.snapEngine = snapEngine;
  }

  public registerClipDrag(clipElement: HTMLElement, clipId: string, onUpdateCallback?: (clipId: string, updates: Partial<AudioClip>) => void) {
    clipElement.addEventListener('mousedown', (e: MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains('clip-trim-handle')) return;

      e.stopPropagation();
      const clip = this.timeline.clips.find((c) => c.id === clipId);
      if (!clip) return;

      this.activeDrag = {
        clipId,
        startX: e.clientX,
        startY: e.clientY,
        initialStartTime: clip.startTime,
        initialTrackId: clip.trackId,
      };

      clipElement.classList.add('opacity-70', 'cursor-grabbing', 'dragging');

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!this.activeDrag) return;

        const deltaX = moveEvent.clientX - this.activeDrag.startX;
        const deltaTime = deltaX / this.timeline.pixelsPerSecond;
        let newStartTime = Math.max(0, this.activeDrag.initialStartTime + deltaTime);

        newStartTime = this.snapEngine.calculateSnappedTime(
          newStartTime,
          clip.duration / (clip.speed || 1),
          this.timeline.clips,
          clip.id,
          this.timeline.currentTime,
          this.timeline.pixelsPerSecond
        );

        clip.startTime = newStartTime;

        // Detect Track (Y-Axis) switch based on cursor position
        const trackElements = document.querySelectorAll('[data-track-id]');
        trackElements.forEach((trackEl) => {
          const rect = trackEl.getBoundingClientRect();
          if (moveEvent.clientY >= rect.top && moveEvent.clientY <= rect.bottom) {
            const newTrackId = trackEl.getAttribute('data-track-id');
            if (newTrackId && newTrackId !== 'video' && clip.trackId !== newTrackId) {
              clip.trackId = newTrackId;
            }
          }
        });

        if (onUpdateCallback) {
          onUpdateCallback(clip.id, { startTime: newStartTime, trackId: clip.trackId });
        }
      };

      const onMouseUp = () => {
        if (!this.activeDrag) return;
        clipElement.classList.remove('opacity-70', 'cursor-grabbing', 'dragging');
        this.activeDrag = null;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }
}
