import type { KantoTextNode } from '../types/engine';

export interface EvaluatedLayerTransform {
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  blur: number;
  glowBlur: number;
  glowColor: string;
}

// Ease out cubic
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

// Ease out back (for bounce)
function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export class AnimationEngine {
  public static evaluateLayer(layer: KantoTextNode, currentTime: number, totalDuration: number): EvaluatedLayerTransform {
    const startTime = typeof layer.meta?.startTime === 'number' ? layer.meta.startTime : 0;
    const clipDuration = typeof layer.meta?.duration === 'number' && layer.meta.duration > 0
      ? layer.meta.duration
      : (typeof layer.meta?.endTime === 'number' ? Math.max(0.1, layer.meta.endTime - startTime) : 5.0);
    const endTime = startTime + clipDuration;

    // Base properties
    let content = layer.content || '';
    let x = layer.transform.x;
    let y = layer.transform.y;
    let scale = layer.transform.scale;
    let rotation = layer.transform.rotation;
    let opacity = layer.style.opacity ?? 1.0;
    let blur = 0;
    let glowBlur = layer.style.glow?.enabled ? (layer.style.glow.blur || 10) : 0;
    let glowColor = layer.style.glow?.color || '#ffffff';

    // Strict boundary visibility check:
    // If currentTime is strictly outside the clip bounds [startTime, endTime], do NOT render
    if (currentTime < startTime || currentTime > endTime) {
      return { content, x, y, scale, rotation, opacity: 0, blur: 0, glowBlur: 0, glowColor };
    }

    const relTime = currentTime - startTime;
    const timeRemaining = endTime - currentTime;

    // 1. IN-ANIMATION
    const inAnim = layer.animation?.in;
    if (inAnim && inAnim.type && inAnim.type !== 'none' && inAnim.duration > 0) {
      const inProgress = Math.min(1, Math.max(0, relTime / inAnim.duration));
      const easedIn = easeOutCubic(inProgress);

      switch (inAnim.type) {
        case 'typewriter': {
          const totalChars = content.length;
          const visibleCount = Math.ceil(totalChars * inProgress);
          content = content.slice(0, visibleCount);
          break;
        }
        case 'blur-fade': {
          opacity *= easedIn;
          blur = Math.max(0, (1 - easedIn) * 25);
          break;
        }
        case 'slide-up': {
          opacity *= easedIn;
          const slideOffset = (1 - easedIn) * 120;
          y += slideOffset;
          break;
        }
        case 'slide-down': {
          opacity *= easedIn;
          const slideOffset = (1 - easedIn) * 120;
          y -= slideOffset;
          break;
        }
        case 'scale-in': {
          opacity *= easedIn;
          scale *= 0.1 + 0.9 * easedIn;
          break;
        }
        case 'bounce': {
          opacity *= Math.min(1, inProgress * 2);
          const bounceEased = easeOutBack(inProgress);
          scale *= Math.max(0, bounceEased);
          break;
        }
      }
    }

    // 2. OUT-ANIMATION
    const outAnim = layer.animation?.out;
    if (outAnim && outAnim.type && outAnim.type !== 'none' && outAnim.duration > 0 && timeRemaining < outAnim.duration) {
      const outProgress = Math.min(1, Math.max(0, 1 - timeRemaining / outAnim.duration)); // 0 -> 1 during out
      const easedOut = easeOutCubic(outProgress);

      switch (outAnim.type) {
        case 'dissolve': {
          opacity *= 1 - easedOut;
          break;
        }
        case 'scale-down': {
          opacity *= 1 - easedOut;
          scale *= Math.max(0, 1 - easedOut * 0.8);
          break;
        }
        case 'slide-down': {
          opacity *= 1 - easedOut;
          y += easedOut * 120;
          break;
        }
        case 'blur-out': {
          opacity *= 1 - easedOut;
          blur = Math.max(blur, easedOut * 25);
          break;
        }
      }
    }

    // 3. LOOP-ANIMATION (driven by relativeTime from clip start)
    const loopAnim = layer.animation?.loop;
    if (loopAnim && loopAnim.type && loopAnim.type !== 'none') {
      const speed = loopAnim.speed || 1.0;
      const t = relTime * speed;

      switch (loopAnim.type) {
        case 'pulse': {
          const pulse = Math.sin(t * Math.PI * 2) * 0.08;
          scale *= 1 + pulse;
          break;
        }
        case 'sine-wobble': {
          const angleWobble = Math.sin(t * Math.PI * 2) * 4; // +/- 4 deg
          const yBob = Math.cos(t * Math.PI * 2) * 12; // +/- 12px
          rotation += angleWobble;
          y += yBob;
          break;
        }
        case 'floating': {
          const xDrift = Math.sin(t * Math.PI * 1.2) * 8;
          const yDrift = Math.cos(t * Math.PI * 1.5) * 10;
          x += xDrift;
          y += yDrift;
          break;
        }
        case 'glitch': {
          // Periodic jitter
          if (Math.sin(t * 12) > 0.85) {
            x += (Math.random() - 0.5) * 14;
            y += (Math.random() - 0.5) * 6;
            glowBlur = 35;
          }
          break;
        }
        case 'rainbow-glow': {
          const hue = Math.floor((t * 120) % 360);
          glowColor = `hsl(${hue}, 100%, 60%)`;
          glowBlur = 28;
          break;
        }
      }
    }

    return {
      content,
      x,
      y,
      scale,
      rotation,
      opacity: Math.max(0, Math.min(1, opacity)),
      blur,
      glowBlur,
      glowColor,
    };
  }
}
