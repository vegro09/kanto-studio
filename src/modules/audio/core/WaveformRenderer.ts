/**
 * Kanto Audio Engineer - WaveformRenderer
 * High-precision canvas-based waveform amplitude drawing
 */

export function drawWaveform(
  canvas: HTMLCanvasElement,
  buffer: AudioBuffer,
  width: number,
  height: number,
  color: string = 'rgba(255, 255, 255, 0.85)'
) {
  if (!canvas || !buffer) return;
  const dpr = window.devicePixelRatio || 1;
  const renderWidth = Math.max(1, Math.floor(width));
  const renderHeight = Math.max(1, Math.floor(height));

  canvas.width = Math.floor(renderWidth * dpr);
  canvas.height = Math.floor(renderHeight * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, renderWidth, renderHeight);

  const rawData = buffer.getChannelData(0);
  const totalSamples = rawData.length;
  const step = Math.max(1, Math.ceil(totalSamples / renderWidth));
  const amp = renderHeight / 2;

  ctx.fillStyle = color;

  for (let i = 0; i < renderWidth; i++) {
    let min = 1.0;
    let max = -1.0;

    for (let j = 0; j < step; j++) {
      const idx = i * step + j;
      if (idx < totalSamples) {
        const datum = rawData[idx];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
    }

    if (min > max) {
      min = 0;
      max = 0;
    }

    // Draw vertical peak line
    const y1 = (1 + min) * amp;
    const y2 = Math.max((1 + max) * amp, y1 + 1);
    ctx.fillRect(i, y1, 1, Math.max(1, y2 - y1));
  }
}
