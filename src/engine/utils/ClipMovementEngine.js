// ClipMovementEngine.js: Freeform Multi-Track Clip Dragging & Snapping Engine

export class ClipMovementEngine {
  constructor(options = {}) {
    this.pxPerSecond = options.pxPerSecond || 80;
    this.onUpdateAsset = options.onUpdateAsset || (() => {});
    this.snapThresholdPx = options.snapThresholdPx || 10;
  }

  updateConfig({ pxPerSecond, onUpdateAsset, snapThresholdPx }) {
    if (pxPerSecond !== undefined) this.pxPerSecond = pxPerSecond;
    if (onUpdateAsset !== undefined) this.onUpdateAsset = onUpdateAsset;
    if (snapThresholdPx !== undefined) this.snapThresholdPx = snapThresholdPx;
  }

  calculateSnappedTime(proposedStartTime, duration, otherAssets, currentClipId, currentPlayheadTime) {
    const snapThresholdSec = this.snapThresholdPx / this.pxPerSecond;
    let bestStart = proposedStartTime;
    let minDiff = snapThresholdSec;

    // Snap target candidate times
    const snapCandidates = [0, currentPlayheadTime || 0];

    // Add boundaries of other clips
    if (Array.isArray(otherAssets)) {
      otherAssets.forEach((asset) => {
        if (!asset || asset.id === currentClipId) return;
        const aStart = asset.startTimeSec || 0;
        const aDur = asset.duration || 5.0;
        const aEnd = aStart + aDur;

        snapCandidates.push(aStart);
        snapCandidates.push(aEnd);
      });
    }

    // Check if proposed start snaps to any candidate
    for (const cand of snapCandidates) {
      // 1. Clip start matches candidate
      const diffStart = Math.abs(proposedStartTime - cand);
      if (diffStart < minDiff) {
        minDiff = diffStart;
        bestStart = cand;
      }

      // 2. Clip end matches candidate
      const proposedEnd = proposedStartTime + duration;
      const diffEnd = Math.abs(proposedEnd - cand);
      if (diffEnd < minDiff) {
        minDiff = diffEnd;
        bestStart = Math.max(0, cand - duration);
      }
    }

    return Math.max(0, Math.round(bestStart * 100) / 100);
  }

  startClipDrag(e, item, allAssets, onDragStateChange) {
    if (e.button !== 0) return;
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialStartTime = item.startTimeSec || 0;
    const initialLane = item.trackLane || 0;
    const duration = item.duration || (item.animationDuration || 3.0);

    const dragState = {
      clipId: item.id,
      startX,
      startY,
      initialStartTime,
      initialLane,
      isDragging: true
    };

    if (onDragStateChange) onDragStateChange(dragState);

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSec = deltaX / this.pxPerSecond;
      const deltaY = moveEvent.clientY - startY;
      const laneDelta = Math.round(deltaY / 44);

      let newStartTime = Math.max(0, initialStartTime + deltaSec);
      newStartTime = this.calculateSnappedTime(
        newStartTime,
        duration,
        allAssets,
        item.id,
        0
      );

      const newLane = Math.max(0, initialLane + laneDelta);

      if (this.onUpdateAsset) {
        this.onUpdateAsset(item.id, {
          startTimeSec: newStartTime,
          trackLane: newLane,
          zIndex: newLane * 10 + 1
        });
      }
    };

    const onMouseUp = () => {
      if (onDragStateChange) onDragStateChange(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
}
