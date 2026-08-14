import React, { useState } from 'react';
import { 
  User, 
  Layers, 
  Lock, 
  RotateCw, 
  Maximize2, 
  Link2, 
  ShieldAlert, 
  Sparkles, 
  Plus,
  Sliders,
  CheckCircle2,
  Pin,
  Diamond
} from 'lucide-react';
import { MODULAR_BODY_PARTS, clampJointRotation } from '../utils/modularCharacterEngine';

export default function ModularCharacterSidebar({
  selectedAsset,
  onUpdateAsset,
  onAddModularPart,
  playbackProgress = 0,
  totalDuration = 10
}) {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Head & Neck', 'Torso & Pelvis', 'Arms & Hands', 'Legs & Feet'];

  const allParts = Object.values(MODULAR_BODY_PARTS);
  const filteredParts = activeCategory === 'All' 
    ? allParts 
    : allParts.filter((p) => p.category === activeCategory);

  const isModularPartSelected = selectedAsset && (selectedAsset.type === 'modular_body_part' || selectedAsset.partType);
  const selectedPartDef = isModularPartSelected ? MODULAR_BODY_PARTS[selectedAsset.partType] || selectedAsset : null;

  const handleAngleChange = (newAngle) => {
    if (!selectedAsset || !onUpdateAsset) return;
    const clamped = clampJointRotation(selectedAsset.partType, newAngle);
    onUpdateAsset(selectedAsset.id, { rotation: clamped });
  };

  const handleAddKeyframe = () => {
    if (!selectedAsset || !onUpdateAsset) return;
    const currentPlayheadTime = Math.round(((playbackProgress || 0) * (totalDuration || 10)) * 100) / 100;

    const newKeyframe = {
      time: currentPlayheadTime,
      relativeX: Math.round(selectedAsset.relativeX || 0),
      relativeY: Math.round(selectedAsset.relativeY || 0),
      rotation: Math.round(selectedAsset.rotation || 0),
      scaleX: typeof selectedAsset.scaleX === 'number' ? selectedAsset.scaleX : 1.0,
      scaleY: typeof selectedAsset.scaleY === 'number' ? selectedAsset.scaleY : 1.0
    };

    const existingFrames = Array.isArray(selectedAsset.keyframes) ? [...selectedAsset.keyframes] : [];
    const existingIndex = existingFrames.findIndex((k) => Math.abs(k.time - currentPlayheadTime) < 0.05);

    if (existingIndex >= 0) {
      existingFrames[existingIndex] = newKeyframe;
    } else {
      existingFrames.push(newKeyframe);
    }

    existingFrames.sort((a, b) => a.time - b.time);
    onUpdateAsset(selectedAsset.id, { keyframes: existingFrames });
  };

  return (
    <div className="w-full flex flex-col gap-4 p-3 bg-[#1E191C] text-[#F3F0E7] font-sans text-xs select-none">
      {/* HEADER TITLE */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Modular Character Rig</h3>
            <p className="text-[10px] text-zinc-400">Colored Assembly & Smart Joints</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40">
          PRO RIG
        </span>
      </div>

      {/* CATEGORY SELECTOR TABS */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-[#2A2529] text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* VISUAL LIBRARY OF SEPARATE BODY CHUNKS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" /> Modular Part Library
          </span>
          <span className="text-[9px] text-zinc-500 font-mono">{filteredParts.length} Parts</span>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 custom-scrollbar bg-[#211C1F] border border-white/10 rounded-xl">
          {filteredParts.map((part) => (
            <div
              key={part.id}
              draggable={true}
              onDragStart={(e) => {
                const payload = JSON.stringify({ kind: 'modular_part', part });
                e.dataTransfer.setData('application/json', payload);
                e.dataTransfer.setData('text/plain', payload);
              }}
              onClick={() => onAddModularPart && onAddModularPart(part)}
              className="group relative rounded-lg border border-white/10 hover:border-purple-400/60 bg-[#2A2529] p-2 flex flex-col items-center justify-between cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] shadow-sm hover:shadow-purple-500/10"
            >
              {/* Colored SVG Preview Box */}
              <div 
                className="w-full h-16 rounded-md flex items-center justify-center p-1 bg-zinc-950/40 relative overflow-hidden"
              >
                <svg viewBox="0 0 160 190" className="max-h-full max-w-full drop-shadow-md">
                  <path 
                    d={part.svgPath} 
                    fill={part.color} 
                    stroke="#FFFFFF" 
                    strokeWidth="4" 
                    strokeLinejoin="round"
                  />
                </svg>

                {/* Joint Anchor Preview Dot */}
                <div 
                  className="absolute w-2 h-2 rounded-full bg-white border border-purple-600 shadow-sm transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${part.snapJoints[0]?.localX * 100}%`, top: `${part.snapJoints[0]?.localY * 100}%` }}
                />
              </div>

              {/* Part Name & Constraint Badge */}
              <div className="w-full mt-1.5 text-center">
                <span className="text-[10px] font-semibold text-zinc-200 block truncate group-hover:text-purple-300">
                  {part.name}
                </span>
                <span className="text-[8px] font-mono text-zinc-500 block">
                  {part.constraints ? `${part.constraints.minAngle}° to ${part.constraints.maxAngle}°` : 'Unconstrained'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SMART PROPERTIES & ANATOMICAL BRAIN PANEL */}
      {isModularPartSelected && selectedPartDef ? (
        <div className="p-3 bg-[#211C1F] border border-purple-500/40 rounded-xl space-y-3 animate-in fade-in duration-150 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: selectedPartDef.color }}
              />
              <span className="font-bold text-xs text-white truncate">{selectedAsset.name || selectedPartDef.name}</span>
            </div>
            <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-700/50 px-1.5 py-0.5 rounded font-mono">
              ANATOMICAL PART
            </span>
          </div>

          {/* EXPLICIT LOCK TO BASE CHARACTER TOGGLE */}
          <button
            type="button"
            onClick={() => {
              const isCurrentlyLocked = selectedAsset.isLockedToCharacter !== false;
              onUpdateAsset && onUpdateAsset(selectedAsset.id, { isLockedToCharacter: !isCurrentlyLocked });
            }}
            className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all shadow-sm ${
              selectedAsset.isLockedToCharacter !== false
                ? 'bg-purple-900/60 border-purple-400 text-purple-200 hover:bg-purple-800/80'
                : 'bg-[#2A2529] border-white/15 text-zinc-400 hover:text-white hover:border-white/30'
            }`}
          >
            <span className="flex items-center gap-2">
              <Pin className={`w-3.5 h-3.5 ${selectedAsset.isLockedToCharacter !== false ? 'text-purple-300 fill-purple-400' : 'text-zinc-500'}`} />
              <span>Lock to Base Character</span>
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
              selectedAsset.isLockedToCharacter !== false
                ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                : 'bg-zinc-800 text-zinc-400'
            }`}>
              {selectedAsset.isLockedToCharacter !== false ? 'LOCKED' : 'FREE'}
            </span>
          </button>

          {/* PARENT-CHILD ANATOMICAL LINK */}
          <div className="bg-[#2A2529] p-2 rounded-lg border border-white/10 flex items-center justify-between text-[10px]">
            <span className="text-zinc-400 flex items-center gap-1">
              <Link2 className="w-3 h-3 text-indigo-400" /> Parent Hierarchy:
            </span>
            <span className="font-mono text-indigo-300 font-bold uppercase">
              {selectedAsset.parentPartId ? `Linked to ID: ${selectedAsset.parentPartId.slice(0, 8)}` : selectedPartDef.parentPartType || 'Root (Chest)'}
            </span>
          </div>

          {/* ANATOMICAL ANGLE CONSTRAINTS (THE BRAIN) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-300 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" /> Joint Constraint:
              </span>
              <span className="font-mono text-amber-300 text-[9px] bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/40">
                [{selectedPartDef.constraints.minAngle}° , {selectedPartDef.constraints.maxAngle}°]
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#2A2529] p-2 rounded-lg border border-white/10">
              <RotateCw className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <input
                type="range"
                min={selectedPartDef.constraints.minAngle}
                max={selectedPartDef.constraints.maxAngle}
                value={selectedAsset.rotation || 0}
                onChange={(e) => handleAngleChange(parseFloat(e.target.value))}
                className="flex-1 accent-purple-500 cursor-pointer"
              />
              <span className="font-mono text-[10px] text-purple-300 w-10 text-right font-bold">
                {Math.round(selectedAsset.rotation || 0)}°
              </span>
            </div>
          </div>

          {/* SMART SCALE & DIMENSIONS */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#2A2529] p-2 rounded-lg border border-white/10 space-y-1">
              <span className="text-[9px] text-zinc-400 font-mono block">Width (Stretch)</span>
              <input
                type="number"
                value={selectedAsset.width || selectedPartDef.width}
                onChange={(e) => onUpdateAsset && onUpdateAsset(selectedAsset.id, { width: Math.max(10, parseFloat(e.target.value) || 10) })}
                className="w-full bg-[#1E191C] border border-white/15 rounded px-2 py-1 text-[10px] text-white font-mono"
              />
            </div>
            <div className="bg-[#2A2529] p-2 rounded-lg border border-white/10 space-y-1">
              <span className="text-[9px] text-zinc-400 font-mono block">Height (Length)</span>
              <input
                type="number"
                value={selectedAsset.height || selectedPartDef.height}
                onChange={(e) => onUpdateAsset && onUpdateAsset(selectedAsset.id, { height: Math.max(10, parseFloat(e.target.value) || 10) })}
                className="w-full bg-[#1E191C] border border-white/15 rounded px-2 py-1 text-[10px] text-white font-mono"
              />
            </div>
          </div>

          {/* KEYFRAME RECORDING BUTTON & TRACK */}
          <div className="bg-[#2A2529] p-2.5 rounded-lg border border-purple-500/30 space-y-2 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                <Diamond className="w-3.5 h-3.5 fill-purple-400 text-purple-300" /> Keyframe Track
              </span>
              <span className="text-[9.5px] font-mono text-zinc-400">
                {((playbackProgress || 0) * (totalDuration || 10)).toFixed(2)}s
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddKeyframe}
              className="w-full py-1.5 px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-md shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Diamond className="w-3.5 h-3.5 fill-white" />
              <span>Add Keyframe @ {((playbackProgress || 0) * (totalDuration || 10)).toFixed(2)}s</span>
            </button>

            {Array.isArray(selectedAsset.keyframes) && selectedAsset.keyframes.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-white/10">
                <span className="text-[9px] text-zinc-400 font-mono block">Recorded Keyframes ({selectedAsset.keyframes.length}):</span>
                <div className="flex items-center gap-1 overflow-x-auto py-1 custom-scrollbar">
                  {selectedAsset.keyframes.map((kf, idx) => (
                    <span 
                      key={idx}
                      className="text-[9px] font-mono bg-purple-950/80 text-purple-300 border border-purple-700/50 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1"
                    >
                      <Diamond className="w-2.5 h-2.5 fill-purple-400" />
                      {kf.time.toFixed(2)}s ({kf.rotation}°)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SNAPPING STATUS */}
          <div className="flex items-center gap-1.5 text-[9.5px] text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Joint Snapping & Anatomical Hierarchy Active</span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-[#211C1F] border border-white/10 rounded-xl text-center text-xs text-zinc-400 space-y-1">
          <p className="font-semibold text-zinc-300">No Modular Part Selected</p>
          <p className="text-[10px] text-zinc-500">
            Click any body part in the library above to spawn it onto the canvas, or click a placed part to edit its anatomical joint limits.
          </p>
        </div>
      )}
    </div>
  );
}
