import React, { useState, useRef } from 'react';
import { SFX_CATALOG, SFXItem, registerCustomAudioBuffer } from '../core/SoundLibrary';
import { ProceduralAudioEngine } from '../core/ProceduralAudioEngine';

export interface CustomAudioItem {
  id: string;
  name: string;
  category: 'Uploaded';
  duration: number;
  buffer: AudioBuffer;
  isCustom: true;
}

export interface AssetStudioAudioProps {
  onAddAudioClip?: (clip: {
    id?: string;
    name: string;
    type: 'audio';
    category: string;
    sfxId?: string;
    duration: number;
    buffer?: AudioBuffer | null;
    src?: string;
    url?: string;
  }) => void;
}

export const AssetStudioAudio: React.FC<AssetStudioAudioProps> = ({ onAddAudioClip }) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customSounds, setCustomSounds] = useState<CustomAudioItem[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const categories = ['ALL', 'Uploaded', 'Transitions', 'UI', 'Cinematic', 'Comedy', 'Foley'];

  // 1. Safe & Robust Audio File Ingestion & Decoding
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const engine = ProceduralAudioEngine.getInstance();
    if (engine.ctx.state === 'suspended') {
      await engine.ctx.resume();
    }

    const newCustomItems: CustomAudioItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const arrayBuffer = await file.arrayBuffer();
        // Decode audio data into native Web Audio buffer
        const decodedBuffer = await engine.ctx.decodeAudioData(arrayBuffer);
        const customId = `upload_${Date.now()}_${i}`;

        registerCustomAudioBuffer(customId, decodedBuffer);

        const customItem: CustomAudioItem = {
          id: customId,
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: 'Uploaded',
          duration: Math.round(decodedBuffer.duration * 100) / 100,
          buffer: decodedBuffer,
          isCustom: true,
        };

        newCustomItems.push(customItem);
      } catch (err) {
        console.error(`Failed to decode audio file: ${file.name}`, err);
      }
    }

    if (newCustomItems.length > 0) {
      setCustomSounds((prev) => [...newCustomItems, ...prev]);
      setActiveCategory('Uploaded'); // Switch view automatically to uploaded tab
    }

    // Reset input value to allow re-uploading the same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 2. Guaranteed Audio Preview Trigger
  const handlePreviewAudio = async (item: SFXItem | CustomAudioItem) => {
    const engine = ProceduralAudioEngine.getInstance();
    if (engine.ctx.state === 'suspended') {
      await engine.ctx.resume();
    }

    // Stop currently playing preview if one is active
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch (e) {}
      currentSourceRef.current = null;
    }

    if (playingId === item.id) {
      setPlayingId(null);
      return;
    }

    // A. Custom Uploaded Sound
    if ('isCustom' in item && item.isCustom) {
      try {
        const source = engine.ctx.createBufferSource();
        source.buffer = item.buffer;

        const gain = engine.ctx.createGain();
        gain.gain.setValueAtTime(1.0, engine.ctx.currentTime);

        source.connect(gain);
        gain.connect(engine.masterGain);

        source.onended = () => {
          setPlayingId((curr) => (curr === item.id ? null : curr));
          currentSourceRef.current = null;
        };

        currentSourceRef.current = source;
        setPlayingId(item.id);
        source.start(0);
      } catch (e) {
        console.error('Preview error:', e);
        setPlayingId(null);
      }
    } 
    // B. Procedural Sound Effect
    else if ('trigger' in item && item.trigger) {
      setPlayingId(item.id);
      item.trigger();
      setTimeout(() => {
        setPlayingId((curr) => (curr === item.id ? null : curr));
      }, Math.max(400, ((item.duration || 0.5) * 1000)));
    }
  };

  // 3. Add to Timeline Track (+ Button)
  const handleAddToTimeline = (item: SFXItem | CustomAudioItem) => {
    const isCustom = 'isCustom' in item && item.isCustom;

    if (onAddAudioClip) {
      onAddAudioClip({
        id: `clip_${Date.now()}`,
        name: item.name,
        category: item.category,
        sfxId: item.id,
        duration: isCustom ? item.duration : (item.duration || 0.5),
        buffer: isCustom ? item.buffer : null,
        type: 'audio',
      });
    }
  };

  // 4. Unified Search & Filter Catalog
  const allAudioItems: (SFXItem | CustomAudioItem)[] = [...customSounds, ...SFX_CATALOG];

  const filteredItems = allAudioItems.filter((item) => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4 select-none">
      {/* Upload Action Trigger */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        id="audio-asset-upload-input"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-neutral-900 border border-neutral-700 hover:border-white rounded-lg cursor-pointer text-xs font-semibold text-white transition-all group shadow-sm"
      >
        <svg className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>Upload Audio File</span>
      </button>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sounds & uploads..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
        />
        <svg className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((cat) => {
          const count = cat === 'Uploaded' ? customSounds.length : undefined;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <span>{cat}</span>
              {count !== undefined && count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${activeCategory === cat ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-300'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sound Cards List Viewport */}
      <div className="grid grid-cols-1 gap-2 max-h-[380px] custom-scrollbar pr-1">
        {filteredItems.length === 0 ? (
          <div className="p-6 text-center text-neutral-500 text-xs">
            {activeCategory === 'Uploaded' ? 'No uploaded audio files yet. Click "Upload Audio File" above.' : 'No sounds found matching your criteria.'}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isPlaying = playingId === item.id;
            const isCustom = 'isCustom' in item && item.isCustom;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({
                      id: item.id,
                      sfxId: item.id,
                      name: item.name,
                      category: item.category,
                      duration: isCustom ? item.duration : (item.duration || 0.5),
                      type: 'audio',
                      isCustom,
                    })
                  );
                }}
                className="flex items-center justify-between p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 hover:border-neutral-700 rounded-lg cursor-grab active:cursor-grabbing transition-all group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {/* Play / Stop Preview Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewAudio(item);
                    }}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-white text-black animate-pulse'
                        : 'bg-neutral-800 text-neutral-300 group-hover:bg-neutral-700 group-hover:text-white'
                    }`}
                    title={isPlaying ? 'Stop Preview' : 'Play Preview'}
                  >
                    {isPlaying ? (
                      <span className="w-2.5 h-2.5 bg-black rounded-xs"></span>
                    ) : (
                      <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <div className="truncate">
                    <h5 className="text-xs font-semibold text-white truncate max-w-[130px]">{item.name}</h5>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {isCustom ? `${item.duration.toFixed(2)}s` : 'Procedural'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 uppercase tracking-wider">
                    {item.category}
                  </span>

                  {/* Add to Timeline Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToTimeline(item);
                    }}
                    className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Add to Timeline"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
