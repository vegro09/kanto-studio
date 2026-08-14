import React, { useRef } from 'react';
import { Camera, Film, Grid, Lock } from 'lucide-react';
import KineticTextCanvas from './KineticTextCanvas';
import { getCanvasFilterString } from '../utils/canvasFilters';
import { evaluateMotionPathAtTime } from '../utils/motionPathEngine';

export default function CameraViewMode({
  assets,
  camera,
  shots = [],
  sceneSettings,
  cameraViewRef,
  activeShotName,
  activeShotIndex,
  isPlaying = false,
  playbackProgress = 0,
  totalDuration = 10
}) {
  const canvasBgColor = (sceneSettings && sceneSettings.bgColor) ? sceneSettings.bgColor : '#FFFFFF';
  const sortedAssets = [...assets].sort((a, b) => a.zIndex - b.zIndex);

  const viewportWidth = camera.width || 270;
  const viewportHeight = camera.height || 480;

  const currentSec = (playbackProgress || 0) * (totalDuration || 10);

  // REAL-TIME DYNAMIC CAMERA MATRIX EVALUATION ACROSS KEYFRAMED SHOTS
  let activeCamX = camera.x;
  let activeCamY = camera.y;
  let activeCamScale = camera.scale || 1.0;

  if (Array.isArray(shots) && shots.length > 0) {
    let cumulativeTime = 0;
    let foundShot = null;
    let nextShot = null;
    let shotLocalProgress = 0;

    for (let i = 0; i < shots.length; i++) {
      const s = shots[i];
      const sDur = s.duration || 2.0;
      if (currentSec >= cumulativeTime && (currentSec < cumulativeTime + sDur || i === shots.length - 1)) {
        foundShot = s;
        nextShot = shots[i + 1] || null;
        shotLocalProgress = Math.min(1, Math.max(0, (currentSec - cumulativeTime) / sDur));
        break;
      }
      cumulativeTime += sDur;
    }

    if (foundShot) {
      if (nextShot && foundShot.transitionType === 'smooth') {
        // Smooth interpolation to next camera shot keyframe
        activeCamX = foundShot.x + (nextShot.x - foundShot.x) * shotLocalProgress;
        activeCamY = foundShot.y + (nextShot.y - foundShot.y) * shotLocalProgress;
        activeCamScale = foundShot.scale + (nextShot.scale - foundShot.scale) * shotLocalProgress;
      } else {
        // Hold / Hard cut to active camera shot keyframe
        activeCamX = foundShot.x;
        activeCamY = foundShot.y;
        activeCamScale = foundShot.scale;
      }
    }
  }

  // REVERSE TRANSFORM MATHEMATICS FOR CAMERA LENS OPTICS
  const viewfinderWidth = (camera.width || 270) * activeCamScale;
  const viewfinderHeight = (camera.height || 480) * activeCamScale;
  const camCenterX = activeCamX + viewfinderWidth / 2;
  const camCenterY = activeCamY + viewfinderHeight / 2;

  const invScale = 1 / activeCamScale;

  const viewportCenterX = viewportWidth / 2;
  const viewportCenterY = viewportHeight / 2;

  const translateX = viewportCenterX - camCenterX * invScale;
  const translateY = viewportCenterY - camCenterY * invScale;

  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-4 relative overflow-hidden select-none">
      {/* Top Header Badge */}
      <div className="absolute top-4 left-6 flex items-center gap-3 z-10">
        <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-md flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-zinc-100 uppercase tracking-wider text-[11px]">CAMERA VIEW (LENS PERSPECTIVE)</span>
          <span className="text-zinc-500 font-mono text-[10px]">{camera.aspectRatio || '9:16'} FRAME</span>
        </div>

        {activeShotName && (
          <div className="bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs px-2.5 py-1 rounded font-mono text-[11px]">
            SHOT #{activeShotIndex + 1}: {activeShotName}
          </div>
        )}
      </div>

      {/* DYNAMIC CAMERA LENS CONTAINER */}
      <div 
        className="relative rounded-lg shadow-2xl border-2 border-blue-500/80 overflow-hidden flex items-center justify-center transition-all duration-75"
        style={{
          width: `${viewportWidth}px`,
          height: `${viewportHeight}px`,
          backgroundColor: canvasBgColor
        }}
      >
        {/* REVERSE RENDER CONTAINER WITH EXPLICIT WORKSPACE BACKGROUND PAINT */}
        <div 
          ref={cameraViewRef}
          className="w-full h-full relative overflow-hidden"
          style={{
            width: `${viewportWidth}px`,
            height: `${viewportHeight}px`,
            backgroundColor: canvasBgColor
          }}
        >
          {/* INVERSE TRANSFORM WRAPPER HOLDING SCENE ASSETS */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4000px',
              height: '4000px',
              backgroundColor: canvasBgColor,
              transform: `translate(${translateX}px, ${translateY}px) scale(${invScale})`,
              transformOrigin: '0 0',
              pointerEvents: 'none'
            }}
          >
            {sortedAssets.filter((a) => a.type !== 'audio' && a.category !== 'Audio').map((asset) => {
              // STRICT IN-POINT & OUT-POINT TIMELINE VISIBILITY CHECK
              const isBackground = asset.type === 'background' || asset.isBackgroundLayer || asset.category === 'Stock';
              if (!isBackground) {
                const startSec = typeof asset.startTimeSec === 'number' ? asset.startTimeSec : 0;
                let duration = asset.duration !== undefined ? asset.duration : (asset.animationDuration || 5.0);

                if (asset.motionPath && asset.motionPath.isPathEnabled) {
                  const pNodes = asset.motionPath.pathNodes || asset.motionPath.nodes;
                  if (Array.isArray(pNodes)) {
                    const totalStop = pNodes.reduce(
                      (sum, n) => sum + (n.isStopNode ? (n.freezeDurationSec !== undefined ? n.freezeDurationSec : 1.0) : 0),
                      0
                    );
                    duration += totalStop;
                  }
                }

                const endSec = startSec + duration;
                if (currentSec < startSec || currentSec > endSec) {
                  return null;
                }
              }

              let renderX = typeof asset.x === 'number' && Number.isFinite(asset.x) && !isNaN(asset.x) ? asset.x : 0;
              let renderY = typeof asset.y === 'number' && Number.isFinite(asset.y) && !isNaN(asset.y) ? asset.y : 0;

              const pathNodes = asset.motionPath?.pathNodes || asset.motionPath?.nodes;
              const hasPathNodes = Array.isArray(pathNodes) && pathNodes.length >= 2;

              if (asset.motionPath && hasPathNodes) {
                try {
                  const evaluated = evaluateMotionPathAtTime(
                    { ...asset.motionPath, pathNodes, nodes: pathNodes },
                    asset.startTimeSec || 0,
                    asset.duration || 5.0,
                    currentSec
                  );
                  if (evaluated && Number.isFinite(evaluated.x) && Number.isFinite(evaluated.y) && !isNaN(evaluated.x) && !isNaN(evaluated.y)) {
                    const halfW = (typeof asset.width === 'number' && asset.width > 0 ? asset.width : 300) / 2;
                    const halfH = (typeof asset.height === 'number' && asset.height > 0 ? asset.height : 100) / 2;
                    renderX = evaluated.x - halfW;
                    renderY = evaluated.y - halfH;
                  }
                } catch (err) {
                  console.error("CameraViewMode Motion Path Error:", err);
                }
              }

              return (
                <div
                  key={asset.id}
                  style={{
                    position: 'absolute',
                    left: `${renderX}px`,
                    top: `${renderY}px`,
                    width: `${asset.width}px`,
                    height: `${asset.height}px`,
                    transform: `rotate(${asset.rotation}deg) scale(${asset.scale})`,
                    transformOrigin: 'center center',
                    opacity: asset.opacity,
                    zIndex: asset.zIndex
                  }}
                >
                {/* 1. TEXT ASSET RENDER */}
                {asset.type === 'text' ? (
                  <KineticTextCanvas
                    asset={asset}
                    currentTimeSec={(playbackProgress || 0) * (totalDuration || 10)}
                  />
                ) : asset.type === 'svg' ? (
                  /* 2. INLINE SVG PROTOTYPING ASSET RENDER */
                  <div 
                    className="w-full h-full flex items-center justify-center pointer-events-none"
                    dangerouslySetInnerHTML={{
                      __html: asset.renderSvg
                        ? asset.renderSvg(
                            asset.color || '#3b82f6',
                            asset.borderColor || '#ffffff',
                            asset.borderWidth !== undefined ? asset.borderWidth : 3,
                            asset.hasBorder !== undefined ? asset.hasBorder : false
                          )
                        : ''
                    }}
                  />
                ) : asset.isSolidColor || (!asset.url && !asset.src) ? (
                  /* 3. SOLID COLOR SCENE RENDER */
                  <div 
                    className="w-full h-full rounded pointer-events-none transition-colors"
                    style={{ backgroundColor: asset.color || '#FFFFFF' }}
                  />
                ) : (asset.type === 'video' || (asset.src && asset.src.match(/\.(mp4|webm|mov|ogv)$/i))) ? (
                  <video
                    src={asset.src || asset.url}
                    playsInline
                    muted
                    preload="auto"
                    style={{ filter: getCanvasFilterString(asset.filterStyle) }}
                    className="w-full h-full object-contain rounded pointer-events-none"
                    ref={(el) => {
                      if (el) {
                        const safeDuration = Math.max(totalDuration || 10, 1.0);
                        const currentSec = (playbackProgress || 0) * safeDuration;
                        const start = asset.startTimeSec || 0;
                        const duration = asset.duration || 5.0;
                        const end = start + duration;

                        if (isPlaying && currentSec >= start && currentSec <= end) {
                          const offset = currentSec - start;
                          if (el.paused) {
                            el.currentTime = offset;
                            el.play().catch(() => {});
                          } else if (Math.abs(el.currentTime - offset) > 0.15) {
                            el.currentTime = offset;
                          }
                        } else {
                          if (!el.paused) el.pause();
                        }
                      }
                    }}
                  />
                ) : (
                  /* 5. RASTER IMAGE ASSET RENDER */
                  <img
                    src={asset.url || asset.src}
                    alt={asset.name}
                    style={{ filter: getCanvasFilterString(asset.filterStyle) }}
                    className="w-full h-full object-contain rounded pointer-events-none"
                  />
                )}
              </div>
            );
          })}
          </div>

          {/* Camera Lens Overlays & Title Safe Guides (EXCLUDED ON EXPORT) */}
          {camera.showGrid && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-30 ignore-on-export">
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-b border-white/15" />
              <div className="border-r border-white/15" />
              <div className="border-r border-white/15" />
              <div className="" />
            </div>
          )}

          {/* Minimalist Lens Watermark Badge (EXCLUDED ON EXPORT) */}
          <div className="absolute bottom-3 right-3 text-[9px] font-mono text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800 pointer-events-none z-30 ignore-on-export">
            {camera.aspectRatio || '9:16'} RECORDING FRAME
          </div>
        </div>
      </div>

      {/* Bottom helper prompt */}
      <div className="absolute bottom-4 text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
        <Film className="w-3.5 h-3.5 text-blue-400" />
        <span>Previewing active camera lens frame. Click "Play Sequence" or "Export MP4".</span>
      </div>
    </main>
  );
}
