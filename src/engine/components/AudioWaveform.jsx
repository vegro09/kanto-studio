import React, { useMemo } from 'react';

export default function AudioWaveform({ waveformData = [], width = 120, height = 24, color = '#34d399' }) {
  // Generate fallback peaks array if waveformData is empty
  const bars = useMemo(() => {
    if (waveformData && waveformData.length > 0) {
      return waveformData;
    }
    // Dynamic pseudo-waveform bars for preview
    const sampleCount = Math.max(15, Math.floor(width / 4));
    const generated = [];
    for (let i = 0; i < sampleCount; i++) {
      // Natural speech pattern simulation (alternating peaks & troughs)
      const val = 0.2 + Math.abs(Math.sin(i * 0.4)) * 0.6 + (i % 3 === 0 ? 0.2 : 0);
      generated.push(Math.min(1.0, val));
    }
    return generated;
  }, [waveformData, width]);

  const barWidth = 2;
  const gap = 1.5;
  const totalBarSpace = barWidth + gap;
  const maxBars = Math.floor(width / totalBarSpace);
  const displayBars = bars.slice(0, maxBars);

  return (
    <svg 
      width={width} 
      height={height} 
      className="overflow-hidden pointer-events-none opacity-80"
    >
      {displayBars.map((amplitude, i) => {
        const barHeight = Math.max(3, amplitude * (height - 4));
        const x = i * totalBarSpace;
        const y = (height - barHeight) / 2;

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={1}
            fill={color}
          />
        );
      })}
    </svg>
  );
}
