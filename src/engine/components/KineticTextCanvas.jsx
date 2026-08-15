import React, { useRef, useEffect } from 'react';
import { renderKineticTextToCanvas } from '../utils/kineticTypography';

export default function KineticTextCanvas({ asset, currentTimeSec = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const textValue = asset?.textValue || asset?.textContent || asset?.text || 'Sample Text';
    const fontSize = asset?.fontSize || 48;
    const fontFamily = asset?.fontFamily || 'Inter';
    const lineHeight = asset?.lineHeight || 1.2;
    const strokeWidth = asset?.strokeWidth || 0;
    const letterSpacing = asset?.letterSpacing || 0;

    // Measure text dimensions accurately
    ctx.font = `600 ${fontSize}px '${fontFamily}', sans-serif`;
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = `${letterSpacing}px`;
    }
    const lines = textValue.split('\n');
    let maxLineWidth = 0;
    lines.forEach((l) => {
      const m = ctx.measureText(l);
      const width = m.width || 10;
      const actualLeft = m.actualBoundingBoxLeft || 0;
      const actualRight = m.actualBoundingBoxRight || 0;
      const boundingWidth = (actualLeft + actualRight) > width ? (actualLeft + actualRight) : width;
      if (boundingWidth > maxLineWidth) maxLineWidth = boundingWidth;
    });

    const totalTextHeight = lines.length * fontSize * lineHeight;
    const calculatedWidth = Math.ceil(maxLineWidth + strokeWidth * 2 + Math.abs(letterSpacing * textValue.length) + 60);
    const calculatedHeight = Math.ceil(totalTextHeight + strokeWidth * 2 + 40);

    const width = Math.max(calculatedWidth, asset?.width || 300);
    const height = Math.max(calculatedHeight, asset?.height || 100);

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
        renderKineticTextToCanvas(ctx, { ...asset, width, height }, currentTimeSec);
      }
    } catch (err) {
      console.error("CRITICAL CANVAS ERROR in KineticTextCanvas:", err);
    } finally {
      // ALWAYS RESTORE AND RESET CANVAS TRANSFORM MATRIX
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }, [asset, currentTimeSec]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: 'auto',
        height: 'auto',
        maxWidth: 'none',
        pointerEvents: 'none',
        display: 'block',
        whiteSpace: 'pre'
      }}
    />
  );
}
