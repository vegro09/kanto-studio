import React, { useEffect, useRef } from 'react';

export default function AudioEngine({
  assets = [],
  isPlaying = false,
  playbackProgress = 0,
  totalDuration = 10
}) {
  const audioNodesRef = useRef({});

  useEffect(() => {
    const audioAssets = assets.filter((a) => a.type === 'audio' || a.category === 'Audio');
    const currentSec = playbackProgress * Math.max(totalDuration, 1.0);

    audioAssets.forEach((asset) => {
      let audioEl = audioNodesRef.current[asset.id];
      if (!audioEl) {
        audioEl = new Audio(asset.src || asset.url);
        audioNodesRef.current[asset.id] = audioEl;
      } else if (audioEl.src !== (asset.src || asset.url)) {
        audioEl.src = asset.src || asset.url;
      }

      const start = asset.startTimeSec || 0;
      const duration = asset.duration || 3.0;
      const end = start + duration;
      const vol = asset.isMuted ? 0 : Math.min(1.0, Math.max(0, asset.volume !== undefined ? asset.volume : 1.0));

      audioEl.volume = vol;

      if (isPlaying && currentSec >= start && currentSec <= end && vol > 0) {
        const offset = currentSec - start;

        if (audioEl.paused) {
          audioEl.currentTime = offset;
          audioEl.play().catch((err) => {
            console.warn("Audio autoplay notice:", err);
          });
        } else if (Math.abs(audioEl.currentTime - offset) > 0.15) {
          audioEl.currentTime = offset;
        }
      } else {
        if (!audioEl.paused) {
          audioEl.pause();
        }
      }
    });

    // Cleanup deleted audio nodes
    const activeIds = new Set(audioAssets.map((a) => a.id));
    Object.keys(audioNodesRef.current).forEach((id) => {
      if (!activeIds.has(id)) {
        audioNodesRef.current[id].pause();
        delete audioNodesRef.current[id];
      }
    });
  }, [assets, isPlaying, playbackProgress, totalDuration]);

  // Clean up all audio nodes on unmount
  useEffect(() => {
    return () => {
      Object.values(audioNodesRef.current).forEach((el) => el.pause());
      audioNodesRef.current = {};
    };
  }, []);

  return null; // Silent background audio engine node
}
