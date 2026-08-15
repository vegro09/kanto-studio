import React from 'react';
import { Trash2, Volume2, Activity, Sparkles } from 'lucide-react';
import { VOICE_FILTERS } from '../core/ProceduralAudioEngine';

export interface AudioInspectorRackProps {
  selectedClip?: {
    id: string;
    name: string;
    type?: string;
    duration: number;
    volume?: number;
    pitchShift?: number;
    speed?: number;
    fadeIn?: number;
    fadeOut?: number;
    filterId?: string;
    trackId?: string;
  } | null;
  updateClip?: (clipId: string, updates: Record<string, any>) => void;
  removeClip?: (clipId: string) => void;
}

export const AudioInspectorRack: React.FC<AudioInspectorRackProps> = ({
  selectedClip,
  updateClip,
  removeClip,
}) => {
  if (!selectedClip || (selectedClip.type && selectedClip.type !== 'audio')) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
        <svg className="w-10 h-10 mb-3 stroke-1 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
        <span className="text-xs font-semibold text-neutral-400">No Audio Clip Selected</span>
        <p className="text-[11px] text-neutral-600 mt-1">Select an audio clip on the timeline (SFX or Voice Over) to tweak its DSP properties.</p>
      </div>
    );
  }

  const duration = typeof selectedClip.duration === 'number' ? selectedClip.duration : 1.0;
  const pitch = typeof selectedClip.pitchShift === 'number' ? selectedClip.pitchShift : 0;

  return (
    <div className="space-y-5 select-none text-white">
      {/* Selected Clip Card */}
      <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 flex justify-between items-center shadow-sm">
        <div className="truncate pr-2">
          <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block">SELECTED AUDIO</span>
          <h4 className="text-xs font-bold text-white truncate">{selectedClip.name}</h4>
          <span className="text-[10px] text-neutral-400 font-mono">{duration.toFixed(2)}s Duration</span>
        </div>
        {removeClip && (
          <button
            onClick={() => removeClip(selectedClip.id)}
            className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
            title="Delete Sound"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Levels & Pitch Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Volume2 className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold tracking-wider uppercase">LEVELS & PITCH</span>
        </div>

        {/* Volume Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>GAIN / VOLUME</span>
            <span className="text-white font-mono">{Math.round((selectedClip.volume ?? 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={selectedClip.volume ?? 1}
            onChange={(e) => updateClip && updateClip(selectedClip.id, { volume: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none accent-white cursor-pointer"
          />
        </div>

        {/* Pitch Shift Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>PITCH SHIFT</span>
            <span className="text-white font-mono">{pitch > 0 ? `+${pitch}` : pitch} st</span>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={pitch}
            onChange={(e) => updateClip && updateClip(selectedClip.id, { pitchShift: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none accent-white cursor-pointer"
          />
        </div>

        {/* Playback Speed Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>PLAYBACK SPEED</span>
            <span className="text-white font-mono">{(selectedClip.speed ?? 1).toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.05"
            value={selectedClip.speed ?? 1}
            onChange={(e) => updateClip && updateClip(selectedClip.id, { speed: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none accent-white cursor-pointer"
          />
        </div>
      </div>

      {/* Voice & Audio DSP Filter */}
      <div className="space-y-2 pt-3 border-t border-neutral-800">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold tracking-wider uppercase">VOICE & AUDIO DSP FILTER</span>
        </div>
        <select
          value={selectedClip.filterId || 'none'}
          onChange={(e) => updateClip && updateClip(selectedClip.id, { filterId: e.target.value })}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-white/50 cursor-pointer"
        >
          {VOICE_FILTERS.map((vf) => (
            <option key={vf.id} value={vf.id}>
              {vf.name}
            </option>
          ))}
        </select>
      </div>

      {/* Attack & Fades Section */}
      <div className="space-y-3 pt-3 border-t border-neutral-800">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Activity className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold tracking-wider uppercase">ATTACK & FADES</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>ATTACK (FADE IN)</span>
            <span className="text-white font-mono">{(selectedClip.fadeIn ?? 0).toFixed(2)}s</span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.min(duration / 2, 2)}
            step="0.02"
            value={selectedClip.fadeIn ?? 0}
            onChange={(e) => updateClip && updateClip(selectedClip.id, { fadeIn: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none accent-white cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>FADE OUT</span>
            <span className="text-white font-mono">{(selectedClip.fadeOut ?? 0).toFixed(2)}s</span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.min(duration / 2, 2)}
            step="0.02"
            value={selectedClip.fadeOut ?? 0}
            onChange={(e) => updateClip && updateClip(selectedClip.id, { fadeOut: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none accent-white cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
