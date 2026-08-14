import React, { useState, useRef } from 'react';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { Film, Download, Loader2, CheckCircle2, AlertCircle, X, Sparkles, Monitor, Zap, Ban, RotateCcw, Cpu, Sliders, Lock, LayoutGrid } from 'lucide-react';
import { renderKineticTextToCanvas } from '../utils/kineticTypography';
import { getCanvasFilterString } from '../utils/canvasFilters';
import { evaluateMotionPathAtTime } from '../utils/motionPathEngine';
import { calculateInterpolatedState } from '../utils/modularCharacterEngine';
import { useEngineStore, AnimationEngine, FontManager } from '../../modules/KantoTextEngine';

// SAFE TIMELINE INITIALIZER (FIXES "initTimeline is not defined" REFERENCE ERROR)
export const initTimeline = (timelineRef) => {
  try {
    if (timelineRef && typeof timelineRef.seek === 'function') {
      return timelineRef;
    }
    return { seek: () => {}, duration: () => 0 };
  } catch (err) {
    return { seek: () => {}, duration: () => 0 };
  }
};

// ─── ASSET LOADERS ────────────────────────────────────────────────────────────

const loadRasterAsset = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = blobUrl;
      });
    }
  } catch (_) {}
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

const loadSvgAsset = (asset) =>
  new Promise((resolve) => {
    try {
      if (typeof asset.renderSvg !== 'function') return resolve(null);
      const svgStr = asset.renderSvg(
        asset.color || '#3b82f6',
        asset.borderColor || '#ffffff',
        asset.borderWidth !== undefined ? asset.borderWidth : 3,
        asset.hasBorder !== undefined ? asset.hasBorder : false
      );
      if (!svgStr) return resolve(null);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch (e) { resolve(null); }
  });

const loadVideoAsset = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const vid = document.createElement('video');
    vid.crossOrigin = 'anonymous';
    vid.preload = 'auto';
    vid.muted = true;
    vid.playsInline = true;
    vid.onloadeddata = () => resolve(vid);
    vid.onerror = () => resolve(null);
    vid.src = url;
    vid.load();
  });

const withTimeout = (promise, ms = 3000, fallback = null) =>
  Promise.race([
    promise,
    new Promise((resolve) =>
      setTimeout(() => {
        console.warn(`[Export Timeout] Asset load timed out after ${ms}ms.`);
        resolve(fallback);
      }, ms)
    )
  ]);

// ─── CAMERA INTERPOLATION (pure, no GSAP) ────────────────────────────────────

function buildCameraEvaluator(shots, cameraBase) {
  const fallback = {
    x: cameraBase?.x ?? 1550,
    y: cameraBase?.y ?? 1480,
    scale: cameraBase?.scale ?? 1,
    width: cameraBase?.width ?? 270,
    height: cameraBase?.height ?? 480
  };

  if (!shots || shots.length === 0) return () => ({ ...fallback });

  const segments = [];
  let cumulative = 0;
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const duration = Math.max(shot.duration || 2.0, 0.01);
    segments.push({
      startT: cumulative,
      endT: cumulative + duration,
      duration,
      from: i === 0 ? shot : shots[i - 1],
      to: shot,
      transitionType: shot.transitionType || 'smooth'
    });
    cumulative += duration;
  }

  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

  return function getCameraAtTime(t) {
    const clampedT = Math.max(0, Math.min(t, segments[segments.length - 1].endT));
    let seg = segments[segments.length - 1];
    for (let i = 0; i < segments.length; i++) {
      if (clampedT <= segments[i].endT) { seg = segments[i]; break; }
    }
    const { from, to, startT, duration, transitionType } = seg;
    if (transitionType === 'cut') {
      const snap = (clampedT - startT) / duration < 0.5 ? from : to;
      return { x: snap.x, y: snap.y, scale: snap.scale, width: fallback.width, height: fallback.height };
    }
    const p = easeInOutSine(Math.max(0, Math.min((clampedT - startT) / duration, 1)));
    return {
      x: from.x + (to.x - from.x) * p,
      y: from.y + (to.y - from.y) * p,
      scale: from.scale + (to.scale - from.scale) * p,
      width: fallback.width,
      height: fallback.height
    };
  };
}

function renderExportTextLines(ctx, lines, offsetX, offsetY, lineHeight, totalHeight, isStroke) {
  const startY = -totalHeight / 2 + lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    const lineY = startY + i * lineHeight + offsetY;
    if (isStroke) {
      ctx.strokeText(lines[i], offsetX, lineY);
    } else {
      ctx.fillText(lines[i], offsetX, lineY);
    }
  }
}

function drawExportRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function renderTextLayerToContext(ctx, layer, evaluated) {
  ctx.save();

  const { x, y, scale, rotation, opacity, blur, glowBlur, glowColor } = evaluated;
  const content = evaluated.content || '';

  // Apply main transform
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

  if (blur > 0.1) {
    ctx.filter = `blur(${blur}px)`;
  } else {
    ctx.filter = 'none';
  }

  // Font setup
  const fontSize = layer.font?.size || 72;
  const fontFamily = layer.font?.family || 'Space Grotesk';
  const isBold = layer.style?.bold ? 'bold ' : '';
  const isItalic = layer.style?.italic ? 'italic ' : '';
  ctx.font = `${isItalic}${isBold}${fontSize}px "${fontFamily}", "Cairo", "Inter", sans-serif`;
  ctx.textBaseline = 'middle';

  // Alignment and RTL handling
  const isArabic = FontManager ? FontManager.isArabicString(content) : false;
  ctx.direction = isArabic ? 'rtl' : 'ltr';
  const align = layer.style?.align || 'center';
  ctx.textAlign = align;

  // Measure text dimensions
  const lines = content.split('\n');
  const lineHeight = fontSize * (layer.style?.spacing?.line || 1.2);
  const lineMetrics = lines.map((l) => ctx.measureText(l));
  const maxLineWidth = Math.max(...lineMetrics.map((m) => m.width), 10);
  const totalHeight = lines.length * lineHeight;

  const bgPadding = layer.style?.background?.enabled ? (layer.style?.background?.padding || 0) : 0;
  const boxWidth = maxLineWidth + bgPadding * 2;
  const boxHeight = totalHeight + bgPadding * 2;

  // 1. Background Box if enabled
  if (layer.style?.background?.enabled) {
    const bgRadius = layer.style?.background?.radius || 0;
    const bgOpacity = layer.style?.background?.opacity ?? 0.85;
    
    ctx.save();
    ctx.globalAlpha = opacity * bgOpacity;
    ctx.fillStyle = layer.style.background.color || '#1c1c1c';

    const bgX = -boxWidth / 2;
    const bgY = -boxHeight / 2;

    drawExportRoundedRect(ctx, bgX, bgY, boxWidth, boxHeight, bgRadius);
    ctx.fill();
    ctx.restore();
  }

  // 2. 3D Pop Shadow if enabled
  if (layer.style?.shadow3D?.enabled && layer.style?.shadow3D.distance > 0) {
    ctx.save();
    ctx.fillStyle = layer.style.shadow3D.color || '#000000';
    const dist = layer.style.shadow3D.distance;
    const step = Math.max(1, Math.floor(dist / 4));
    for (let i = dist; i >= 1; i -= step) {
      renderExportTextLines(ctx, lines, i, i, lineHeight, totalHeight, false);
    }
    ctx.restore();
  }

  // 3. Glow if enabled
  if (layer.style?.glow?.enabled && glowBlur > 0) {
    ctx.save();
    ctx.shadowColor = glowColor || '#ffffff';
    ctx.shadowBlur = Math.min(glowBlur, 40);
    ctx.fillStyle = glowColor || '#ffffff';
    renderExportTextLines(ctx, lines, 0, 0, lineHeight, totalHeight, false);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();
  }

  // 4. Outer Stroke if enabled
  if (layer.style?.stroke?.enabled && layer.style?.stroke?.width > 0) {
    ctx.save();
    ctx.strokeStyle = layer.style.stroke.color || '#000000';
    ctx.lineWidth = layer.style.stroke.width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    renderExportTextLines(ctx, lines, 0, 0, lineHeight, totalHeight, true);
    ctx.restore();
  }

  // 5. Main Fill Text
  ctx.fillStyle = layer.style?.fill || '#ffffff';
  renderExportTextLines(ctx, lines, 0, 0, lineHeight, totalHeight, false);

  // 6. Underline if enabled
  if (layer.style?.underline) {
    ctx.save();
    ctx.strokeStyle = layer.style?.fill || '#ffffff';
    ctx.lineWidth = Math.max(2, fontSize * 0.06);
    const underlineY = totalHeight / 2 + 4;
    ctx.beginPath();
    ctx.moveTo(-maxLineWidth / 2, underlineY);
    ctx.lineTo(maxLineWidth / 2, underlineY);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// ─── FRAME RENDERER ───────────────────────────────────────────────────────────

function renderSceneToCanvas(ctx, targetW, targetH, cam, assets, sceneSettings, imageCache, timestampInSeconds, totalDuration = 10) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.save();
  ctx.fillStyle = sceneSettings?.bgColor || '#000000';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.restore();

  const camW = (cam.width || 270) * (cam.scale || 1);
  const camH = (cam.height || 480) * (cam.scale || 1);
  const camCenterX = (cam.x || 0) + camW / 2;
  const camCenterY = (cam.y || 0) + camH / 2;
  const renderScale = targetW / camW;
  const sceneTranslateX = targetW / 2 - camCenterX * renderScale;
  const sceneTranslateY = targetH / 2 - camCenterY * renderScale;

  const sorted = [...(assets || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  // PASS 1: Full-frame backgrounds
  for (const asset of sorted) {
    if (asset.type !== 'background' && !asset.isBackgroundLayer && asset.category !== 'Stock') continue;
    if (asset.type === 'audio') continue;
    ctx.save();
    ctx.globalAlpha = asset.opacity !== undefined ? asset.opacity : 1.0;
    const filt = getCanvasFilterString(asset.filterStyle);
    if (filt && filt !== 'none') ctx.filter = filt;
    const img = imageCache.get(asset.id);
    if (img) {
      try { ctx.drawImage(img, 0, 0, targetW, targetH); } catch (_) {}
    } else if (asset.isSolidColor || (!asset.url && !asset.src)) {
      ctx.fillStyle = asset.color || sceneSettings?.bgColor || '#000000';
      ctx.fillRect(0, 0, targetW, targetH);
    }
    ctx.filter = 'none';
    ctx.restore();
  }

  // PASS 2: Foreground in camera space
  ctx.save();
  ctx.translate(sceneTranslateX, sceneTranslateY);
  ctx.scale(renderScale, renderScale);

  for (const asset of sorted) {
    if (asset.type === 'background' || asset.isBackgroundLayer || asset.category === 'Stock') continue;
    if (asset.type === 'audio' || asset.category === 'Audio' || asset.type === 'text' || asset.category === 'Text') continue;

    const startSec = typeof asset.startTimeSec === 'number' ? asset.startTimeSec : 0;
    let clipDuration = typeof asset.duration === 'number' && asset.duration > 0
      ? asset.duration
      : (typeof asset.animationDuration === 'number' ? asset.animationDuration : 5.0);

    if (asset.motionPath?.isPathEnabled) {
      const nodes = asset.motionPath.pathNodes || asset.motionPath.nodes || [];
      for (const n of nodes) {
        if (n.isStopNode) clipDuration += typeof n.freezeDurationSec === 'number' ? n.freezeDurationSec : 1.0;
      }
    }

    const isAlwaysVisible = asset.type === 'modular_body_part' || asset.partType;
    if (!isAlwaysVisible && (timestampInSeconds < startSec || timestampInSeconds > startSec + clipDuration)) continue;

    let renderX = typeof asset.x === 'number' && Number.isFinite(asset.x) ? asset.x : 0;
    let renderY = typeof asset.y === 'number' && Number.isFinite(asset.y) ? asset.y : 0;
    let renderRotation = typeof asset.rotation === 'number' ? asset.rotation : 0;
    let renderScaleX = typeof asset.scaleX === 'number' ? asset.scaleX : 1.0;
    let renderScaleY = typeof asset.scaleY === 'number' ? asset.scaleY : 1.0;

    if (Array.isArray(asset.keyframes) && asset.keyframes.length > 0) {
      try {
        const interp = calculateInterpolatedState(asset, timestampInSeconds);
        if (interp) {
          if (typeof interp.rotation === 'number') renderRotation = interp.rotation;
          if (typeof interp.scaleX === 'number') renderScaleX = interp.scaleX;
          if (typeof interp.scaleY === 'number') renderScaleY = interp.scaleY;
          if (asset.attachedBaseId) {
            const parent = sorted.find((a) => a.id === asset.attachedBaseId);
            if (parent) {
              renderX = parent.x + (typeof interp.relativeX === 'number' ? interp.relativeX : (asset.relativeX || 0));
              renderY = parent.y + (typeof interp.relativeY === 'number' ? interp.relativeY : (asset.relativeY || 0));
            }
          }
        }
      } catch (_) {}
    }

    if (asset.motionPath?.isPathEnabled) {
      try {
        const elDur = Math.max(0.0001, typeof asset.duration === 'number' && asset.duration > 0 ? asset.duration : 5.0);
        const ev = evaluateMotionPathAtTime(asset.motionPath, startSec, elDur, timestampInSeconds);
        if (ev && Number.isFinite(ev.x) && Number.isFinite(ev.y)) {
          renderX = ev.x - (asset.width || 0) / 2;
          renderY = ev.y - (asset.height || 0) / 2;
        }
      } catch (_) {}
    }

    ctx.save();
    ctx.globalAlpha = asset.opacity !== undefined ? asset.opacity : 1.0;
    const filt = getCanvasFilterString(asset.filterStyle);
    if (filt && filt !== 'none') ctx.filter = filt;

    const w = asset.width || 100;
    const h = asset.height || 100;
    ctx.translate(renderX + w / 2, renderY + h / 2);
    if (renderRotation) ctx.rotate((renderRotation * Math.PI) / 180);
    const fsx = renderScaleX * (asset.scale || 1);
    const fsy = renderScaleY * (asset.scale || 1);
    if (fsx !== 1 || fsy !== 1) ctx.scale(fsx, fsy);
    ctx.translate(-w / 2, -h / 2);

    if (asset.type === 'modular_body_part' || asset.partType) {
      ctx.save();
      const stf = Math.min(w / 160, h / 190);
      ctx.translate((w - 160 * stf) / 2, (h - 190 * stf) / 2);
      ctx.scale(stf, stf);
      ctx.fillStyle = asset.color || '#60A5FA';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3 / stf;
      ctx.lineJoin = 'round';
      if (asset.svgPath) {
        try { const p = new Path2D(asset.svgPath); ctx.fill(p); ctx.stroke(p); }
        catch (_) { ctx.fillRect(0, 0, 160, 190); }
      } else { ctx.fillRect(0, 0, 160, 190); }
      ctx.restore();
    } else if (asset.type === 'svg' || typeof asset.renderSvg === 'function' || asset.svgCategory) {
      const img = imageCache.get(asset.id);
      if (img) { try { ctx.drawImage(img, 0, 0, w, h); } catch (_) {} }
      else { ctx.fillStyle = asset.color || '#3b82f6'; ctx.fillRect(0, 0, w, h); }
    } else if (asset.type === 'video' || /\.(mp4|webm|mov|ogv)(\?|$)/i.test(asset.src || asset.url || '')) {
      const vid = imageCache.get(asset.id);
      if (vid instanceof HTMLVideoElement) {
        const offset = Math.max(0, timestampInSeconds - startSec);
        try { if (Math.abs(vid.currentTime - offset) > 0.08) vid.currentTime = offset; ctx.drawImage(vid, 0, 0, w, h); }
        catch (_) {}
      } else {
        ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#6b7280'; ctx.font = `${Math.min(w, h) * 0.12}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('VIDEO', w / 2, h / 2);
      }
    } else if (asset.isSolidColor || (!asset.url && !asset.src)) {
      ctx.fillStyle = asset.color || '#FFFFFF'; ctx.fillRect(0, 0, w, h);
    } else {
      const img = imageCache.get(asset.id);
      if (img) { try { ctx.drawImage(img, 0, 0, w, h); } catch (_) {} }
      else { ctx.fillStyle = asset.color || '#374151'; ctx.fillRect(0, 0, w, h); }
    }

    ctx.filter = 'none';
    ctx.restore();
  }

  // PASS 3: KANTO TEXT ENGINE LAYERS (COMPOSITE TEXT + KEYFRAMES + ANIMATIONS + EFFECTS)
  try {
    const textLayers = useEngineStore.getState().layers;
    const safeTotalDuration = Math.max(totalDuration || 10, 1.0);
    if (Array.isArray(textLayers) && textLayers.length > 0) {
      for (const layer of textLayers) {
        if (layer.meta?.hidden) continue;

        const evaluated = AnimationEngine.evaluateLayer(layer, timestampInSeconds, safeTotalDuration);
        if (evaluated.opacity <= 0.001) continue;

        renderTextLayerToContext(ctx, layer, evaluated);
      }
    }
  } catch (err) {
    console.warn('[ExportModal] Error rendering KantoTextEngine layer:', err);
  }

  ctx.restore();
}

// ─── EXPORT MODAL ─────────────────────────────────────────────────────────────

export default function ExportModal({
  isOpen,
  onClose,
  camera,
  assets,
  sceneSettings,
  shots,
  totalDuration,
  onScrubTimestamp
}) {
  const FPS_OPTIONS = [
    { fps: 60, label: '60 FPS', sub: 'Ultra Smooth' },
    { fps: 30, label: '30 FPS', sub: 'Standard' },
    { fps: 24, label: '24 FPS', sub: 'Cinematic' }
  ];

  const TEMPLATE_LOOKUP = {
    'v_9_16':  { name: 'TikTok / Reels / Shorts (9:16)', w: 1080, h: 1920 },
    'reels':   { name: 'Instagram Reels (9:16)',          w: 1080, h: 1920 },
    'tiktok':  { name: 'TikTok Video (9:16)',             w: 1080, h: 1920 },
    'shorts':  { name: 'YouTube Shorts (9:16)',           w: 1080, h: 1920 },
    'facebook':{ name: 'Facebook Video (9:16)',           w: 1080, h: 1920 },
    'linkedin':{ name: 'LinkedIn Video (9:16)',           w: 1080, h: 1920 },
    'l_16_9':  { name: 'YouTube / Cinematic (16:9)',      w: 1920, h: 1080 },
    'yt_land': { name: 'YouTube Landscape (16:9)',        w: 1920, h: 1080 },
    's_1_1':   { name: 'Instagram Post (1:1)',            w: 1080, h: 1080 },
    'post':    { name: 'Instagram Post (1:1)',            w: 1080, h: 1080 },
    'custom':  { name: 'Custom Canvas Size', w: sceneSettings?.width || 1080, h: sceneSettings?.height || 1920 }
  };

  const ASPECT_RATIO_PRESETS = [
    { id: 'v_9_16', label: '9:16 Vertical',  sub: 'TikTok / Reels / Shorts', w: 1080, h: 1920 },
    { id: 'l_16_9', label: '16:9 Landscape', sub: 'YouTube / Cinematic',     w: 1920, h: 1080 },
    { id: 's_1_1',  label: '1:1 Square',     sub: 'Instagram Post',          w: 1080, h: 1080 },
    { id: 'p_4_5',  label: '4:5 Portrait',   sub: 'Instagram Feed Post',     w: 1080, h: 1350 }
  ];

  const [overrideMode, setOverrideMode] = useState('match');
  const [selectedRatioPreset, setSelectedRatioPreset] = useState('v_9_16');
  const [selectedFps, setSelectedFps] = useState(30);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Ready for export');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const isCancelledRef = useRef(false);
  const activeEncoderRef = useRef(null);

  if (!isOpen) return null;

  const formatKey = sceneSettings?.formatPreset || 'v_9_16';
  const activeTemplate = TEMPLATE_LOOKUP[formatKey] || {
    name: 'Custom Workspace',
    w: sceneSettings?.width || 1080,
    h: sceneSettings?.height || 1920
  };

  const currentManualPreset = ASPECT_RATIO_PRESETS.find((p) => p.id === selectedRatioPreset) || ASPECT_RATIO_PRESETS[0];
  const rawWidth  = overrideMode === 'manual' ? currentManualPreset.w : (activeTemplate.w || 1080);
  const rawHeight = overrideMode === 'manual' ? currentManualPreset.h : (activeTemplate.h || 1920);
  const exportWidth  = Math.max(Math.floor(rawWidth  / 2) * 2, 16);
  const exportHeight = Math.max(Math.floor(rawHeight / 2) * 2, 16);

  const maxDim = Math.max(exportWidth, exportHeight);
  let targetBitrate = 15_000_000;
  if (maxDim >= 3840) targetBitrate = 40_000_000;
  else if (maxDim >= 2560) targetBitrate = 25_000_000;

  const computeExportDuration = () => {
    const totalShotsSec = (shots || []).reduce((acc, s) => acc + (s.duration || 2.0), 0);
    const maxAssetEndSec = (assets || []).reduce((acc, asset) => {
      const start = typeof asset.startTimeSec === 'number' ? asset.startTimeSec : 0;
      const dur = asset.duration !== undefined ? asset.duration : (asset.type === 'video' ? 5.0 : asset.type === 'audio' ? 3.0 : 5.0);
      return Math.max(acc, start + dur);
    }, 0);
    const computed = Math.max(totalShotsSec, maxAssetEndSec);
    const fromProp = typeof totalDuration === 'number' && totalDuration > 0 ? totalDuration : 0;
    return Math.max(computed, fromProp, 0.5);
  };

  const handleResetExportState = () => {
    if (activeEncoderRef.current) {
      try { if (activeEncoderRef.current.state !== 'closed') activeEncoderRef.current.close(); } catch (_) {}
      activeEncoderRef.current = null;
    }
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null); setProgress(0); setStatusText('Ready for export'); setErrorMsg(null); setExporting(false);
  };

  const handleCancelExport = () => {
    isCancelledRef.current = true;
    if (activeEncoderRef.current) {
      try { if (activeEncoderRef.current.state !== 'closed') activeEncoderRef.current.close(); } catch (_) {}
      activeEncoderRef.current = null;
    }
    setStatusText('Export cancelled.'); setExporting(false);
  };

  // ── WebCodecs GPU path ──────────────────────────────────────────────────────
  const runWebCodecsGpuExport = async (width, height, bitrate, imageCache, getCameraAtTime, duration, fps) => {
    const totalFrames = Math.max(Math.floor(duration * fps), 1);

    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'avc', width, height },
      fastStart: 'in-memory'
    });

    let encoderError = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => { try { muxer.addVideoChunk(chunk, meta); } catch (e) { encoderError = e; } },
      error: (err) => { console.warn('[WebCodecs error]', err); encoderError = err; }
    });
    activeEncoderRef.current = encoder;

    let codec = 'avc1.640028';
    try {
      const check = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate, hardwareAcceleration: 'prefer-hardware' });
      if (!check?.supported) codec = 'avc1.4d002a';
    } catch (_) { codec = 'avc1.42001f'; }

    try {
      encoder.configure({ codec, width, height, bitrate, bitrateMode: 'variable', hardwareAcceleration: 'prefer-hardware', latencyMode: 'quality' });
    } catch (configErr) {
      console.warn('[WebCodecs configure failed]', configErr);
      if (encoder.state !== 'closed') try { encoder.close(); } catch (_) {}
      activeEncoderRef.current = null;
      return false;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });

    let encodedCount = 0;
    let handshakeDone = false;
    const watchdog = setTimeout(() => {
      if (!handshakeDone && activeEncoderRef.current) {
        try { if (activeEncoderRef.current.state !== 'closed') activeEncoderRef.current.close(); } catch (_) {}
        activeEncoderRef.current = null;
      }
    }, 3000);

    for (let fi = 0; fi < totalFrames; fi++) {
      if (fi === 1) { handshakeDone = true; clearTimeout(watchdog); }
      if (isCancelledRef.current || encoderError || encoder.state !== 'configured') {
        clearTimeout(watchdog);
        if (encoder.state !== 'closed') try { encoder.close(); } catch (_) {}
        activeEncoderRef.current = null;
        return false;
      }

      const t = fi / fps;
      const cam = getCameraAtTime(t);
      if (typeof onScrubTimestamp === 'function') onScrubTimestamp(t);
      renderSceneToCanvas(ctx, width, height, cam, assets, sceneSettings, imageCache, t, duration);

      while (encoder.encodeQueueSize > 10 && encoder.state === 'configured') {
        await new Promise((r) => setTimeout(r, 5));
      }

      const tsUs  = Math.round((fi * 1_000_000) / fps);
      const durUs = Math.round(1_000_000 / fps);
      const frame = new VideoFrame(canvas, { timestamp: tsUs, duration: durUs });

      if (encoder.state === 'configured') {
        try { encoder.encode(frame, { keyFrame: fi % (fps * 2) === 0 }); encodedCount++; }
        catch (encErr) {
          frame.close();
          if (encoder.state !== 'closed') try { encoder.close(); } catch (_) {}
          activeEncoderRef.current = null;
          return false;
        }
      } else { frame.close(); return false; }
      frame.close();

      const pct = Math.round(((fi + 1) / totalFrames) * 92);
      setProgress(pct);
      setStatusText(`GPU Encoding ${width}x${height} (${pct}%)`);
    }

    if (encodedCount === 0) throw new Error('Zero frames were encoded.');

    setStatusText('Flushing encoder...');
    if (encoder.state === 'configured') try { await encoder.flush(); } catch (_) {}
    if (encoder.state !== 'closed') try { encoder.close(); } catch (_) {}
    activeEncoderRef.current = null;

    muxer.finalize();
    const { buffer } = muxer.target;
    const blob = new Blob([buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url); setProgress(100);
    setStatusText(`Export complete! ${width}x${height} @ ${fps} FPS`);

    const a = document.createElement('a');
    a.href = url;
    a.download = `kanto-motion-${width}x${height}-${fps}fps-${Date.now()}.mp4`;
    document.body.appendChild(a); a.click(); a.remove();
    return true;
  };

  // ── Software MediaRecorder fallback ─────────────────────────────────────────
  const runSoftwareExport = (width, height, imageCache, getCameraAtTime, duration, fps) =>
    new Promise((resolve, reject) => {
      try {
        const totalFrames = Math.max(Math.floor(duration * fps), 1);
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
        renderSceneToCanvas(ctx, width, height, getCameraAtTime(0), assets, sceneSettings, imageCache, 0, duration);

        let mimeType = 'video/webm;codecs=vp9';
        for (const t of ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8', 'video/webm']) {
          if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) { mimeType = t; break; }
        }
        console.log(`[Software Export] mimeType=${mimeType}, fps=${fps}, totalFrames=${totalFrames}`);

        const stream = canvas.captureStream(fps);
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: targetBitrate });
        const chunks = [];

        recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data); };
        recorder.onerror = (e) => reject(e.error || new Error('MediaRecorder error'));
        recorder.onstop = () => {
          if (isCancelledRef.current) { setStatusText('Export cancelled.'); setExporting(false); resolve(false); return; }
          try {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
            setDownloadUrl(url); setProgress(100);
            setStatusText(`Export complete! ${width}x${height} @ ${fps} FPS (.${ext})`);
            setExporting(false);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kanto-motion-${width}x${height}-${fps}fps-${Date.now()}.${ext}`;
            document.body.appendChild(a); a.click(); a.remove();
            resolve(true);
          } catch (e) { reject(e); }
        };

        recorder.start(100);
        (async () => {
          try {
            const videoTrack = stream.getVideoTracks()[0];
            const frameMs = Math.round(1000 / fps);
            for (let fi = 0; fi < totalFrames; fi++) {
              if (isCancelledRef.current) { if (recorder.state !== 'inactive') recorder.stop(); return; }
              const t = fi / fps;
              const cam = getCameraAtTime(t);
              if (typeof onScrubTimestamp === 'function') onScrubTimestamp(t);
              try { renderSceneToCanvas(ctx, width, height, cam, assets, sceneSettings, imageCache, t, duration); } catch (_) {}
              if (videoTrack?.requestFrame) videoTrack.requestFrame();
              await new Promise((r) => setTimeout(r, frameMs));
              const pct = Math.min(Math.round(((fi + 1) / totalFrames) * 96), 96);
              setProgress(pct);
              setStatusText(`Rendering frame ${fi + 1}/${totalFrames} (${pct}%)`);
            }
            await new Promise((r) => setTimeout(r, 300));
            if (recorder.state !== 'inactive') recorder.stop();
          } catch (loopErr) {
            if (recorder.state !== 'inactive') try { recorder.stop(); } catch (_) {}
            reject(loopErr);
          }
        })();
      } catch (err) { reject(err); }
    });

  // ── Main handler ────────────────────────────────────────────────────────────
  const handleStartExport = async () => {
    try {
      isCancelledRef.current = false;
      setExporting(true); setProgress(0); setDownloadUrl(null); setErrorMsg(null);
      setStatusText('Preparing scene elements...');

      const exportDuration = computeExportDuration();
      const fps = selectedFps;
      const totalFrames = Math.max(Math.floor(exportDuration * fps), 1);
      console.log(`[Export] Duration=${exportDuration.toFixed(2)}s FPS=${fps} Frames=${totalFrames} Size=${exportWidth}x${exportHeight}`);

      if (exportDuration <= 0 || totalFrames <= 0) {
        throw new Error('Timeline duration is 0. Add clips or camera shots with duration > 0 and try again.');
      }

      // Pre-load assets
      console.log(`[Export] Pre-loading ${(assets || []).length} assets...`);
      const imageCache = new Map();
      await Promise.all(
        (assets || []).map(async (asset) => {
          try {
            if (asset.type === 'audio' || asset.category === 'Audio') return;
            if (typeof asset.renderSvg === 'function' || asset.type === 'svg' || asset.svgCategory) {
              const img = await withTimeout(loadSvgAsset(asset), 3000);
              if (img) { imageCache.set(asset.id, img); return; }
            }
            if (asset.type === 'video' || /\.(mp4|webm|mov|ogv)(\?|$)/i.test(asset.src || asset.url || '')) {
              const vid = await withTimeout(loadVideoAsset(asset.src || asset.url), 4000);
              if (vid) { imageCache.set(asset.id, vid); return; }
            }
            if ((asset.url || asset.src) && asset.type !== 'modular_body_part') {
              const img = await withTimeout(loadRasterAsset(asset.src || asset.url), 3000);
              if (img) imageCache.set(asset.id, img);
            }
          } catch (err) {
            console.warn(`[Export] Asset warn (${asset.id}):`, err);
          }
        })
      );
      console.log(`[Export] Cache ready: ${imageCache.size} items`);

      if (isCancelledRef.current) { setStatusText('Export cancelled.'); setExporting(false); return; }

      const getCameraAtTime = buildCameraEvaluator(shots, camera);

      let gpuSuccess = false;
      if (typeof window.VideoEncoder === 'function') {
        try {
          setStatusText(`Initializing GPU Export (${exportWidth}x${exportHeight})...`);
          gpuSuccess = await runWebCodecsGpuExport(
            exportWidth, exportHeight, targetBitrate,
            imageCache, getCameraAtTime, exportDuration, fps
          );
        } catch (gpuErr) {
          console.warn('[Export] GPU failed, using software:', gpuErr.message);
          gpuSuccess = false;
        }
      }

      if (!gpuSuccess && !isCancelledRef.current) {
        setStatusText(`Software Rendering ${exportWidth}x${exportHeight}...`);
        await runSoftwareExport(exportWidth, exportHeight, imageCache, getCameraAtTime, exportDuration, fps);
      }

    } catch (err) {
      if (isCancelledRef.current) {
        setStatusText('Export cancelled.');
      } else {
        console.error('[Export Error]:', err);
        setErrorMsg(err.message || 'Export failed. Check browser console for details.');
        setStatusText('Export failed.');
      }
    } finally {
      setExporting(false);
    }
  };

  const exportDurPreview = computeExportDuration();
  const totalFramesPreview = Math.max(Math.floor(exportDurPreview * selectedFps), 1);

  return (
    <div className="fixed inset-0 z-50 bg-[#2A2529]/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-[#2A2529] border border-white/10 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-[#F3F0E7]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold">Export Video</h3>
                <span className="bg-[#F3F0E7] text-[#2A2529] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">FRAME-ACCURATE</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">Renders every element from your timeline</p>
            </div>
          </div>
          {!exporting && (
            <button onClick={onClose} className="text-zinc-400 hover:text-[#F3F0E7] p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form */}
        {!exporting && !downloadUrl && (
          <div className="space-y-4">
            <div className="p-2.5 bg-[#211C1F] rounded-xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#F3F0E7]" />
                <span className="text-xs font-semibold">Active Template:</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#F3F0E7] bg-[#2A2529] px-2 py-0.5 rounded border border-white/15">{activeTemplate.name}</span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Resolution</span>
                <span className="font-mono text-[10px] text-zinc-300 font-bold">{exportWidth} x {exportHeight} PX</span>
              </label>
              <div className="grid grid-cols-2 gap-2 bg-[#211C1F] p-1 rounded-xl border border-white/10">
                <button type="button" onClick={() => setOverrideMode('match')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${overrideMode === 'match' ? 'bg-[#F3F0E7] text-[#2A2529] shadow-sm font-bold' : 'text-zinc-400 hover:text-[#F3F0E7]'}`}>
                  <Monitor className="w-3.5 h-3.5" />Match Template
                </button>
                <button type="button" onClick={() => setOverrideMode('manual')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${overrideMode === 'manual' ? 'bg-[#F3F0E7] text-[#2A2529] shadow-sm font-bold' : 'text-zinc-400 hover:text-[#F3F0E7]'}`}>
                  <LayoutGrid className="w-3.5 h-3.5" />Preset Ratios
                </button>
              </div>
              {overrideMode === 'manual' && (
                <div className="p-3 bg-[#211C1F] rounded-xl border border-white/10 space-y-2">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Select Aspect Ratio:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {ASPECT_RATIO_PRESETS.map((p) => (
                      <button key={p.id} type="button" onClick={() => setSelectedRatioPreset(p.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${selectedRatioPreset === p.id ? 'bg-[#F3F0E7] text-[#2A2529] border-white font-bold shadow-md' : 'bg-[#2A2529] border-white/10 text-zinc-400 hover:text-[#F3F0E7] hover:border-white/20'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold">{p.label}</span>
                          <span className="text-[9px] font-mono opacity-75">{p.w}x{p.h}</span>
                        </div>
                        <span className="text-[9px] block opacity-70 mt-0.5">{p.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider block">Frame Rate (FPS)</label>
              <div className="grid grid-cols-3 gap-2">
                {FPS_OPTIONS.map((item) => (
                  <button key={item.fps} type="button" onClick={() => setSelectedFps(item.fps)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${selectedFps === item.fps ? 'bg-[#F3F0E7] text-[#2A2529] border-white font-bold shadow-md' : 'bg-[#211C1F] border-white/10 text-zinc-400 hover:text-[#F3F0E7] hover:border-white/20'}`}>
                    <span className="text-xs block font-mono font-bold">{item.label}</span>
                    <span className="text-[9px] opacity-75 block">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#211C1F] p-3 rounded-xl border border-white/10 text-[11px] space-y-1.5 font-mono text-zinc-400">
              <div className="flex justify-between"><span>SEQUENCE DURATION:</span><span className="text-[#F3F0E7] font-semibold">{exportDurPreview.toFixed(1)}s</span></div>
              <div className="flex justify-between"><span>TOTAL FRAMES:</span><span className="text-[#F3F0E7] font-semibold">{totalFramesPreview}</span></div>
              <div className="flex justify-between"><span>VISUAL CLIPS:</span><span className="text-[#F3F0E7] font-semibold">{(assets || []).filter(a => a.type !== 'audio').length}</span></div>
              <div className="flex justify-between"><span>CAMERA SHOTS:</span><span className="text-[#F3F0E7] font-semibold">{(shots || []).length}</span></div>
              <div className="flex justify-between border-t border-white/5 pt-1"><span>EXPORT RESOLUTION:</span><span className="text-emerald-400 font-bold">{exportWidth} x {exportHeight} PX</span></div>
            </div>

            {(shots || []).length === 0 && (
              <div className="p-2.5 bg-amber-950/40 border border-amber-800/50 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No camera shots captured. Export will use the current camera position.</span>
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        {exporting && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300 flex items-center gap-1.5 truncate max-w-[280px]">
                <Loader2 className="w-3.5 h-3.5 text-[#F3F0E7] animate-spin shrink-0" />
                {statusText}
              </span>
              <span className="text-[#F3F0E7] font-bold shrink-0">{progress}%</span>
            </div>
            <div className="w-full bg-[#211C1F] rounded-full h-2 overflow-hidden border border-white/10">
              <div className="bg-[#F3F0E7] h-full transition-all duration-150 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={handleCancelExport}
                className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                <Ban className="w-3.5 h-3.5 text-rose-400" /> Cancel Export
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {downloadUrl && !exporting && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Export ready! ({exportWidth}x{exportHeight} @ {selectedFps} FPS)</span>
              </div>
              <a href={downloadUrl}
                download={`kanto-motion-${exportWidth}x${exportHeight}-${selectedFps}fps-${Date.now()}.${downloadUrl.includes('webm') ? 'webm' : 'mp4'}`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 text-[11px] transition-colors shrink-0 shadow-md">
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
            <div className="flex justify-end">
              <button onClick={handleResetExportState}
                className="bg-[#211C1F] hover:bg-[#353034] text-zinc-300 border border-white/10 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                <RotateCcw className="w-3.5 h-3.5 text-[#F3F0E7]" /> Export Again
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button onClick={onClose} disabled={exporting}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-[#211C1F] border border-white/10 rounded-lg transition-colors disabled:opacity-40">
            Close
          </button>
          {!downloadUrl && (
            <button onClick={handleStartExport} disabled={exporting}
              className="px-4 py-1.5 text-xs font-bold text-[#2A2529] bg-[#F3F0E7] hover:bg-white rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40">
              {exporting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Encoding {progress}%</span></>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /><span>Export MP4 ({exportWidth}x{exportHeight})</span></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
