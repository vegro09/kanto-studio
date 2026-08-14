import { create } from 'zustand';
import type { KantoTextNode, CanvasDimensions, PresetEffect } from '../types/engine';

export const CANVAS_PRESETS: CanvasDimensions[] = [
  { name: 'TikTok / Reels (9:16)', width: 1080, height: 1920, aspectRatio: '9:16' },
  { name: 'YouTube / Cinema (16:9)', width: 1920, height: 1080, aspectRatio: '16:9' },
  { name: 'Instagram Square (1:1)', width: 1080, height: 1080, aspectRatio: '1:1' },
  { name: 'Portrait Banner (4:5)', width: 1080, height: 1350, aspectRatio: '4:5' },
];

export type InspectorTab = 'fonts' | 'styles' | 'effects' | 'animations' | 'layers';

export interface EngineState {
  // Layers
  layers: KantoTextNode[];
  activeLayerId: string | null;
  
  // Canvas settings
  canvasDimensions: CanvasDimensions;
  zoom: number;
  showSafeAreas: boolean;
  showGrid: boolean;

  // Timeline / Playback
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  playbackSpeed: number;
  loopPlayback: boolean;

  // UI State
  activeTab: InspectorTab;
  isExportModalOpen: boolean;

  // Actions
  setActiveTab: (tab: InspectorTab) => void;
  setCanvasDimensions: (dimensions: CanvasDimensions) => void;
  setZoom: (zoom: number) => void;
  setShowSafeAreas: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;

