import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Layers, 
  RotateCw, 
  Eye, 
  Maximize2, 
  Trash2, 
  Copy, 
  Lock, 
  Unlock, 
  Camera, 
  ArrowUp, 
  ArrowDown, 
  Palette, 
  Type, 
  Video,
  Scissors,
  Zap,
  Sparkles,
  Smartphone,
  Gauge,
  ZoomIn,
  Save,
  Check,
  Plus,
  Music,
  Mic,
  Volume2,
  VolumeX,
  Shapes,
  Wand2,
  Loader2,
  Download,
  PanelRightClose,
  PanelRightOpen,
  Compass,
  Activity,
  TrendingUp,
  Square,
  User
} from 'lucide-react';
import ModularCharacterSidebar from './ModularCharacterSidebar';
import { ANIMATION_PRESETS } from '../utils/kineticTypography';
import { VISUAL_FILTERS } from '../utils/canvasFilters';
import BezierGraphEditor from './BezierGraphEditor';
import { EASING_PRESETS } from '../utils/motionPathEngine';
import { KantoTextInspector } from '../../modules/KantoTextEngine';

function BezierGraphPreview({ points }) {
  const [x1, y1, x2, y2] = points || [0.42, 0, 0.58, 1];
  const px1 = x1 * 100;
  const py1 = (1 - y1) * 100;
  const px2 = x2 * 100;
  const py2 = (1 - y2) * 100;

  return (
    <div className="w-full h-24 bg-[#1E191C] rounded-lg border border-white/10 p-2 flex flex-col justify-between relative select-none">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
        <line x1="0" y1="100" x2={px1} y2={py1} stroke="#a855f7" strokeWidth="1.5" strokeDasharray="2 2" />
        <line x1="100" y1="0" x2={px2} y2={py2} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 2" />
        <path
          d={`M 0,100 C ${px1},${py1} ${px2},${py2} 100,0`}
          fill="none"
          stroke="#F3F0E7"
          strokeWidth="2.5"
        />
        <circle cx={px1} cy={py1} r="4" fill="#a855f7" />
        <circle cx={px2} cy={py2} r="4" fill="#3b82f6" />
      </svg>
      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 mt-1">
        <span>Start</span>
        <span>Speed Curve</span>
        <span>End</span>
      </div>
    </div>
  );
}

