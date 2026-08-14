import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Upload, 
  Square, 
  Sparkles, 
  MessageSquare,
  Type,
  Shapes,
  Video,
  Music,
  Mic,
  FolderPlus,
  Play,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { PROTOTYPING_ASSETS } from '../utils/prototypingAssets';
import { useEngineStore } from '../../modules/KantoTextEngine';

// INTERACTIVE VIDEO LIBRARY CARD COMPONENT WITH LIVE HOVER PREVIEW & NATIVE ASPECT RATIO DETECTOR
function VideoLibraryCard({ video, onAddAsset }) {
  const videoRef = useRef(null);
  const [durationSec, setDurationSec] = useState(video.duration || 0);
  const [videoDims, setVideoDims] = useState({ w: video.naturalWidth || video.width || 1280, h: video.naturalHeight || video.height || 720 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleMouseEnter = () => {
    if (videoRef.current && isLoaded && !hasError) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current && isLoaded && !hasError) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleLoadedMetadata = () => {
    setIsLoaded(true);
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;

      if (dur && !isNaN(dur)) {
        setDurationSec(Math.round(dur * 10) / 10);
      }
      if (vw && vh) {
        setVideoDims({ w: vw, h: vh });
      }
    }
  };

  return (
    <div
      onClick={() =>
        onAddAsset({
          ...video,
          duration: durationSec || video.duration || 5.0,
          naturalWidth: videoDims.w,
          naturalHeight: videoDims.h,
          width: videoDims.w,
          height: videoDims.h
        })
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-xl border border-blue-500/30 hover:border-blue-400 bg-[#211C1F] overflow-hidden cursor-pointer transition-all hover:scale-[1.02] p-2 shadow-sm"
    >
      <div className="h-28 w-full bg-zinc-950 rounded-lg flex items-center justify-center relative overflow-hidden border border-white/10">
        {!hasError ? (
          <video
            ref={videoRef}
            src={video.src || video.url}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-zinc-500">
            <Video className="w-6 h-6 text-zinc-600" />
            <span className="text-[9px]">Video Error</span>
          </div>
        )}

        {/* Hover Overlay Play Icon */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent flex items-center justify-center transition-colors">
          <div className="p-2 rounded-full bg-black/50 border border-white/20 group-hover:scale-110 transition-transform shadow-md">
            <Play className="w-4 h-4 text-white fill-current" />
          </div>
        </div>

        {/* Duration Badge */}
        {durationSec > 0 && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-blue-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10 shadow-sm">
            {durationSec.toFixed(1)}s
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#F3F0E7] truncate">{video.name}</span>
        <span className="text-[9px] font-mono text-blue-300 bg-blue-950/80 border border-blue-600/40 px-1.5 py-0.5 rounded">
          + Add
        </span>
      </div>
    </div>
  );
}

// UNSPLASH STOCK BACKGROUND ASSETS COLLECTION
const stockBackgrounds = [
  { id: 'stock-1', name: 'Dark Aesthetic Texture', url: 'https://images.unsplash.com/photo-1541140134513-85a161dc4a00?q=80&w=2070&auto=format&fit=crop', src: 'https://images.unsplash.com/photo-1541140134513-85a161dc4a00?q=80&w=2070&auto=format&fit=crop', category: 'Stock', type: 'background' },
  { id: 'stock-2', name: 'Minimalist Dark', url: 'https://images.unsplash.com/photo-1655694775188-361234f2f5ed?q=80&w=1470&auto=format&fit=crop', src: 'https://images.unsplash.com/photo-1655694775188-361234f2f5ed?q=80&w=1470&auto=format&fit=crop', category: 'Stock', type: 'background' },
  { id: 'stock-3', name: 'Light Leaks A', url: 'https://plus.unsplash.com/premium_vector-1749812770916-c8c841aab636?w=500&auto=format&fit=crop', src: 'https://plus.unsplash.com/premium_vector-1749812770916-c8c841aab636?w=500&auto=format&fit=crop', category: 'Stock', type: 'background' },
  { id: 'stock-4', name: 'Light Leaks B', url: 'https://plus.unsplash.com/premium_vector-1750769199537-f1ec575c1e52?w=500&auto=format&fit=crop', src: 'https://plus.unsplash.com/premium_vector-1750769199537-f1ec575c1e52?w=500&auto=format&fit=crop', category: 'Stock', type: 'background' },
  { id: 'stock-5', name: 'Light Leaks C', url: 'https://images.unsplash.com/vector-1767642476274-6d46dd8dc3f8?w=500&auto=format&fit=crop', src: 'https://images.unsplash.com/vector-1767642476274-6d46dd8dc3f8?w=500&auto=format&fit=crop', category: 'Stock', type: 'background' },
  { id: 'stock-6', name: 'Light Leaks D', url: 'https://images.unsplash.com/vector-1767642476379-66fee21c3abb?w=500&auto=format&fit=crop', src: 'https://images.unsplash.com/vector-1767642476379-66fee21c3abb?w=500&auto=format&fit=crop', category: 'Stock', type: 'background' }
];

export default function LeftPanel({
  isOpen,
  onToggleOpen,
  onAddAsset,
  onAddTextAsset,
  onUploadCustomFont,
  userLibraryAssets = [],
  onSaveToLibrary
}) {
  const [activeTab, setActiveTab] = useState('images'); // 'images' | 'videos' | 'audio'
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // External Media URL State & Validation Handler
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaNameInput, setMediaNameInput] = useState('');
  const [urlError, setUrlError] = useState('');

  const handleAddMediaUrl = () => {
    if (!mediaUrlInput || !mediaUrlInput.trim()) return;
    const cleanUrl = mediaUrlInput.trim();

    try {
      new URL(cleanUrl);
    } catch (e) {
      setUrlError('Please enter a valid HTTP/HTTPS URL');
      return;
    }

    setUrlError('');

    const lower = cleanUrl.toLowerCase();
    const isVideo = lower.match(/\.(mp4|webm|mov|ogv)$/i) || lower.includes('video');
    const isAudio = lower.match(/\.(mp3|wav|ogg|aac|m4a)$/i) || lower.includes('audio');
    const mediaType = isVideo ? 'video' : isAudio ? 'audio' : 'image';
    const mediaCategory = isVideo ? 'Videos' : isAudio ? 'Audio' : 'Images';

    const defaultName = isVideo ? 'External Video' : isAudio ? 'External Audio' : 'External Image';
    const name = mediaNameInput.trim() ? mediaNameInput.trim() : defaultName;

    const newLibraryItem = {
      id: `media_url_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      type: mediaType,
      category: mediaCategory,
      src: cleanUrl,
      url: cleanUrl,
      width: isVideo ? 1280 : 400,
      height: isVideo ? 720 : 400,
      naturalWidth: isVideo ? 1280 : 400,
      naturalHeight: isVideo ? 720 : 400,
      duration: 5.0
    };

    if (onSaveToLibrary) {
      onSaveToLibrary(newLibraryItem);
    }

    setMediaUrlInput('');
    setMediaNameInput('');
    setIsUrlInputOpen(false);
  };

  // Universal Media File Processor
  const processUniversalMediaFile = (file) => {
    if (!file) return;

    // Check if custom font
    if (file.name.match(/\.(ttf|woff|woff2|otf)$/i)) {
      if (onUploadCustomFont) {
        onUploadCustomFont(file);
      }
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    const fileName = file.name.replace(/\.[^/.]+$/, "") || 'Uploaded Asset';
    const mime = file.type || '';

    let mediaType = 'image';
    let mediaCategory = 'Images';

    if (mime.startsWith('video/')) {
      const tempVid = document.createElement('video');
      tempVid.src = blobUrl;
      tempVid.onloadedmetadata = () => {
        const vw = tempVid.videoWidth || 1280;
        const vh = tempVid.videoHeight || 720;
        const dur = tempVid.duration || 5.0;

        const libraryItem = {
          id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: fileName,
          type: 'video',
          category: 'Videos',
          src: blobUrl,
          url: blobUrl,
          width: vw,
          height: vh,
          naturalWidth: vw,
          naturalHeight: vh,
          duration: Math.round(dur * 10) / 10
        };

        if (onSaveToLibrary) onSaveToLibrary(libraryItem);
        if (onAddAsset) onAddAsset(libraryItem);
      };
      return;
    } else if (mime.startsWith('audio/')) {
      mediaType = 'audio';
      mediaCategory = 'Audio';
    }

    const libraryItem = {
      id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: fileName,
      type: mediaType,
      category: mediaCategory,
      src: blobUrl,
      url: blobUrl,
      width: 300,
      height: 300,
      duration: 3.0
    };

    if (onSaveToLibrary) {
      onSaveToLibrary(libraryItem);
    }

    if (onAddAsset) {
      onAddAsset(libraryItem);
    }
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(processUniversalMediaFile);
    }
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processUniversalMediaFile);
    }
  };

  const handleAddSpeechBubble = () => {
    const svgBubble = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><rect x="5" y="5" width="290" height="110" rx="15" fill="%232A2529" stroke="%23F3F0E7" stroke-width="3"/><path d="M 50 115 L 70 140 L 90 115 Z" fill="%232A2529" stroke="%23F3F0E7" stroke-width="3"/><text x="150" y="65" font-family="sans-serif" font-size="16" fill="%23F3F0E7" text-anchor="middle" font-weight="bold">TARGET ACQUIRED</text></svg>`;
    onAddAsset({
      name: 'Speech Bubble',
      type: 'prop',
      category: 'Images',
      url: svgBubble,
      src: svgBubble,
      width: 300,
      height: 150,
      scale: 0.8
    });
  };

  const imageAssets = userLibraryAssets.filter((a) => a.type === 'image' || a.type === 'background' || a.category === 'Images' || a.category === 'Scene' || a.category === 'Character');
  const videoAssets = userLibraryAssets.filter((a) => a.type === 'video' || a.category === 'Videos');
  const audioAssets = userLibraryAssets.filter((a) => a.type === 'audio' || a.category === 'Audio');

  if (!isOpen) {
    return (
      <div className="fixed top-3 left-3 z-40">
        <button
          onClick={onToggleOpen}
          className="p-2 bg-[#2A2529]/90 hover:bg-[#353034] text-[#F3F0E7] border border-white/15 rounded-xl shadow-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          title="Open Asset Studio Sidebar"
        >
          <PanelLeftOpen className="w-4 h-4 text-[#F3F0E7]" />
          <span className="text-xs font-mono font-bold">Assets</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex shrink-0 p-2 h-full z-30 select-none">
      <aside className="w-80 bg-[#2A2529]/95 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl transition-all duration-200">
        
        {/* Studio Header & Universal Uploader */}
        <div className="p-3 border-b border-white/10 flex flex-col gap-2.5 bg-[#211C1F]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F3F0E7]" />
              <h2 className="text-xs font-bold text-[#F3F0E7] uppercase tracking-wider">ASSET STUDIO</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 font-mono">LIBRARY</span>
              {onToggleOpen && (
                <button
                  onClick={onToggleOpen}
                  className="p-1 hover:bg-white/10 text-zinc-400 hover:text-[#F3F0E7] rounded-lg transition-colors cursor-pointer"
                  title="Hide Asset Studio Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Universal Drag & Drop Upload & Add Media URL Action Bar */}
          <div className="flex items-center gap-2">
            <label 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 border border-dashed rounded-xl p-2 text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 text-xs font-semibold ${
                isDraggingOver 
                  ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300' 
                  : 'border-white/20 bg-[#2A2529] hover:bg-[#353034] text-[#F3F0E7] hover:border-white/30'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-[#F3F0E7]" />
              <span className="truncate">Upload File</span>
              <input
                type="file"
                accept="image/*,video/*,audio/*,.ttf,.woff,.woff2,.otf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setIsUrlInputOpen(!isUrlInputOpen)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isUrlInputOpen
                  ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                  : 'bg-[#2A2529] hover:bg-[#353034] border-white/20 text-[#F3F0E7] hover:border-white/30'
              }`}
              title="Add Image or Video via External Direct URL"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add URL</span>
            </button>
          </div>

          {/* Direct Media URL Input Drawer Card */}
          {isUrlInputOpen && (
            <div className="p-3 bg-[#1E191C] border border-blue-500/40 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" /> Import Media via Link
                </span>
                <button 
                  onClick={() => setIsUrlInputOpen(false)}
                  className="text-zinc-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>

              <input
                type="url"
                placeholder="Direct URL (e.g. https://.../media.mp4)"
                value={mediaUrlInput}
                onChange={(e) => {
                  setMediaUrlInput(e.target.value);
                  if (urlError) setUrlError('');
                }}
                className="w-full bg-[#2A2529] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#F3F0E7] placeholder-zinc-500 focus:outline-none focus:border-blue-400 font-mono"
              />

              <input
                type="text"
                placeholder="Asset Name (Optional)"
                value={mediaNameInput}
                onChange={(e) => setMediaNameInput(e.target.value)}
                className="w-full bg-[#2A2529] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#F3F0E7] placeholder-zinc-500 focus:outline-none focus:border-blue-400"
              />

              {urlError && (
                <p className="text-[10px] text-rose-400 font-medium">{urlError}</p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleAddMediaUrl}
                  disabled={!mediaUrlInput.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save to Library</span>
                </button>
                <button
                  onClick={() => {
                    setMediaUrlInput('');
                    setMediaNameInput('');
                    setUrlError('');
                    setIsUrlInputOpen(false);
                  }}
                  className="px-2.5 py-1.5 bg-[#2A2529] hover:bg-[#353034] text-zinc-300 text-xs rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3 MEDIA CATEGORY TABS */}
        <div className="flex border-b border-white/10 bg-[#1E191C] p-1 gap-1">
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'images'
                ? 'bg-[#F3F0E7] text-[#2A2529] font-bold shadow-sm'
                : 'text-zinc-400 hover:text-[#F3F0E7]'
            }`}
          >
            <Shapes className="w-3.5 h-3.5" />
            <span>Images & Shapes</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'videos'
                ? 'bg-[#F3F0E7] text-[#2A2529] font-bold shadow-sm'
                : 'text-zinc-400 hover:text-[#F3F0E7]'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-blue-500" />
            <span>Videos</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'audio'
                ? 'bg-[#F3F0E7] text-[#2A2529] font-bold shadow-sm'
                : 'text-zinc-400 hover:text-[#F3F0E7]'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audio</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          
          {/* TAB 1: IMAGES & VECTOR SHAPES */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Typography & Fonts</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      useEngineStore.getState().addLayer('KANTO MOTION');
                      if (onAddTextAsset) onAddTextAsset();
                    }}
                    className="bg-[#F3F0E7] text-[#2A2529] hover:bg-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Type className="w-4 h-4" />
                    <span>Add Text</span>
                  </button>

                  <label className="bg-[#211C1F] hover:bg-[#353034] text-zinc-200 border border-white/10 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                    <FolderPlus className="w-4 h-4 text-[#F3F0E7]" />
                    <span>Upload Font</span>
                    <input
                      type="file"
                      accept=".ttf,.woff,.woff2,.otf"
                      onChange={async (e) => {
                        const file = e.target.files && e.target.files[0];
                        if (file) {
                          try {
                            await useEngineStore.getState().uploadCustomFont(file);
                          } catch (err) {
                            console.error("Failed to upload font to text engine:", err);
                          }
                          if (onUploadCustomFont) {
                            onUploadCustomFont(file);
                          }
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Vector Shapes Grid */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Vector Shapes & Figures</p>
                <div className="grid grid-cols-2 gap-2">
                  {PROTOTYPING_ASSETS.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onAddAsset(item)}
                      className="group relative rounded-xl border border-white/10 hover:border-white/30 bg-[#211C1F] p-2 text-center cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <div 
                        className="h-16 w-full mb-1.5 overflow-hidden rounded-lg bg-[#2A2529] flex items-center justify-center p-2"
                        dangerouslySetInnerHTML={{ __html: item.renderSvg('#F3F0E7') }}
                      />
                      <span className="text-[11px] font-medium text-zinc-300 block truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock & Backgrounds Gallery */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#F3F0E7]" /> Stock & Backgrounds
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {stockBackgrounds.map((bg) => (
                    <div
                      key={bg.id}
                      onClick={() =>
                        onAddAsset({
                          ...bg,
                          type: 'background',
                          category: 'Stock',
                          isBackgroundLayer: true,
                          width: 1080,
                          height: 1920,
                          scale: 1.0,
                          x: 0,
                          y: 0,
                          zIndex: 1
                        })
                      }
                      className="group relative rounded-xl border border-white/10 hover:border-white/30 bg-[#211C1F] overflow-hidden cursor-pointer transition-all hover:scale-[1.02] shadow-sm"
                    >
                      <div className="h-20 w-full relative bg-[#2A2529]">
                        <img 
                          src={bg.url} 
                          alt={bg.name} 
                          loading="lazy" 
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2A2529]/90 via-transparent to-transparent" />
                        <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between">
                          <span className="text-[9px] font-medium text-[#F3F0E7] truncate">{bg.name}</span>
                          <span className="text-[8px] bg-[#F3F0E7] text-[#2A2529] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                            <Plus className="w-2.5 h-2.5" /> Add
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uploaded Images Gallery */}
              {imageAssets.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Uploaded Images</p>
                  <div className="grid grid-cols-2 gap-2">
                    {imageAssets.map((item) => (
                      <div
                        key={item.id}
                        draggable={true}
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify(item))}
                        onClick={() => onAddAsset(item)}
                        className="group relative rounded-xl border border-white/10 hover:border-white/30 bg-[#211C1F] p-2 text-center cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02]"
                      >
                        <div className="h-20 w-full mb-1 overflow-hidden rounded-lg bg-[#2A2529] flex items-center justify-center p-1 pointer-events-none">
                          <img src={item.src || item.url} alt={item.name} className="max-h-full max-w-full object-contain pointer-events-none" />
                        </div>
                        <span className="text-[10px] font-medium text-zinc-300 block truncate pointer-events-none">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VIDEOS */}
          {activeTab === 'videos' && (
            <div className="space-y-3">
              <p className="text-[11px] text-zinc-400">Uploaded Video Clips:</p>
              {videoAssets.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {videoAssets.map((vid) => (
                    <VideoLibraryCard
                      key={vid.id}
                      video={vid}
                      onAddAsset={onAddAsset}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#211C1F] border border-white/10 rounded-xl text-center text-xs text-zinc-400 italic">
                  No video clips uploaded yet. Use the top upload zone to add MP4 or WebM videos.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIO & VOICE-OVERS */}
          {activeTab === 'audio' && (
            <div className="space-y-3">
              <p className="text-[11px] text-zinc-400">Audio Tracks & Voice-Overs:</p>
              
              {audioAssets.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {audioAssets.map((aud) => (
                    <div
                      key={aud.id}
                      onClick={() => onAddAsset(aud)}
                      className="group relative rounded-xl border border-emerald-500/30 hover:border-emerald-400 bg-[#211C1F] p-2.5 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <div className="p-2 bg-emerald-950/80 rounded-lg border border-emerald-600/40 text-emerald-400 shrink-0">
                          <Music className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-semibold text-[#F3F0E7] block truncate">{aud.name}</span>
                          <span className="text-[9px] font-mono text-emerald-400 block">{aud.duration || 3.0}s Audio</span>
                        </div>
                      </div>

                      <span className="text-[10px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        + Track
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#211C1F] border border-white/10 rounded-xl text-center text-xs text-zinc-400 italic">
                  No audio tracks recorded yet. Click "Record Voice" on the timeline or upload audio files above.
                </div>
              )}
            </div>
          )}

        </div>
      </aside>
    </div>
  );
}
