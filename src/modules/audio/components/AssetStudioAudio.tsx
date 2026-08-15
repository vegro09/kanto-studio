import React, { useState, useRef } from 'react';
import { SFX_CATALOG, SFXItem, registerCustomAudioBuffer } from '../core/SoundLibrary';
import { ProceduralAudioEngine } from '../core/ProceduralAudioEngine';
import { AudioBufferRegistry } from '../core/AudioBufferRegistry';
import { useAudioStore } from '../store/audioStore';

export interface AssetStudioAudioProps {
  onAddAudioClip?: (clip: {
    id?: string;
    soundId?: string;
    name: string;
    type: 'audio';
    category: string;
    sfxId?: string;
    trackId?: string;
    duration: number;
    buffer?: AudioBuffer | null;
    src?: string;
    url?: string;
  }) => void;
}

export const AssetStudioAudio: React.FC<AssetStudioAudioProps> = ({ onAddAudioClip }) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const currentPreviewSource = useRef<AudioBufferSourceNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { uploadedSounds, addUploadedSound } = useAudioStore();
  const bufferRegistry = AudioBufferRegistry.getInstance();
  const audioEngine = ProceduralAudioEngine.getInstance();

  const categories = ['ALL', 'Uploaded', 'Transitions', 'UI', 'Cinematic', 'Comedy', 'Foley'];

  // Handle local file uploads
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (audioEngine.ctx.state === 'suspended') {
      await audioEngine.ctx.resume();
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const arrayBuffer = await file.arrayBuffer();
        const decodedBuffer = await audioEngine.ctx.decodeAudioData(arrayBuffer);
        const soundId = `upload_${Date.now()}_${i}`;

        bufferRegistry.register(soundId, decodedBuffer);
        registerCustomAudioBuffer(soundId, decodedBuffer);

        addUploadedSound({
          id: soundId,
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: 'Uploaded',
          duration: Math.round(decodedBuffer.duration * 100) / 100,
          uploadedAt: Date.now(),
        });
      } catch (err) {
        console.error(`Failed to decode file: ${file.name}`, err);
      }
    }

    setActiveCategory('Uploaded');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Immediate Preview Trigger
  const handleTogglePreview = async (id: string, isCustom: boolean, trigger?: () => void) => {
    if (audioEngine.ctx.state === 'suspended') {
      await audioEngine.ctx.resume();
    }

    if (currentPreviewSource.current) {
      try {
        currentPreviewSource.current.stop();
        currentPreviewSource.current.disconnect();
      } catch (e) {}
      currentPreviewSource.current = null;
    }

    if (previewingId === id) {
      setPreviewingId(null);
      return;
    }

    if (isCustom) {
      const buffer = bufferRegistry.get(id);
      if (!buffer) return;

      const source = audioEngine.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioEngine.masterGain);

      source.onended = () => {
        setPreviewingId(null);
        currentPreviewSource.current = null;
      };

      currentPreviewSource.current = source;
      setPreviewingId(id);
      source.start(0);
    } else if (trigger) {
      setPreviewingId(id);
      trigger();
      setTimeout(() => setPreviewingId(null), 700);
    }
  };

  // Place on Timeline
  const handleAddToTimeline = (id: string, name: string, duration: number, isCustom: boolean) => {
    if (onAddAudioClip) {
      const isVoiceRec = isCustom && name.startsWith('Voice Rec');
      onAddAudioClip({
        id: `clip_${Date.now()}`,
        soundId: id,
        sfxId: id,
        name,
        category: isCustom ? 'Uploaded' : 'SFX',
        trackId: isVoiceRec ? 'voice_over' : 'sfx_1',
        duration: isCustom ? duration : (duration || 0.5),
        buffer: isCustom ? bufferRegistry.get(id) || null : null,
        type: 'audio',
      });
    }
  };

  const customItems = uploadedSounds.map((s) => ({
    id: s.id,
    name: s.name,
    category: 'Uploaded' as const,
    duration: s.duration,
    isCustom: true,
  }));

  const allItems = [
    ...customItems,
    ...SFX_CATALOG.map((s) => ({ ...s, isCustom: false, duration: s.duration || 0.5 })),
  ];

  const filteredItems = allItems.filter((item) => {
    const matchesCat = activeCategory === 'ALL' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4 select-none">
      <input ref={fileInputRef} type="file" accept="audio/*" multiple onChange={handleFileUpload} className="hidden" id="audio-asset-upload-input" />

      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-neutral-900 border border-neutral-700 hover:border-white rounded-lg text-xs font-semibold text-white transition-all group cursor-pointer shadow-sm"
      >
        <svg className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>Upload Audio File</span>
      </button>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sounds, uploads & recordings..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
        />
        <svg className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((cat) => {
          const count = cat === 'Uploaded' ? uploadedSounds.length : undefined;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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

      {/* Sound Cards List */}
      <div className="grid grid-cols-1 gap-2 max-h-[380px] custom-scrollbar pr-1">
        {filteredItems.length === 0 ? (
          <div className="p-6 text-center text-neutral-500 text-xs">
            {activeCategory === 'Uploaded' ? 'No custom uploads or voice recordings yet.' : 'No matching sounds found.'}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isPlaying = previewingId === item.id;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({
                      id: item.id,
                      soundId: item.id,
                      sfxId: item.id,
                      name: item.name,
                      category: item.category,
                      duration: item.duration,
                      type: 'audio',
                      isCustom: item.isCustom,
                    })
                  );
                }}
                className="flex items-center justify-between p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg cursor-grab active:cursor-grabbing transition-all group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePreview(item.id, item.isCustom, 'trigger' in item ? (item as any).trigger : undefined);
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
                      {item.isCustom ? `${item.duration.toFixed(2)}s` : 'Procedural'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 uppercase tracking-wider">
                    {item.category}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToTimeline(item.id, item.name, item.duration, item.isCustom);
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
