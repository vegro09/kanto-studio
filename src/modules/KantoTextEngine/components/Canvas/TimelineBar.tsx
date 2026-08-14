import React, { useRef } from 'react';
import { useEngineStore } from '../../store/useEngineStore';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Repeat, 
  Clock
} from 'lucide-react';

export const TimelineBar: React.FC = () => {
  const {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    totalDuration,
    setTotalDuration,
    playbackSpeed,
    setPlaybackSpeed,
    loopPlayback,
    setLoopPlayback,
    layers,
    activeLayerId,
  } = useEngineStore();

  const trackRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = clickX / rect.width;
    setCurrentTime(ratio * totalDuration);
  };

  const handleTrackDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1 || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = clickX / rect.width;
    setCurrentTime(ratio * totalDuration);
  };

  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const inDuration = activeLayer?.animation.in.duration || 0;
  const outDuration = activeLayer?.animation.out?.duration || 0;

  const inPercent = Math.min(100, (inDuration / totalDuration) * 100);
  const outPercent = Math.min(100, (outDuration / totalDuration) * 100);
  const progressPercent = Math.min(100, (currentTime / totalDuration) * 100);

  return (
    <div className="h-16 bg-dark-900 border-t border-dark-750 px-4 flex items-center justify-between gap-4 select-none z-20 shrink-0">
      {/* Left: Playback Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-9 h-9 rounded bg-white hover:bg-neutral-200 text-black flex items-center justify-center font-bold transition-all active:scale-95"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <button
          onClick={() => setCurrentTime(0)}
          className="p-2 text-neutral-400 hover:text-white hover:bg-dark-800 rounded transition-colors"
          title="Reset to Start (0.0s)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="font-mono text-xs text-neutral-300 bg-black px-2.5 py-1.5 rounded border border-dark-750 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-white">{formatTime(currentTime)}</span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Middle: Timeline Track */}
      <div className="flex-1 max-w-3xl flex flex-col justify-center gap-1">
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
          <div className="flex items-center gap-3">
            {activeLayer && (
              <>
                <span className="text-white font-mono text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                  IN: {inDuration.toFixed(1)}s ({activeLayer.animation.in.type})
                </span>
                {activeLayer.animation.out && activeLayer.animation.out.type !== 'none' && (
                  <span className="text-neutral-400 font-mono text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 inline-block" />
                    OUT: {outDuration.toFixed(1)}s ({activeLayer.animation.out.type})
                  </span>
                )}
              </>
            )}
          </div>
          <div className="text-neutral-400 font-mono text-[10px]">
            {progressPercent.toFixed(0)}%
          </div>
        </div>

        {/* Track Bar */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          onMouseMove={handleTrackDrag}
          className="relative h-4 bg-dark-800 rounded cursor-pointer overflow-hidden border border-dark-700 hover:border-dark-600 transition-colors"
        >
          {/* In-Animation Region */}
          {activeLayer && inDuration > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-white/20 border-r border-white/40"
              style={{ left: 0, width: `${inPercent}%` }}
              title={`In Animation: ${activeLayer.animation.in.type}`}
            />
          )}

          {/* Out-Animation Region */}
          {activeLayer && outDuration > 0 && activeLayer.animation.out?.type !== 'none' && (
            <div
              className="absolute top-0 bottom-0 bg-white/10 border-l border-white/30"
              style={{ right: 0, width: `${outPercent}%` }}
              title={`Out Animation: ${activeLayer.animation.out?.type}`}
            />
          )}

          {/* Played Progress */}
          <div
            className="absolute top-0 bottom-0 bg-neutral-600/60 pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Playhead Marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none z-10"
            style={{ left: `${progressPercent}%` }}
          >
            <div className="w-2.5 h-2.5 bg-white rounded-full -ml-1 -top-0.5 absolute shadow" />
          </div>
        </div>
      </div>

      {/* Right: Playback Settings */}
      <div className="flex items-center gap-2">
        {/* Speed Selector */}
        <div className="flex items-center bg-black p-0.5 rounded border border-dark-750 text-xs">
          {[0.5, 1, 1.5, 2].map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-2 py-0.5 rounded font-mono ${
                playbackSpeed === spd
                  ? 'bg-white text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Loop Toggle */}
        <button
          onClick={() => setLoopPlayback(!loopPlayback)}
          className={`p-1.5 rounded border transition-colors ${
            loopPlayback
              ? 'bg-white text-black border-white'
              : 'bg-black text-neutral-400 border-dark-750 hover:text-white'
          }`}
          title={loopPlayback ? 'Loop: Enabled' : 'Loop: Disabled'}
        >
          <Repeat className="w-4 h-4" />
        </button>

        {/* Total Duration */}
        <div className="flex items-center gap-1 bg-black px-2.5 py-1 rounded border border-dark-750">
          <span className="text-[11px] text-neutral-400">Duration:</span>
          <input
            type="number"
            min={1}
            max={15}
            step={0.5}
            value={totalDuration}
            onChange={(e) => setTotalDuration(Math.max(1, Math.min(15, parseFloat(e.target.value) || 3.5)))}
            className="w-9 bg-transparent text-xs font-mono font-bold text-white text-center outline-none border-b border-dark-600 focus:border-white"
          />
          <span className="text-[11px] text-neutral-500 font-mono">s</span>
        </div>
      </div>
    </div>
  );
};
