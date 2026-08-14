import React, { useEffect, useRef, useCallback } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { CanvasRenderer } from '../engine/CanvasRenderer';
import type { KantoTextNode } from '../types/engine';

interface KantoTextOverlayProps {
  currentTimeSec?: number;
  totalDurationSec?: number;
  isPlaying?: boolean;
  sceneWidth?: number;
  sceneHeight?: number;
  interactive?: boolean;
  onSelectLayer?: (layerId: string | null) => void;
}

export const KantoTextOverlay: React.FC<KantoTextOverlayProps> = ({
  currentTimeSec = 0,
  totalDurationSec = 10,
  isPlaying = false,
  sceneWidth = 3200,
  sceneHeight = 2400,
  interactive = true,
  onSelectLayer,
}) => {
  const {
    layers,
    activeLayerId,
    updateLayerById,
    selectLayer,
  } = useEngineStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Keep dimensions synced
  const dimensions = {
    name: 'Kanto Scene',
    width: sceneWidth,
    height: sceneHeight,
    aspectRatio: `${sceneWidth}:${sceneHeight}`,
  };

  // Initialize CanvasRenderer
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const renderer = new CanvasRenderer(canvasRef.current, dimensions);
      rendererRef.current = renderer;

      renderer.setCallbacks(
        (layerId, transform) => {
          updateLayerById(layerId, { transform });
        },
        (layerId) => {
          selectLayer(layerId);
          if (onSelectLayer) onSelectLayer(layerId);
        }
      );

      // Force immediate initial frame render
      renderer.render(
        layers,
        currentTimeSec,
        totalDurationSec,
        {
          showSafeAreas: false,
          showGrid: false,
          transparent: true,
        }
      );
    } catch (err) {
      console.error('[KantoTextOverlay] Renderer init failed:', err);
    }

    return () => {
      rendererRef.current = null;
    };
  }, [sceneWidth, sceneHeight]);

  // Synchronous draw function
  const drawFrame = useCallback(() => {
    if (rendererRef.current && canvasRef.current) {
      rendererRef.current.setDimensions(dimensions);
      rendererRef.current.setActiveLayerId(activeLayerId);
      rendererRef.current.render(
        layers,
        currentTimeSec,
        totalDurationSec,
        {
          showSafeAreas: false,
          showGrid: false,
          transparent: true,
        }
      );
    }
  }, [layers, activeLayerId, currentTimeSec, totalDurationSec, sceneWidth, sceneHeight]);

  // Immediate re-render when state changes
  useEffect(() => {
    drawFrame();
  }, [drawFrame]);

  // RAF loop when isPlaying
  useEffect(() => {
    if (!isPlaying) return;

    let active = true;
    const loop = () => {
      if (!active) return;
      drawFrame();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, drawFrame]);

  // World coordinates converter
  const getWorldCoordinates = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = sceneWidth / (rect.width || 1);
      const scaleY = sceneHeight / (rect.height || 1);

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [sceneWidth, sceneHeight]
  );

  // Dynamic hit-testing: pass through pointer events to scene assets unless hovering text / handles
  useEffect(() => {
    if (!interactive) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!rendererRef.current || !canvasRef.current) return;

      if (rendererRef.current.isInteracting()) {
        canvasRef.current.style.pointerEvents = 'auto';
        return;
      }

      const coords = getWorldCoordinates(e.clientX, e.clientY);
      if (!coords) {
        canvasRef.current.style.pointerEvents = 'none';
        return;
      }

      const cursor = rendererRef.current.getCursor(coords.x, coords.y, layers);
      const isOverText = cursor !== 'default';

      canvasRef.current.style.pointerEvents = isOverText ? 'auto' : 'none';
      if (isOverText) {
        canvasRef.current.style.cursor = cursor;
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleWindowPointerMove);
  }, [interactive, layers, getWorldCoordinates]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const coords = getWorldCoordinates(e.clientX, e.clientY);
    if (!coords || !rendererRef.current) return;
    const hit = rendererRef.current.handlePointerDown(coords.x, coords.y, layers);
    if (hit) {
      if (canvasRef.current) {
        canvasRef.current.style.pointerEvents = 'auto';
        canvasRef.current.style.cursor = rendererRef.current.getCursor(coords.x, coords.y, layers);
      }
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.stopPropagation();
    } else {
      if (canvasRef.current) {
        canvasRef.current.style.pointerEvents = 'none';
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const coords = getWorldCoordinates(e.clientX, e.clientY);
    if (!coords || !rendererRef.current) return;
    rendererRef.current.handlePointerMove(coords.x, coords.y, layers);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = rendererRef.current.getCursor(coords.x, coords.y, layers);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    rendererRef.current?.handlePointerUp();
    if (canvasRef.current && rendererRef.current) {
      const coords = getWorldCoordinates(e.clientX, e.clientY);
      const cursor = coords ? rendererRef.current.getCursor(coords.x, coords.y, layers) : 'default';
      canvasRef.current.style.cursor = cursor;
      if (cursor === 'default') {
        canvasRef.current.style.pointerEvents = 'none';
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={sceneWidth}
      height={sceneHeight}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute inset-0 w-full h-full pointer-events-none cursor-default"
      style={{
        zIndex: 1050,
        background: 'transparent',
      }}
    />
  );
};

export default KantoTextOverlay;
