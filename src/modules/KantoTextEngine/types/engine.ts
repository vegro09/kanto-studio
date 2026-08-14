export interface KantoTextNode {
  id: string;
  content: string;
  transform: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  font: {
    family: string;
    size: number;
    isCustom: boolean;
  };
  style: {
    fill: string;
    opacity: number;
    stroke: {
      enabled: boolean;
      color: string;
      width: number;
    };
    glow: {
      enabled: boolean;
      color: string;
      blur: number;
    };
    background: {
      enabled: boolean;
      color: string;
      radius: number;
      padding: number;
      opacity?: number;
    };
    spacing: {
      char: number;
      line: number;
    };
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: 'left' | 'center' | 'right';
    shadow3D?: {
      enabled: boolean;
      color: string;
      distance: number;
    };
  };
  animation: {
    in: {
      type: 'none' | 'typewriter' | 'blur-fade' | 'slide-up' | 'scale-in' | 'bounce';
      duration: number; // in seconds
    };
    out?: {
      type: 'none' | 'dissolve' | 'scale-down' | 'slide-down' | 'blur-out';
      duration: number; // in seconds
    };
    loop: {
      type: 'none' | 'pulse' | 'sine-wobble' | 'floating' | 'glitch' | 'rainbow-glow';
      speed: number; // multiplier
    };
  };
  meta?: {
    locked?: boolean;
    hidden?: boolean;
    name?: string;
    startTime?: number;
    endTime?: number;
  };
}

export interface CanvasDimensions {
  width: number;
  height: number;
  name: string;
  aspectRatio: string;
}

export interface CustomFontItem {
  name: string;
  family: string;
  url?: string;
  file?: File;
  category: 'arabic' | 'modern' | 'display' | 'custom';
  sampleText: string;
}

export interface PresetEffect {
  id: string;
  name: string;
  previewClass: string;
  style: Partial<KantoTextNode['style']>;
}
