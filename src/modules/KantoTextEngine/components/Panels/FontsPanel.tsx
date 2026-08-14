import React, { useState, useRef } from 'react';
import { useEngineStore } from '../../store/useEngineStore';
import { FontManager } from '../../engine/FontManager';
import type { CustomFontItem } from '../../types/engine';
import { Search, Check, FolderUp } from 'lucide-react';
import confetti from 'canvas-confetti';

export const FontsPanel: React.FC = () => {
  const { layers, activeLayerId, updateActiveLayer } = useEngineStore();
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'arabic' | 'modern' | 'display' | 'custom'>('all');
  const [allFonts, setAllFonts] = useState<CustomFontItem[]>(() => FontManager.getAllFonts());
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFontSelect = (font: CustomFontItem) => {
    updateActiveLayer({
      font: {
        family: font.family,
        size: activeLayer?.font.size || 72,
        isCustom: font.category === 'custom',
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const customFont = await FontManager.loadCustomFontFile(file);
      const updatedList = FontManager.getAllFonts();
      setAllFonts([...updatedList]);
      handleFontSelect(customFont);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8, x: 0.85 } });
    } catch (err) {
      alert('Failed to load font. Please ensure you selected a valid font file (.ttf, .otf, .woff)');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const filteredFonts = allFonts.filter((font) => {
    const matchesSearch = font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          font.family.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || font.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'arabic', label: 'Arabic' },
    { id: 'modern', label: 'Modern' },
    { id: 'display', label: 'Display' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="flex flex-col h-full gap-3 p-4 select-none">
      {/* Upload Custom Font Button (Strictly B&W, No Gradients) */}
      <div className="flex flex-col gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".ttf,.otf,.woff,.woff2"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-black hover:bg-neutral-200 border border-white rounded font-semibold text-xs transition-all active:scale-[0.98]"
        >
          <FolderUp className="w-4 h-4" />
          <span>{isUploading ? 'Loading Font...' : '+ Add Custom Font (.ttf, .otf, .woff)'}</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search fonts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black text-white text-xs rounded pl-8 pr-3 py-2 border border-dark-750 focus:border-white outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-white text-black font-bold'
                  : 'bg-black text-neutral-400 hover:text-white border border-dark-750'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
        {filteredFonts.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs font-mono">
            No fonts found matching your search.
          </div>
        ) : (
          filteredFonts.map((font) => {
            const isSelected = activeLayer?.font.family === font.family;
            return (
              <button
                key={font.family}
                onClick={() => handleFontSelect(font)}
                className={`p-3 rounded border text-left transition-all relative overflow-hidden flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-white/10 border-white text-white'
                    : 'bg-black border-dark-750 hover:border-neutral-500 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">
                    {font.name}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-black">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Live Preview Text */}
                <div
                  className="text-base text-neutral-100 truncate pt-0.5"
                  style={{ fontFamily: `"${font.family}", "Cairo", sans-serif` }}
                >
                  {activeLayer?.content || font.sampleText}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
