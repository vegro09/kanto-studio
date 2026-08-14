import React from 'react';
import { useEngineStore } from '../../store/useEngineStore';
import {
  Type,
  Palette,
  Layers,
  Sparkles,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Sliders,
} from 'lucide-react';

const MONO_PALETTE = [
  '#ffffff', '#f5f5f5', '#e5e5e5', '#d4d4d4',
  '#a3a3a3', '#737373', '#525252', '#404040',
  '#262626', '#171717', '#0a0a0a', '#000000',
];

export const StylesPanel: React.FC = () => {
  const { layers, activeLayerId, updateActiveLayer } = useEngineStore();
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  if (!activeLayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-6 text-center text-xs">
        <Type className="w-8 h-8 mb-2 opacity-40 text-neutral-400" />
        <span>Select or add a text layer to customize styling.</span>
      </div>
    );
  }

  const { style, font, content } = activeLayer;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4 text-xs select-none">
      {/* 1. Text Content Input */}
      <div className="flex flex-col gap-1.5 bg-dark-900 p-3 rounded border border-dark-750">
        <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-neutral-400" />
            <span>Text Content</span>
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">{content.length} chars</span>
        </label>
        <textarea
          rows={2}
          value={content}
          onChange={(e) => updateActiveLayer({ content: e.target.value })}
          placeholder="Enter text..."
          className="w-full bg-black text-white p-2.5 rounded border border-dark-700 focus:border-white outline-none text-sm resize-none leading-relaxed"
          dir="auto"
        />
      </div>

      {/* 2. Color & Opacity Section */}
      <div className="flex flex-col gap-3 bg-dark-900 p-3 rounded border border-dark-750">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-neutral-400" />
            <span>Fill & Opacity</span>
          </span>
          <div className="flex items-center gap-1.5 bg-black px-2 py-0.5 rounded border border-dark-700">
            <input
              type="color"
              value={style.fill}
              onChange={(e) => updateActiveLayer({ style: { ...style, fill: e.target.value } })}
              className="w-4 h-4 bg-transparent border-0 cursor-pointer"
            />
            <span className="font-mono text-[10px] text-neutral-300 uppercase">{style.fill}</span>
          </div>
        </div>

        {/* Monochromatic Palette */}
        <div className="grid grid-cols-6 gap-1.5">
          {MONO_PALETTE.map((hex) => (
            <button
              key={hex}
              onClick={() => updateActiveLayer({ style: { ...style, fill: hex } })}
              className={`h-6 rounded border transition-transform hover:scale-105 ${
                style.fill.toLowerCase() === hex.toLowerCase() ? 'border-white ring-1 ring-white' : 'border-dark-700'
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>

        {/* Opacity Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] text-neutral-400 font-medium font-mono">
            <span>Opacity</span>
            <span>{Math.round(style.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={style.opacity}
            onChange={(e) => updateActiveLayer({ style: { ...style, opacity: parseFloat(e.target.value) } })}
          />
        </div>
      </div>

      {/* 3. Typography & Spacing */}
      <div className="flex flex-col gap-3 bg-dark-900 p-3 rounded border border-dark-750">
        <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-neutral-400" />
          <span>Typography & Transform</span>
        </span>

        {/* Font Size */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] text-neutral-400 font-medium font-mono">
            <span>Font Size</span>
            <span>{font.size}px</span>
          </div>
          <input
            type="range"
            min="18"
            max="240"
            step="2"
            value={font.size}
            onChange={(e) => updateActiveLayer({ font: { ...font, size: parseInt(e.target.value) } })}
          />
        </div>

        {/* Spacing & Alignment Row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Alignment */}
          <div className="flex bg-black p-1 rounded border border-dark-750 justify-between">
            <button
              onClick={() => updateActiveLayer({ style: { ...style, align: 'left' } })}
              className={`p-1.5 rounded flex-1 flex justify-center ${style.align === 'left' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateActiveLayer({ style: { ...style, align: 'center' } })}
              className={`p-1.5 rounded flex-1 flex justify-center ${style.align === 'center' || !style.align ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateActiveLayer({ style: { ...style, align: 'right' } })}
              className={`p-1.5 rounded flex-1 flex justify-center ${style.align === 'right' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Formats: Bold / Italic / Underline */}
          <div className="flex bg-black p-1 rounded border border-dark-750 justify-between">
            <button
              onClick={() => updateActiveLayer({ style: { ...style, bold: !style.bold } })}
              className={`p-1.5 rounded flex-1 flex justify-center ${style.bold ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateActiveLayer({ style: { ...style, italic: !style.italic } })}
              className={`p-1.5 rounded flex-1 flex justify-center ${style.italic ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateActiveLayer({ style: { ...style, underline: !style.underline } })}
              className={`p-1.5 rounded flex-1 flex justify-center ${style.underline ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Letter Spacing */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] text-neutral-400 font-medium font-mono">
            <span>Letter Spacing</span>
            <span>{style.spacing.char}px</span>
          </div>
          <input
            type="range"
            min="-5"
            max="30"
            step="1"
            value={style.spacing.char}
            onChange={(e) =>
              updateActiveLayer({
                style: {
                  ...style,
                  spacing: { ...style.spacing, char: parseInt(e.target.value) },
                },
              })
            }
          />
        </div>

        {/* Line Height */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] text-neutral-400 font-medium font-mono">
            <span>Line Height</span>
            <span>{style.spacing.line.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="2.5"
            step="0.1"
            value={style.spacing.line}
            onChange={(e) =>
              updateActiveLayer({
                style: {
                  ...style,
                  spacing: { ...style.spacing, line: parseFloat(e.target.value) },
                },
              })
            }
          />
        </div>
      </div>

      {/* 4. Stroke (Outer Border) */}
      <div className="flex flex-col gap-2.5 bg-dark-900 p-3 rounded border border-dark-750">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span>Outer Stroke</span>
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={style.stroke.enabled}
              onChange={(e) =>
                updateActiveLayer({
                  style: {
                    ...style,
                    stroke: { ...style.stroke, enabled: e.target.checked },
                  },
                })
              }
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-white"></div>
          </label>
        </div>

        {style.stroke.enabled && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-400">Stroke Color</span>
              <div className="flex items-center gap-1.5 bg-black px-2 py-0.5 rounded border border-dark-700">
                <input
                  type="color"
                  value={style.stroke.color}
                  onChange={(e) =>
                    updateActiveLayer({
                      style: {
                        ...style,
                        stroke: { ...style.stroke, color: e.target.value },
                      },
                    })
                  }
                  className="w-4 h-4 bg-transparent border-0 cursor-pointer"
                />
                <span className="font-mono text-[10px] text-neutral-300">{style.stroke.color}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>Stroke Width</span>
                <span>{style.stroke.width}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={style.stroke.width}
                onChange={(e) =>
                  updateActiveLayer({
                    style: {
                      ...style,
                      stroke: { ...style.stroke, width: parseInt(e.target.value) },
                    },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Glow (Luminance) */}
      <div className="flex flex-col gap-2.5 bg-dark-900 p-3 rounded border border-dark-750">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span>Glow / Shadow</span>
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={style.glow.enabled}
              onChange={(e) =>
                updateActiveLayer({
                  style: {
                    ...style,
                    glow: { ...style.glow, enabled: e.target.checked },
                  },
                })
              }
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-white"></div>
          </label>
        </div>

        {style.glow.enabled && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-400">Glow Color</span>
              <div className="flex items-center gap-1.5 bg-black px-2 py-0.5 rounded border border-dark-700">
                <input
                  type="color"
                  value={style.glow.color}
                  onChange={(e) =>
                    updateActiveLayer({
                      style: {
                        ...style,
                        glow: { ...style.glow, color: e.target.value },
                      },
                    })
                  }
                  className="w-4 h-4 bg-transparent border-0 cursor-pointer"
                />
                <span className="font-mono text-[10px] text-neutral-300">{style.glow.color}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>Blur Intensity</span>
                <span>{style.glow.blur}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="60"
                step="2"
                value={style.glow.blur}
                onChange={(e) =>
                  updateActiveLayer({
                    style: {
                      ...style,
                      glow: { ...style.glow, blur: parseInt(e.target.value) },
                    },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* 6. Background Box */}
      <div className="flex flex-col gap-2.5 bg-dark-900 p-3 rounded border border-dark-750">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
            <Square className="w-3.5 h-3.5 text-neutral-400" />
            <span>Background Box</span>
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={style.background.enabled}
              onChange={(e) =>
                updateActiveLayer({
                  style: {
                    ...style,
                    background: { ...style.background, enabled: e.target.checked },
                  },
                })
              }
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-white"></div>
          </label>
        </div>

        {style.background.enabled && (
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-400">Box Color</span>
              <div className="flex items-center gap-1.5 bg-black px-2 py-0.5 rounded border border-dark-700">
                <input
                  type="color"
                  value={style.background.color}
                  onChange={(e) =>
                    updateActiveLayer({
                      style: {
                        ...style,
                        background: { ...style.background, color: e.target.value },
                      },
                    })
                  }
                  className="w-4 h-4 bg-transparent border-0 cursor-pointer"
                />
                <span className="font-mono text-[10px] text-neutral-300">{style.background.color}</span>
              </div>
            </div>

            {/* Corner Radius */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>Corner Radius</span>
                <span>{style.background.radius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="2"
                value={style.background.radius}
                onChange={(e) =>
                  updateActiveLayer({
                    style: {
                      ...style,
                      background: { ...style.background, radius: parseInt(e.target.value) },
                    },
                  })
                }
              />
            </div>

            {/* Padding */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>Padding</span>
                <span>{style.background.padding}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="2"
                value={style.background.padding}
                onChange={(e) =>
                  updateActiveLayer({
                    style: {
                      ...style,
                      background: { ...style.background, padding: parseInt(e.target.value) },
                    },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
