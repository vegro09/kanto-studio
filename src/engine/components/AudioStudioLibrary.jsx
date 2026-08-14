import React, { useState, useRef } from 'react';
import { 
  Mic, 
  Music, 
  Volume2, 
  VolumeX, 
  Plus, 
  Search, 
  Play, 
  Pause, 
  Sliders, 
  UploadCloud, 
  Sparkles, 
  Filter,
  Zap,
  Radio,
  Trash2
} from 'lucide-react';
import { 
  VOICE_FILTERS, 
  SFX_LIBRARY, 
  SFX_CATEGORIES, 
  playSfxPreview 
} from '../utils/sfxAudioEngine';

export default function AudioStudioLibrary({
  onAddAudioTrack,
  onAddSfxTrack,
  onAddFilterFxTrack,
  onOpenRecordingStudio,
  assets = []
}) {
  const [activeTab, setActiveTab] = useState('sfx'); // 'filters' | 'sfx' | 'media'
  const [sfxSearch, setSfxSearch] = useState('');
  const [sfxCategory, setSfxCategory] = useState('ALL');
  
  // Custom Uploaded MP3 Library State
  const [uploadedMp3s, setUploadedMp3s] = useState(() => {
    try {
      const saved = localStorage.getItem('kanto_custom_mp3_library');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [previewMp3Id, setPreviewMp3Id] = useState(null);
  const audioPreviewRef = useRef(null);
  const fileInputRef = useRef(null);

  // Filtered SFX Items
  const filteredSfx = SFX_LIBRARY.filter((sfx) => {
    const matchesSearch = sfx.name.toLowerCase().includes(sfxSearch.toLowerCase()) || 
                          sfx.tag.toLowerCase().includes(sfxSearch.toLowerCase());
    const matchesCategory = sfxCategory === 'ALL' || sfx.tag === sfxCategory;
    return matchesSearch && matchesCategory;
  });

  // MP3 Upload Handler
  const handleMp3FileUpload = (files) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64DataUrl = e.target.result;
        const audioObj = new Audio();
        audioObj.src = base64DataUrl;

        audioObj.onloadedmetadata = () => {
          const duration = Math.round((audioObj.duration || 3.0) * 10) / 10;
          const cleanName = file.name.replace(/\.[^/.]+$/, '').trim();

          const newItem = {
            id: `mp3_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: cleanName || 'Uploaded Audio',
            category: 'voice',
            duration: duration || 3.0,
            src: base64DataUrl,
            url: base64DataUrl,
            uploadedAt: new Date().toISOString()
          };

          setUploadedMp3s((prev) => {
            const next = [newItem, ...prev];
            try {
              localStorage.setItem('kanto_custom_mp3_library', JSON.stringify(next));
            } catch (err) {
              console.warn("LocalStorage warning:", err);
            }
            return next;
          });
        };
      };
      reader.readAsDataURL(file);
    });
  };

  // Preview Uploaded Audio Toggle
  const toggleMp3Preview = (item) => {
    if (previewMp3Id === item.id) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setPreviewMp3Id(null);
    } else {
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio();
        audioPreviewRef.current.onended = () => setPreviewMp3Id(null);
      }
      audioPreviewRef.current.src = item.src || item.url;
      audioPreviewRef.current.play().catch(() => null);
      setPreviewMp3Id(item.id);
    }
  };

  const handleDeleteMp3 = (id) => {
    setUploadedMp3s((prev) => {
      const next = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('kanto_custom_mp3_library', JSON.stringify(next));
      } catch (err) {
        console.warn(err);
      }
      return next;
    });
    if (previewMp3Id === id) {
      if (audioPreviewRef.current) audioPreviewRef.current.pause();
      setPreviewMp3Id(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#181416] text-[#F3F0E7] select-none overflow-hidden">
      
      {/* TOP STUDIO HEADER & LAUNCH AUDIO RECORDING SYSTEM */}
      <div className="p-3 border-b border-white/10 bg-[#211C1F] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#F3F0E7]">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Sound & Audio Studio</span>
          </div>
        </div>

        {/* Big Action Button to Launch Audio Recording System */}
        <button
          onClick={onOpenRecordingStudio}
          className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Mic className="w-4 h-4 text-black" />
          <span>Launch Audio Recorder & Sync</span>
        </button>
      </div>

      {/* THREE STUDIO TABS (SFX / FILTERS / MP3 LIBRARY) */}
      <div className="flex border-b border-white/10 bg-[#1E191C] p-1 gap-1">
        <button
          onClick={() => setActiveTab('sfx')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'sfx'
              ? 'bg-[#F3F0E7] text-black font-bold shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>SFX ({SFX_LIBRARY.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('filters')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'filters'
              ? 'bg-[#F3F0E7] text-black font-bold shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-purple-400" />
          <span>Voice FX</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'media'
              ? 'bg-[#F3F0E7] text-black font-bold shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Music className="w-3.5 h-3.5 text-emerald-400" />
          <span>My MP3s</span>
        </button>
      </div>

      {/* TAB 1: 50 TRENDING SFX LIBRARY */}
      {activeTab === 'sfx' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search 50 SFX (Vine Boom, Rizz, Airhorn)..."
              value={sfxSearch}
              onChange={(e) => setSfxSearch(e.target.value)}
              className="w-full bg-[#2A2529] border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F3F0E7] focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
            {SFX_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSfxCategory(cat)}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer shrink-0 ${
                  sfxCategory === cat
                    ? 'bg-cyan-400 text-black font-bold'
                    : 'bg-[#2A2529] text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* SFX Cards List */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            {filteredSfx.map((sfx) => (
              <div
                key={sfx.id}
                className="p-2.5 bg-[#211C1F] hover:bg-[#2A2529] border border-white/10 hover:border-cyan-500/50 rounded-xl flex items-center justify-between transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <button
                    onClick={() => playSfxPreview(sfx.name, sfx.duration)}
                    className="p-1.5 bg-cyan-950/80 hover:bg-cyan-400 text-cyan-300 hover:text-black rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Preview Sound Effect"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-[#F3F0E7] block truncate">{sfx.name}</span>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400">
                      <span className="bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800/40 uppercase">{sfx.tag}</span>
                      <span>{sfx.duration}s</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onAddSfxTrack) {
                      onAddSfxTrack(sfx);
                    }
                  }}
                  className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] rounded-lg transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1 shadow-sm"
                  title="Add to SFX Track"
                >
                  <Plus className="w-3 h-3" /> SFX Track
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VOICE FILTERS & FX RACK */}
      {activeTab === 'filters' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          <div className="p-2 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-purple-200">
            <span className="font-bold block mb-0.5">🎛️ Voice Filters & FX Automation</span>
            Apply real-time Web Audio DSP filters (Megaphone, Titan Beast, Vintage Radio) to timeline clips.
          </div>

          <div className="space-y-2">
            {VOICE_FILTERS.map((vf) => (
              <div
                key={vf.id}
                className="p-2.5 bg-[#211C1F] hover:bg-[#2A2529] border border-white/10 hover:border-purple-500/50 rounded-xl flex items-center justify-between transition-all group"
              >
                <div className="truncate pr-2">
                  <span className="text-xs font-semibold text-[#F3F0E7] block truncate">{vf.name}</span>
                  <span className="text-[10px] text-zinc-400 block truncate">{vf.desc}</span>
                </div>

                <button
                  onClick={() => {
                    if (onAddFilterFxTrack) {
                      onAddFilterFxTrack(vf.name);
                    }
                  }}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded-lg transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1 shadow-sm"
                  title="Add Filter FX Track Block"
                >
                  <Plus className="w-3 h-3" /> Filter FX
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MY MP3s & CUSTOM AUDIO UPLOADER */}
      {activeTab === 'media' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* File Drop & Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleMp3FileUpload(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 hover:border-emerald-400 bg-[#211C1F] hover:bg-[#2A2529] rounded-xl p-4 text-center cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleMp3FileUpload(e.target.files);
                }
              }}
            />
            <UploadCloud className="w-6 h-6 text-emerald-400 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-[#F3F0E7] block">Upload Audio (.mp3, .wav, .aac)</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Click or drop device audio files into library</span>
          </div>

          {/* Uploaded Audio Items */}
          {uploadedMp3s.length === 0 ? (
            <div className="p-4 bg-[#211C1F] rounded-xl text-center text-xs text-zinc-400 italic border border-white/10">
              No MP3 audio uploaded yet. Click above to upload audio files.
            </div>
          ) : (
            <div className="space-y-2">
              {uploadedMp3s.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-[#211C1F] hover:bg-[#2A2529] border border-white/10 hover:border-emerald-500/50 rounded-xl flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <button
                      onClick={() => toggleMp3Preview(item)}
                      className="p-1.5 bg-emerald-950 text-emerald-300 hover:bg-emerald-400 hover:text-black rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      {previewMp3Id === item.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <div className="truncate">
                      <span className="text-xs font-semibold text-[#F3F0E7] block truncate">{item.name}</span>
                      <span className="text-[9px] font-mono text-emerald-400 block">{item.duration}s Audio</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDeleteMp3(item.id)}
                      className="p-1 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete audio file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (onAddAudioTrack) {
                          onAddAudioTrack({
                            id: `el_aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                            name: item.name,
                            type: 'audio',
                            category: 'Audio',
                            src: item.src || item.url,
                            url: item.src || item.url,
                            duration: item.duration || 3.0
                          });
                        }
                      }}
                      className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3 h-3" /> Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
