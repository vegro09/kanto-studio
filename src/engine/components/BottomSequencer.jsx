import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw,
  Camera, 
  Trash2, 
  Repeat, 
  Video,
  Scissors,
  Copy,
  Type,
  Image,
  Music,
  MousePointer,
  Mic,
  Volume2,
  VolumeX,
  Plus,
  Compass,
  Shapes,
  Sparkles
} from 'lucide-react';
import VoiceOverModal from './VoiceOverModal';
import AudioWaveform from './AudioWaveform';
import { buildMotionPathChunks } from '../utils/motionPathEngine';

// TASK 1: MULTI-TRACK LANES NO-OVERLAP STACKING ALGORITHM
function groupIntoLanes(items) {
  const sorted = [...(items || [])].sort((a, b) => (a.startTimeSec || 0) - (b.startTimeSec || 0));
  const lanes = []; // stores max end time per lane

  return sorted.map((item) => {
    const start = item.startTimeSec || 0;
    const duration = item.duration || 5.0;
    const end = start + duration;

    let laneIndex = item.trackLane;

    if (laneIndex === undefined || laneIndex === null) {
      laneIndex = lanes.findIndex((laneEnd) => laneEnd <= start + 0.05);
      if (laneIndex === -1) {
        laneIndex = lanes.length;
      }
    }

    lanes[laneIndex] = Math.max(lanes[laneIndex] || 0, end);
    return { ...item, assignedLane: laneIndex };
  });
}

function renderCategoryLanes(items) {
  if (!items || items.length === 0) return [];
  const assigned = groupIntoLanes(items);
  const lanesMap = new Map();

  assigned.forEach((item) => {
    const laneIdx = item.assignedLane || 0;
    if (!lanesMap.has(laneIdx)) {
      lanesMap.set(laneIdx, []);
    }
    lanesMap.get(laneIdx).push(item);
  });

  return Array.from(lanesMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([laneIndex, laneItems]) => ({ laneIndex, laneItems }));
}

function renderDedicatedLanes(items) {
  if (!items || items.length === 0) return [];
  return items.map((item, idx) => ({
    laneIndex: idx,
    laneItems: [item]
  }));
}

