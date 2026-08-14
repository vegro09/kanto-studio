import React from 'react';
import { useEngineStore } from '../../store/useEngineStore';
import { 
  PlayCircle, 
  Sparkles, 
  Repeat, 
  Activity, 
  Zap, 
  MoveUp, 
  Waves,
  EyeOff
} from 'lucide-react';

export const AnimationsPanel: React.FC = () => {
  const { layers, activeLayerId, updateActiveLayer, totalDuration } = useEngineStore();
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  if (!activeLayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-6 text-center text-xs">
        <Activity className="w-8 h-8 mb-2 opacity-40 text-neutral-400" />
        <span>Select a text layer to configure Motion & Keyframe settings.</span>
      </div>
    );
  }

  const inAnimations = [
    { id: 'none', label: 'None', icon: EyeOff, desc: 'Static entrance' },
    { id: 'typewriter', label: 'Typewriter', icon: Zap, desc: 'Dynamic string slice' },
    { id: 'blur-fade', label: 'Blur Fade', icon: Sparkles, desc: 'Focal blur to sharp' },
    { id: 'slide-up', label: 'Slide Up', icon: MoveUp, desc: 'Smooth cubic rise' },
    { id: 'bounce', label: 'Bounce In', icon: Activity, desc: 'Overshoot bounce' },
  ];

  const outAnimations = [
    { id: 'none', label: 'None', icon: EyeOff, desc: 'Static exit' },
    { id: 'dissolve', label: 'Dissolve', icon: Sparkles, desc: 'Smooth opacity fade' },
    { id: 'scale-down', label: 'Scale Down', icon: Activity, desc: 'Shrink and fade' },
    { id: 'slide-down', label: 'Slide Down', icon: MoveUp, desc: 'Downward exit' },
  ];

  const loopAnimations = [
    { id: 'none', label: 'None', icon: EyeOff, desc: 'No continuous loop' },
    { id: 'pulse', label: 'Pulse', icon: Activity, desc: 'Harmonic scale wave' },
    { id: 'sine-wobble', label: 'Sine Wobble', icon: Waves, desc: 'Floating angle bob' },
    { id: 'floating', label: 'Floating', icon: Sparkles, desc: 'Smooth 2D drift' },
    { id: 'glitch', label: 'Glitch Jitter', icon: Zap, desc: 'Periodic jitter offset' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4 text-xs select-none">
      {/* 1. IN-ANIMATION SECTION */}
      <div className="flex flex-col gap-3 bg-dark-900 p-3 rounded border border-dark-750">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-white flex items-center gap-1.5 font-mono">
            <PlayCircle className="w-3.5 h-3.5 text-neutral-400" />
            <span>IN-ANIMATION</span>
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {activeLayer.animation.in.duration.toFixed(1)}s
          </span>
        </div>

        {/* In Animation Grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {inAnimations.map((anim) => {
            const isSelected = activeLayer.animation.in.type === anim.id;
            const Icon = anim.icon;
            return (
              <button
                key={anim.id}
                onClick={() =>
                  updateActiveLayer({
                    animation: {
                      ...activeLayer.animation,
                      in: { ...activeLayer.animation.in, type: anim.id as any },
                    },
                  })
                }
                className={`p-2.5 rounded border text-left flex flex-col gap-0.5 transition-all ${
                  isSelected
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-black border-dark-700 hover:border-neutral-500 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-neutral-400'}`} />
                  <span className="font-semibold text-[11px] truncate">{anim.label}</span>
                </div>
                <span className={`text-[9px] truncate ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}>
                  {anim.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* In Duration Slider */}
        {activeLayer.animation.in.type !== 'none' && (
          <div className="flex flex-col gap-1 pt-1 border-t border-dark-750">
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>Duration (In)</span>
              <span>{activeLayer.animation.in.duration.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0.1"
              max={Math.min(5.0, totalDuration)}
              step="0.1"
              value={activeLayer.animation.in.duration}
              onChange={(e) =>
                updateActiveLayer({
                  animation: {
                    ...activeLayer.animation,
                    in: { ...activeLayer.animation.in, duration: parseFloat(e.target.value) },
                  },
                })
              }
            />
          </div>
        )}
      </div>

      {/* 2. LOOP-ANIMATION SECTION */}
      <div className="flex flex-col gap-3 bg-dark-900 p-3 rounded border border-dark-750">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-white flex items-center gap-1.5 font-mono">
            <Repeat className="w-3.5 h-3.5 text-neutral-400" />
            <span>LOOP-ANIMATION</span>
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {activeLayer.animation.loop.speed.toFixed(1)}x speed
          </span>
        </div>

        {/* Loop Animation Grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {loopAnimations.map((anim) => {
            const isSelected = activeLayer.animation.loop.type === anim.id;
            const Icon = anim.icon;
            return (
              <button
                key={anim.id}
                onClick={() =>
                  updateActiveLayer({
                    animation: {
                      ...activeLayer.animation,
                      loop: { ...activeLayer.animation.loop, type: anim.id as any },
                    },
                  })
                }
                className={`p-2.5 rounded border text-left flex flex-col gap-0.5 transition-all ${
                  isSelected
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-black border-dark-700 hover:border-neutral-500 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-neutral-400'}`} />
                  <span className="font-semibold text-[11px] truncate">{anim.label}</span>
                </div>
                <span className={`text-[9px] truncate ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}>
                  {anim.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loop Speed Slider */}
        {activeLayer.animation.loop.type !== 'none' && (
          <div className="flex flex-col gap-1 pt-1 border-t border-dark-750">
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>Speed Multiplier</span>
              <span>{activeLayer.animation.loop.speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={activeLayer.animation.loop.speed}
              onChange={(e) =>
                updateActiveLayer({
                  animation: {
                    ...activeLayer.animation,
                    loop: { ...activeLayer.animation.loop, speed: parseFloat(e.target.value) },
                  },
                })
              }
            />
          </div>
        )}
      </div>

      {/* 3. OUT-ANIMATION SECTION */}
      <div className="flex flex-col gap-3 bg-dark-900 p-3 rounded border border-dark-750">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-white flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span>OUT-ANIMATION</span>
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {activeLayer.animation.out?.duration.toFixed(1) || '0.0'}s
          </span>
        </div>

        {/* Out Animation Grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {outAnimations.map((anim) => {
            const isSelected = (activeLayer.animation.out?.type || 'none') === anim.id;
            const Icon = anim.icon;
            return (
              <button
                key={anim.id}
                onClick={() =>
                  updateActiveLayer({
                    animation: {
                      ...activeLayer.animation,
                      out: {
                        type: anim.id as any,
                        duration: activeLayer.animation.out?.duration || 0.8,
                      },
                    },
                  })
                }
                className={`p-2.5 rounded border text-left flex flex-col gap-0.5 transition-all ${
                  isSelected
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-black border-dark-700 hover:border-neutral-500 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-neutral-400'}`} />
                  <span className="font-semibold text-[11px] truncate">{anim.label}</span>
                </div>
                <span className={`text-[9px] truncate ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}>
                  {anim.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Out Duration Slider */}
        {activeLayer.animation.out && activeLayer.animation.out.type !== 'none' && (
          <div className="flex flex-col gap-1 pt-1 border-t border-dark-750">
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>Duration (Out)</span>
              <span>{activeLayer.animation.out.duration.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0.1"
              max={Math.min(5.0, totalDuration)}
              step="0.1"
              value={activeLayer.animation.out.duration}
              onChange={(e) =>
                updateActiveLayer({
                  animation: {
                    ...activeLayer.animation,
                    out: {
                      type: activeLayer.animation.out?.type || 'dissolve',
                      duration: parseFloat(e.target.value),
                    },
                  },
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};