export default function RightPanel({
  isOpen,
  onToggleOpen,
  selectedAsset,
  onUpdateAsset,
  onDeleteAsset,
  onDuplicateAsset,
  onReorderZIndex,
  selectedCamera,
  onUpdateCamera,
  selectedShot,
  onUpdateShot,
  onDeleteShot,
  onCaptureShot,
  sceneSettings,
  onUpdateSceneSettings,
  customFonts = [],
  onRemoveBackground,
  isRemovingBg = false,
  onOpenExportModal,
  onAddModularPart,
  playbackProgress = 0,
  totalDuration = 10
}) {
  const [rightPanelTab, setRightPanelTab] = useState('inspector'); // 'inspector' | 'character_assembly'

  if (!isOpen) {
    return (
      <div className="fixed top-3 right-3 z-40 flex items-center gap-2">
        <button
          onClick={onOpenExportModal}
          className="px-3 py-2 bg-[#F3F0E7] hover:bg-white text-[#2A2529] rounded-xl shadow-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          title="Export Video (MP4)"
        >
          <Download className="w-4 h-4 text-[#2A2529]" />
          <span>Export</span>
        </button>
        <button
          onClick={onToggleOpen}
          className="p-2 bg-[#2A2529]/90 hover:bg-[#353034] text-[#F3F0E7] border border-white/15 rounded-xl shadow-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          title="Open Inspector Panel"
        >
          <PanelRightOpen className="w-4 h-4 text-[#F3F0E7]" />
        </button>
      </div>
    );
  }

  // Custom Presets State (Persisted in localStorage)
  const [customPresets, setCustomPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('kanto_custom_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customWidth, setCustomWidth] = useState(sceneSettings?.width || 1080);
  const [customHeight, setCustomHeight] = useState(sceneSettings?.height || 1920);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const standardPresets = [
    { id: 'v_9_16', name: 'Vertical 9:16 (1080 x 1920) - TikTok/Reels/Shorts', w: 1080, h: 1920, aspect: '9:16', camW: 270, camH: 480 },
    { id: 'l_16_9', name: 'Landscape 16:9 (1920 x 1080) - YouTube/Cinematic', w: 1920, h: 1080, aspect: '16:9', camW: 480, camH: 270 },
    { id: 's_1_1', name: 'Square 1:1 (1080 x 1080) - Instagram Post', w: 1080, h: 1080, aspect: '1:1', camW: 360, camH: 360 }
  ];

  const allPresets = [...standardPresets, ...customPresets];
  const currentPresetId = sceneSettings?.formatPreset || (isCustomMode ? 'custom' : 'v_9_16');

  const handleFormatChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomMode(true);
      if (onUpdateSceneSettings) {
        onUpdateSceneSettings({ formatPreset: 'custom' });
      }
      return;
    }

    setIsCustomMode(false);
    const selected = allPresets.find((p) => p.id === val) || standardPresets[0];

    if (onUpdateSceneSettings) {
      onUpdateSceneSettings({
        width: selected.w,
        height: selected.h,
        formatPreset: selected.id
      });
    }

    if (onUpdateCamera) {
      onUpdateCamera({
        aspectRatio: selected.aspect,
        width: selected.camW,
        height: selected.camH
      });
    }
  };

  const handleApplyCustomDimensions = (newW, newH) => {
    const w = Math.max(100, parseInt(newW) || 1080);
    const h = Math.max(100, parseInt(newH) || 1920);
    setCustomWidth(w);
    setCustomHeight(h);

    const ratio = w / h;
    let camW = 270;
    let camH = 480;
    if (ratio >= 1) {
      camW = 480;
      camH = Math.round(480 / ratio);
    } else {
      camH = 480;
      camW = Math.round(480 * ratio);
    }

    if (onUpdateSceneSettings) {
      onUpdateSceneSettings({
        width: w,
        height: h,
        formatPreset: 'custom'
      });
    }

    if (onUpdateCamera) {
      onUpdateCamera({
        aspectRatio: ratio >= 1 ? '16:9' : '9:16',
        width: camW,
        height: camH
      });
    }
  };

  const handleSaveCustomPreset = () => {
    const w = customWidth;
    const h = customHeight;
    const ratio = (w / h).toFixed(2);
    const newPreset = {
      id: `custom_${Date.now()}`,
      name: `Custom (${w} x ${h}) [${ratio}]`,
      w,
      h,
      aspect: `${w}:${h}`,
      camW: w >= h ? 480 : Math.round(480 * (w / h)),
      camH: h > w ? 480 : Math.round(480 * (h / w))
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem('kanto_custom_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setIsCustomMode(false);
    if (onUpdateSceneSettings) {
      onUpdateSceneSettings({
        width: w,
        height: h,
        formatPreset: newPreset.id
      });
    }

    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  return (
    <div className="relative z-30 flex shrink-0 p-2 h-full">
      {/* Slideable Glassmorphic Panel Body */}
      <aside className="w-72 bg-[#2A2529]/95 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col h-full select-none shadow-2xl overflow-hidden transition-all duration-200">
        {/* Panel Header & Mode Switcher */}
        <div className="p-3 border-b border-white/10 flex flex-col gap-2 bg-[#211C1F]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#F3F0E7] uppercase tracking-wider flex items-center gap-1.5">
              {rightPanelTab === 'character_assembly' ? (
                <>
                  <User className="w-3.5 h-3.5 text-purple-400" /> Modular Character
                </>
              ) : (
                <>
                  <Sliders className="w-3.5 h-3.5 text-[#F3F0E7]" /> Inspector
                </>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-400 bg-[#2A2529] px-2 py-0.5 rounded-md border border-white/10">
                {selectedAsset ? (selectedAsset.type === 'modular_body_part' ? 'MODULAR RIG' : selectedAsset.type === 'text' ? 'TEXT' : selectedAsset.type === 'svg' ? 'SVG' : 'ASSET') : selectedShot ? 'SHOT' : 'CAMERA'}
              </span>
              {onToggleOpen && (
                <button
                  onClick={onToggleOpen}
                  className="p-1 hover:bg-white/10 text-zinc-400 hover:text-[#F3F0E7] rounded-lg transition-colors cursor-pointer"
                  title="Hide Inspector Sidebar"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* THREE MAIN MODE TABS: INSPECTOR | TEXT ENGINE | CHARACTER RIG */}
          <div className="flex bg-[#1E191C] p-1 rounded-xl border border-white/10 gap-1">
            <button
              onClick={() => setRightPanelTab('inspector')}
              className={`flex-1 py-1 px-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                rightPanelTab === 'inspector'
                  ? 'bg-[#F3F0E7] text-[#2A2529] font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-[#F3F0E7]'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Inspector</span>
            </button>
            <button
              onClick={() => setRightPanelTab('text_engine')}
              className={`flex-1 py-1 px-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                rightPanelTab === 'text_engine'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-[#F3F0E7]'
              }`}
            >
              <Type className="w-3 h-3" />
              <span>Text Engine</span>
            </button>
            <button
              onClick={() => setRightPanelTab('character_assembly')}
              className={`flex-1 py-1 px-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                rightPanelTab === 'character_assembly'
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'text-purple-300/70 hover:text-purple-200'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Rig</span>
            </button>
          </div>

          {/* EXPORT BUTTON */}
          <button
            onClick={onOpenExportModal}
            className="w-full py-1.5 px-3 bg-[#F3F0E7] hover:bg-white text-[#2A2529] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer mt-0.5"
          >
            <Download className="w-4 h-4 text-[#2A2529]" />
            <span>Export Video (MP4)</span>
          </button>
        </div>

        {rightPanelTab === 'text_engine' ? (
          <div className="flex-1 overflow-hidden h-full flex flex-col bg-[#0c0c0c]">
            <KantoTextInspector />
          </div>
        ) : rightPanelTab === 'character_assembly' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ModularCharacterSidebar
              selectedAsset={selectedAsset}
              onUpdateAsset={onUpdateAsset}
              onAddModularPart={onAddModularPart}
              playbackProgress={playbackProgress}
              totalDuration={totalDuration}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
            {/* TASK 1: WORKSPACE FORMAT (STANDARDIZED & CUSTOM CANVAS TEMPLATES) */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#F3F0E7]" /> Workspace Format
              </p>
              <div className="p-2.5 bg-[#211C1F] rounded-xl border border-white/10 space-y-2.5">
                <label className="text-[10px] text-zinc-400 font-medium block">Standard Aspect Ratio Preset</label>
              <select
                value={isCustomMode ? 'custom' : currentPresetId}
                onChange={handleFormatChange}
                className="w-full bg-[#2A2529] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#F3F0E7] font-medium focus:outline-none focus:border-white/30 cursor-pointer"
              >
                <optgroup label="Standard Templates">
                  {standardPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </optgroup>
                {customPresets.length > 0 && (
                  <optgroup label="Saved Custom Presets">
                    {customPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value="custom">Custom Size...</option>
              </select>

              {/* DYNAMIC CUSTOM SIZE INPUTS */}
              {isCustomMode && (
                <div className="p-2 bg-[#2A2529] rounded-lg border border-white/15 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-zinc-400 font-mono block mb-0.5">Width (px)</span>
                      <input
                        type="number"
                        min="100"
                        max="7680"
                        value={customWidth}
                        onChange={(e) => handleApplyCustomDimensions(e.target.value, customHeight)}
                        className="w-full bg-[#211C1F] border border-white/15 rounded p-1 text-xs font-mono text-[#F3F0E7] text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 font-mono block mb-0.5">Height (px)</span>
                      <input
                        type="number"
                        min="100"
                        max="7680"
                        value={customHeight}
                        onChange={(e) => handleApplyCustomDimensions(customWidth, e.target.value)}
                        className="w-full bg-[#211C1F] border border-white/15 rounded p-1 text-xs font-mono text-[#F3F0E7] text-center"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveCustomPreset}
                    className="w-full bg-[#F3F0E7] text-[#2A2529] hover:bg-white text-xs font-semibold py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    {isSavedNotice ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSavedNotice ? 'Preset Saved!' : 'Save Custom Preset'}</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/5">
                <span>Active Resolution:</span>
                <span className="text-[#F3F0E7]">
                  {sceneSettings?.width || 1080} x {sceneSettings?.height || 1920} PX
                </span>
              </div>
            </div>
          </div>

          {/* CASE 1: ASSET SELECTED */}
          {selectedAsset && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="truncate pr-2">
                  <h3 className="text-xs font-bold text-[#F3F0E7] truncate">{selectedAsset.name}</h3>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase">ID: {selectedAsset.id.slice(0, 10)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateAsset(selectedAsset.id, { isLocked: !selectedAsset.isLocked })}
                    className={`p-1.5 rounded-lg transition-colors ${
                      selectedAsset.isLocked 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                        : 'bg-[#211C1F] text-zinc-400 hover:text-[#F3F0E7] border border-white/10'
                    }`}
                    title={selectedAsset.isLocked ? "Unlock position" : "Lock position"}
                  >
                    {selectedAsset.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onDuplicateAsset(selectedAsset.id)}
                    className="p-1.5 bg-[#211C1F] text-zinc-400 hover:text-[#F3F0E7] border border-white/10 rounded-lg transition-colors"
                    title="Duplicate asset"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteAsset(selectedAsset.id)}
                    className="p-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 rounded-lg transition-colors"
                    title="Delete asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* TASK 4: AUDIO PROPERTIES INSPECTOR (VOLUME, MUTE, TIMING) */}
              {selectedAsset.type === 'audio' && (
                <div className="space-y-3 p-2.5 bg-[#211C1F] rounded-xl border border-emerald-500/40 shadow-lg">
                  <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-emerald-400" /> Audio Track Properties
                  </p>
                  
                  {/* Volume Slider (0% to 200%) */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">Volume</span>
                      <span className="font-mono text-emerald-300">
                        {Math.round((selectedAsset.volume !== undefined ? selectedAsset.volume : 1.0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="2.0"
                      step="0.05"
                      value={selectedAsset.volume !== undefined ? selectedAsset.volume : 1.0}
                      onChange={(e) => onUpdateAsset(selectedAsset.id, { volume: parseFloat(e.target.value) })}
                      className="w-full cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Mute Toggle */}
                  <button
                    onClick={() => onUpdateAsset(selectedAsset.id, { isMuted: !selectedAsset.isMuted })}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      selectedAsset.isMuted
                        ? 'bg-rose-950/60 text-rose-300 border-rose-700/50'
                        : 'bg-[#2A2529] text-emerald-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {selectedAsset.isMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Muted</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Active (Unmuted)</span>
                      </>
                    )}
                  </button>

                  {/* Timing Controls */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Start Time (sec)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={selectedAsset.startTimeSec !== undefined ? selectedAsset.startTimeSec : 0}
                        onChange={(e) => onUpdateAsset(selectedAsset.id, { startTimeSec: Math.max(0, parseFloat(e.target.value) || 0) })}
                        className="w-full bg-[#2A2529] border border-white/15 rounded-lg p-1 text-xs font-mono text-[#F3F0E7] text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Duration (sec)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.2"
                        value={selectedAsset.duration || 3.0}
                        onChange={(e) => onUpdateAsset(selectedAsset.id, { duration: Math.max(0.2, parseFloat(e.target.value) || 1.0) })}
                        className="w-full bg-[#2A2529] border border-white/15 rounded-lg p-1 text-xs font-mono text-[#F3F0E7] text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TEXT ENGINE & TYPOGRAPHY PROPERTIES PANEL */}
              {selectedAsset.type === 'text' && (
                <div className="space-y-3 p-3 bg-[#211C1F] rounded-xl border border-white/10 shadow-lg">
                  {/* Header & Reset Button */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-purple-400" /> Text & Typography Engine
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateAsset(selectedAsset.id, {
                          strokeWidth: 0,
                          strokeColor: '#000000',
                          shadowOffsetX: 0,
                          shadowOffsetY: 0,
                          shadowBlur: 0,
                          shadowColor: 'transparent',
                          neonIntensity: 0,
                          neonColor: '#ffffff',
                          shineSpeed: 0,
                          shineAngle: 45,
                          shineIntensity: 0.8
                        });
                      }}
                      className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-[10px] font-semibold transition-all cursor-pointer"
                    >
                      Clear All Effects
                    </button>
                  </div>

                  {/* A. Core Basics */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">A. Core Basics</p>

                    {/* 1. textValue */}
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Text Value</label>
                      <textarea
                        value={selectedAsset.textValue || selectedAsset.textContent || selectedAsset.text || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdateAsset(selectedAsset.id, { textValue: val, textContent: val, text: val });
                        }}
                        className="w-full bg-[#2A2529] border border-white/15 rounded-lg p-2 text-xs text-[#F3F0E7] focus:outline-none focus:border-white/30 resize-none font-sans"
                        rows={2}
                      />
                    </div>

                    {/* 2. fontSize & 3. fillColor */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Font Size</span>
                          <span className="font-mono text-white">{selectedAsset.fontSize || 48}px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="300"
                          value={selectedAsset.fontSize || 48}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { fontSize: parseInt(e.target.value) || 10 })}
                          className="w-full cursor-pointer accent-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Fill Color</label>
                        <input
                          type="color"
                          value={selectedAsset.fillColor || selectedAsset.textColor || selectedAsset.color || '#ffffff'}
                          onChange={(e) => {
                            const c = e.target.value;
                            onUpdateAsset(selectedAsset.id, { fillColor: c, textColor: c, color: c });
                          }}
                          className="w-full h-7 bg-[#2A2529] border border-white/15 rounded-lg cursor-pointer p-0.5"
                        />
                      </div>
                    </div>

                    {/* 4. opacity */}
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Opacity</span>
                        <span className="font-mono text-white">
                          {Math.round((selectedAsset.opacity !== undefined ? selectedAsset.opacity : 1.0) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.01"
                        value={selectedAsset.opacity !== undefined ? selectedAsset.opacity : 1.0}
                        onChange={(e) => onUpdateAsset(selectedAsset.id, { opacity: parseFloat(e.target.value) })}
                        className="w-full cursor-pointer accent-purple-500"
                      />
                    </div>

                    {/* 5. letterSpacing & 6. lineHeight */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Letter Spacing</span>
                          <span className="font-mono text-white">{selectedAsset.letterSpacing || 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-10"
                          max="100"
                          value={selectedAsset.letterSpacing || 0}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { letterSpacing: parseInt(e.target.value) || 0 })}
                          className="w-full cursor-pointer accent-purple-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Line Height</span>
                          <span className="font-mono text-white">{(selectedAsset.lineHeight || 1.2).toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="3.0"
                          step="0.1"
                          value={selectedAsset.lineHeight || 1.2}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { lineHeight: parseFloat(e.target.value) })}
                          className="w-full cursor-pointer accent-purple-500"
                        />
                      </div>
                    </div>

                    {/* 7. textAlign */}
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Text Align</label>
                      <div className="grid grid-cols-3 gap-1 bg-[#2A2529] p-1 rounded-lg border border-white/10">
                        {['left', 'center', 'right'].map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => onUpdateAsset(selectedAsset.id, { textAlign: align })}
                            className={`py-1 rounded text-[10px] font-mono font-bold capitalize transition-all cursor-pointer ${
                              (selectedAsset.textAlign || 'center') === align
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* B. Stroke & Shadow */}
                  <div className="space-y-2.5 pt-2 border-t border-white/10">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">B. Stroke & Shadow</p>

                    {/* 8. strokeWidth & strokeColor */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Stroke Width</span>
                          <span className="font-mono text-white">{selectedAsset.strokeWidth || 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={selectedAsset.strokeWidth || 0}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { strokeWidth: parseInt(e.target.value) || 0 })}
                          className="w-full cursor-pointer accent-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Stroke Color</label>
                        <input
                          type="color"
                          value={selectedAsset.strokeColor || '#000000'}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { strokeColor: e.target.value })}
                          className="w-full h-7 bg-[#2A2529] border border-white/15 rounded-lg cursor-pointer p-0.5"
                        />
                      </div>
                    </div>

                    {/* 9. shadowOffsetX & shadowOffsetY */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Shadow Offset X</span>
                          <span className="font-mono text-white">{selectedAsset.shadowOffsetX || 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={selectedAsset.shadowOffsetX || 0}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { shadowOffsetX: parseInt(e.target.value) || 0 })}
                          className="w-full cursor-pointer accent-purple-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Shadow Offset Y</span>
                          <span className="font-mono text-white">{selectedAsset.shadowOffsetY || 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={selectedAsset.shadowOffsetY || 0}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { shadowOffsetY: parseInt(e.target.value) || 0 })}
                          className="w-full cursor-pointer accent-purple-500"
                        />
                      </div>
                    </div>

                    {/* 10. shadowBlur & shadowColor */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Shadow Blur</span>
                          <span className="font-mono text-white">{selectedAsset.shadowBlur || 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={selectedAsset.shadowBlur || 0}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { shadowBlur: parseInt(e.target.value) || 0 })}
                          className="w-full cursor-pointer accent-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Shadow Color</label>
                        <input
                          type="color"
                          value={selectedAsset.shadowColor && selectedAsset.shadowColor !== 'transparent' ? selectedAsset.shadowColor : '#000000'}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { shadowColor: e.target.value })}
                          className="w-full h-7 bg-[#2A2529] border border-white/15 rounded-lg cursor-pointer p-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* C. Neon Glow */}
                  <div className="space-y-2.5 pt-2 border-t border-white/10">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">C. Neon Glow</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Neon Intensity</span>
                          <span className="font-mono text-white">{selectedAsset.neonIntensity || 0}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedAsset.neonIntensity || 0}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { neonIntensity: parseInt(e.target.value) || 0 })}
                          className="w-full cursor-pointer accent-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Neon Color</label>
                        <input
                          type="color"
                          value={selectedAsset.neonColor || '#ffffff'}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { neonColor: e.target.value })}
                          className="w-full h-7 bg-[#2A2529] border border-white/15 rounded-lg cursor-pointer p-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* D. Animated Shine (Light Sweep) */}
                  <div className="space-y-2.5 pt-2 border-t border-white/10">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">D. Animated Shine (Light Sweep)</p>
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Shine Speed (0 = off)</span>
                        <span className="font-mono text-white">{selectedAsset.shineSpeed || 0}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={selectedAsset.shineSpeed || 0}
                        onChange={(e) => onUpdateAsset(selectedAsset.id, { shineSpeed: parseInt(e.target.value) || 0 })}
                        className="w-full cursor-pointer accent-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Shine Angle</span>
                          <span className="font-mono text-white">{selectedAsset.shineAngle !== undefined ? selectedAsset.shineAngle : 45}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={selectedAsset.shineAngle !== undefined ? selectedAsset.shineAngle : 45}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { shineAngle: parseInt(e.target.value) || 0 })}
                          className="w-full cursor-pointer accent-purple-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Shine Intensity</span>
                          <span className="font-mono text-white">
                            {Math.round((selectedAsset.shineIntensity !== undefined ? selectedAsset.shineIntensity : 0.8) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.05"
                          value={selectedAsset.shineIntensity !== undefined ? selectedAsset.shineIntensity : 0.8}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { shineIntensity: parseFloat(e.target.value) })}
                          className="w-full cursor-pointer accent-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VISUAL FILTERS & EFFECTS (FOR VIDEOS, IMAGES & STOCK BACKGROUNDS) */}
              {(selectedAsset.type === 'video' || selectedAsset.type === 'image' || selectedAsset.type === 'background' || selectedAsset.url || selectedAsset.src) && (
                <div className="space-y-3 p-2.5 bg-[#211C1F] rounded-xl border border-white/10">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#F3F0E7]" /> Visual Filters & Effects
                  </p>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Color Grade / Filter Style</label>
                    <select
                      value={selectedAsset.filterStyle || 'none'}
                      onChange={(e) => onUpdateAsset(selectedAsset.id, { filterStyle: e.target.value })}
                      className="w-full bg-[#2A2529] border border-white/15 rounded-lg p-1.5 text-xs text-[#F3F0E7] focus:outline-none focus:border-white/30 cursor-pointer font-medium"
                    >
                      {VISUAL_FILTERS.map((filter) => (
                        <option key={filter.id} value={filter.id}>
                          {filter.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* AI BACKGROUND REMOVAL (TASK 4 - remove.bg REST API) */}
              {(selectedAsset.type === 'image' || selectedAsset.type === 'character' || (selectedAsset.url && !selectedAsset.url.match(/\.(mp4|webm)$/i))) && (
                <div className="space-y-2 p-2.5 bg-[#211C1F] rounded-xl border border-white/10">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Magic Tools
                  </p>
                  <button
                    onClick={() => onRemoveBackground && onRemoveBackground(selectedAsset.id)}
                    disabled={isRemovingBg}
                    className="w-full py-2 px-3 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 disabled:opacity-50 text-purple-100 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-purple-500/40 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    {isRemovingBg ? (
                      <>
                        <Loader2 className="w-4 h-4 text-purple-300 animate-spin" />
                        <span>Removing Background...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 text-purple-300" />
                        <span>Remove Background (AI)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STRICTLY ISOLATED MOTION PATH ENGINE KEYED BY SELECTED ASSET ID */}
              {selectedAsset && selectedAsset.type !== 'audio' && (
                <div key={`motion-path-panel-${selectedAsset.id}`} className="space-y-3 p-2.5 bg-[#211C1F] rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-blue-400" /> Motion Path Engine
                    </p>
                    {selectedAsset.motionPath?.isPathEnabled && (
                      <button
                        onClick={() => {
                          onUpdateAsset(selectedAsset.id, {
                            motionPath: {
                              ...selectedAsset.motionPath,
                              isPathEnabled: false
                            }
                          });
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2A2529] text-rose-400 border border-rose-500/30 hover:bg-rose-950/40 cursor-pointer transition-all"
                      >
                        Disable Path
                      </button>
                    )}
                  </div>

                  {!selectedAsset.motionPath?.isPathEnabled ? (
                    <div className="flex flex-col items-center justify-center p-4 bg-[#1B1618] border border-dashed border-white/15 rounded-xl space-y-2 text-center">
                      <Compass className="w-6 h-6 text-purple-400 opacity-80" />
                      <p className="text-xs text-zinc-300 font-semibold">No Motion Path for {selectedAsset.name || 'Element'}</p>
                      <p className="text-[10px] text-zinc-500 max-w-[200px]">Add a custom animation spline path with stop stations and per-segment bezier easing.</p>
                      <button
                        onClick={() => {
                          const startX = typeof selectedAsset.x === 'number' && Number.isFinite(selectedAsset.x) ? selectedAsset.x : 1400;
                          const startY = typeof selectedAsset.y === 'number' && Number.isFinite(selectedAsset.y) ? selectedAsset.y : 1000;
                          const halfW = (typeof selectedAsset.width === 'number' && selectedAsset.width > 0 ? selectedAsset.width : 300) / 2;
                          const halfH = (typeof selectedAsset.height === 'number' && selectedAsset.height > 0 ? selectedAsset.height : 100) / 2;
                          const centerX = startX + halfW;
                          const centerY = startY + halfH;

                          onUpdateAsset(selectedAsset.id, {
                            motionPath: {
                              isPathEnabled: true,
                              pathNodes: [
                                { x: centerX, y: centerY, isStopNode: false, freezeDurationSec: 0 },
                                { x: centerX + 300, y: centerY + 150, isStopNode: false, freezeDurationSec: 0 }
                              ],
                              selectedSegmentIndex: 0,
                              segmentEasings: [{ easingPreset: 'linear', customBezier: [1, 0, 0, 0.97] }],
                              segmentDurations: []
                            }
                          });
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Path</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      {/* TASK 1 & 2: SEGMENT SELECTOR AND PER-SEGMENT EASING BINDING */}
                      {(() => {
                        const nodes = selectedAsset.motionPath.pathNodes || [];
                        const numSegments = Math.max(1, nodes.length - 1);
                        const selectedSegIdx = Math.min(numSegments - 1, selectedAsset.motionPath.selectedSegmentIndex || 0);

                        const segmentEasings = selectedAsset.motionPath.segmentEasings || [];
                        const currentSegEasing = segmentEasings[selectedSegIdx] || {
                          easingPreset: selectedAsset.motionPath.easingPreset || 'linear',
                          customBezier: selectedAsset.motionPath.customBezier || [1, 0, 0, 0.97]
                        };

                        const updateSegEasing = (partial) => {
                          const nextEasings = [...segmentEasings];
                          while (nextEasings.length < numSegments) {
                            nextEasings.push({
                              easingPreset: 'linear',
                              customBezier: [1, 0, 0, 0.97]
                            });
                          }
                          nextEasings[selectedSegIdx] = { ...nextEasings[selectedSegIdx], ...partial };

                          onUpdateAsset(selectedAsset.id, {
                            motionPath: {
                              ...selectedAsset.motionPath,
                              segmentEasings: nextEasings
                            }
                          });
                        };

                        const segmentDurations = selectedAsset.motionPath.segmentDurations || [];
                        const defaultSegDuration = (selectedAsset.duration || 5.0) / numSegments;
                        const totalMoveDuration = segmentDurations.length === numSegments
                          ? segmentDurations.reduce((a, b) => a + b, 0)
                          : (selectedAsset.duration || 5.0);

                        return (
                          <div className="space-y-2">
                            {/* INDEPENDENT SEGMENT DURATION CONTROLS */}
                            <div className="p-2 bg-[#1B1618] border border-white/10 rounded-lg space-y-2 text-xs">
                              <div className="flex items-center justify-between font-mono text-[10px]">
                                <span className="text-purple-300 font-bold uppercase tracking-wider">Segment Durations:</span>
                                <span className="text-zinc-400 font-semibold">Total Move: {totalMoveDuration.toFixed(1)}s</span>
                              </div>

                              <div className="space-y-1.5 font-mono text-[10px]">
                                {Array.from({ length: numSegments }).map((_, segIdx) => {
                                  const currentDur = segmentDurations[segIdx] !== undefined ? segmentDurations[segIdx] : parseFloat(defaultSegDuration.toFixed(1));

                                  return (
                                    <div key={`seg-dur-${segIdx}`} className="flex items-center justify-between bg-[#2A2529] px-2 py-1 rounded border border-white/5">
                                      <span className="text-zinc-300 font-bold">Segment #{segIdx + 1} (Node {segIdx + 1} → {segIdx + 2}):</span>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0.1"
                                          max="60.0"
                                          value={currentDur}
                                          onChange={(e) => {
                                            const val = Math.max(0.1, parseFloat(e.target.value) || 1.0);
                                            const nextDurs = [...segmentDurations];
                                            while (nextDurs.length < numSegments) {
                                              nextDurs.push(parseFloat(defaultSegDuration.toFixed(1)));
                                            }
                                            nextDurs[segIdx] = val;
                                            const sumDurations = nextDurs.reduce((a, b) => a + b, 0);

                                            onUpdateAsset(selectedAsset.id, {
                                              duration: sumDurations,
                                              animationDuration: sumDurations,
                                              motionPath: {
                                                ...selectedAsset.motionPath,
                                                segmentDurations: nextDurs
                                              }
                                            });
                                          }}
                                          className="w-14 bg-[#1F191B] border border-purple-500/40 rounded px-1.5 py-0.5 text-purple-200 text-center font-bold focus:outline-none focus:border-purple-400"
                                        />
                                        <span className="text-purple-300 font-bold">s</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-[#1B1618] border border-white/10 rounded-lg text-[10px] font-mono">
                              <span className="text-zinc-400 font-bold uppercase tracking-wider">Active Segment:</span>
                              <select
                                value={selectedSegIdx}
                                onChange={(e) => {
                                  onUpdateAsset(selectedAsset.id, {
                                    motionPath: {
                                      ...selectedAsset.motionPath,
                                      selectedSegmentIndex: parseInt(e.target.value, 10)
                                    }
                                  });
                                }}
                                className="bg-[#2A2529] border border-white/15 text-purple-300 font-bold rounded px-2 py-0.5 focus:outline-none cursor-pointer"
                              >
                                {Array.from({ length: numSegments }).map((_, idx) => (
                                  <option key={idx} value={idx}>
                                    Segment #{idx + 1} (Node {idx + 1} → {idx + 2})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <BezierGraphEditor
                              easingPreset={currentSegEasing.easingPreset || 'linear'}
                              customBezier={currentSegEasing.customBezier || [1, 0, 0, 0.97]}
                              onPresetChange={(newPreset) => updateSegEasing({ easingPreset: newPreset })}
                              onBezierChange={(newBezier) => updateSegEasing({ easingPreset: 'custom', customBezier: newBezier })}
                            />
                          </div>
                        );
                      })()}

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[10px] font-mono text-zinc-400">Path Nodes ({selectedAsset.motionPath.pathNodes?.length || 0})</span>
                        <button
                          onClick={() => {
                            const nodes = selectedAsset.motionPath.pathNodes || [];
                            const lastNode = nodes[nodes.length - 1] || { x: selectedAsset.x || 1400, y: selectedAsset.y || 1000 };
                            const newNode = { x: (lastNode.x || 1400) + 200, y: (lastNode.y || 1000) + 100 };
                            onUpdateAsset(selectedAsset.id, {
                              motionPath: {
                                ...selectedAsset.motionPath,
                                pathNodes: [...nodes, newNode]
                              }
                            });
                          }}
                          className="px-2 py-0.5 bg-blue-900/60 hover:bg-blue-800 border border-blue-500/40 text-blue-200 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Node</span>
                        </button>
                      </div>

                      {(selectedAsset.motionPath.pathNodes || []).map((node, nodeIdx) => (
                        <div key={`node-${nodeIdx}`} className="p-2 bg-[#2A2529] rounded-lg border border-white/10 space-y-1.5 text-xs">
                          {/* Top Row: Node Header, STOP Toggle & Delete Button */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-mono text-zinc-300 font-bold">Node #{nodeIdx + 1}</span>
                              <button
                                onClick={() => {
                                  const updated = selectedAsset.motionPath.pathNodes.map((n, idx) =>
                                    idx === nodeIdx
                                      ? { ...n, isStopNode: !n.isStopNode, freezeDurationSec: !n.isStopNode ? (n.freezeDurationSec || 1.0) : 0 }
                                      : n
                                  );
                                  onUpdateAsset(selectedAsset.id, {
                                    motionPath: { ...selectedAsset.motionPath, pathNodes: updated }
                                  });
                                }}
                                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer border ${
                                  node.isStopNode
                                    ? 'bg-amber-600 text-white border-amber-400 shadow-xs font-bold'
                                    : 'bg-[#211C1F] text-zinc-400 border-white/10 hover:text-white'
                                }`}
                                title={node.isStopNode ? "Designated Stop Station (Pause Point)" : "Toggle as Stop Station"}
                              >
                                {node.isStopNode ? 'STOP ON' : 'STOP OFF'}
                              </button>
                            </div>

                            {/* Delete Node Button */}
                            {(selectedAsset.motionPath.pathNodes || []).length > 1 && (
                              <button
                                onClick={() => {
                                  const updated = selectedAsset.motionPath.pathNodes.filter((_, idx) => idx !== nodeIdx);
                                  onUpdateAsset(selectedAsset.id, {
                                    motionPath: { ...selectedAsset.motionPath, pathNodes: updated }
                                  });
                                }}
                                className="text-zinc-500 hover:text-rose-400 p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Controls Row: X, Y Coordinates and Pause Duration (X.Xs) when Stop Station is ON */}
                          <div className="flex items-center justify-between gap-2 font-mono text-[10px] pt-0.5">
                            {/* X & Y Coords */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-zinc-500">X:</span>
                              <input
                                type="number"
                                value={Math.round(node.x || 0)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const updated = selectedAsset.motionPath.pathNodes.map((n, idx) =>
                                    idx === nodeIdx ? { ...n, x: val } : n
                                  );
                                  onUpdateAsset(selectedAsset.id, {
                                    motionPath: { ...selectedAsset.motionPath, pathNodes: updated }
                                  });
                                }}
                                className="w-12 bg-[#211C1F] border border-white/15 rounded px-1 py-0.5 text-[#F3F0E7] focus:outline-none focus:border-blue-500"
                              />
                              <span className="text-zinc-500">Y:</span>
                              <input
                                type="number"
                                value={Math.round(node.y || 0)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const updated = selectedAsset.motionPath.pathNodes.map((n, idx) =>
                                    idx === nodeIdx ? { ...n, y: val } : n
                                  );
                                  onUpdateAsset(selectedAsset.id, {
                                    motionPath: { ...selectedAsset.motionPath, pathNodes: updated }
                                  });
                                }}
                                className="w-12 bg-[#211C1F] border border-white/15 rounded px-1 py-0.5 text-[#F3F0E7] focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            {/* Pause Duration (X.Xs) when Stop Station is ACTIVE */}
                            {node.isStopNode && (
                              <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded text-amber-300">
                                <span className="text-[9px] font-semibold text-amber-400">Pause:</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0.1"
                                  max="10.0"
                                  value={node.freezeDurationSec !== undefined ? node.freezeDurationSec : 1.0}
                                  onChange={(e) => {
                                    const val = Math.max(0.1, parseFloat(e.target.value) || 1.0);
                                    const updated = selectedAsset.motionPath.pathNodes.map((n, idx) =>
                                      idx === nodeIdx ? { ...n, freezeDurationSec: val } : n
                                    );
                                    onUpdateAsset(selectedAsset.id, {
                                      motionPath: { ...selectedAsset.motionPath, pathNodes: updated }
                                    });
                                  }}
                                  className="w-11 bg-[#1A1416] border border-amber-500/40 rounded px-1 py-0.2 text-amber-200 text-center font-bold"
                                />
                                <span className="text-[9px] text-amber-400 font-bold">s</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SHAPE PROPERTIES PANEL (FILL COLOR, TOGGLE BORDER, BORDER COLOR & WIDTH) */}
              {(selectedAsset.type === 'svg' || selectedAsset.svgCategory === 'shape') && (
                <div className="space-y-3 p-2.5 bg-[#211C1F] rounded-xl border border-white/10">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shapes className="w-3.5 h-3.5 text-[#F3F0E7]" /> Shape Properties & Border
                  </p>

                  {/* Fill Color */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Fill Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedAsset.color || '#3b82f6'}
                        onChange={(e) => onUpdateAsset(selectedAsset.id, { color: e.target.value })}
                        className="w-8 h-8 bg-[#2A2529] border border-white/15 rounded-lg cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={selectedAsset.color || '#3b82f6'}
                        onChange={(e) => onUpdateAsset(selectedAsset.id, { color: e.target.value })}
                        className="flex-1 bg-[#2A2529] border border-white/15 rounded-lg px-2 py-1 text-xs font-mono text-[#F3F0E7]"
                      />
                    </div>
                  </div>

                  {/* Toggle Border ON/OFF */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-zinc-400 font-medium">Border Outline</span>
                    <button
                      onClick={() => onUpdateAsset(selectedAsset.id, { hasBorder: !selectedAsset.hasBorder })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        selectedAsset.hasBorder 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-[#2A2529] text-zinc-400 border border-white/10'
                      }`}
                    >
                      {selectedAsset.hasBorder ? 'BORDER ON' : 'BORDER OFF'}
                    </button>
                  </div>

                  {/* Border Color & Width (When Border is ON) */}
                  {selectedAsset.hasBorder && (
                    <div className="space-y-2 pt-1 border-t border-white/10">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Border Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedAsset.borderColor || '#ffffff'}
                            onChange={(e) => onUpdateAsset(selectedAsset.id, { borderColor: e.target.value })}
                            className="w-8 h-8 bg-[#2A2529] border border-white/15 rounded-lg cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={selectedAsset.borderColor || '#ffffff'}
                            onChange={(e) => onUpdateAsset(selectedAsset.id, { borderColor: e.target.value })}
                            className="flex-1 bg-[#2A2529] border border-white/15 rounded-lg px-2 py-1 text-xs font-mono text-[#F3F0E7]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">Border Width</span>
                          <span className="font-mono text-[#F3F0E7]">{selectedAsset.borderWidth || 3}px</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="1"
                          value={selectedAsset.borderWidth !== undefined ? selectedAsset.borderWidth : 3}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { borderWidth: parseInt(e.target.value) })}
                          className="w-full cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Position, Dimensions & Layer Z-Index (ONLY FOR VISUAL ASSETS, NOT AUDIO) */}
              {selectedAsset.type !== 'audio' && selectedAsset.category !== 'Audio' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Transform & Layout</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#211C1F] p-2 rounded-xl border border-white/10">
                        <span className="text-[10px] text-zinc-400 block">X Pos</span>
                        <input
                          type="number"
                          value={Math.round(selectedAsset.x || 0)}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { x: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#2A2529] border border-white/15 rounded-lg p-1 text-xs font-mono text-[#F3F0E7] text-center"
                        />
                      </div>
                      <div className="bg-[#211C1F] p-2 rounded-xl border border-white/10">
                        <span className="text-[10px] text-zinc-400 block">Y Pos</span>
                        <input
                          type="number"
                          value={Math.round(selectedAsset.y || 0)}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { y: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#2A2529] border border-white/15 rounded-lg p-1 text-xs font-mono text-[#F3F0E7] text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#211C1F] p-2 rounded-xl border border-white/10">
                        <span className="text-[10px] text-zinc-400 block">Width</span>
                        <input
                          type="number"
                          value={Math.round(selectedAsset.width || 300)}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { width: parseFloat(e.target.value) || 100 })}
                          className="w-full bg-[#2A2529] border border-white/15 rounded-lg p-1 text-xs font-mono text-[#F3F0E7] text-center"
                        />
                      </div>
                      <div className="bg-[#211C1F] p-2 rounded-xl border border-white/10">
                        <span className="text-[10px] text-zinc-400 block">Height</span>
                        <input
                          type="number"
                          value={Math.round(selectedAsset.height || 300)}
                          onChange={(e) => onUpdateAsset(selectedAsset.id, { height: parseFloat(e.target.value) || 100 })}
                          className="w-full bg-[#2A2529] border border-white/15 rounded-lg p-1 text-xs font-mono text-[#F3F0E7] text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scale & Opacity */}
                  <div className="space-y-3 p-2.5 bg-[#211C1F] rounded-xl border border-white/10">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Scale</span>
                        <span className="font-mono text-[#F3F0E7]">{(selectedAsset.scale || 1.0).toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="4.0"
                        step="0.05"
                        value={selectedAsset.scale || 1.0}
                        onChange={(e) => onUpdateAsset(selectedAsset.id, { scale: parseFloat(e.target.value) })}
                        className="w-full cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Opacity</span>
                        <span className="font-mono text-[#F3F0E7]">{Math.round((selectedAsset.opacity || 1.0) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={selectedAsset.opacity !== undefined ? selectedAsset.opacity : 1.0}
                        onChange={(e) => onUpdateAsset(selectedAsset.id, { opacity: parseFloat(e.target.value) })}
                        className="w-full cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Rotation</span>
                        <span className="font-mono text-[#F3F0E7]">{Math.round(selectedAsset.rotation || 0)}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={selectedAsset.rotation || 0}
                        onChange={(e) => onUpdateAsset(selectedAsset.id, { rotation: parseInt(e.target.value) })}
                        className="w-full cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Layer Z-Index Order */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Layer Depth (Z-Index)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onReorderZIndex(selectedAsset.id, 'up')}
                        className="text-xs bg-[#211C1F] hover:bg-[#353034] text-zinc-200 border border-white/10 p-1.5 rounded-lg flex items-center justify-center gap-1"
                      >
                        <ArrowUp className="w-3 h-3" /> Layer Up
                      </button>
                      <button
                        onClick={() => onReorderZIndex(selectedAsset.id, 'down')}
                        className="text-xs bg-[#211C1F] hover:bg-[#353034] text-zinc-200 border border-white/10 p-1.5 rounded-lg flex items-center justify-center gap-1"
                      >
                        <ArrowDown className="w-3 h-3" /> Layer Down
                      </button>
                      <button
                        onClick={() => onReorderZIndex(selectedAsset.id, 'front')}
                        className="text-xs bg-[#211C1F] hover:bg-[#353034] text-zinc-200 border border-white/10 p-1.5 rounded-lg flex items-center justify-center gap-1"
                      >
                        <ArrowUp className="w-3 h-3 text-[#F3F0E7]" /> Bring Front
                      </button>
                      <button
                        onClick={() => onReorderZIndex(selectedAsset.id, 'back')}
                        className="text-xs bg-[#211C1F] hover:bg-[#353034] text-zinc-200 border border-white/10 p-1.5 rounded-lg flex items-center justify-center gap-1"
                      >
                        <ArrowDown className="w-3 h-3 text-[#F3F0E7]" /> Send Back
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TASK 2: FAST CUT TRANSITION SPEED (0.1s MINIMUM) & CAMERA SIZE */}
          {(selectedShot || (!selectedAsset && selectedCamera)) && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="p-3 bg-[#211C1F] rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#F3F0E7]" />
                    <span className="text-xs font-bold text-[#F3F0E7]">
                      {selectedShot ? `Shot #${selectedShot.name || 'Keyframe'}` : 'Live Camera Viewfinder'}
                    </span>
                  </div>
                  {selectedShot && (
                    <button
                      onClick={() => onDeleteShot && onDeleteShot(selectedShot.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded transition-colors"
                      title="Delete keyframe shot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Configure transition speed, camera zoom scale, and easing dynamics for this keyframe shot.
                </p>
              </div>

              {/* Fast Cut Transition Speed (0.1s Minimum) */}
              <div className="space-y-2 bg-[#211C1F] p-3 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-[#F3F0E7]" /> Transition Speed (Duration)
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.1"
                      max="10.0"
                      step="0.1"
                      value={selectedShot ? selectedShot.duration : 2.0}
                      onChange={(e) => {
                        const val = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                        if (selectedShot && onUpdateShot) {
                          onUpdateShot(selectedShot.id, { duration: Math.round(val * 10) / 10 });
                        }
                      }}
                      className="w-14 bg-[#2A2529] border border-white/15 rounded p-0.5 text-xs font-mono text-[#F3F0E7] text-center focus:outline-none"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono">s</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.1"
                  value={selectedShot ? selectedShot.duration : 2.0}
                  onChange={(e) => {
                    const val = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                    if (selectedShot && onUpdateShot) {
                      onUpdateShot(selectedShot.id, { duration: Math.round(val * 10) / 10 });
                    }
                  }}
                  className="w-full cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                  <span className="text-emerald-400 font-semibold">Fast Cut (0.1s)</span>
                  <span>Normal (2.0s)</span>
                  <span>Slow (10.0s)</span>
                </div>
              </div>

              {/* Camera Size / Zoom Level */}
              <div className="space-y-2 bg-[#211C1F] p-3 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-[#F3F0E7]" /> Camera Zoom / Size
                  </span>
                  <span className="font-mono text-xs text-[#F3F0E7] bg-[#2A2529] px-2 py-0.5 rounded border border-white/10">
                    {Math.round((selectedShot ? (selectedShot.scale || 1.0) : (selectedCamera?.scale || 1.0)) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={selectedShot ? (selectedShot.scale || 1.0) : (selectedCamera?.scale || 1.0)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (selectedShot && onUpdateShot) {
                      onUpdateShot(selectedShot.id, { scale: val });
                    } else if (onUpdateCamera) {
                      onUpdateCamera({ scale: val });
                    }
                  }}
                  className="w-full cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                  <span>50% (Wide)</span>
                  <span>100% (Standard)</span>
                  <span>300% (Close)</span>
                </div>
              </div>

              {/* Motion Easing Type Dropdown */}
              <div className="space-y-2 bg-[#211C1F] p-3 rounded-xl border border-white/10">
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Easing & Motion Dynamics</label>
                <select
                  value={selectedShot ? (selectedShot.transitionType || 'smooth') : 'smooth'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (selectedShot && onUpdateShot) {
                      onUpdateShot(selectedShot.id, { transitionType: val });
                    }
                  }}
                  className="w-full bg-[#2A2529] border border-white/15 rounded-lg p-2 text-xs text-[#F3F0E7] font-medium focus:outline-none focus:border-white/30 cursor-pointer"
                >
                  <option value="smooth">Smooth (Linear Camera Glide)</option>
                  <option value="cut">Hard Cut (Instant Angle Switch)</option>
                  <option value="bounce">Bounce (Dynamic Elastic Movement)</option>
                  <option value="handheld">Handheld (Organic Camera Shake)</option>
                  <option value="ease-in-out">Ease In-Out (Cinematic Acceleration)</option>
                </select>
              </div>

              {/* Global Scene Options */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Canvas Backdrop Setup</p>
                <div className="space-y-2 bg-[#211C1F] p-3 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300">Background Color</span>
                    <input
                      type="color"
                      value={sceneSettings?.bgColor || '#F3F0E7'}
                      onChange={(e) => onUpdateSceneSettings && onUpdateSceneSettings({ bgColor: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-[#2A2529] border border-white/15 cursor-pointer p-0.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  </div>
);
}
