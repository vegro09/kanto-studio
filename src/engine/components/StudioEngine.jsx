import React, { useState, useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import LeftPanel from './LeftPanel';
import WorkspaceCanvas from './WorkspaceCanvas';
import CameraViewMode from './CameraViewMode';
import RightPanel from './RightPanel';
import BottomSequencer from './BottomSequencer';
import ExportModal from './ExportModal';
import Toast from './Toast';
import AudioEngine from './AudioEngine';
import { 
  MousePointer, 
  Hand, 
  Type, 
  Scissors, 
  Sparkles, 
  RotateCcw, 
  RotateCw, 
  Eye, 
  EyeOff,
  Target
} from 'lucide-react';
import { DEFAULT_DEMO_PROJECT } from '../data/presetAssets';

export default function StudioEngine() {
  // Core Application State
  const [assets, setAssets] = useState(DEFAULT_DEMO_PROJECT.assets);
  const [camera, setCamera] = useState(DEFAULT_DEMO_PROJECT.camera);
  const [shots, setShots] = useState(DEFAULT_DEMO_PROJECT.shots);

  // Background Pre-rendering Lazy Cache Ref
  const renderedFramesCacheRef = useRef({});

  // STRICT DYNAMIC TIMELINE DURATION ENGINE (NO HARDCODED FLOORS, EXACT SNAP TO LONGEST CLIP)
  const totalDuration = useMemo(() => {
    const totalShotsSec = shots.reduce((acc, shot) => acc + (shot.duration || 2.0), 0);
    const maxAssetEndSec = assets.reduce((acc, asset) => {
      const start = asset.startTimeSec || 0;
      const dur = asset.duration !== undefined ? asset.duration : (asset.type === 'video' ? 5.0 : asset.type === 'audio' ? 3.0 : 0);
      return Math.max(acc, start + dur);
    }, 0);

    const computedMax = Math.max(totalShotsSec, maxAssetEndSec);
    const result = Math.max(computedMax, 0.5);
    return Math.round(result * 10) / 10;
  }, [shots, assets]);

  // Collapsible Panel State
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Scene & Background Settings State
  const [sceneSettings, setSceneSettings] = useState({
    width: 3200,
    height: 2400,
    bgColor: '#FFFFFF',
    texture: 'lines'
  });

  // View Mode: 'director' vs 'camera'
  const [viewMode, setViewMode] = useState('director');

  // Selection Context State
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [isCameraSelected, setIsCameraSelected] = useState(false);
  const [selectedShotId, setSelectedShotId] = useState(null);

  // Workspace Controls, Custom Fonts & Asset Library State (With localStorage Persistence)
  const [userLibraryAssets, setUserLibraryAssets] = useState(() => {
    try {
      const saved = localStorage.getItem('kanto_user_library_assets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [customFonts, setCustomFonts] = useState([]);
  const [isPanMode, setIsPanMode] = useState(false);
  const [isTimelineVisible, setIsTimelineVisible] = useState(true);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [gridType, setGridType] = useState('lines');
  const [toast, setToast] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // TASK 4: AI BACKGROUND REMOVAL INTEGRATION (remove.bg REST API)
  const handleRemoveBackground = async (assetId) => {
    const targetAsset = assets.find((a) => a.id === assetId);
    if (!targetAsset || (!targetAsset.url && !targetAsset.src)) {
      showToast('Select an image asset first to remove background', 'warning');
      return;
    }

    const imageUrl = targetAsset.url || targetAsset.src;
    setIsRemovingBg(true);
    showToast('AI Engine: Removing image background...', 'info');

    try {
      const formData = new FormData();
      formData.append('image_url', imageUrl);
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': 'mJiN7XcUQkDq33aanFiDu3Co'
        },
        body: formData
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error ${response.status}: ${errText}`);
      }

      const blob = await response.blob();
      const transparentUrl = URL.createObjectURL(blob);

      recordHistory();
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? { ...a, url: transparentUrl, src: transparentUrl, bgRemoved: true }
            : a
        )
      );

      showToast('AI Engine: Background removed successfully!', 'success');
    } catch (err) {
      console.error('[AI REMOVE BG ERROR]', err);
      showToast(`Background removal failed: ${err.message}`, 'error');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const focusCameraRef = useRef(null);

  const handleFocusOnCamera = () => {
    if (focusCameraRef.current) {
      focusCameraRef.current();
      showToast('Centered workspace canvas on active camera viewfinder', 'info');
    }
  };

  // ROBUST CUSTOM FONTS PIPELINE (FileReader + FontFace API + Dual @font-face CSS Injection)
  const handleUploadCustomFont = (file) => {
    if (!file) return;

    const rawName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_\-\s]/g, "").trim() || 'CustomFont';
    const fontName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target.result;
      const blobUrl = URL.createObjectURL(file);

      try {
        // 1. Browser Native FontFace API Loading
        const font = new FontFace(fontName, buffer);
        const loadedFont = await font.load();
        document.fonts.add(loadedFont);

        // 2. Dual @font-face Style Injection for Canvas2D Engine Compatibility
        const styleId = `font-style-${fontName.toLowerCase()}`;
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
            @font-face {
              font-family: '${fontName}';
              src: url('${blobUrl}');
              font-weight: normal;
              font-style: normal;
              font-display: swap;
            }
          `;
          document.head.appendChild(style);
        }

        setCustomFonts((prev) => {
          if (prev.some((f) => f.name === fontName)) return prev;
          return [...prev, { name: fontName, fileName: file.name, blobUrl }];
        });

        showToast(`Successfully loaded custom font "${fontName}"`, 'success');
      } catch (err) {
        console.warn("FontFace load warning, using dynamic CSS font-face injection:", err);
        try {
          const styleId = `font-style-${fontName.toLowerCase()}`;
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
            @font-face {
              font-family: '${fontName}';
              src: url('${blobUrl}');
              font-weight: normal;
              font-style: normal;
            }
          `;
          document.head.appendChild(style);

          setCustomFonts((prev) => {
            if (prev.some((f) => f.name === fontName)) return prev;
            return [...prev, { name: fontName, fileName: file.name, blobUrl }];
          });

          showToast(`Loaded custom font "${fontName}"`, 'success');
        } catch (fallbackErr) {
          showToast(`Failed to load font "${file.name}"`, 'error');
        }
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSaveToLibrary = (libraryItem) => {
    setUserLibraryAssets((prev) => {
      const updated = [libraryItem, ...prev];
      try {
        localStorage.setItem('kanto_user_library_assets', JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving library item to localStorage:", e);
      }
      return updated;
    });
    showToast(`Saved "${libraryItem.name}" to Custom Library`, 'success');
  };

  // GSAP Sequencer State & Refs
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  
  const timelineRef = useRef(null);
  const viewfinderRef = useRef(null);
  const cameraViewRef = useRef(null);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || null;
  const selectedShot = shots.find((s) => s.id === selectedShotId) || null;

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Invalidate frame cache whenever scene assets or shots are updated
  useEffect(() => {
    renderedFramesCacheRef.current = {};
  }, [assets, shots, sceneSettings]);

  // Global Undo / Redo & Clipboard Refs
  const historyStackRef = useRef({ past: [], future: [] });
  const clipboardRef = useRef(null);

  // Helper to record history snapshot for Undo/Redo
  const recordHistory = (overrideAssets, overrideCamera, overrideShots, overrideSettings) => {
    try {
      const snapshot = JSON.parse(JSON.stringify({
        assets: overrideAssets !== undefined ? overrideAssets : assets,
        camera: overrideCamera !== undefined ? overrideCamera : camera,
        shots: overrideShots !== undefined ? overrideShots : shots,
        sceneSettings: overrideSettings !== undefined ? overrideSettings : sceneSettings
      }));
      historyStackRef.current.past.push(snapshot);
      if (historyStackRef.current.past.length > 35) {
        historyStackRef.current.past.shift();
      }
      historyStackRef.current.future = [];
    } catch (e) {
      console.warn("Error recording history snapshot:", e);
    }
  };

  // Undo Handler (Ctrl+Z)
  const handleUndo = () => {
    if (historyStackRef.current.past.length === 0) {
      showToast('Nothing to undo', 'info');
      return;
    }
    const currentSnapshot = JSON.parse(JSON.stringify({ assets, camera, shots, sceneSettings }));
    historyStackRef.current.future.push(currentSnapshot);

    const previousState = historyStackRef.current.past.pop();
    setAssets(previousState.assets);
    setCamera(previousState.camera);
    setShots(previousState.shots);
    if (previousState.sceneSettings) setSceneSettings(previousState.sceneSettings);
    showToast('Undo action (Ctrl+Z)', 'info');
  };

  // Redo Handler (Ctrl+Y / Ctrl+Shift+Z)
  const handleRedo = () => {
    if (historyStackRef.current.future.length === 0) {
      showToast('Nothing to redo', 'info');
      return;
    }
    const currentSnapshot = JSON.parse(JSON.stringify({ assets, camera, shots, sceneSettings }));
    historyStackRef.current.past.push(currentSnapshot);

    const nextState = historyStackRef.current.future.pop();
    setAssets(nextState.assets);
    setCamera(nextState.camera);
    setShots(nextState.shots);
    if (nextState.sceneSettings) setSceneSettings(nextState.sceneSettings);
    showToast('Redo action (Ctrl+Y)', 'info');
  };

  // Copy Handler (Ctrl+C)
  const handleCopyAsset = () => {
    if (selectedAsset) {
      clipboardRef.current = JSON.parse(JSON.stringify(selectedAsset));
      showToast(`Copied "${selectedAsset.name}" to clipboard`, 'info');
    }
  };

  // Paste Handler (Ctrl+V)
  const handlePasteAsset = () => {
    if (!clipboardRef.current) {
      showToast('Clipboard is empty', 'info');
      return;
    }
    recordHistory();
    const source = clipboardRef.current;
    const pastedAsset = {
      ...source,
      id: `asset-${Date.now()}`,
      name: `${source.name} (Copy)`,
      x: source.x + 30,
      y: source.y + 30,
      zIndex: assets.length > 0 ? Math.max(...assets.map((a) => a.zIndex)) + 1 : 1
    };

    setAssets((prev) => [...prev, pastedAsset]);
    setSelectedAssetId(pastedAsset.id);
    setIsCameraSelected(false);
    showToast(`Pasted "${pastedAsset.name}"`, 'success');
  };

  // Toggle Lock Handler (Ctrl+L)
  const handleToggleLockAsset = () => {
    if (selectedAssetId) {
      const target = assets.find((a) => a.id === selectedAssetId);
      if (target) {
        recordHistory();
        const nextLocked = !target.isLocked;
        handleUpdateAsset(selectedAssetId, { isLocked: nextLocked });
        showToast(nextLocked ? `Locked "${target.name}"` : `Unlocked "${target.name}"`, 'info');
      }
    }
  };

  // Group / Ungroup Handler (Ctrl+G)
  const handleToggleGroupAsset = () => {
    if (selectedAssetId) {
      const target = assets.find((a) => a.id === selectedAssetId);
      if (target) {
        recordHistory();
        const isGrouped = !!target.groupId;
        const newGroupId = isGrouped ? null : `group-${Date.now()}`;
        handleUpdateAsset(selectedAssetId, { groupId: newGroupId });
        showToast(isGrouped ? `Ungrouped "${target.name}"` : `Grouped "${target.name}"`, 'info');
      }
    }
  };

  // Comprehensive Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input/textarea/select/contentEditable
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;
      if (isInputActive) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      // GROUP 1: WORKSPACE & CANVAS NAVIGATION
      if (isCtrl && (key === '0' || key === 'num0')) {
        e.preventDefault();
        setCamera((c) => ({ ...c, x: 1550, y: 1480, scale: 1.0 }));
        showToast('Reset Viewport & Zoom (Ctrl+0)', 'info');
        return;
      }
      if (isCtrl && (key === '=' || key === '+' || key === 'numpadadd')) {
        e.preventDefault();
        setCamera((c) => ({ ...c, scale: Math.min(c.scale + 0.15, 4.0) }));
        return;
      }
      if (isCtrl && (key === '-' || key === 'numpadsubtract')) {
        e.preventDefault();
        setCamera((c) => ({ ...c, scale: Math.max(c.scale - 0.15, 0.3) }));
        return;
      }

      // GROUP 2: EDITING & TIMELINE CONTROLS
      if (isCtrl && isShift && key === 'z') {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (isCtrl && key === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (isCtrl && key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (isCtrl && key === 'c') {
        e.preventDefault();
        handleCopyAsset();
        return;
      }
      if (isCtrl && key === 'v') {
        e.preventDefault();
        handlePasteAsset();
        return;
      }
      if (isCtrl && key === 'd') {
        e.preventDefault();
        if (selectedAssetId) {
          handleDuplicateAsset(selectedAssetId);
        } else if (selectedShotId) {
          handleCaptureShot('smooth', null);
        }
        return;
      }
      if (key === 'delete' || key === 'backspace') {
        if (selectedAssetId) {
          e.preventDefault();
          handleDeleteAsset(selectedAssetId);
        } else if (selectedShotId) {
          e.preventDefault();
          handleDeleteShot(selectedShotId);
        }
        return;
      }
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        handleTogglePlay();
        return;
      }

      // GROUP 3: CAMERA & CUSTOM ACTIONS
      if (isShift && key === 'c') {
        e.preventDefault();
        handleCaptureShot('cut');
        return;
      }
      if (isShift && key === 's') {
        e.preventDefault();
        handleCaptureShot('smooth');
        return;
      }
      if (isCtrl && key === 'l') {
        e.preventDefault();
        handleToggleLockAsset();
        return;
      }
      if (isCtrl && key === 'g') {
        e.preventDefault();
        handleToggleGroupAsset();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAssetId, selectedShotId, camera, shots, isPlaying, assets, sceneSettings]);

  // SEQUENTIAL AUTO-PLACEMENT CALCULATOR FOR TIMELINE CLIPS
  const getSequentialAutoStartTime = (currentAssets, isBackground = false) => {
    if (isBackground) return 0.0;
    try {
      if (!Array.isArray(currentAssets) || currentAssets.length === 0) return 0.0;
      let maxEndTime = 0.0;

      currentAssets.forEach((a) => {
        if (!a || a.type === 'background') return;
        const start = typeof a.startTimeSec === 'number' ? a.startTimeSec : 0;
        let baseDur = typeof a.duration === 'number' && a.duration > 0 ? a.duration : (a.animationDuration || 5.0);

        if (a.motionPath && a.motionPath.isPathEnabled && Array.isArray(a.motionPath.pathNodes)) {
          const totalStop = a.motionPath.pathNodes.reduce((sum, n) => sum + (n.isStopNode ? (n.freezeDurationSec !== undefined ? n.freezeDurationSec : 1.0) : 0), 0);
          baseDur += totalStop;
        }

        const clipEndTime = start + baseDur;
        if (clipEndTime > maxEndTime) {
          maxEndTime = clipEndTime;
        }
      });

      return Math.round(maxEndTime * 10) / 10;
    } catch (err) {
      console.error("getSequentialAutoStartTime Error:", err);
      return 0.0;
    }
  };

  // Ground-Up Image Engine Insertion Function with Smart Camera Viewfinder Scaling & Auto-Centering
  const insertFreshImageAsset = (fileOrBlobUrl, category = 'Character', assetName = 'Image Asset', originalType = 'image', targetX = null, targetY = null) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const commitAsset = (naturalW = 400, naturalH = 400) => {
      // Calculate current Camera Viewfinder dimensions & center coordinates
      const camW = (camera.width || 270) * (camera.scale || 1);
      const camH = (camera.height || 480) * (camera.scale || 1);
      const camCenterX = camera.x + camW / 2;
      const camCenterY = camera.y + camH / 2;

      const isScene = category === 'Scene' || category === 'background';

      let finalW = 400;
      let finalH = 400;
      let posX = camera.x;
      let posY = camera.y;

      if (isScene) {
        // 1. For "Scene/Background" assets: Scale to fit the EXACT dimensions of the Camera Frame
        finalW = camW;
        finalH = camH;
        posX = camera.x;
        posY = camera.y;
      } else {
        // 2. For "Character" or "Shape/Object" assets: Scale max dimension <= 50% of active Camera Viewfinder
        const maxAllowedW = camW * 0.5;
        const maxAllowedH = camH * 0.5;
        const aspect = (naturalW && naturalH) ? (naturalW / naturalH) : 1;

        finalW = maxAllowedW;
        finalH = finalW / aspect;

        if (finalH > maxAllowedH) {
          finalH = maxAllowedH;
          finalW = finalH * aspect;
        }

        posX = (typeof targetX === 'number' && Number.isFinite(targetX)) ? targetX : (camCenterX - finalW / 2);
        posY = (typeof targetY === 'number' && Number.isFinite(targetY)) ? targetY : (camCenterY - finalH / 2);
      }

      const autoStart = isScene ? 0.0 : getSequentialAutoStartTime(assets);

      const newAsset = {
        id: `img_fresh_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: assetName,
        type: isScene ? 'background' : (originalType || 'image'),
        src: fileOrBlobUrl,
        url: fileOrBlobUrl,
        category: category,
        x: Math.round(posX),
        y: Math.round(posY),
        width: Math.round(finalW),
        height: Math.round(finalH),
        naturalWidth: naturalW,
        naturalHeight: naturalH,
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        zIndex: Date.now(),
        isLocked: false,
        startTimeSec: autoStart,
        duration: 5.0
      };

      recordHistory();
      setAssets((prev) => [...prev, newAsset]);

      // Direct state update into the active shot's asset array
      if (shots.length > 0 && activeShotIndex !== null && activeShotIndex >= 0) {
        setShots((prevShots) => {
          const updated = [...prevShots];
          const activeShot = updated[activeShotIndex];
          if (activeShot) {
            updated[activeShotIndex] = {
              ...activeShot,
              assets: [...(activeShot.assets || []), newAsset]
            };
          }
          return updated;
        });
      }

      setSelectedAssetId(newAsset.id);
      setIsCameraSelected(false);
      showToast(`Added "${newAsset.name}" to workspace & timeline`, 'success');
    };

    img.onload = () => {
      commitAsset(img.naturalWidth || 400, img.naturalHeight || 400);
    };

    img.onerror = () => {
      // Fallback committing even if cross-origin image natural dimensions fail to load asynchronously
      commitAsset(400, 400);
    };

    img.src = fileOrBlobUrl;
  };

  // AUDIO & VOICE-OVER SUITE TRACK HANDLERS
  const handleAddAudioTrack = (audioAsset) => {
    recordHistory();
    setAssets((prev) => [...prev, audioAsset]);
    showToast(`Recorded "${audioAsset.name}" to Audio track`, 'success');
  };

  const handleSplitAudioClip = (audioId, splitTimestampSec) => {
    recordHistory();
    setAssets((prev) => {
      const updated = [];
      prev.forEach((asset) => {
        if (asset.id === audioId) {
          const start = asset.startTimeSec || 0;
          const duration = asset.duration || 3.0;
          const end = start + duration;

          if (splitTimestampSec > start + 0.1 && splitTimestampSec < end - 0.1) {
            const firstDuration = Math.round((splitTimestampSec - start) * 10) / 10;
            const secondDuration = Math.round((end - splitTimestampSec) * 10) / 10;

            const clip1 = {
              ...asset,
              duration: Math.max(0.2, firstDuration)
            };

            const clip2 = {
              ...asset,
              id: `audio_${Date.now()}_split`,
              name: `${asset.name} (Part 2)`,
              startTimeSec: Math.round(splitTimestampSec * 10) / 10,
              duration: Math.max(0.2, secondDuration)
            };

            updated.push(clip1, clip2);
          } else {
            updated.push(asset);
          }
        } else {
          updated.push(asset);
        }
      });
      return updated;
    });

    showToast('Split audio clip at razor cursor', 'success');
  };

  // MODULAR CHARACTER ASSEMBLY SPAWNER
  const handleAddModularPart = (partDef) => {
    if (!partDef) return;
    recordHistory();

    const camW = (camera.width || 270) * (camera.scale || 1);
    const camH = (camera.height || 480) * (camera.scale || 1);
    const camCenterX = camera.x + camW / 2;
    const camCenterY = camera.y + camH / 2;

    const autoStart = getSequentialAutoStartTime(assets);

    const partW = partDef.width || 100;
    const partH = partDef.height || 120;

    const posX = (typeof partDef.x === 'number' && Number.isFinite(partDef.x)) ? partDef.x : Math.round(camCenterX - partW / 2);
    const posY = (typeof partDef.y === 'number' && Number.isFinite(partDef.y)) ? partDef.y : Math.round(camCenterY - partH / 2);

    const newAsset = {
      id: `mod_${partDef.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: partDef.name,
      type: 'modular_body_part',
      partType: partDef.id,
      category: partDef.category,
      color: partDef.color,
      svgPath: partDef.svgPath,
      parentPartType: partDef.parentPartType,
      snapJoints: partDef.snapJoints,
      constraints: partDef.constraints,
      width: partW,
      height: partH,
      x: posX,
      y: posY,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
      zIndex: Date.now(),
      isLocked: false,
      startTimeSec: autoStart,
      duration: 5.0
    };

    setAssets((prev) => [...prev, newAsset]);
    setSelectedAssetId(newAsset.id);
    setIsCameraSelected(false);
    showToast(`Spawned "${newAsset.name}" modular body part`, 'success');
  };

  // ASSET ACTIONS
  const handleAddAsset = (preset) => {
    if (!preset) return;

    // 1. STRICT VIDEO ASSET TYPE ENFORCEMENT & NATIVE ASPECT RATIO PRESERVATION
    if (preset.type === 'video' || (preset.category === 'Videos') || (preset.src && preset.src.match(/\.(mp4|webm|mov|ogv)$/i))) {
      recordHistory();

      const nativeW = preset.naturalWidth || preset.videoWidth || preset.width || 1280;
      const nativeH = preset.naturalHeight || preset.videoHeight || preset.height || 720;
      const aspect = nativeW / nativeH;

      // Scale to fit nicely in workspace while preserving exact native aspect ratio
      let finalW = 600;
      let finalH = 600 / aspect;

      if (finalH > 800) {
        finalH = 800;
        finalW = 800 * aspect;
      }

      const viewfinderWidth = camera.width * camera.scale;
      const viewfinderHeight = camera.height * camera.scale;
      const camCenterX = camera.x + viewfinderWidth / 2;
      const camCenterY = camera.y + viewfinderHeight / 2;

      const autoStart = (preset.startTimeSec !== undefined && preset.startTimeSec > 0) ? preset.startTimeSec : getSequentialAutoStartTime(assets);

      const posX = (typeof preset.x === 'number' && Number.isFinite(preset.x)) ? preset.x : Math.round(camCenterX - finalW / 2);
      const posY = (typeof preset.y === 'number' && Number.isFinite(preset.y)) ? preset.y : Math.round(camCenterY - finalH / 2);

      const newAsset = {
        id: preset.id || `video_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: preset.name || 'Video Asset',
        type: 'video',
        category: 'Videos',
        src: preset.src || preset.url,
        url: preset.src || preset.url,
        x: posX,
        y: posY,
        width: Math.round(finalW),
        height: Math.round(finalH),
        naturalWidth: nativeW,
        naturalHeight: nativeH,
        aspectRatio: aspect,
        scale: preset.scale || 1.0,
        rotation: preset.rotation || 0,
        opacity: preset.opacity !== undefined ? preset.opacity : 1.0,
        zIndex: Date.now(),
        isLocked: false,
        startTimeSec: autoStart,
        duration: preset.duration || 5.0
      };

      setAssets((prev) => [...prev, newAsset]);
      setSelectedAssetId(newAsset.id);
      setIsCameraSelected(false);
      showToast(`Added Video "${newAsset.name}" to workspace & timeline`, 'success');
      return;
    }

    // 2. STOCK BACKGROUND LAYER ENFORCEMENT (1-CLICK FULL FRAME DEPLOYMENT)
    if (preset.type === 'background' || preset.isBackgroundLayer || preset.category === 'Stock') {
      recordHistory();
      const newAsset = {
        id: `bg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: preset.name || 'Stock Background',
        type: 'background',
        category: 'Stock',
        src: preset.src || preset.url,
        url: preset.src || preset.url,
        x: 0,
        y: 0,
        width: sceneSettings?.width || 1080,
        height: sceneSettings?.height || 1920,
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        zIndex: 1, // Positioned at back layer (zIndex: 1)
        isLocked: false,
        startTimeSec: 0,
        duration: preset.duration || 5.0
      };

      setAssets((prev) => [newAsset, ...prev]);
      setSelectedAssetId(newAsset.id);
      setIsCameraSelected(false);
      showToast(`Added Stock Background "${newAsset.name}" to workspace frame`, 'success');
      return;
    }

    // 3. AUDIO TRACK ASSET ENFORCEMENT
    if (preset.type === 'audio' || preset.category === 'Audio') {
      handleAddAudioTrack(preset);
      return;
    }

    // 4. IMAGE & URL MEDIA INSTANTIATION
    if (preset.src || preset.url) {
      const cat = preset.category || (preset.type === 'background' ? 'Scene' : 'Character');
      insertFreshImageAsset(preset.src || preset.url, cat, preset.name || 'Image Asset', preset.type || 'image', preset.x, preset.y);
      return;
    }

    recordHistory();

    const dataSrc = preset.src || preset.url;
    const initialW = preset.width || 400;
    const initialH = preset.height || 400;

    const isBg = preset.type === 'background' || preset.category === 'Stock' || preset.isBackgroundLayer;
    const autoStart = (preset.startTimeSec !== undefined && preset.startTimeSec > 0 && !isBg)
      ? preset.startTimeSec
      : getSequentialAutoStartTime(assets, isBg);

    const newAsset = {
      id: preset.id || `img_${Date.now()}`,
      name: preset.name || 'New Asset',
      type: preset.type || 'image',
      isSolidColor: preset.isSolidColor || false,
      svgCategory: preset.svgCategory,
      renderSvg: preset.renderSvg,
      color: preset.color || '#3b82f6',
      url: dataSrc,
      src: dataSrc,
      x: preset.x !== undefined ? preset.x : (camera.x + 40),
      y: preset.y !== undefined ? preset.y : (camera.y + 40),
      scale: preset.defaultScale || preset.scale || 1.0,
      rotation: preset.rotation || 0,
      opacity: preset.opacity !== undefined ? preset.opacity : 1.0,
      zIndex: Date.now(), // Force to top layer
      width: initialW,
      height: initialH,
      isLocked: false,
      startTimeSec: autoStart,
      duration: preset.duration || 5.0
    };

    setAssets((prev) => [...prev, newAsset]);

    // Explicitly append to active shot assets if shots exist
    if (shots.length > 0 && activeShotIndex !== null && activeShotIndex >= 0) {
      setShots((prevShots) => {
        const updated = [...prevShots];
        const activeShot = updated[activeShotIndex];
        if (activeShot) {
          const currentShotAssets = activeShot.assets || [];
          updated[activeShotIndex] = {
            ...activeShot,
            assets: [...currentShotAssets, newAsset]
          };
        }
        return updated;
      });
    }

    setSelectedAssetId(newAsset.id);
    setIsCameraSelected(false);
    showToast(`Added asset "${newAsset.name}" to active scene`, 'success');
  };

  const handleAddTextAsset = () => {
    const newTextAsset = {
      id: `asset-${Date.now()}`,
      name: 'Text Node',
      type: 'text',
      textContent: 'الرسوم المتحركة 2D Animatic',
      fontFamily: 'Cairo',
      fontSize: 36,
      textColor: '#ffffff',
      textAlign: 'center',
      x: camera.x + 20,
      y: camera.y + 160,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
      zIndex: assets.length > 0 ? Math.max(...assets.map((a) => a.zIndex)) + 1 : 1,
      width: 320,
      height: 120,
      isLocked: false
    };

    setAssets((prev) => [...prev, newTextAsset]);
    setSelectedAssetId(newTextAsset.id);
    setIsCameraSelected(false);
    showToast('Added Text element (Arabic / English)', 'success');
  };

  const handleUpdateAsset = (id, updates) => {
    setAssets((prev) =>
      prev.map((asset) => (asset.id === id ? { ...asset, ...updates } : asset))
    );
  };

  const handleDeleteAsset = (id) => {
    const target = assets.find((a) => a.id === id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    if (selectedAssetId === id) setSelectedAssetId(null);
    if (target) showToast(`Deleted "${target.name}"`, 'info');
  };

  const handleDuplicateAsset = (id) => {
    const target = assets.find((a) => a.id === id);
    if (!target) return;

    const dupAsset = {
      ...target,
      id: `asset-${Date.now()}`,
      name: `${target.name} (Copy)`,
      x: target.x + 30,
      y: target.y + 30,
      zIndex: Math.max(...assets.map((a) => a.zIndex)) + 1
    };

    setAssets((prev) => [...prev, dupAsset]);
    setSelectedAssetId(dupAsset.id);
    showToast(`Duplicated "${target.name}"`, 'success');
  };

  const handleReorderZIndex = (id, action) => {
    setAssets((prev) => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const index = sorted.findIndex((a) => a.id === id);
      if (index === -1) return prev;

      if (action === 'up' && index < sorted.length - 1) {
        const temp = sorted[index].zIndex;
        sorted[index].zIndex = sorted[index + 1].zIndex;
        sorted[index + 1].zIndex = temp;
      } else if (action === 'down' && index > 0) {
        const temp = sorted[index].zIndex;
        sorted[index].zIndex = sorted[index - 1].zIndex;
        sorted[index - 1].zIndex = temp;
      } else if (action === 'top') {
        const maxZ = Math.max(...prev.map((a) => a.zIndex));
        sorted[index].zIndex = maxZ + 1;
      } else if (action === 'bottom') {
        const minZ = Math.min(...prev.map((a) => a.zIndex));
        sorted[index].zIndex = Math.max(0, minZ - 1);
      }
      return [...sorted];
    });
  };

  // CAMERA VIEWFINDER ACTIONS
  const handleUpdateCamera = (updates) => {
    setCamera((prev) => ({ ...prev, ...updates }));
  };

  // MULTI-CAMERA SHOT SEQUENCING
  const handleCaptureShot = (type = 'smooth', existingShotId = null) => {
    if (existingShotId) {
      setShots((prev) =>
        prev.map((s) =>
          s.id === existingShotId
            ? { ...s, x: camera.x, y: camera.y, scale: camera.scale }
            : s
        )
      );
      showToast(`Updated Shot keyframe coordinates`, 'success');
    } else {
      const isCut = type === 'cut';
      const newShot = {
        id: `shot-${Date.now()}`,
        name: `Shot ${shots.length + 1}: ${isCut ? 'Hard Cut Angle' : camera.scale > 1.2 ? 'Close Up' : 'Medium Shot'}`,
        x: camera.x,
        y: camera.y,
        scale: camera.scale,
        duration: 2.0,
        transitionType: isCut ? 'cut' : 'smooth',
        ease: 'power2.inOut',
        notes: ''
      };

      setShots((prev) => [...prev, newShot]);
      setSelectedShotId(newShot.id);
      showToast(`Captured ${isCut ? 'Hard Cut Camera' : 'Smooth Movement'} Shot #${shots.length + 1}`, 'success');
    }
  };

  const handleUpdateShot = (id, updates) => {
    setShots((prev) =>
      prev.map((shot) => (shot.id === id ? { ...shot, ...updates } : shot))
    );
  };

  const handleDeleteShot = (id) => {
    recordHistory();
    setShots((prev) => prev.filter((s) => s.id !== id));
    if (selectedShotId === id) setSelectedShotId(null);
    showToast('Deleted shot keyframe', 'info');
  };

  // TASK 2: SPLIT / CUT SHOT KEYFRAME AT PLAYHEAD POSITION
  const handleSplitShot = (shotId, playheadTimeSec) => {
    recordHistory();
    setShots((prev) => {
      let cumulative = 0;
      const updated = [];

      prev.forEach((shot) => {
        const shotDuration = shot.duration || 2.0;
        const shotStart = cumulative;
        const shotEnd = cumulative + shotDuration;

        if (shot.id === shotId && playheadTimeSec > shotStart + 0.2 && playheadTimeSec < shotEnd - 0.2) {
          const firstDuration = Math.round((playheadTimeSec - shotStart) * 10) / 10;
          const secondDuration = Math.round((shotEnd - playheadTimeSec) * 10) / 10;

          const shot1 = {
            ...shot,
            duration: Math.max(0.2, firstDuration)
          };

          const shot2 = {
            ...shot,
            id: `shot_${Date.now()}_split`,
            name: `${shot.name} (Part 2)`,
            duration: Math.max(0.2, secondDuration)
          };

          updated.push(shot1, shot2);
        } else {
          updated.push(shot);
        }

        cumulative += shotDuration;
      });

      return updated;
    });

    showToast('Split shot keyframe at playhead position', 'success');
  };

  // TASK 2: DUPLICATE SHOT KEYFRAME
  const handleDuplicateShot = (shotId) => {
    recordHistory();
    setShots((prev) => {
      const index = prev.findIndex((s) => s.id === shotId);
      if (index === -1) return prev;

      const target = prev[index];
      const dup = {
        ...target,
        id: `shot_${Date.now()}_dup`,
        name: `${target.name} (Copy)`
      };

      const updated = [...prev];
      updated.splice(index + 1, 0, dup);
      return updated;
    });

    showToast(`Duplicated shot keyframe`, 'success');
  };

  const handleMoveShot = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= shots.length) return;

    setShots((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleSelectShot = (shotId) => {
    setSelectedShotId(shotId);
    setSelectedAssetId(null);
    setIsCameraSelected(false);

    const shot = shots.find((s) => s.id === shotId);
    if (shot) {
      setCamera((prev) => ({
        ...prev,
        x: shot.x,
        y: shot.y,
        scale: shot.scale
      }));
    }
  };

  // TASK 2: MASTER SEEK / SET CURRENT TIME HANDLER (UNIVERSAL BINDING)
  const handleSetCurrentTime = (timeInSeconds) => {
    const safeDuration = Math.max(totalDuration || 10, 1.0);
    const clampedTime = Math.max(0, Math.min(safeDuration, typeof timeInSeconds === 'number' && Number.isFinite(timeInSeconds) ? timeInSeconds : 0));
    setPlaybackProgress(clampedTime / safeDuration);
  };

  // TASK 1: TRUE SECONDS REAL-TIME DELTA CLOCK (1 Timeline Second = 1 Real-World Second)
  useEffect(() => {
    if (!isPlaying) return;

    let animFrameId = null;
    let lastTime = performance.now();

    const tick = (now) => {
      const deltaSec = Math.max(0, (now - lastTime) / 1000);
      lastTime = now;

      const safeDuration = Math.max(totalDuration || 10, 1.0);

      setPlaybackProgress((prevProg) => {
        const currentSec = prevProg * safeDuration;
        const nextSec = currentSec + deltaSec;

        if (nextSec >= safeDuration) {
          if (isLooping) {
            return 0;
          } else {
            setIsPlaying(false);
            return 1.0;
          }
        }

        return nextSec / safeDuration;
      });

      animFrameId = requestAnimationFrame(tick);
    };

    lastTime = performance.now();
    animFrameId = requestAnimationFrame(tick);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [isPlaying, isLooping, totalDuration]);

  // Synchronize Camera position smoothly during sequence playback (Value Equality Guarded)
  useEffect(() => {
    if (!isPlaying || shots.length === 0) return;
    const currentSec = playbackProgress * Math.max(totalDuration, 1.0);

    let cumulative = 0;
    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i];
      const duration = shot.duration || 2.0;
      const shotStart = cumulative;
      const shotEnd = cumulative + duration;

      if (currentSec >= shotStart && currentSec <= shotEnd) {
        const nextShot = shots[i + 1] || shot;
        const progressInShot = (currentSec - shotStart) / duration;

        let targetX = shot.x;
        let targetY = shot.y;
        let targetScale = shot.scale;

        if (shot.transitionType !== 'cut' && shots[i + 1]) {
          const easeProgress = Math.sin((progressInShot * Math.PI) / 2);
          targetX = shot.x + (nextShot.x - shot.x) * easeProgress;
          targetY = shot.y + (nextShot.y - shot.y) * easeProgress;
          targetScale = shot.scale + (nextShot.scale - shot.scale) * easeProgress;
        }

        setCamera((prev) => {
          if (
            Math.abs(prev.x - targetX) < 0.05 &&
            Math.abs(prev.y - targetY) < 0.05 &&
            Math.abs(prev.scale - targetScale) < 0.005
          ) {
            return prev;
          }
          return {
            ...prev,
            x: targetX,
            y: targetY,
            scale: targetScale
          };
        });
        break;
      }
      cumulative += duration;
    }
  }, [playbackProgress, isPlaying, shots, totalDuration]);

  const handleTogglePlay = () => {
    if (shots.length === 0) {
      showToast('Capture at least 1 camera shot to play sequence', 'error');
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    showToast('Playing sequence in real time (1:1 sec clock)', 'info');
  };

  const handleResetCamera = () => {
    setIsPlaying(false);
    setPlaybackProgress(0);
    const firstShot = shots[0];
    if (firstShot) {
      setCamera((prev) => ({
        ...prev,
        x: firstShot.x,
        y: firstShot.y,
        scale: firstShot.scale
      }));
    }
    showToast('Reset timeline playhead to 00:00.0', 'info');
  };

  const handleScrubProgress = (progressVal) => {
    setPlaybackProgress(progressVal);
    // Directly scrub GSAP timeline if it exists and has content
    if (timelineRef.current && typeof timelineRef.current.totalDuration === 'function' && timelineRef.current.totalDuration() > 0) {
      timelineRef.current.pause();
      timelineRef.current.progress(progressVal);
    }
    setIsPlaying(false);
  };

  const handleScrubTimestamp = (timestampInSeconds) => {
    const progressVal = Math.min(Math.max(timestampInSeconds / totalDuration, 0), 1);
    handleScrubProgress(progressVal);
  };

  const handleLoadDemo = () => {
    setAssets(DEFAULT_DEMO_PROJECT.assets);
    setCamera(DEFAULT_DEMO_PROJECT.camera);
    setShots(DEFAULT_DEMO_PROJECT.shots);
    setSelectedAssetId(null);
    setSelectedShotId(null);
    showToast('Loaded Cyberpunk Storyboard Preset Scene', 'success');
  };

  const handleExportProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ assets, camera, shots, sceneSettings }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `storyboard-project-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Project JSON exported', 'success');
  };

  const handleImportProject = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.assets && parsed.camera && parsed.shots) {
          setAssets(parsed.assets);
          setCamera(parsed.camera);
          setShots(parsed.shots);
          if (parsed.sceneSettings) setSceneSettings(parsed.sceneSettings);
          showToast('Successfully imported project JSON', 'success');
        } else {
          showToast('Invalid project file format', 'error');
        }
      } catch (err) {
        showToast('Failed to parse JSON project file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const activeShotIndex = shots.findIndex((s) => s.id === selectedShotId);
  const activeShotName = activeShotIndex >= 0 ? shots[activeShotIndex].name : '';

  return (
    <div className="flex flex-col h-full w-full bg-[#181416] text-[#F3F0E7] overflow-hidden font-sans select-none">
      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 2. Left Panel */}
        <LeftPanel
          isOpen={isLeftPanelOpen}
          onToggleOpen={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          onAddAsset={handleAddAsset}
          onAddTextAsset={handleAddTextAsset}
          onUploadCustomFont={handleUploadCustomFont}
          onAddCamera={() => setIsCameraSelected(true)}
          userLibraryAssets={userLibraryAssets}
          onSaveToLibrary={handleSaveToLibrary}
        />

        {/* 3. Main Center Workspace */}
        {viewMode === 'director' ? (
          <WorkspaceCanvas
            assets={assets}
            onUpdateAsset={handleUpdateAsset}
            selectedAssetId={selectedAssetId}
            onSelectAsset={(id) => {
              setSelectedAssetId(id);
              if (id) {
                setIsCameraSelected(false);
                setSelectedShotId(null);
              }
            }}
            camera={camera}
            onUpdateCamera={handleUpdateCamera}
            onSelectCamera={(val) => {
              setIsCameraSelected(val);
              if (val) {
                setSelectedAssetId(null);
                setSelectedShotId(null);
              }
            }}
            isCameraSelected={isCameraSelected}
            viewfinderRef={viewfinderRef}
            focusCameraRef={focusCameraRef}
            onCaptureShot={(type) => handleCaptureShot(type)}
            isPanMode={isPanMode}
            gridType={gridType}
            sceneSettings={sceneSettings}
            activeShotIndex={activeShotIndex >= 0 ? activeShotIndex : null}
            isPlaying={isPlaying}
            playbackProgress={playbackProgress}
            totalDuration={totalDuration}
            onAddAsset={handleAddAsset}
            onAddModularPart={handleAddModularPart}
          />
        ) : (
          <CameraViewMode
            assets={assets}
            camera={camera}
            shots={shots}
            sceneSettings={sceneSettings}
            cameraViewRef={cameraViewRef}
            viewportWidth={360}
            viewportHeight={640}
            activeShotName={activeShotName}
            activeShotIndex={activeShotIndex}
            isPlaying={isPlaying}
            playbackProgress={playbackProgress}
            totalDuration={totalDuration}
          />
        )}

        {/* 4. Right Panel */}
        <RightPanel
          isOpen={isRightPanelOpen}
          onToggleOpen={() => setIsRightPanelOpen(!isRightPanelOpen)}
          selectedAsset={selectedAsset}
          onUpdateAsset={handleUpdateAsset}
          onDeleteAsset={handleDeleteAsset}
          onDuplicateAsset={handleDuplicateAsset}
          onReorderZIndex={handleReorderZIndex}
          selectedCamera={camera}
          onUpdateCamera={handleUpdateCamera}
          selectedShot={selectedShot}
          onUpdateShot={handleUpdateShot}
          onDeleteShot={handleDeleteShot}
          onCaptureShot={(existingShotId) => handleCaptureShot('smooth', existingShotId)}
          sceneSettings={sceneSettings}
          onUpdateSceneSettings={(updates) => setSceneSettings((prev) => ({ ...prev, ...updates }))}
          assetsCount={assets.length}
          shotsCount={shots.length}
          customFonts={customFonts}
          onRemoveBackground={handleRemoveBackground}
          isRemovingBg={isRemovingBg}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onAddModularPart={handleAddModularPart}
          playbackProgress={playbackProgress}
          totalDuration={totalDuration}
        />

        {/* FLOATING QUICK TOOLBAR (TASK 3 - ABSOLUTE FLOATING OVER WORKSPACE BOTTOM AREA) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1 px-3 py-1 bg-[#2A2529]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl scale-95 transition-all">
            {/* Pointer / Select Tool */}
            <button
              onClick={() => setIsPanMode(false)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                !isPanMode 
                  ? 'bg-[#F3F0E7] text-[#2A2529] shadow-xs font-bold' 
                  : 'text-zinc-400 hover:text-[#F3F0E7] hover:bg-white/10'
              }`}
              title="Pointer / Select Tool (V)"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="font-mono">Select</span>
            </button>

            {/* Pan Tool (Hand Tool) */}
            <button
              onClick={() => setIsPanMode(!isPanMode)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isPanMode 
                  ? 'bg-[#F3F0E7] text-[#2A2529] shadow-xs font-bold' 
                  : 'text-zinc-400 hover:text-[#F3F0E7] hover:bg-white/10'
              }`}
              title="Pan / Hand Tool (H)"
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="font-mono">Pan</span>
            </button>

            {/* Focus Camera (Compact Icon Tool) */}
            <button
              onClick={handleFocusOnCamera}
              className="p-1.5 text-zinc-300 hover:text-[#F3F0E7] hover:bg-white/10 rounded-lg transition-all cursor-pointer flex items-center justify-center"
              title="Focus Camera Dead-Center in Viewport (F)"
            >
              <Target className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            <div className="h-3.5 w-px bg-white/15 mx-0.5" />

            {/* Add Text Asset */}
            <button
              onClick={handleAddTextAsset}
              className="px-2 py-1 text-zinc-300 hover:text-[#F3F0E7] hover:bg-white/10 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer"
              title="Add Kinetic Text Layer"
            >
              <Type className="w-3.5 h-3.5 text-purple-400" />
              <span>Add Text</span>
            </button>

            <div className="h-3.5 w-px bg-white/15 mx-0.5" />

            {/* Undo History */}
            <button
              onClick={handleUndo}
              className="p-1 text-zinc-300 hover:text-[#F3F0E7] hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              title="Undo Action (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Redo History */}
            <button
              onClick={handleRedo}
              className="p-1 text-zinc-300 hover:text-[#F3F0E7] hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              title="Redo Action (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <div className="h-3.5 w-px bg-white/15 mx-0.5" />

            {/* Toggle Timeline Panel Visibility */}
            <button
              onClick={() => setIsTimelineVisible(!isTimelineVisible)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer ${
                isTimelineVisible
                  ? 'text-zinc-300 hover:text-[#F3F0E7] hover:bg-white/10'
                  : 'bg-indigo-600 text-white font-bold'
              }`}
              title={isTimelineVisible ? "Hide Timeline Panel" : "Show Timeline Panel"}
            >
              {isTimelineVisible ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              <span>{isTimelineVisible ? 'Hide Timeline' : 'Show Timeline'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Bottom Panel: Multi-Camera NLE Timeline */}
      {isTimelineVisible && (
        <BottomSequencer
          shots={shots}
          assets={assets}
          activeShotId={selectedShotId}
          selectedAssetId={selectedAssetId}
          onSelectShot={handleSelectShot}
          onSelectAsset={(id) => {
            setSelectedAssetId(id);
            if (id) {
              setIsCameraSelected(false);
              setSelectedShotId(null);
            }
          }}
          onMoveShot={handleMoveShot}
          onDeleteShot={handleDeleteShot}
          onUpdateShot={handleUpdateShot}
          onCaptureShot={(type) => handleCaptureShot(type)}
          onSplitShot={handleSplitShot}
          onSplitAudioClip={handleSplitAudioClip}
          onDuplicateShot={handleDuplicateShot}
          onAddAudioTrack={handleAddAudioTrack}
          onUpdateAsset={handleUpdateAsset}
          onDeleteAsset={handleDeleteAsset}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onResetCamera={handleResetCamera}
          playbackProgress={playbackProgress}
          onScrubProgress={handleScrubProgress}
          onSetCurrentTime={handleSetCurrentTime}
          isLooping={isLooping}
          onToggleLoop={() => setIsLooping(!isLooping)}
          totalDuration={totalDuration}
          onUndo={handleUndo}
          onRedo={handleRedo}
          viewMode={viewMode}
          onToggleViewMode={(mode) => setViewMode(mode)}
        />
      )}

      {/* GPU-Accelerated MP4 Video Export Engine Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        camera={camera}
        assets={assets}
        sceneSettings={sceneSettings}
        shots={shots}
        totalDuration={totalDuration}
        onScrubTimestamp={handleScrubTimestamp}
      />

      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
