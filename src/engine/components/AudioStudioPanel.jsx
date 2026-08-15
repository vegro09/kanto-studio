import React, { useState } from 'react';
import { 
  Music, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Sparkles, 
  Mic, 
  Play, 
  Pause, 
  Trash2, 
  Plus, 
  Disc, 
  Layers, 
  Zap,
  Activity,
  Waves,
  Headphones
} from 'lucide-react';
import AudioWaveform from './AudioWaveform';

const BUILTIN_SFX_PRESETS = [
  { id: 'sfx_whoosh', name: 'Cinematic Whoosh', duration: 1.2, category: 'Transition', freq: 440 },
  { id: 'sfx_impact', name: 'Deep Bass Impact', duration: 2.0, category: 'Impact', freq: 120 },
  { id: 'sfx_riser', name: 'Tension Riser', duration: 3.5, category: 'Riser', freq: 880 },
  { id: 'sfx_pop', name: 'UI Bubble Pop', duration: 0.4, category: 'UI', freq: 650 },
  { id: 'sfx_click', name: 'Mechanical Click', duration: 0.2, category: 'UI', freq: 1200 },
  { id: 'sfx_glitch', name: 'Cyber Glitch Stutter', duration: 1.5, category: 'Glitch', freq: 950 },
  { id: 'sfx_drop', name: 'Sub-Bass Drop', duration: 2.8, category: 'Impact', freq: 80 },
  { id: 'sfx_ambient', name: 'Atmospheric Drone', duration: 5.0, category: 'Ambient', freq: 220 }
];

