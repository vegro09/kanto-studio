// KINETIC TYPOGRAPHY ENGINE (15 MATHEMATICAL FRAME-PERFECT TEXT ANIMATION BEHAVIORS)

export const ANIMATION_PRESETS = [
  { id: 'none', label: 'None (Static)' },
  { id: 'fade_in_out', label: 'Fade In / Out' },
  { id: 'typewriter', label: 'Typewriter' },
  { id: 'slide_left', label: 'Slide From Left' },
  { id: 'slide_right', label: 'Slide From Right' },
  { id: 'zoom_in', label: 'Zoom In (Pop)' },
  { id: 'bounce', label: 'Bounce Drop' },
  { id: 'blur_clear', label: 'Blur to Clear' },
  { id: 'rotate_spin', label: 'Rotate & Spin' },
  { id: 'letter_stagger', label: 'Letter Stagger' },
  { id: 'glitch', label: 'Cyber Glitch Reveal' },
  { id: 'waveform', label: 'Waveform Oscillation' },
  { id: 'flip_up', label: 'Flip Up (3D Reveal)' },
  { id: 'neon_glow', label: 'Neon Glow Pulse' },
  { id: 'elastic_bounce', label: 'Elastic Spring Bounce' },
  { id: 'drop_down', label: 'Drop Down (Gravity)' }
];

// Standard Easing Functions
export const easings = {
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
  easeInQuad: (t) => t * t,
  elasticOut: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  }
};

/**
 * Render frame-perfect Text & Typography with Live Stroke, Shadow, Neon Glow, and Animated Shine
 */
export function renderKineticTextToCanvas(ctx, asset, timestampInSeconds = 0) {
  if (!ctx || !asset) return;

  const textValue = asset.textValue || asset.textContent || asset.text || 'Sample Text';
  const fontSize = asset.fontSize || 48;
  const fontFamily = asset.fontFamily || 'Inter';
  const fillColor = asset.fillColor || asset.textColor || asset.color || '#ffffff';
  const opacity = asset.opacity !== undefined ? asset.opacity : 1.0;
  const letterSpacing = asset.letterSpacing || 0;
  const lineHeight = asset.lineHeight || 1.2;
  const textAlign = asset.textAlign || 'center';

  // Advanced Stroke & Shadow Properties
  const strokeWidth = asset.strokeWidth || 0;
  const strokeColor = asset.strokeColor || '#000000';
  const shadowOffsetX = asset.shadowOffsetX || 0;
  const shadowOffsetY = asset.shadowOffsetY || 0;
  const shadowBlur = asset.shadowBlur || 0;
  const shadowColor = asset.shadowColor || 'transparent';

  // Neon Glow Properties
  const neonIntensity = asset.neonIntensity || 0;
  const neonColor = asset.neonColor || '#ffffff';

  // Animated Shine (Light Sweep) Properties
  const shineSpeed = asset.shineSpeed || 0;
  const shineAngle = asset.shineAngle !== undefined ? asset.shineAngle : 45;
  const shineIntensity = asset.shineIntensity !== undefined ? asset.shineIntensity : 0.8;

  const canvasWidth = asset.width || 400;
  const canvasHeight = asset.height || 200;

  ctx.save();

  // Basic Rendering Setup
  ctx.globalAlpha *= opacity;
  ctx.font = `600 ${fontSize}px '${fontFamily}', sans-serif`;
  ctx.fillStyle = fillColor;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'middle';

  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${letterSpacing}px`;
  }

  let textX = canvasWidth / 2;
  if (textAlign === 'left') textX = 20;
  if (textAlign === 'right') textX = canvasWidth - 20;
  const textY = canvasHeight / 2;

  const lines = textValue.split('\n');
  const totalHeight = lines.length * fontSize * lineHeight;
  const startY = textY - (totalHeight / 2) + (fontSize * lineHeight / 2);

  // 1. NEON GLOW PASS (Drawn Behind)
  if (neonIntensity > 0) {
    ctx.save();
    ctx.shadowColor = neonColor;
    ctx.shadowBlur = neonIntensity;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = neonColor;

    lines.forEach((line, idx) => {
      const y = startY + idx * fontSize * lineHeight;
      ctx.fillText(line, textX, y);
    });
    ctx.restore();
  }

  // 2. SHADOWS PASS
  if (shadowBlur > 0 || shadowOffsetX !== 0 || shadowOffsetY !== 0) {
    ctx.shadowColor = shadowColor && shadowColor !== 'transparent' ? shadowColor : '#000000';
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // 3. STROKE PASS
  if (strokeWidth > 0) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    lines.forEach((line, idx) => {
      const y = startY + idx * fontSize * lineHeight;
      ctx.strokeText(line, textX, y);
    });
  }

  // 4. FILL MAIN TEXT PASS
  lines.forEach((line, idx) => {
    const y = startY + idx * fontSize * lineHeight;
    ctx.fillText(line, textX, y);
  });

  // 5. ANIMATED SHINE LOGIC (SOURCE-ATOP COMPOSITING)
  if (shineSpeed > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';

    const radians = (shineAngle * Math.PI) / 180;
    const distance = (timestampInSeconds * shineSpeed * 80) % (canvasWidth * 1.5) - (canvasWidth * 0.5);

    const x1 = textX + Math.cos(radians) * distance;
    const y1 = textY + Math.sin(radians) * distance;
    const x2 = x1 + Math.cos(radians + Math.PI / 2) * 100;
    const y2 = y1 + Math.sin(radians + Math.PI / 2) * 100;

    const shineGradient = ctx.createLinearGradient(x1, y1, x2, y2);
    shineGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
    shineGradient.addColorStop(0.5, `rgba(255, 255, 255, ${shineIntensity})`);
    shineGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

    ctx.fillStyle = shineGradient;
    ctx.fillRect(textX - canvasWidth, textY - canvasHeight, canvasWidth * 2, canvasHeight * 2);
    ctx.restore();
  }

  ctx.restore();
}
