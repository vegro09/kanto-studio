import React, { useState } from 'react';
import { Play, Upload, Search, Plus } from 'lucide-react';
import { SFX_CATALOG } from '../core/SoundLibrary';
import { ProceduralAudioEngine } from '../core/ProceduralAudioEngine';

export interface AssetStudioAudioProps {
  onAddAudioClip?: (clip: {
    name: string;
    type: 'audio';
    category: string;
    sfxId?: string;
    duration: number;
    src?: string;
    url?: string;
  }) => void;
}

export const AssetStudioAudio: React.FC<AssetStudioAudioProps> = ({ onAddAudioClip }) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const categories = ['ALL', 'Transitions', 'UI', 'Cinematic', 'Comedy', 'Foley'];

  const filteredSFX = SFX_CATALOG.filter((sfx) => {
    const matchesCategory = activeCategory === 'ALL' || sfx.category === activeCategory;
    const matchesSearch = sfx.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const engine = ProceduralAudioEngine.getInstance();
    await engine.ensureContext();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const buffer = await file.arrayBuffer();
        const decoded = await engine.ctx.decodeAudioData(buffer);
        const customId = `custom_${Date.now()}_${i}`;
        const name = file.name.replace(/\.[^/.]+$/, '');

        SFX_CATALOG.unshift({
          id: customId,
          name,
          category: 'Foley',
          duration: Math.round(decoded.duration * 100) / 100,
          description: `Custom uploaded audio file (${decoded.duration.toFixed(2)}s)`,
          trigger: (customCtx, customDest) => {
            const c = customCtx || engine.ctx;
            const dest = customDest || engine.masterGain;
            const src = c.createBufferSource();
            src.buffer = decoded;
            src.connect(dest);
            src.start();
          },
        });

        if (onAddAudioClip) {
          onAddAudioClip({
            name,
            type: 'audio',
            category: 'Foley',
            sfxId: customId,
            duration: Math.round(decoded.duration * 100) / 100,
          });
        }
      } catch (err) {
        console.error('[AssetStudioAudio] Failed to decode local audio file:', file.name, err);
      }
    }
  };

  return (
    <div className="space-y-3.5 select-none">
      {/* Upload Custom Audio Button */}
      <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-neutral-900 border border-neutral-700 hover:border-white/60 rounded-xl cursor-pointer text-xs font-semibold text-white transition-all shadow-sm group">
        <Upload className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
        <span>Upload Audio (WAV / MP3)</span>
        <input type="file" accept="audio/*" multiple onChange={handleFileUpload} className="hidden" />
      </label>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search 43+ Procedural Sounds..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/50"
        />
      </div>

      {/* Category Chips: Black & White Active State */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-white text-black shadow-sm'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Draggable Sound Cards */}
      <div className="grid grid-cols-1 gap-2 max-h-[380px] custom-scrollbar pr-1.5">
        {filteredSFX.map((sfx) => (
          <div
            key={sfx.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                'application/json',
                JSON.stringify({
                  id: sfx.id,
                  sfxId: sfx.id,
                  name: sfx.name,
                  category: sfx.category,
                  duration: sfx.duration || 1.0,
                  type: 'audio',
                })
              );
            }}
            className="flex items-center justify-between p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg cursor-grab transition-all group"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const engine = ProceduralAudioEngine.getInstance();
                  engine.ensureContext().then(() => {
                    if (sfx.trigger) sfx.trigger();
                  });
                }}
                className="w-6 h-6 rounded-md bg-neutral-800 group-hover:bg-white group-hover:text-black text-neutral-400 flex items-center justify-center transition-colors text-[10px] flex-shrink-0 cursor-pointer shadow-sm"
                title="Preview Sound"
              >
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </button>
              <div className="truncate">
                <span className="text-xs text-white font-medium block truncate">{sfx.name}</span>
                <span className="text-[10px] text-neutral-500 font-mono">{(sfx.duration || 0.5).toFixed(2)}s</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[9px] text-neutral-500 font-mono uppercase bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                {sfx.category}
              </span>
              {onAddAudioClip && (
                <button
                  type="button"
                  onClick={() =>
                    onAddAudioClip({
                      name: sfx.name,
                      type: 'audio',
                      category: sfx.category,
                      sfxId: sfx.id,
                      duration: sfx.duration || 1.0,
                    })
                  }
                  className="p-1 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors cursor-pointer"
                  title="Add to Timeline"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