export default function BottomSequencer({
  shots = [],
  assets = [],
  activeShotId,
  selectedAssetId,
  onSelectShot,
  onSelectAsset,
  onMoveShot,
  onDeleteShot,
  onUpdateShot,
  onCaptureShot,
  onSplitShot,
  onSplitAudioClip,
  onDuplicateShot,
  onAddAudioTrack,
  onUpdateAsset,
  onDeleteAsset,
  isPlaying,
  onTogglePlay,
  onResetCamera,
  playbackProgress = 0,
  onScrubProgress,
  onSetCurrentTime,
  isLooping,
  onToggleLoop,
  totalDuration = 10,
  onUndo,
  onRedo,
  viewMode = 'director',
  onToggleViewMode
}) {
  // TOOLBAR MODE SWITCHING ('select' vs 'razor')
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'razor'
  const [trimmingTarget, setTrimmingTarget] = useState(null);
  
  // FREE-DRAG ENGINE STATE
  const [draggingItem, setDraggingItem] = useState(null);

  // TASK 3: DRAGGABLE TIMELINE INITIAL HEIGHT (DEFAULT 180PX - NO MASSIVE EMPTY SPACE)
  const [timelineHeight, setTimelineHeight] = useState(180);
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(180);

  const handleSplitterMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingHeight(true);
    resizeStartYRef.current = e.clientY;
    resizeStartHeightRef.current = timelineHeight;
  };

  // FREEZE BLOCK TIMELINE EDGE RESIZING (TASK 1)
  const handleFreezeBlockResize = (e, assetId, nodeIndex, edge) => {
    e.preventDefault();
    e.stopPropagation();
    const startMouseX = e.clientX;

    const targetAsset = (assets || []).find((a) => a.id === assetId);
    if (!targetAsset || !targetAsset.motionPath) return;
    const targetNode = targetAsset.motionPath.nodes[nodeIndex];
    if (!targetNode) return;
    const startFreezeDur = targetNode.freezeDurationSec || 1.0;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaSec = deltaX / pxPerSecond;
      let newDuration = startFreezeDur;

      if (edge === 'right') {
        newDuration = Math.max(0.2, startFreezeDur + deltaSec);
      } else {
        newDuration = Math.max(0.2, startFreezeDur - deltaSec);
      }

      newDuration = Math.round(newDuration * 10) / 10;

      const updatedNodes = targetAsset.motionPath.nodes.map((n, idx) =>
        idx === nodeIndex ? { ...n, freezeDurationSec: newDuration } : n
      );

      if (onUpdateAsset) {
        onUpdateAsset(assetId, {
          motionPath: {
            ...targetAsset.motionPath,
            nodes: updatedNodes
          }
        });
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // STANDALONE VOICE-OVER MODAL STATE
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const trackRef = useRef(null);
  const pxPerSecond = 80;
  const safeTotalDuration = Math.max(totalDuration, 0.5);
  const currentTimestampSec = playbackProgress * safeTotalDuration;

  // Global Keyboard Shortcuts (V for Pointer, C for Razor)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === 'v') {
        setActiveTool('select');
      } else if (key === 'c') {
        setActiveTool('razor');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format seconds into 00:00.0 zero-based master clock
  const formatTimecode = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
  };

  // FREE-DRAG & CLIP POSITIONING ENGINE
  const handleClipDragStart = (e, item, type) => {
    if (activeTool === 'razor') return;
    e.stopPropagation();
    setDraggingItem({
      id: item.id,
      type, // 'shot' | 'audio' | 'text' | 'media'
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      initialStartTimeSec: item.startTimeSec || 0,
      initialLane: item.trackLane || 0,
      initialShotIndex: shots.findIndex((s) => s.id === item.id)
    });
  };

  // Trimming / Resizing Drag Handler for Shots and Assets
  const handleTrimMouseDown = (e, item, edge, isAsset = false) => {
    if (activeTool === 'razor') return;
    e.stopPropagation();
    setTrimmingTarget({
      id: item.id,
      isAsset,
      edge,
      startMouseX: e.clientX,
      startDuration: item.duration !== undefined ? item.duration : (item.animationDuration || 5.0),
      initialStartTimeSec: item.startTimeSec || 0
    });
  };

  const handleMouseMove = (e) => {
    if (isResizingHeight) {
      const deltaY = resizeStartYRef.current - e.clientY; // Dragging UP increases height
      const newHeight = Math.min(Math.max(160, resizeStartHeightRef.current + deltaY), 600);
      setTimelineHeight(newHeight);
      return;
    }

    if (trimmingTarget) {
      const deltaX = e.clientX - trimmingTarget.startMouseX;
      const deltaSeconds = deltaX / pxPerSecond;

      if (trimmingTarget.isAsset) {
        if (trimmingTarget.edge === 'right') {
          // Right Edge Drag: Increase or decrease duration
          const newDuration = Math.max(0.2, Math.round((trimmingTarget.startDuration + deltaSeconds) * 10) / 10);
          if (onUpdateAsset) {
            onUpdateAsset(trimmingTarget.id, { duration: newDuration, animationDuration: newDuration });
          }
        } else {
          // Left Edge Drag: Adjust startTimeSec AND duration simultaneously so right edge stays fixed
          const proposedStart = trimmingTarget.initialStartTimeSec + deltaSeconds;
          const newStartSec = Math.max(0, Math.round(proposedStart * 10) / 10);
          const actualDelta = newStartSec - trimmingTarget.initialStartTimeSec;
          const newDuration = Math.max(0.2, Math.round((trimmingTarget.startDuration - actualDelta) * 10) / 10);
          if (onUpdateAsset) {
            onUpdateAsset(trimmingTarget.id, { startTimeSec: newStartSec, duration: newDuration, animationDuration: newDuration });
          }
        }
      } else {
        let newDuration = trimmingTarget.startDuration;
        if (trimmingTarget.edge === 'right') {
          newDuration = Math.max(0.2, trimmingTarget.startDuration + deltaSeconds);
        } else {
          newDuration = Math.max(0.2, trimmingTarget.startDuration - deltaSeconds);
        }

        if (onUpdateShot) {
          onUpdateShot(trimmingTarget.id, { duration: Math.round(newDuration * 10) / 10 });
        }
      }
    } else if (draggingItem) {
      const deltaX = e.clientX - draggingItem.startMouseX;
      const deltaSec = deltaX / pxPerSecond;
      const deltaY = e.clientY - (draggingItem.startMouseY || e.clientY);
      const laneDelta = Math.round(deltaY / 44);

      if (draggingItem.type === 'shot') {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const mouseRelX = e.clientX - rect.left;
        const targetIndex = Math.min(Math.max(0, Math.floor(mouseRelX / 100)), shots.length - 1);
        if (targetIndex !== draggingItem.initialShotIndex && onMoveShot) {
          onMoveShot(draggingItem.initialShotIndex, targetIndex - draggingItem.initialShotIndex);
          setDraggingItem((prev) => ({ ...prev, initialShotIndex: targetIndex }));
        }
      } else {
        const newStartSec = Math.max(0, Math.round((draggingItem.initialStartTimeSec + deltaSec) * 10) / 10);
        const newLane = Math.max(0, (draggingItem.initialLane || 0) + laneDelta);
        if (onUpdateAsset) {
          onUpdateAsset(draggingItem.id, { 
            startTimeSec: newStartSec,
            trackLane: newLane,
            zIndex: newLane * 10 + 1
          });
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsResizingHeight(false);
    setTrimmingTarget(null);
    setDraggingItem(null);
  };

  // DIRECT CLICK-TO-SPLIT IN RAZOR MODE
  const handleShotClick = (e, shot) => {
    if (activeTool === 'razor') {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const relativeSec = clickX / pxPerSecond;
      
      let shotStart = 0;
      for (const s of shots) {
        if (s.id === shot.id) break;
        shotStart += s.duration || 2.0;
      }
      const splitTimestampSec = shotStart + relativeSec;

      if (onSplitShot) {
        onSplitShot(shot.id, splitTimestampSec);
      }
    } else {
      onSelectShot(shot.id);
    }
  };

  // RAZOR (SCISSORS) CUTTING FOR AUDIO CLIPS
  const handleAudioClipClick = (e, audio) => {
    if (activeTool === 'razor') {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const relativeSec = clickX / pxPerSecond;
      const splitTimestampSec = (audio.startTimeSec || 0) + relativeSec;

      if (onSplitAudioClip) {
        onSplitAudioClip(audio.id, splitTimestampSec);
      }
    } else {
      if (onSelectAsset) {
        onSelectAsset(audio.id);
      }
    }
  };

  // Master Ruler Click & Drag Seeking/Scrubbing (TASK 2: UNIVERSAL BINDING SEEK)
  const handleRulerClick = (e) => {
    if (!trackRef.current || safeTotalDuration === 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedSec = Math.min(Math.max(clickX / pxPerSecond, 0), safeTotalDuration);
    const progress = clickedSec / safeTotalDuration;

    if (onScrubProgress) {
      onScrubProgress(progress);
    }
    if (onSetCurrentTime) {
      onSetCurrentTime(clickedSec);
    }
  };

  // Split Active Shot at Playhead Position
  const handleSplitClick = () => {
    if (!activeShotId || !onSplitShot) return;
    onSplitShot(activeShotId, currentTimestampSec);
  };

  // Duplicate Active Shot
  const handleDuplicateClick = () => {
    if (!activeShotId || !onDuplicateShot) return;
    onDuplicateShot(activeShotId);
  };

  // Delete Active Shot
  const handleDeleteClick = () => {
    if (!activeShotId || !onDeleteShot) return;
    onDeleteShot(activeShotId);
  };

  const totalSecCeil = Math.ceil(safeTotalDuration);
  const rulerTicks = [];
  for (let s = 0; s <= totalSecCeil; s++) {
    rulerTicks.push({ sec: s, isMajor: true });
    if (s < totalSecCeil) {
      rulerTicks.push({ sec: s + 0.5, isMajor: false });
    }
  }

  // TASK 1: MULTI-TRACK LANES BY MEDIA CATEGORY (SEPARATE VECTOR ICONS)
  const isIconElement = (a) => a && (
    a.type === 'svg' || 
    a.type === 'shape' || 
    a.type === 'icon' || 
    a.category === 'Icons' || 
    a.category === 'Shapes' || 
    !!a.renderSvg || 
    !!a.svgCategory
  );

  const videoLanes = renderCategoryLanes((assets || []).filter((a) => a && (a.type === 'video' || a.category === 'Videos')));
  const iconLanes = renderCategoryLanes((assets || []).filter((a) => isIconElement(a)));
  const imageLanes = renderCategoryLanes((assets || []).filter((a) => a && (a.type === 'image' || a.type === 'background' || a.category === 'Images') && !isIconElement(a)));
  const textLanes = renderDedicatedLanes((assets || []).filter((a) => a && a.type === 'text'));
  const audioLanes = renderCategoryLanes((assets || []).filter((a) => a && (a.type === 'audio' || a.category === 'Audio')));

  return (
    <footer 
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="w-full z-30 shrink-0 select-none flex flex-col items-center relative border-t border-white/10 bg-[#1E191C]"
    >
      {/* TASK 2: TOP DRAGGABLE HEIGHT SPLITTER HANDLE */}
      <div 
        onMouseDown={handleSplitterMouseDown}
        className="w-full h-2 cursor-ns-resize flex items-center justify-center group relative z-40 bg-[#1E191C] hover:bg-[#2A2529] transition-colors border-b border-white/10"
        title="Drag up or down to adjust timeline height"
      >
        <div className="w-16 h-1 rounded-full bg-zinc-600 group-hover:bg-[#F3F0E7] transition-colors" />
      </div>

      <div 
        style={{ height: `${timelineHeight}px` }}
        className="w-full bg-[#2A2529]/95 backdrop-blur-md flex flex-col overflow-hidden shadow-2xl transition-all duration-75"
      >
        {/* TIMELINE TOOLBAR DOCK */}
        <div className="h-10 border-b border-white/10 px-4 flex items-center justify-between bg-[#211C1F] text-xs shrink-0">
          
          {/* PLAYBACK CONTROLS & STABLE MASTER REAL-TIME CLOCK */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className={`flex items-center gap-1.5 font-bold px-3 py-1 rounded-lg transition-all ${
                isPlaying 
                  ? 'bg-[#F3F0E7] text-[#2A2529] shadow-md active:scale-95 font-black' 
                  : 'bg-[#F3F0E7] text-[#2A2529] hover:bg-white shadow-md active:scale-95'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              onClick={onResetCamera}
              className="p-1.5 text-zinc-400 hover:text-[#F3F0E7] bg-[#2A2529] border border-white/10 rounded-lg transition-colors"
              title="Reset Playhead to 00:00.0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onToggleLoop}
              className={`p-1.5 rounded-lg border transition-colors ${
                isLooping 
                  ? 'bg-[#F3F0E7]/20 text-[#F3F0E7] border-white/30' 
                  : 'bg-[#2A2529] border-white/10 text-zinc-400 hover:text-[#F3F0E7]'
              }`}
              title="Toggle Loop Playback"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            {/* MASTER REAL-TIME CLOCK DISPLAY */}
            <div className="text-[#F3F0E7] font-mono text-xs font-bold bg-[#2A2529] px-2.5 py-0.5 rounded border border-white/10 flex items-center gap-1 shadow-inner">
              <span>{formatTimecode(currentTimestampSec)}</span>
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400">{formatTimecode(safeTotalDuration)}</span>
            </div>
          </div>

          {/* VIEW MODE TOGGLE SWITCHER (DIRECTOR vs CAMERA VIEW - TASK 1) */}
          <div className="flex items-center gap-1 bg-[#2A2529] border border-white/10 p-0.5 rounded-lg">
            <button
              onClick={() => onToggleViewMode && onToggleViewMode('director')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'director'
                  ? 'bg-[#F3F0E7] text-[#2A2529] shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-[#F3F0E7]'
              }`}
              title="Director Stage Canvas Mode"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Director</span>
            </button>

            <button
              onClick={() => onToggleViewMode && onToggleViewMode('camera')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'camera'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-blue-300'
              }`}
              title="Live Camera Viewfinder Mode"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Camera View</span>
            </button>
          </div>

          {/* DUAL TOOL SWITCHER (POINTER vs RAZOR) */}
          <div className="flex items-center gap-1 bg-[#2A2529] border border-white/10 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTool('select')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTool === 'select'
                  ? 'bg-[#F3F0E7] text-[#2A2529] shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-[#F3F0E7]'
              }`}
              title="Pointer / Select & Drag Tool (V)"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Pointer</span>
            </button>

            <button
              onClick={() => setActiveTool('razor')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTool === 'razor'
                  ? 'bg-rose-500 text-white shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-rose-400'
              }`}
              title="Razor / Slicing Tool (C)"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Razor</span>
            </button>
          </div>

          {/* VOICE-OVER MODAL & EDITING TOOL BUTTONS */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95"
              title="Open Voice-Over Studio Modal"
            >
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              <span>Record Voice</span>
            </button>

            {/* UNDO / REDO HISTORY BUTTONS */}
            <button
              onClick={onUndo}
              className="p-1.5 bg-[#2A2529] hover:bg-[#353034] text-zinc-300 hover:text-[#F3F0E7] border border-white/10 rounded-lg transition-colors"
              title="Undo Action (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onRedo}
              className="p-1.5 bg-[#2A2529] hover:bg-[#353034] text-zinc-300 hover:text-[#F3F0E7] border border-white/10 rounded-lg transition-colors"
              title="Redo Action (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* SPLIT / DUPLICATE / DELETE TOOL BUTTONS */}
            <button
              onClick={handleSplitClick}
              disabled={!activeShotId}
              className="px-2.5 py-1 bg-[#2A2529] hover:bg-[#353034] disabled:opacity-40 text-zinc-200 border border-white/10 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Split active shot at playhead"
            >
              <Scissors className="w-3.5 h-3.5 text-emerald-400" />
              <span>Split</span>
            </button>

            <button
              onClick={handleDuplicateClick}
              disabled={!activeShotId}
              className="px-2.5 py-1 bg-[#2A2529] hover:bg-[#353034] disabled:opacity-40 text-zinc-200 border border-white/10 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Duplicate active shot"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span>Duplicate</span>
            </button>

            {/* TASK 1: + SMOOTH & + HARD CUT SHOT BUTTONS */}
            <button
              onClick={() => onCaptureShot && onCaptureShot('smooth')}
              className="px-2.5 py-1 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Add a new smooth camera motion clip to sequence"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-300" />
              <span>+ Smooth Shot</span>
            </button>

            <button
              onClick={() => onCaptureShot && onCaptureShot('cut')}
              className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Add a new hard cut camera clip to sequence"
            >
              <Video className="w-3.5 h-3.5 text-amber-300" />
              <span>+ Hard Cut Shot</span>
            </button>

            <button
              onClick={handleDeleteClick}
              disabled={!activeShotId}
              className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 disabled:opacity-40 text-rose-300 border border-rose-800/60 rounded-lg transition-colors"
              title="Delete active item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* TASK 3: MULTI-TRACK NLE TIMELINE CONTAINER WITH AUTO-EXPANDING SCROLLBAR */}
        <div 
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
          onDrop={(e) => {
            e.preventDefault();
            try {
              const rawData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
              if (rawData) {
                const data = JSON.parse(rawData);
                if (data && (data.type === 'audio' || data.sfxId)) {
                  const rect = trackRef.current ? trackRef.current.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
                  const dropX = Math.max(0, e.clientX - rect.left);
                  const dropSec = Math.round((dropX / pxPerSecond) * 10) / 10;
                  
                  if (onAddAudioTrack) {
                    onAddAudioTrack({
                      name: data.name || 'Audio SFX',
                      type: 'audio',
                      category: data.category || 'Audio',
                      sfxId: data.sfxId || data.id,
                      duration: data.duration || 1.0,
                      startTimeSec: dropSec,
                      volume: 1.0
                    });
                  }
                }
              }
            } catch (err) {
              console.error("Timeline drop error:", err);
            }
          }}
          id="tracks-viewport"
          className={`flex-1 timeline-scrollbar p-3 relative bg-[#211C1F] space-y-2.5 select-none ${
            activeTool === 'razor' ? 'cursor-crosshair' : 'cursor-default'
          }`}
        >
          {/* MASTER TIME RULER WITH PERFECT ZERO-POINT SIDEBAR ALIGNMENT */}
          <div className="flex items-center relative h-6 border-b border-white/10 shrink-0">
            <div className="w-20 text-[9px] font-mono font-bold text-zinc-500 shrink-0 flex items-center gap-1 border-r border-white/10 pr-2 uppercase">
              RULER
            </div>
            <div 
              ref={trackRef}
              onClick={handleRulerClick}
              style={{ width: `${safeTotalDuration * pxPerSecond}px` }}
              className="h-6 relative cursor-pointer group shrink-0"
            >
              {rulerTicks.map((tick) => {
                const leftPx = tick.sec * pxPerSecond;
                if (leftPx > safeTotalDuration * pxPerSecond) return null;

                return (
                  <div 
                    key={tick.sec}
                    style={{ left: `${leftPx}px` }}
                    className={`absolute top-0 bottom-0 border-l pointer-events-none flex flex-col justify-between ${
                      tick.isMajor ? 'border-white/20' : 'border-white/5 h-2.5 bottom-0 top-auto'
                    }`}
                  >
                    {tick.isMajor && (
                      <span className="text-[9px] font-mono text-zinc-400 pl-1 font-semibold">{tick.sec}s</span>
                    )}
                  </div>
                );
              })}

              {/* ZERO-BASED MASTER PLAYHEAD MARKER */}
              <div 
                style={{ left: `${currentTimestampSec * pxPerSecond}px` }}
                className="absolute top-0 bottom-0 w-0.5 bg-[#F3F0E7] z-30 shadow-md pointer-events-none"
              >
                <div className="w-3 h-3 bg-[#F3F0E7] rotate-45 -translate-x-[5px] -translate-y-1 shadow-sm" />
              </div>
            </div>
          </div>

          {/* TRACK 1: CAMERA & VIDEO SHOTS TRACK */}
          <div className="flex items-center relative min-h-[44px]">
            <div className="w-20 text-[10px] font-mono font-bold text-zinc-400 shrink-0 flex items-center gap-1 border-r border-white/10 pr-2">
              <Camera className="w-3 h-3 text-[#F3F0E7]" /> CAMERA
            </div>
            <div 
              style={{ width: `${safeTotalDuration * pxPerSecond}px` }}
              className="flex items-center gap-0 relative min-h-[44px] shrink-0"
            >
              {shots.map((shot, index) => {
                const isActive = shot.id === activeShotId;
                const cardWidth = (shot.duration || 2.0) * pxPerSecond;

                return (
                  <div
                    key={shot.id}
                    onMouseDown={(e) => handleClipDragStart(e, shot, 'shot')}
                    onClick={(e) => handleShotClick(e, shot)}
                    style={{ width: `${Math.max(cardWidth, 70)}px` }}
                    className={`group relative h-11 rounded-xl border transition-all flex flex-col justify-between p-1.5 shrink-0 ${
                      activeTool === 'razor' ? 'cursor-crosshair hover:border-rose-400' : 'cursor-grab active:cursor-grabbing'
                    } ${
                      isActive 
                        ? 'bg-[#F3F0E7] text-[#2A2529] border-white shadow-lg ring-2 ring-white/30 font-bold' 
                        : 'bg-[#2A2529] text-[#F3F0E7] border-white/10 hover:border-white/25 font-medium'
                    }`}
                  >
                    {/* Left Trim Handle */}
                    {activeTool === 'select' && (
                      <div 
                        onMouseDown={(e) => handleTrimMouseDown(e, shot, 'left')}
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 rounded-l-xl transition-opacity z-10" 
                      />
                    )}

                    {/* Top Bar */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="truncate flex items-center gap-1 font-mono">
                        #{index + 1} {shot.name}
                      </span>
                    </div>

                    {/* Bottom Duration Tag */}
                    <div className="flex items-center justify-between text-[9px] font-mono opacity-80">
                      <span>{shot.transitionType === 'cut' ? 'CUT' : 'SMOOTH'}</span>
                      <span>{shot.duration || 2.0}s</span>
                    </div>

                    {/* Right Trim Handle */}
                    {activeTool === 'select' && (
                      <div 
                        onMouseDown={(e) => handleTrimMouseDown(e, shot, 'right')}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 rounded-r-xl transition-opacity z-10" 
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* MULTI-TRACK MOTION PATH LANES WITH DYNAMIC EXPANSION */}
          {renderCategoryLanes((assets || []).filter((a) => a && a.motionPath && a.motionPath.isPathEnabled && Array.isArray(a.motionPath.pathNodes) && a.motionPath.pathNodes.length > 0)).map(({ laneIndex, laneItems }) => (
            <div key={`motion-path-lane-${laneIndex}`} className="flex items-center relative min-h-[40px] bg-indigo-950/20 border border-indigo-500/20 rounded-xl my-1">
              <div className="w-20 text-[10px] font-mono font-bold text-purple-300 shrink-0 flex items-center gap-1 border-r border-indigo-500/20 pr-1 pl-1">
                <Compass className="w-3.5 h-3.5 text-purple-400" /> PATH {laneIndex + 1}
              </div>

              <div 
                style={{ width: `${safeTotalDuration * pxPerSecond}px` }}
                className="flex items-center relative min-h-[40px] shrink-0 pointer-events-auto"
              >
                {laneItems.map((asset) => {
                  const isAssetSelected = asset.id === activeShotId || asset.id === selectedAssetId;
                  const baseDuration = asset.duration || (asset.animationDuration || 5.0);

                  // 1. CALCULATE SEQUENTIAL NON-OVERLAPPING TRACK CHUNKS
                  const { chunks, totalEffectiveDuration } = buildMotionPathChunks(asset.motionPath, baseDuration);

                  const assetStartPx = (asset.startTimeSec || 0) * pxPerSecond;
                  const assetWidthPx = totalEffectiveDuration * pxPerSecond;

                  return (
                    <div
                      key={`path-clip-${asset.id}`}
                      onMouseDown={(e) => handleClipDragStart(e, asset, 'media')}
                      onClick={(e) => { if (onSelectAsset) onSelectAsset(asset.id); }}
                      style={{
                        left: `${assetStartPx}px`,
                        width: `${Math.max(assetWidthPx, 60)}px`
                      }}
                      className={`absolute h-9 rounded-xl border bg-indigo-900/60 border-indigo-500/50 flex items-center px-2 text-xs transition-all overflow-hidden cursor-grab active:cursor-grabbing shadow-md ${
                        isAssetSelected ? 'ring-2 ring-purple-400 border-purple-300 bg-indigo-900/80' : ''
                      }`}
                    >
                      <span className="text-[10px] font-mono text-indigo-200 font-bold truncate pr-2 z-10 shrink-0">
                        {asset.name || 'Element'} Path ({totalEffectiveDuration.toFixed(1)}s)
                      </span>

                      {/* CONTRASTING AMBER/YELLOW STOP ZONES (PAUSE CHUNKS) */}
                      {chunks.filter((c) => c.type === 'pause').map((pauseChunk) => {
                        const freezeDuration = pauseChunk.durationSec;
                        const freezeWidthPx = freezeDuration * pxPerSecond;
                        const leftOffsetPx = pauseChunk.startTimeSec * pxPerSecond;

                        return (
                          <div
                            key={`freeze-node-${pauseChunk.nodeIndex}`}
                            style={{
                              left: `${leftOffsetPx}px`,
                              width: `${Math.max(freezeWidthPx, 26)}px`
                            }}
                            className="absolute top-0.5 bottom-0.5 bg-amber-500/90 border border-amber-300 rounded-lg flex items-center justify-between px-1.5 z-20 shadow-sm text-amber-950 font-bold"
                            title={`Stop Station Node #${pauseChunk.nodeIndex}: ${freezeDuration.toFixed(1)}s Pause (From ${pauseChunk.startTimeSec.toFixed(1)}s to ${pauseChunk.endTimeSec.toFixed(1)}s)`}
                          >
                            <div className="flex items-center gap-1 truncate">
                              <span className="text-[9px] font-mono font-bold truncate">⏸ {freezeDuration.toFixed(1)}s</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* TASK 1: MULTI-TRACK VIDEO LANES */}
          {videoLanes.map(({ laneIndex, laneItems }) => (
            <div key={`video-lane-${laneIndex}`} className="flex items-center relative min-h-[36px]">
              <div className="w-20 text-[10px] font-mono font-bold text-blue-400 shrink-0 flex items-center gap-1 border-r border-white/10 pr-2">
                <Video className="w-3.5 h-3.5 text-blue-400" /> VID {laneIndex + 1}
              </div>
              <div 
                style={{ width: `${safeTotalDuration * pxPerSecond}px` }}
                className="flex items-center relative min-h-[36px] shrink-0"
              >
                {laneItems.map((vid) => {
                  const leftPos = (vid.startTimeSec || 0) * pxPerSecond;
                  const vidWidth = (vid.duration || 5.0) * pxPerSecond;

                  return (
                    <div
                      key={vid.id}
                      onMouseDown={(e) => handleClipDragStart(e, vid, 'media')}
                      onClick={(e) => {
                        if (onSelectAsset) onSelectAsset(vid.id);
                      }}
                      style={{ left: `${leftPos}px`, width: `${Math.max(vidWidth, 90)}px` }}
                      className="absolute h-9 bg-blue-950/80 border border-blue-500/50 text-blue-200 rounded-xl px-2 py-1 text-[10px] flex items-center justify-between font-mono shadow-md cursor-grab active:cursor-grabbing hover:border-blue-400 truncate group transition-all"
                    >
                      {activeTool === 'select' && (
                        <>
                          <div 
                            onMouseDown={(e) => handleTrimMouseDown(e, vid, 'left', true)}
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 rounded-l-xl transition-opacity z-20"
                            title="Drag left edge to trim start time"
                          />
                          <div 
                            onMouseDown={(e) => handleTrimMouseDown(e, vid, 'right', true)}
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 rounded-r-xl transition-opacity z-20"
                            title="Drag right edge to change duration"
                          />
                        </>
                      )}
                      <div className="flex items-center gap-1 truncate z-10">
                        <Video className="w-3 h-3 text-blue-300 shrink-0" />
                        <span className="truncate font-semibold">{vid.name}</span>
                      </div>
                      <span className="text-[9px] opacity-75 z-10">{vid.duration || 5.0}s</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* MULTI-TRACK VECTOR ICON & SHAPE LANES */}
          {iconLanes.map(({ laneIndex, laneItems }) => (
            <div key={`icon-lane-${laneIndex}`} className="flex items-center relative min-h-[34px]">
              <div className="w-20 text-[10px] font-mono font-bold text-cyan-400 shrink-0 flex items-center gap-1 border-r border-white/10 pr-2">
                <Shapes className="w-3.5 h-3.5 text-cyan-400" /> ICON {laneIndex + 1}
              </div>
              <div 
                style={{ width: `${safeTotalDuration * pxPerSecond}px` }}
                className="flex items-center relative min-h-[34px] shrink-0"
              >
                {laneItems.map((iconAsset, idx) => {
                  const leftPos = (iconAsset.startTimeSec || 0) * pxPerSecond;
                  const iconWidth = (iconAsset.duration || 5.0) * pxPerSecond;
                  const displayName = iconAsset.name || `Icon ${idx + 1}`;

                  return (
                    <div
                      key={iconAsset.id}
                      onMouseDown={(e) => handleClipDragStart(e, iconAsset, 'media')}
                      onClick={(e) => {
                        if (onSelectAsset) onSelectAsset(iconAsset.id);
                      }}
                      style={{ left: `${leftPos}px`, width: `${Math.max(iconWidth, 85)}px` }}
                      className="absolute h-8.5 bg-cyan-950/85 border border-cyan-500/60 text-cyan-200 rounded-xl px-2 py-1 text-[10px] flex items-center justify-between font-mono shadow-md cursor-grab active:cursor-grabbing hover:border-cyan-300 truncate group transition-all"
                    >
                      {activeTool === 'select' && (
                        <>
                          <div 
                            onMouseDown={(e) => handleTrimMouseDown(e, iconAsset, 'left', true)}
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 rounded-l-xl transition-opacity z-20"
                            title="Drag left edge to trim start time"
                          />
                          <div 
                            onMouseDown={(e) => handleTrimMouseDown(e, iconAsset, 'right', true)}
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 rounded-r-xl transition-opacity z-20"
                            title="Drag right edge to change duration"
                          />
                        </>
                      )}
                      <div className="flex items-center gap-1 truncate z-10">
                        <Shapes className="w-3 h-3 text-cyan-300 shrink-0" />
                        <span className="truncate font-semibold">{displayName}</span>
                      </div>
                      <span className="text-[9px] opacity-75 z-10">{iconAsset.duration || 5.0}s</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* TASK 1: MULTI-TRACK IMAGE & BACKGROUND LANES */}
          {imageLanes.map(({ laneIndex, laneItems }) => (
            <div key={`image-lane-${laneIndex}`} className="flex items-center relative min-h-[34px]">
              <div className="w-20 text-[10px] font-mono font-bold text-amber-400 shrink-0 flex items-center gap-1 border-r border-white/10 pr-2">
                <Image className="w-3.5 h-3.5 text-amber-400" /> IMG {laneIndex + 1}
              </div>
              <div 
                style={{ width: `${safeTotalDuration * pxPerSecond}px` }}
                className="flex items-center relative min-h-[34px] shrink-0"
              >
                {laneItems.map((img) => {
                  const leftPos = (img.startTimeSec || 0) * pxPerSecond;
                  const imgWidth = (img.duration || 5.0) * pxPerSecond;

                  return (
                    <div
                      key={img.id}
                      onMouseDown={(e) => handleClipDragStart(e, img, 'media')}
                      onClick={(e) => {
                        if (onSelectAsset) onSelectAsset(img.id);
                      }}
                      style={{ left: `${leftPos}px`, width: `${Math.max(imgWidth, 80)}px` }}
                      className="absolute h-8.5 bg-amber-950/80 border border-amber-500/50 text-amber-200 rounded-xl px-2 py-1 text-[10px] flex items-center justify-between font-mono shadow-md cursor-grab active:cursor-grabbing hover:border-amber-400 truncate group transition-all"
                    >
                      {activeTool === 'select' && (
                        <>
                          <div 
                            onMouseDown={(e) => handleTrimMouseDown(e, img, 'left', true)}
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 rounded-l-xl transition-opacity z-20"
                            title="Drag left edge to trim start time"
                          />
                          <div 
                            onMouseDown={(e) => handleTrimMouseDown(e, img, 'right', true)}
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 rounded-r-xl transition-opacity z-20"
                            title="Drag right edge to change duration"
                          />
                        </>
                      )}
                      <div className="flex items-center gap-1 truncate z-10">
                        <Image className="w-3 h-3 text-amber-300 shrink-0" />
                        <span className="truncate font-semibold">{img.name}</span>
                      </div>
                      <span className="text-[9px] opacity-75 z-10">{img.duration || 5.0}s</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* TASK 1: MULTI-TRACK TEXT LANES */}
          {textLanes.map(({ laneIndex, laneItems }) => (
            <div key={`text-lane-${laneIndex}`} className="flex items-center relative min-h-[32px]">
              <div className="w-20 text-[10px] font-mono font-bold text-purple-400 shrink-0 flex items-center gap-1 border-r border-white/10 pr-2">
                <Type className="w-3 h-3 text-purple-300" /> TXT {laneIndex + 1}
              </div>
              <div 
                style={{ width: `${safeTotalDuration * pxPerSecond}px` }}
                className="flex items-center relative min-h-[32px] shrink-0"
              >
                {laneItems.map((asset) => {
                  const leftPos = (asset.startTimeSec || 0) * pxPerSecond;
                  const textWidth = (asset.duration !== undefined ? asset.duration : (asset.animationDuration || 2.5)) * pxPerSecond;
                  return (
                    <div
                      key={asset.id}
                      onMouseDown={(e) => handleClipDragStart(e, asset, 'text')}
                      onClick={(e) => {
                        if (onSelectAsset) onSelectAsset(asset.id);
                      }}
                      style={{ left: `${leftPos}px`, width: `${Math.max(textWidth, 100)}px` }}
                      className="absolute h-8 bg-purple-950/80 border border-purple-500/50 rounded-lg px-2 text-[10px] text-purple-200 flex items-center gap-1 truncate font-mono cursor-grab active:cursor-grabbing hover:border-purple-400 shadow-sm group transition-all"
                    >
                      {activeTool === 'select' && (
                        <>
                          <div 
                            onMouseDown={(e) => handleTrimMouseDown(e, asset, 'left', true)}
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 rounded-l-lg transition-opacity z-20"
                            title="Drag left edge to trim start time"
                          />
                          <div 
                            onMouseDown={(e) => handleTrimMouseDown(e, asset, 'right', true)}
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 rounded-r-lg transition-opacity z-20"
                            title="Drag right edge to change duration"
                          />
                        </>
                      )}
                      <Type className="w-3 h-3 shrink-0 text-purple-300 z-10" />
                      <span className="truncate z-10">{asset.textContent || asset.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* TASK 1: MULTI-TRACK AUDIO LANES */}
          {audioLanes.map(({ laneIndex, laneItems }) => (
            <div key={`audio-track-lane-${laneIndex}`} className="flex items-center relative min-h-[44px]">
              <div className="w-20 text-[10px] font-mono font-bold text-emerald-400 shrink-0 flex items-center gap-1 border-r border-white/10 pr-2">
                <Music className="w-3 h-3 text-emerald-400" /> AUD {laneIndex + 1}
              </div>
              <div 
                style={{ width: `${safeTotalDuration * pxPerSecond}px` }}
                className="flex items-center relative min-h-[44px] shrink-0"
              >
                {laneItems.map((audio) => {
                  const audioWidth = (audio.duration || 3.0) * pxPerSecond;
                  const leftPos = (audio.startTimeSec || 0) * pxPerSecond;

                  return (
                    <div
                      key={audio.id}
                      onMouseDown={(e) => handleClipDragStart(e, audio, 'audio')}
                      onClick={(e) => handleAudioClipClick(e, audio)}
                      style={{ left: `${leftPos}px`, width: `${Math.max(audioWidth, 80)}px` }}
                      className={`absolute h-11 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 rounded-xl px-2 py-1 text-[10px] flex flex-col justify-between font-mono shadow-md group overflow-hidden transition-all ${
                        activeTool === 'razor' ? 'cursor-crosshair hover:border-rose-400' : 'cursor-grab active:cursor-grabbing hover:border-emerald-400'
                      }`}
                    >
                      {activeTool === 'select' && (
                        <>
                          <div 
                            onMouseDown={(e) => handleTrimMouseDown(e, audio, 'left', true)}
                            className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 rounded-l-xl transition-opacity z-20"
                            title="Drag left edge to trim start time"
                          />
                          <div 
                            onMouseDown={(e) => handleTrimMouseDown(e, audio, 'right', true)}
                            className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 rounded-r-xl transition-opacity z-20"
                            title="Drag right edge to change duration"
                          />
                        </>
                      )}
                      <div className="flex items-center justify-between w-full z-10">
                        <div className="flex items-center gap-1 truncate">
                          <Music className="w-3 h-3 text-emerald-300 shrink-0" />
                          <span className="truncate font-semibold">{audio.name}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteAsset) onDeleteAsset(audio.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition-opacity z-20"
                          title="Delete audio clip"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* VISUAL AUDIO WAVEFORM BARS */}
                      <div className="w-full overflow-hidden flex items-center justify-center">
                        <AudioWaveform 
                          waveformData={audio.waveformData || []} 
                          width={Math.max(audioWidth - 16, 60)} 
                          height={16} 
                          color="#34d399" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INDEPENDENT STANDALONE VOICE-OVER STUDIO MODAL */}
      <VoiceOverModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        playheadSec={currentTimestampSec}
        onAddAudioTrack={onAddAudioTrack}
      />
    </footer>
  );
}
