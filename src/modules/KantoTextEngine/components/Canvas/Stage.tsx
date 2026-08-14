import React, { useEffect, useRef, useCallback } from 'react';
import { useEngineStore } from '../../store/useEngineStore';
import { CanvasRenderer } from '../../engine/CanvasRenderer';
import { ZoomIn, ZoomOut, Maximize, Lock } from 'lucide-react';

export const Stage: React.FC = () => {
  const {
    layers,
    activeLayerId,
    canvasDimensions,
    zoom,
    setZoom,
    showSafeAreas,
    showGrid,
    isPlaying,
    currentTime,
    setCurrentTime,
    totalDuration,
    playbackSpeed,
    loopPlayback,
    updateActiveLayer,
    updateLayerById,
    selectLayer,
    removeLayer,
  } = useEngineStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Initialize CanvasRenderer
  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new CanvasRenderer(canvasRef.current, canvasDimensions);
    rendererRef.current = renderer;

    renderer.setCallbacks(
      (layerId, transform) => {
        updateLayerById(layerId, { transform });
      },
      (layerId) => {
        selectLayer(layerId);
      }
    );

    return () => {
      rendererRef.current = null;
    };
  }, []);

  // Update renderer dimension & active layer
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setDimensions(canvasDimensions);
      rendererRef.current.setActiveLayerId(activeLayerId);
    }
  }, [canvasDimensions, activeLayerId]);

  // Main 60 FPS Render & Playback Loop
  useEffect(() => {
    let active = true;

    const loop = (now: number) => {
      if (!active) return;
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Update Playback playhead
      if (isPlaying) {
        let nextTime = currentTime + dt * playbackSpeed;
        if (nextTime >= totalDuration) {
          if (loopPlayback) {
            nextTime = 0;
          } else {
            nextTime = totalDuration;
          }
        }
        setCurrentTime(nextTime);
      }

      // Render Canvas
      if (rendererRef.current && canvasRef.current) {
        rendererRef.current.render(layers, currentTime, totalDuration, {
          showSafeAreas,
          showGrid,
        });
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, currentTime, totalDuration, playbackSpeed, loopPlayback, layers, showSafeAreas, showGrid]);

  // Transform Client mouse coords into Canvas World coords
  const getWorldCoordinates = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasDimensions.width / rect.width;
      const scaleY = canvasDimensions.height / rect.height;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [canvasDimensions]
  );

  // Mouse / Touch Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getWorldCoordinates(e.clientX, e.clientY);
    if (!coords || !rendererRef.current) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    rendererRef.current.handlePointerDown(coords.x, coords.y, layers);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getWorldCoordinates(e.clientX, e.clientY);
    if (!coords || !rendererRef.current) return;
    rendererRef.current.handlePointerMove(coords.x, coords.y, layers);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    rendererRef.current?.handlePointerUp();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeLayerId) {
          removeLayer(activeLayerId);
        }
      } else if (e.key === 'Escape') {
        selectLayer(null);
      } else if (activeLayerId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const active = layers.find((l) => l.id === activeLayerId);
        if (!active || active.meta?.locked) return;

        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        updateActiveLayer((prev) => ({
          transform: {
            ...prev.transform,
            x: prev.transform.x + dx,
            y: prev.transform.y + dy,
          },
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLayerId, layers, removeLayer, selectLayer, updateActiveLayer]);

  // Fit to screen helper
  const handleFitZoom = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 80;
    const scaleX = (clientWidth - padding) / canvasDimensions.width;
    const scaleY = (clientHeight - padding) / canvasDimensions.height;
    const fitScale = Math.min(scaleX, scaleY);
    setZoom(Number(fitScale.toFixed(2)));
  };

  const activeLayer = layers.find((l) => l.id === activeLayerId);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-black flex items-center justify-center overflow-hidden p-6 select-none"
    >
      {/* Floating Canvas Zoom Controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center bg-dark-900 rounded p-1 border border-dark-750 gap-1">
        <button
          onClick={() => setZoom(Math.max(0.1, Number((zoom - 0.05).toFixed(2))))}
          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-dark-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono px-2 text-neutral-300 font-medium min-w-[48px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(2.0, Number((zoom + 0.05).toFixed(2))))}
          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-dark-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-dark-700 mx-1" />
        <button
          onClick={handleFitZoom}
          className="px-2 py-1 text-xs bg-dark-800 hover:bg-dark-750 text-white rounded transition-colors flex items-center gap-1 font-mono"
          title="Fit Canvas to Viewport"
        >
          <Maximize className="w-3.5 h-3.5" />
          <span>Fit</span>
        </button>
      </div>

      {/* Active Layer Status Pill */}
      {activeLayer && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-dark-900 px-3 py-1.5 rounded border border-dark-750 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="font-semibold text-white truncate max-w-[160px]">
            {activeLayer.meta?.name || activeLayer.content || 'Layer'}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            ({Math.round(activeLayer.transform.x)}, {Math.round(activeLayer.transform.y)})
          </span>
          {activeLayer.meta?.locked && <Lock className="w-3 h-3 text-neutral-400 ml-1" />}
        </div>
      )}

      {/* Canvas Viewport */}
      <div
        className="relative transition-transform duration-75 ease-out shadow-2xl border border-dark-700"
        style={{
          width: `${canvasDimensions.width * zoom}px`,
          height: `${canvasDimensions.height * zoom}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full cursor-crosshair touch-none bg-black"
        />
      </div>
    </div>
  );
};
