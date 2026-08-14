import type { KantoTextNode, CanvasDimensions } from '../types/engine';
import { AnimationEngine, type EvaluatedLayerTransform } from './AnimationEngine';
import { FontManager } from './FontManager';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  corners: { x: number; y: number }[];
}

export type InteractionMode = 'none' | 'dragging' | 'rotating' | 'resizing-tl' | 'resizing-tr' | 'resizing-bl' | 'resizing-br';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private dimensions: CanvasDimensions;
  
  // Interaction state
  private activeLayerId: string | null = null;
  private interactionMode: InteractionMode = 'none';
  private startPointerPos: { x: number; y: number } = { x: 0, y: 0 };
  private initialLayerTransform: { x: number; y: number; scale: number; rotation: number } = { x: 0, y: 0, scale: 1, rotation: 0 };
  private cachedBoxes: Map<string, BoundingBox> = new Map();

  // High-performance OffscreenCanvas Cache for static text layers
  private staticCache: Map<string, {
    canvas: HTMLCanvasElement;
    boxWidth: number;
    boxHeight: number;
    maxLineWidth: number;
    totalHeight: number;
  }> = new Map();

  // Callbacks
  private onLayerTransformChange?: (layerId: string, transform: { x: number; y: number; scale: number; rotation: number }) => void;
  private onLayerSelect?: (layerId: string | null) => void;

  constructor(canvas: HTMLCanvasElement, dimensions: CanvasDimensions) {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    this.dimensions = dimensions;
  }

  public setDimensions(dimensions: CanvasDimensions) {
    this.dimensions = dimensions;
  }

  public setActiveLayerId(id: string | null) {
    this.activeLayerId = id;
  }

  public setCallbacks(
    onTransform: (layerId: string, transform: { x: number; y: number; scale: number; rotation: number }) => void,
    onSelect: (layerId: string | null) => void
  ) {
    this.onLayerTransformChange = onTransform;
    this.onLayerSelect = onSelect;
  }

  // Draw background, safe areas, grid, layers, and interactive handles
  public render(
    layers: KantoTextNode[],
    currentTime: number,
    totalDuration: number,
    options?: { showSafeAreas?: boolean; showGrid?: boolean; transparent?: boolean }
  ) {
    const { width, height } = this.dimensions;
    const ctx = this.ctx;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    if (!options?.transparent) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
    }

    // Grid (optional)
    if (options?.showGrid) {
      this.drawGrid(width, height);
    }

    // Safe Area Guidelines (optional)
    if (options?.showSafeAreas) {
      this.drawSafeAreas(width, height);
    }

    this.cachedBoxes.clear();

    // Render layers from bottom to top
    for (const layer of layers) {
      if (layer.meta?.hidden) continue;

      const evaluated = AnimationEngine.evaluateLayer(layer, currentTime, totalDuration);
      if (evaluated.opacity <= 0.001) continue;

      const box = this.renderLayer(layer, evaluated);
      this.cachedBoxes.set(layer.id, box);
    }

    // Render interactive controls on top for active layer
    if (this.activeLayerId) {
      const activeLayer = layers.find((l) => l.id === this.activeLayerId);
      const activeBox = this.cachedBoxes.get(this.activeLayerId);
      if (activeLayer && activeBox && !activeLayer.meta?.locked && !activeLayer.meta?.hidden) {
        this.drawSelectionControls(activeBox);
      }
    }
  }

  private renderLayer(layer: KantoTextNode, evaluated: EvaluatedLayerTransform): BoundingBox {
    const ctx = this.ctx;
    ctx.save();

    const { x, y, scale, rotation, opacity, blur, glowBlur, glowColor } = evaluated;
    const content = evaluated.content;

    // Apply main transform
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    if (blur > 0.1) {
      ctx.filter = `blur(${blur}px)`;
    } else {
      ctx.filter = 'none';
    }

    // Font setup
    const fontSize = layer.font.size;
    const fontFamily = layer.font.family;
    const isBold = layer.style.bold ? 'bold ' : '';
    const isItalic = layer.style.italic ? 'italic ' : '';
    ctx.font = `${isItalic}${isBold}${fontSize}px "${fontFamily}", "Cairo", "Inter", sans-serif`;
    ctx.textBaseline = 'middle';

    // Alignment and RTL handling
    const isArabic = FontManager.isArabicString(content);
    ctx.direction = isArabic ? 'rtl' : 'ltr';
    const align = layer.style.align || 'center';
    ctx.textAlign = align;

    // Measure text dimensions
    const lines = content.split('\n');
    const lineHeight = fontSize * (layer.style.spacing?.line || 1.2);
    const lineMetrics = lines.map((l) => ctx.measureText(l));
    const maxLineWidth = Math.max(...lineMetrics.map((m) => m.width), 10);
    const totalHeight = lines.length * lineHeight;

    const bgPadding = layer.style.background?.enabled ? (layer.style.background.padding || 0) : 0;
    const boxWidth = maxLineWidth + bgPadding * 2;
    const boxHeight = totalHeight + bgPadding * 2;

    // 1. Background Box if enabled
    if (layer.style.background?.enabled) {
      const bgRadius = layer.style.background.radius || 0;
      const bgOpacity = layer.style.background.opacity ?? 0.85;
      
      ctx.save();
      ctx.globalAlpha = opacity * bgOpacity;
      ctx.fillStyle = layer.style.background.color;

      const bgX = -boxWidth / 2;
      const bgY = -boxHeight / 2;

      this.drawRoundedRect(ctx, bgX, bgY, boxWidth, boxHeight, bgRadius);
      ctx.fill();
      ctx.restore();
    }

    // 2. 3D Pop Shadow if enabled (optimized step loop)
    if (layer.style.shadow3D?.enabled && layer.style.shadow3D.distance > 0) {
      ctx.save();
      ctx.fillStyle = layer.style.shadow3D.color;
      const dist = layer.style.shadow3D.distance;
      const step = Math.max(1, Math.floor(dist / 4));
      for (let i = dist; i >= 1; i -= step) {
        this.renderTextLines(ctx, lines, i, i, lineHeight, totalHeight, false);
      }
      ctx.restore();
    }

    // 3. Glow if enabled
    if (layer.style.glow?.enabled && glowBlur > 0) {
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = Math.min(glowBlur, 40);
      ctx.fillStyle = glowColor;
      this.renderTextLines(ctx, lines, 0, 0, lineHeight, totalHeight, false);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.restore();
    }

    // 4. Outer Stroke if enabled
    if (layer.style.stroke?.enabled && layer.style.stroke.width > 0) {
      ctx.save();
      ctx.strokeStyle = layer.style.stroke.color;
      ctx.lineWidth = layer.style.stroke.width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      this.renderTextLines(ctx, lines, 0, 0, lineHeight, totalHeight, true);
      ctx.restore();
    }

    // 5. Main Fill Text
    ctx.fillStyle = layer.style.fill;
    this.renderTextLines(ctx, lines, 0, 0, lineHeight, totalHeight, false);

    // 6. Underline if enabled
    if (layer.style.underline) {
      ctx.save();
      ctx.strokeStyle = layer.style.fill;
      ctx.lineWidth = Math.max(2, fontSize * 0.06);
      const underlineY = totalHeight / 2 + 4;
      ctx.beginPath();
      ctx.moveTo(-maxLineWidth / 2, underlineY);
      ctx.lineTo(maxLineWidth / 2, underlineY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Calculate unrotated bounding box points in world coordinates
    const halfW = (boxWidth * scale) / 2;
    const halfH = (boxHeight * scale) / 2;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const corners = [
      { x: x + (-halfW * cos - -halfH * sin), y: y + (-halfW * sin + -halfH * cos) },
      { x: x + (halfW * cos - -halfH * sin), y: y + (halfW * sin + -halfH * cos) },
      { x: x + (halfW * cos - halfH * sin), y: y + (halfW * sin + halfH * cos) },
      { x: x + (-halfW * cos - halfH * sin), y: y + (-halfW * sin + halfH * cos) },
    ];

    return {
      x,
      y,
      width: boxWidth * scale,
      height: boxHeight * scale,
      rotation,
      corners,
    };
  }

  private renderTextLines(
    ctx: CanvasRenderingContext2D,
    lines: string[],
    offsetX: number,
    offsetY: number,
    lineHeight: number,
    totalHeight: number,
    isStroke: boolean
  ) {
    const startY = -totalHeight / 2 + lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
      const lineY = startY + i * lineHeight + offsetY;
      if (isStroke) {
        ctx.strokeText(lines[i], offsetX, lineY);
      } else {
        ctx.fillText(lines[i], offsetX, lineY);
      }
    }
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // Draw Monochromatic White Selection Outline & Corner Handles
  private drawSelectionControls(box: BoundingBox) {
    const ctx = this.ctx;
    ctx.save();

    const { x, y, width, height, rotation } = box;

    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);

    const halfW = width / 2;
    const halfH = height / 2;
    const pad = 12;

    // Crisp White Bounding Box Rect
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(-halfW - pad, -halfH - pad, width + pad * 2, height + pad * 2);
    ctx.setLineDash([]);

    // Rotation Handle Stem & Circle (Monochrome)
    const stemLength = 32;
    const rotY = -halfH - pad - stemLength;

    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.moveTo(0, -halfH - pad);
    ctx.lineTo(0, rotY);
    ctx.stroke();

    // Rotation circle
    ctx.beginPath();
    ctx.arc(0, rotY, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Corner Handles (Crisp White Square Handles with Black Outline)
    const handlePositions = [
      { x: -halfW - pad, y: -halfH - pad }, // TL
      { x: halfW + pad, y: -halfH - pad },  // TR
      { x: halfW + pad, y: halfH + pad },   // BR
      { x: -halfW - pad, y: halfH + pad },  // BL
    ];

    for (const hp of handlePositions) {
      ctx.beginPath();
      ctx.rect(hp.x - 6, hp.y - 6, 12, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawGrid(width: number, height: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const step = 60;

    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawSafeAreas(width: number, height: number) {
    const ctx = this.ctx;
    ctx.save();

    // Center Crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Action Safe (90%)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    const marginX = width * 0.05;
    const marginY = height * 0.05;
    ctx.strokeRect(marginX, marginY, width - marginX * 2, height - marginY * 2);

    // Title Safe (80%)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    const titleMarginX = width * 0.1;
    const titleMarginY = height * 0.1;
    ctx.strokeRect(titleMarginX, titleMarginY, width - titleMarginX * 2, height - titleMarginY * 2);

    ctx.restore();
  }

  // Pointer Interaction Handlers
  public handlePointerDown(worldX: number, worldY: number, layers: KantoTextNode[]): boolean {
    if (this.activeLayerId) {
      const activeBox = this.cachedBoxes.get(this.activeLayerId);
      const activeLayer = layers.find((l) => l.id === this.activeLayerId);
      
      if (activeBox && activeLayer && !activeLayer.meta?.locked) {
        // 1. Check Rotation handle hit (Generous 28px hit radius)
        const rotPoint = this.getRotHandleWorldPos(activeBox);
        const distToRot = Math.hypot(worldX - rotPoint.x, worldY - rotPoint.y);
        if (distToRot <= 28) {
          this.interactionMode = 'rotating';
          this.startPointerPos = { x: worldX, y: worldY };
          this.initialLayerTransform = { ...activeLayer.transform };
          return true;
        }

        // 2. Check Corner Resize Handles (Generous 28px hit radius)
        const cornerHit = this.checkCornerHandleHit(worldX, worldY, activeBox);
        if (cornerHit) {
          this.interactionMode = cornerHit;
          this.startPointerPos = { x: worldX, y: worldY };
          this.initialLayerTransform = { ...activeLayer.transform };
          return true;
        }
      }
    }

    // 3. Check Layer Selection & Translation Hit
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.meta?.hidden || layer.meta?.locked) continue;
      const box = this.cachedBoxes.get(layer.id);
      if (box && this.isPointInsideBox(worldX, worldY, box)) {
        this.activeLayerId = layer.id;
        this.interactionMode = 'dragging';
        this.startPointerPos = { x: worldX, y: worldY };
        this.initialLayerTransform = { ...layer.transform };
        this.onLayerSelect?.(layer.id);
        return true;
      }
    }

    // Clicked empty space: deselect
    this.activeLayerId = null;
    this.interactionMode = 'none';
    this.onLayerSelect?.(null);
    return false;
  }

  public getCursor(worldX: number, worldY: number, layers: KantoTextNode[]): string {
    if (this.interactionMode === 'dragging') return 'grabbing';
    if (this.interactionMode === 'rotating') return 'crosshair';
    if (this.interactionMode.startsWith('resizing')) {
      return this.interactionMode === 'resizing-tl' || this.interactionMode === 'resizing-br' ? 'nwse-resize' : 'nesw-resize';
    }

    if (this.activeLayerId) {
      const activeBox = this.cachedBoxes.get(this.activeLayerId);
      const activeLayer = layers.find((l) => l.id === this.activeLayerId);
      if (activeBox && activeLayer && !activeLayer.meta?.locked) {
        const rotPoint = this.getRotHandleWorldPos(activeBox);
        if (Math.hypot(worldX - rotPoint.x, worldY - rotPoint.y) <= 28) {
          return 'crosshair';
        }
        const cornerHit = this.checkCornerHandleHit(worldX, worldY, activeBox);
        if (cornerHit) {
          return cornerHit === 'resizing-tl' || cornerHit === 'resizing-br' ? 'nwse-resize' : 'nesw-resize';
        }
      }
    }

    // Check if hovering any visible text box
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.meta?.hidden || layer.meta?.locked) continue;
      const box = this.cachedBoxes.get(layer.id);
      if (box && this.isPointInsideBox(worldX, worldY, box)) {
        return 'grab';
      }
    }

    return 'default';
  }

  public handlePointerMove(worldX: number, worldY: number, layers: KantoTextNode[]) {
    if (this.interactionMode === 'none' || !this.activeLayerId) return;

    const layer = layers.find((l) => l.id === this.activeLayerId);
    if (!layer || layer.meta?.locked) return;

    if (this.interactionMode === 'dragging') {
      const dx = worldX - this.startPointerPos.x;
      const dy = worldY - this.startPointerPos.y;

      const newX = Math.round(this.initialLayerTransform.x + dx);
      const newY = Math.round(this.initialLayerTransform.y + dy);

      layer.transform.x = newX;
      layer.transform.y = newY;

      this.onLayerTransformChange?.(layer.id, {
        x: newX,
        y: newY,
        scale: layer.transform.scale,
        rotation: layer.transform.rotation,
      });
    } else if (this.interactionMode === 'rotating') {
      const angleRad = Math.atan2(worldY - layer.transform.y, worldX - layer.transform.x);
      let angleDeg = (angleRad * 180) / Math.PI + 90;
      if (angleDeg < 0) angleDeg += 360;

      // Snap to 0, 90, 180, 270 within 4 degrees
      for (const snap of [0, 90, 180, 270, 360]) {
        if (Math.abs(angleDeg - snap) < 4) {
          angleDeg = snap % 360;
          break;
        }
      }

      const rot = Math.round(angleDeg);
      layer.transform.rotation = rot;

      this.onLayerTransformChange?.(layer.id, {
        x: layer.transform.x,
        y: layer.transform.y,
        scale: layer.transform.scale,
        rotation: rot,
      });
    } else if (this.interactionMode.startsWith('resizing')) {
      const initialDist = Math.hypot(
        this.startPointerPos.x - layer.transform.x,
        this.startPointerPos.y - layer.transform.y
      );
      const currentDist = Math.hypot(worldX - layer.transform.x, worldY - layer.transform.y);

      if (initialDist > 5) {
        const scaleFactor = currentDist / initialDist;
        const newScale = Math.max(0.1, Math.min(10, this.initialLayerTransform.scale * scaleFactor));
        const scaledVal = Number(newScale.toFixed(3));
        layer.transform.scale = scaledVal;

        this.onLayerTransformChange?.(layer.id, {
          x: layer.transform.x,
          y: layer.transform.y,
          scale: scaledVal,
          rotation: layer.transform.rotation,
        });
      }
    }
  }

  public handlePointerUp() {
    this.interactionMode = 'none';
  }

  // Geometry Helpers
  private isPointInsideBox(px: number, py: number, box: BoundingBox): boolean {
    const { x, y, width, height, rotation } = box;
    const rad = (-rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const dx = px - x;
    const dy = py - y;

    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    const pad = 16;
    return (
      localX >= -width / 2 - pad &&
      localX <= width / 2 + pad &&
      localY >= -height / 2 - pad &&
      localY <= height / 2 + pad
    );
  }

  private getRotHandleWorldPos(box: BoundingBox): { x: number; y: number } {
    const { x, y, height, rotation } = box;
    const rad = (rotation * Math.PI) / 180;
    const dist = height / 2 + 12 + 32;
    return {
      x: x + Math.sin(rad) * dist,
      y: y - Math.cos(rad) * dist,
    };
  }

  private checkCornerHandleHit(px: number, py: number, box: BoundingBox): InteractionMode | null {
    const { x, y, width, height, rotation } = box;
    const rad = (-rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const dx = px - x;
    const dy = py - y;

    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    const halfW = width / 2 + 12;
    const halfH = height / 2 + 12;
    const r = 28; // Generous hit radius for mouse & touch

    if (Math.hypot(localX - -halfW, localY - -halfH) <= r) return 'resizing-tl';
    if (Math.hypot(localX - halfW, localY - -halfH) <= r) return 'resizing-tr';
    if (Math.hypot(localX - halfW, localY - halfH) <= r) return 'resizing-br';
    if (Math.hypot(localX - -halfW, localY - halfH) <= r) return 'resizing-bl';

    return null;
  }
}
