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
    } catch (err) {
      console.error('[KantoTextOverlay] Renderer init failed:', err);
    }

    return () => {
      rendererRef.current = null;
    };
  }, [sceneWidth, sceneHeight]);

  // Update active layer & dimensions
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setDimensions(dimensions);
      rendererRef.current.setActiveLayerId(activeLayerId);
    }
  }, [activeLayerId, sceneWidth, sceneHeight]);

  // Render loop synchronized with Kanto Motion playhead
  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;

      if (rendererRef.current && canvasRef.current) {
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

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentTimeSec, totalDurationSec, isPlaying, layers]);

  // World coordinates converter
  const getWorldCoordinates = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = sceneWidth / rect.width;
      const scaleY = sceneHeight / rect.height;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [sceneWidth, sceneHeight]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const coords = getWorldCoordinates(e.clientX, e.clientY);
    if (!coords || !rendererRef.current) return;
    const hit = rendererRef.current.handlePointerDown(coords.x, coords.y, layers);
    if (hit) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.stopPropagation();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const coords = getWorldCoordinates(e.clientX, e.clientY);
    if (!coords || !rendererRef.current) return;
    rendererRef.current.handlePointerMove(coords.x, coords.y, layers);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    rendererRef.current?.handlePointerUp();
  };

  return (
    <canvas
      ref={canvasRef}
      width={sceneWidth}
      height={sceneHeight}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute inset-0 w-full h-full ${interactive ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
      style={{
        zIndex: 100,
        background: 'transparent',
      }}
    />
  );
};

export default KantoTextOverlay;
