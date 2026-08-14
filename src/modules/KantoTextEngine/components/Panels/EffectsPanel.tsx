import React from 'react';
import { useEngineStore } from '../../store/useEngineStore';
import { PRESET_EFFECTS } from '../../engine/PresetEffects';
import { Wand2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const EffectsPanel: React.FC = () => {
  const { applyPreset, activeLayerId, layers } = useEngineStore();
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  const handleApplyPreset = (preset: typeof PRESET_EFFECTS[0]) => {
    if (!activeLayerId) return;
    applyPreset(preset);
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.7, x: 0.85 } });
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3 select-none overflow-y-auto">
      <div className="flex items-center gap-2 pb-1 border-b border-dark-750">
        <Wand2 className="w-4 h-4 text-neutral-300" />
        <span className="text-xs font-bold text-white">
          Visual Style Presets
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {PRESET_EFFECTS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleApplyPreset(preset)}
            className="relative group p-3 rounded bg-dark-900 border border-dark-750 hover:border-white transition-all text-left flex flex-col gap-2 overflow-hidden shadow-sm"
          >
            {/* Header info */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                {preset.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-dark-800 text-neutral-300 border border-dark-700 font-mono group-hover:bg-white group-hover:text-black transition-colors">
                Apply
              </span>
            </div>

            {/* Visual Preview Box */}
            <div className="h-12 rounded bg-black flex items-center justify-center border border-dark-800 px-3 overflow-hidden">
              <span
                className={`text-xs tracking-wide ${preset.previewClass}`}
                style={{
                  fontFamily: '"Bebas Neue", "Cairo", "Inter", sans-serif',
                }}
              >
                {activeLayer?.content || 'KANTO MOTION'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
