import React, { useRef } from 'react';
import { useEngineStore, CANVAS_PRESETS } from '../store/useEngineStore';
import { 
  Plus, 
  Upload, 
  Grid, 
  Maximize2, 
  FileCode2,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Header: React.FC = () => {
  const {
    canvasDimensions,
    setCanvasDimensions,
    showGrid,
    setShowGrid,
    showSafeAreas,
    setShowSafeAreas,
    addLayer,
    setIsExportModalOpen,
    importData,
  } = useEngineStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddText = () => {
    addLayer('New Text Layer', false);
  };

  const handleAddArabicText = () => {
    addLayer('نص عربي جديد', true);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          importData(json);
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.1 } });
        } else {
          alert('Invalid file. Must contain a valid KantoTextNode array.');
        }
      } catch (err) {
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-14 bg-dark-900 border-b border-dark-750 px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded border border-white/40 bg-black flex items-center justify-center">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white tracking-widest">KANTO</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/20 text-neutral-300 font-mono">
              TEXT ENGINE
            </span>
          </div>
          <span className="text-[10px] text-neutral-400">Professional Text & Motion Graphics</span>
        </div>
      </div>

      {/* Center Controls: Aspect Ratio & View Options & Add Layer */}
      <div className="flex items-center gap-2">
        {/* Aspect Ratio Selector */}
        <div className="flex items-center bg-black p-0.5 rounded border border-dark-750">
          {CANVAS_PRESETS.map((preset) => {
            const isSelected = canvasDimensions.aspectRatio === preset.aspectRatio;
            return (
              <button
                key={preset.aspectRatio}
                onClick={() => setCanvasDimensions(preset)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  isSelected
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-dark-800'
                }`}
                title={`${preset.name} (${preset.width}x${preset.height})`}
              >
                {preset.aspectRatio}
              </button>
            );
          })}
        </div>

        {/* View Helpers */}
        <div className="flex items-center bg-black rounded border border-dark-750 p-0.5">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded transition-colors ${
              showGrid ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
            }`}
            title="Toggle Grid Overlay"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSafeAreas(!showSafeAreas)}
            className={`p-1.5 rounded transition-colors ${
              showSafeAreas ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
            }`}
            title="Toggle Safe Area Guides"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Add Layer Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddText}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-neutral-200 text-xs font-semibold rounded border border-white transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Add Text</span>
          </button>
          <button
            onClick={handleAddArabicText}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-black hover:bg-dark-800 text-neutral-300 hover:text-white text-xs font-medium rounded border border-dark-700 transition-colors"
            title="Add Arabic Text Layer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Arabic Text</span>
          </button>
        </div>
      </div>

      {/* Right Controls: Import & Export Schema */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black hover:bg-dark-800 text-neutral-300 hover:text-white text-xs rounded border border-dark-750 transition-colors"
          title="Import JSON Scene"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Import</span>
        </button>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-white text-black text-xs font-bold rounded border border-white transition-all active:scale-95"
          title="Export KantoTextNode JSON Schema"
        >
          <FileCode2 className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Export Schema</span>
        </button>
      </div>
    </header>
  );
};
