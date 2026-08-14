import React, { useRef, useEffect } from 'react';
import { renderKineticTextToCanvas } from '../utils/kineticTypography';

export default function KineticTextCanvas({ asset, currentTimeSec = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = typeof asset?.width === 'number' && asset.width > 0 ? asset.width : 300;
    const height = typeof asset?.height === 'number' && asset.height > 0 ? asset.height : 100;

    // High-DPI Canvas scaling for Retina crispness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    try {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Frame-Perfect Kinetic Typography Render Loop with Error Boundary
      if (asset) {
        renderKineticTextToCanvas(ctx, asset, currentTimeSec);
      }
    } catch (err) {
      console.error("CRITICAL CANVAS ERROR in KineticTextCanvas:", err);
    } finally {
      // TASK 3: ALWAYS RESTORE AND RESET CANVAS TRANSFORM MATRIX
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }, [asset, currentTimeSec]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${asset?.width || 300}px`,
        height: `${asset?.height || 100}px`,
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
}