export default function AudioStudioPanel({
  selectedAsset,
  onUpdateAsset,
  onDeleteAsset,
  assets = [],
  onAddAudioTrack,
  playbackProgress = 0,
  totalDuration = 10,
  onOpenVoiceModal
}) {
  const isAudioSelected = selectedAsset && (selectedAsset.type === 'audio' || selectedAsset.category === 'Audio');
  const allAudioClips = assets.filter((a) => a && (a.type === 'audio' || a.category === 'Audio'));

  // Sound generator synthesizing web audio buffers for instant preview / adding
  const handleAddSynthesizedSFX = (preset) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const dur = preset.duration || 1.5;
    const buffer = audioContext.createBuffer(1, Math.floor(sampleRate * dur), sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      if (preset.category === 'Impact') {
        data[i] = Math.sin(2 * Math.PI * (preset.freq * Math.exp(-t * 3)) * t) * Math.exp(-t * 2);
      } else if (preset.category === 'Transition') {
        data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * (t / dur)) * 0.5;
      } else if (preset.category === 'Riser') {
        data[i] = Math.sin(2 * Math.PI * (preset.freq * (t / dur) * (t / dur)) * t) * (t / dur);
      } else {
        data[i] = Math.sin(2 * Math.PI * preset.freq * t) * Math.exp(-t * 4);
      }
    }

    // Convert to Wave blob URL
    const wavBlob = audioBufferToWavBlob(buffer);
    const url = URL.createObjectURL(wavBlob);

    if (onAddAudioTrack) {
      onAddAudioTrack({
        name: preset.name,
        type: 'audio',
        category: 'Audio',
        src: url,
        url: url,
        duration: dur,
        volume: 1.0,
        pitchShift: 0,
        speed: 1.0,
        waveformData: Array.from({ length: 32 }, () => Math.random() * 0.8 + 0.2)
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar text-[#F3F0E7]">
      {/* AUDIVGHO ENGINE HEADER BADGE */}
      <div className="p-3 bg-[#1A1618] rounded-xl border border-white/15 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-950/90 border border-emerald-500/50 rounded-lg text-emerald-400">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-wider uppercase flex items-center gap-1 text-white">
              AUDIVGHO <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">PRO</span>
            </h3>
            <p className="text-[9px] text-zinc-400 font-mono">Multi-Track Spatial DSP Engine</p>
          </div>
        </div>

        {onOpenVoiceModal && (
          <button
            onClick={onOpenVoiceModal}
            className="px-2 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-600/50 text-rose-200 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all"
            title="Record Voice-over"
          >
            <Mic className="w-3 h-3 text-rose-400" />
            <span>Record</span>
          </button>
        )}
      </div>

      {/* SECTION 1: ACTIVE AUDIO CLIP INSPECTOR */}
      {isAudioSelected ? (
        <div className="space-y-3 p-3 bg-[#211C1F] rounded-xl border border-emerald-500/50 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="truncate pr-2">
              <span className="text-[9px] font-mono uppercase text-emerald-400 block">Selected Audio Track</span>
              <h4 className="text-xs font-bold text-white truncate">{selectedAsset.name}</h4>
            </div>
            <button
              onClick={() => onDeleteAsset && onDeleteAsset(selectedAsset.id)}
              className="p-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 rounded-lg transition-colors"
              title="Delete audio clip"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Volume Control */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Volume Gain</span>
              <span className="font-mono text-emerald-400">{Math.round((selectedAsset.volume !== undefined ? selectedAsset.volume : 1.0) * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateAsset(selectedAsset.id, { isMuted: !selectedAsset.isMuted })}
                className={`p-1.5 rounded-lg border transition-colors ${
                  selectedAsset.isMuted 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-[#2A2529] text-zinc-300 border-white/15'
                }`}
                title={selectedAsset.isMuted ? "Unmute track" : "Mute track"}
              >
                {selectedAsset.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="2.0"
                step="0.05"
                value={selectedAsset.volume !== undefined ? selectedAsset.volume : 1.0}
                onChange={(e) => onUpdateAsset(selectedAsset.id, { volume: parseFloat(e.target.value) })}
                className="w-full cursor-pointer accent-emerald-400"
              />
            </div>
          </div>

          {/* Panning & Spatial Balance */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Stereo Panning</span>
              <span className="font-mono text-white">
                {(selectedAsset.pan || 0) === 0 ? 'Center' : (selectedAsset.pan || 0) < 0 ? `L ${Math.abs(Math.round((selectedAsset.pan || 0) * 100))}%` : `R ${Math.round((selectedAsset.pan || 0) * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.05"
              value={selectedAsset.pan || 0}
              onChange={(e) => onUpdateAsset(selectedAsset.id, { pan: parseFloat(e.target.value) })}
              className="w-full cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-0.5">
              <span>L 100%</span>
              <span>Center</span>
              <span>R 100%</span>
            </div>
          </div>

          {/* Pitch Shift & Playback Speed */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
            <div className="bg-[#2A2529] p-2 rounded-lg border border-white/10">
              <span className="text-[9px] text-zinc-400 block font-mono">Pitch Shift</span>
              <div className="flex items-center justify-between mt-1">
                <input
                  type="number"
                  min="-12"
                  max="12"
                  value={selectedAsset.pitchShift || 0}
                  onChange={(e) => onUpdateAsset(selectedAsset.id, { pitchShift: parseInt(e.target.value) || 0 })}
                  className="w-14 bg-[#211C1F] border border-white/15 rounded p-0.5 text-xs font-mono text-center text-white"
                />
                <span className="text-[9px] text-zinc-500 font-mono">st</span>
              </div>
            </div>

            <div className="bg-[#2A2529] p-2 rounded-lg border border-white/10">
              <span className="text-[9px] text-zinc-400 block font-mono">Speed Rate</span>
              <div className="flex items-center justify-between mt-1">
                <input
                  type="number"
                  min="0.25"
                  max="3.0"
                  step="0.1"
                  value={selectedAsset.speed || 1.0}
                  onChange={(e) => onUpdateAsset(selectedAsset.id, { speed: parseFloat(e.target.value) || 1.0 })}
                  className="w-14 bg-[#211C1F] border border-white/15 rounded p-0.5 text-xs font-mono text-center text-white"
                />
                <span className="text-[9px] text-zinc-500 font-mono">x</span>
              </div>
            </div>
          </div>

          {/* Start Time & Duration */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#2A2529] p-2 rounded-lg border border-white/10">
              <span className="text-[9px] text-zinc-400 block font-mono">Start (s)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={Math.round((selectedAsset.startTimeSec || 0) * 10) / 10}
                onChange={(e) => onUpdateAsset(selectedAsset.id, { startTimeSec: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-full bg-[#211C1F] border border-white/15 rounded p-1 text-xs font-mono text-center text-white mt-1"
              />
            </div>

            <div className="bg-[#2A2529] p-2 rounded-lg border border-white/10">
              <span className="text-[9px] text-zinc-400 block font-mono">Duration (s)</span>
              <input
                type="number"
                step="0.1"
                min="0.2"
                value={Math.round((selectedAsset.duration || 3.0) * 10) / 10}
                onChange={(e) => onUpdateAsset(selectedAsset.id, { duration: Math.max(0.2, parseFloat(e.target.value) || 1) })}
                className="w-full bg-[#211C1F] border border-white/15 rounded p-1 text-xs font-mono text-center text-white mt-1"
              />
            </div>
          </div>

          {/* Waveform Visualization */}
          <div className="pt-2 border-t border-white/10">
            <span className="text-[9px] font-mono text-zinc-400 block mb-1">Live Waveform Signal</span>
            <div className="w-full h-10 bg-[#151214] rounded-lg border border-white/10 p-1 flex items-center justify-center">
              <AudioWaveform waveformData={selectedAsset.waveformData || []} width={220} height={30} color="#34d399" />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-[#211C1F] rounded-xl border border-white/10 text-center space-y-1">
          <Music className="w-5 h-5 text-zinc-500 mx-auto" />
          <p className="text-xs font-semibold text-zinc-300">No Audio Clip Selected</p>
          <p className="text-[10px] text-zinc-500">Click any clip on the timeline or add an SFX below to tweak sound properties.</p>
        </div>
      )}

      {/* SECTION 2: BUILT-IN SFX & AMBIENCE LIBRARY */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AUDIVGHO Sound FX Library
          </p>
          <span className="text-[9px] font-mono text-zinc-500">{BUILTIN_SFX_PRESETS.length} presets</span>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {BUILTIN_SFX_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="p-2 bg-[#211C1F] hover:bg-[#2A2529] border border-white/10 hover:border-emerald-500/40 rounded-xl transition-all flex items-center justify-between group"
            >
              <div className="truncate pr-2">
                <span className="text-xs font-medium text-white block truncate">{preset.name}</span>
                <span className="text-[9px] font-mono text-emerald-400 block">{preset.category} • {preset.duration}s</span>
              </div>

              <button
                onClick={() => handleAddSynthesizedSFX(preset)}
                className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 shrink-0 cursor-pointer"
                title={`Add ${preset.name} to Timeline at Playhead`}
              >
                <Plus className="w-3 h-3 text-emerald-400" />
                <span>Add</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: MULTI-TRACK AUDIO OVERVIEW */}
      {allAudioClips.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" /> Timeline Audio Stack ({allAudioClips.length})
          </p>
          <div className="space-y-1.5">
            {allAudioClips.map((clip, idx) => (
              <div
                key={clip.id}
                onClick={() => onUpdateAsset && onUpdateAsset(clip.id, {})}
                className={`p-2 rounded-lg border text-xs flex items-center justify-between font-mono cursor-pointer transition-all ${
                  selectedAsset?.id === clip.id
                    ? 'bg-emerald-950/80 border-emerald-500 text-white'
                    : 'bg-[#211C1F] border-white/10 text-zinc-300 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] text-zinc-500 font-bold">#{idx + 1}</span>
                  <span className="truncate font-semibold">{clip.name}</span>
                </div>
                <span className="text-[9px] text-emerald-400 shrink-0">{(clip.startTimeSec || 0).toFixed(1)}s - {((clip.startTimeSec || 0) + (clip.duration || 3.0)).toFixed(1)}s</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Wave Helper for synthetic preview buffers
function audioBufferToWavBlob(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
  function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}