  // Playback Actions
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setTotalDuration: (duration: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setLoopPlayback: (loop: boolean) => void;

  // Layer Management
  addLayer: (content?: string, isArabic?: boolean) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  reorderLayers: (startIndex: number, endIndex: number) => void;
  selectLayer: (id: string | null) => void;
  updateActiveLayer: (updates: Partial<KantoTextNode> | ((prev: KantoTextNode) => Partial<KantoTextNode>)) => void;
  updateLayerById: (id: string, updates: Partial<KantoTextNode>) => void;
  
  // Effects & Presets
  applyPreset: (preset: PresetEffect) => void;

  // Export / Import
  getExportData: () => KantoTextNode[];
  importData: (nodes: KantoTextNode[]) => void;
}

const DEFAULT_LAYER_1: KantoTextNode = {
  id: 'layer-1',
  content: 'KANTO MOTION',
  transform: {
    x: 540,
    y: 860,
    scale: 1,
    rotation: 0,
  },
  font: {
    family: 'Bebas Neue',
    size: 110,
    isCustom: false,
  },
  style: {
    fill: '#ffffff',
    opacity: 1,
    stroke: {
      enabled: false,
      color: '#000000',
      width: 0,
    },
    glow: {
      enabled: true,
      color: '#ffffff',
      blur: 16,
    },
    background: {
      enabled: false,
      color: '#000000',
      radius: 0,
      padding: 0,
      opacity: 0,
    },
    spacing: {
      char: 2,
      line: 1.2,
    },
    bold: true,
    italic: false,
    underline: false,
    align: 'center',
  },
  animation: {
    in: {
      type: 'typewriter',
      duration: 1.2,
    },
    out: {
      type: 'dissolve',
      duration: 0.8,
    },
    loop: {
      type: 'pulse',
      speed: 1.0,
    },
  },
  meta: {
    name: 'Main Headline',
    locked: false,
    hidden: false,
    startTime: 0,
    endTime: 3.5,
  },
};

const DEFAULT_LAYER_2: KantoTextNode = {
  id: 'layer-2',
  content: 'كانتو موشن للتصميم',
  transform: {
    x: 540,
    y: 1020,
    scale: 0.9,
    rotation: 0,
  },
  font: {
    family: 'Cairo',
    size: 58,
    isCustom: false,
  },
  style: {
    fill: '#ffffff',
    opacity: 0.9,
    stroke: {
      enabled: false,
      color: '#000000',
      width: 0,
    },
    glow: {
      enabled: false,
      color: '#ffffff',
      blur: 0,
    },
    background: {
      enabled: true,
      color: '#262626',
      radius: 12,
      padding: 16,
      opacity: 0.85,
    },
    spacing: {
      char: 0,
      line: 1.2,
    },
    bold: false,
    italic: false,
    underline: false,
    align: 'center',
  },
  animation: {
    in: {
      type: 'blur-fade',
      duration: 1.0,
    },
    out: {
      type: 'scale-down',
      duration: 0.8,
    },
    loop: {
      type: 'sine-wobble',
      speed: 1.0,
    },
  },
  meta: {
    name: 'Arabic Subtitle',
    locked: false,
    hidden: false,
    startTime: 0.4,
    endTime: 3.5,
  },
};

export const useEngineStore = create<EngineState>((set, get) => ({
  layers: [DEFAULT_LAYER_1, DEFAULT_LAYER_2],
  activeLayerId: 'layer-1',
  canvasDimensions: CANVAS_PRESETS[0], // 9:16 TikTok / Reels
  zoom: 0.42,
  showSafeAreas: true,
  showGrid: false,

  isPlaying: true,
  currentTime: 0,
  totalDuration: 3.5,
  playbackSpeed: 1,
  loopPlayback: true,

  activeTab: 'styles',
  isExportModalOpen: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCanvasDimensions: (dimensions) => set({ canvasDimensions: dimensions }),
  setZoom: (zoom) => set({ zoom }),
  setShowSafeAreas: (showSafeAreas) => set({ showSafeAreas }),
  setShowGrid: (showGrid) => set({ showGrid }),
  setIsExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setTotalDuration: (totalDuration) => set({ totalDuration }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setLoopPlayback: (loopPlayback) => set({ loopPlayback }),

  addLayer: (content = 'New Text Layer', isArabic = false) => {
    const newId = `layer-${Date.now()}`;
    const dims = get().canvasDimensions;
    const newLayer: KantoTextNode = {
      id: newId,
      content: content,
      transform: {
        x: dims.width / 2,
        y: dims.height / 2 + (get().layers.length * 40),
        scale: 1,
        rotation: 0,
      },
      font: {
        family: isArabic ? 'Cairo' : 'Inter',
        size: 72,
        isCustom: false,
      },
      style: {
        fill: '#ffffff',
        opacity: 1,
        stroke: {
          enabled: false,
          color: '#000000',
          width: 2,
        },
        glow: {
          enabled: false,
          color: '#ffffff',
          blur: 10,
        },
        background: {
          enabled: false,
          color: '#1c1c1c',
          radius: 12,
          padding: 16,
          opacity: 0.8,
        },
        spacing: {
          char: 0,
          line: 1.2,
        },
        bold: false,
        italic: false,
        underline: false,
        align: 'center',
      },
      animation: {
        in: {
          type: 'typewriter',
          duration: 1.0,
        },
        out: {
          type: 'dissolve',
          duration: 0.6,
        },
        loop: {
          type: 'pulse',
          speed: 1.0,
        },
      },
      meta: {
        name: `Layer ${get().layers.length + 1}`,
        locked: false,
        hidden: false,
        startTime: 0,
        endTime: get().totalDuration,
      },
    };

    set((state) => ({
      layers: [...state.layers, newLayer],
      activeLayerId: newId,
    }));
  },

  removeLayer: (id) => {
    set((state) => {
      const filtered = state.layers.filter((l) => l.id !== id);
      return {
        layers: filtered,
        activeLayerId: state.activeLayerId === id ? (filtered[0]?.id || null) : state.activeLayerId,
      };
    });
  },

  duplicateLayer: (id) => {
    const layer = get().layers.find((l) => l.id === id);
    if (!layer) return;
    const duplicated: KantoTextNode = {
      ...JSON.parse(JSON.stringify(layer)),
      id: `layer-${Date.now()}`,
      meta: {
        ...layer.meta,
        name: `${layer.meta?.name || 'Layer'} (Copy)`,
      },
      transform: {
        ...layer.transform,
        x: layer.transform.x + 30,
        y: layer.transform.y + 30,
      },
    };
    set((state) => ({
      layers: [...state.layers, duplicated],
      activeLayerId: duplicated.id,
    }));
  },

  reorderLayers: (startIndex, endIndex) => {
    set((state) => {
      const result = Array.from(state.layers);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { layers: result };
    });
  },

  selectLayer: (id) => set({ activeLayerId: id }),

  updateActiveLayer: (updates) => {
    set((state) => {
      if (!state.activeLayerId) return state;
      const updatedLayers: KantoTextNode[] = state.layers.map((layer) => {
        if (layer.id !== state.activeLayerId) return layer;
        const patch = typeof updates === 'function' ? updates(layer) : updates;
        const updated: KantoTextNode = {
          ...layer,
          ...patch,
          transform: { ...layer.transform, ...(patch.transform || {}) },
          font: { ...layer.font, ...(patch.font || {}) },
          style: {
            ...layer.style,
            ...(patch.style || {}),
            stroke: { ...layer.style.stroke, ...(patch.style?.stroke || {}) },
            glow: { ...layer.style.glow, ...(patch.style?.glow || {}) },
            background: { ...layer.style.background, ...(patch.style?.background || {}) },
            spacing: { ...layer.style.spacing, ...(patch.style?.spacing || {}) },
          },
          animation: {
            in: { ...layer.animation.in, ...(patch.animation?.in || {}) },
            out: patch.animation?.out
              ? { ...(layer.animation.out || { type: 'dissolve', duration: 0.8 }), ...patch.animation.out }
              : layer.animation.out,
            loop: { ...layer.animation.loop, ...(patch.animation?.loop || {}) },
          },
          meta: { ...layer.meta, ...(patch.meta || {}) },
        };
        return updated;
      });
      return { layers: updatedLayers };
    });
  },

  updateLayerById: (id, updates) => {
    set((state) => {
      const updatedLayers: KantoTextNode[] = state.layers.map((layer) => {
        if (layer.id !== id) return layer;
        const updated: KantoTextNode = {
          ...layer,
          ...updates,
          transform: { ...layer.transform, ...(updates.transform || {}) },
          font: { ...layer.font, ...(updates.font || {}) },
          style: {
            ...layer.style,
            ...(updates.style || {}),
            stroke: { ...layer.style.stroke, ...(updates.style?.stroke || {}) },
            glow: { ...layer.style.glow, ...(updates.style?.glow || {}) },
            background: { ...layer.style.background, ...(updates.style?.background || {}) },
            spacing: { ...layer.style.spacing, ...(updates.style?.spacing || {}) },
          },
          animation: {
            in: { ...layer.animation.in, ...(updates.animation?.in || {}) },
            out: updates.animation?.out
              ? { ...(layer.animation.out || { type: 'dissolve', duration: 0.8 }), ...updates.animation.out }
              : layer.animation.out,
            loop: { ...layer.animation.loop, ...(updates.animation?.loop || {}) },
          },
          meta: { ...layer.meta, ...(updates.meta || {}) },
        };
        return updated;
      });
      return { layers: updatedLayers };
    });
  },

  applyPreset: (preset) => {
    const active = get().layers.find((l) => l.id === get().activeLayerId);
    if (!active) return;
    get().updateActiveLayer({
      style: {
        ...active.style,
        ...preset.style,
        stroke: { ...active.style.stroke, ...(preset.style.stroke || {}) },
        glow: { ...active.style.glow, ...(preset.style.glow || {}) },
        background: { ...active.style.background, ...(preset.style.background || {}) },
        spacing: { ...active.style.spacing, ...(preset.style.spacing || {}) },
      },
    });
  },

  getExportData: () => {
    return get().layers.map((l) => ({
      id: l.id,
      content: l.content,
      transform: {
        x: Math.round(l.transform.x),
        y: Math.round(l.transform.y),
        scale: Number(l.transform.scale.toFixed(3)),
        rotation: Math.round(l.transform.rotation),
      },
      font: {
        family: l.font.family,
        size: Math.round(l.font.size),
        isCustom: !!l.font.isCustom,
      },
      style: {
        fill: l.style.fill,
        opacity: Number(l.style.opacity.toFixed(2)),
        stroke: {
          enabled: l.style.stroke.enabled,
          color: l.style.stroke.color,
          width: l.style.stroke.width,
        },
        glow: {
          enabled: l.style.glow.enabled,
          color: l.style.glow.color,
          blur: l.style.glow.blur,
        },
        background: {
          enabled: l.style.background.enabled,
          color: l.style.background.color,
          radius: l.style.background.radius,
          padding: l.style.background.padding,
        },
        spacing: {
          char: l.style.spacing.char,
          line: l.style.spacing.line,
        },
      },
      animation: {
        in: {
          type: l.animation.in.type,
          duration: l.animation.in.duration,
        },
        loop: {
          type: l.animation.loop.type,
          speed: l.animation.loop.speed,
        },
      },
    }));
  },

  importData: (nodes) => {
    if (!Array.isArray(nodes) || nodes.length === 0) return;
    set({
      layers: nodes.map((n, idx) => ({
        ...n,
        meta: {
          name: `Layer ${idx + 1}`,
          locked: false,
          hidden: false,
          startTime: 0,
          endTime: 3.5,
        },
      })),
      activeLayerId: nodes[0].id,
      currentTime: 0,
    });
  },
}));
