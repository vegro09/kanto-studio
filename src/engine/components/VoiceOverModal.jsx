import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Pause, X, Plus, Volume2 } from 'lucide-react';
import AudioWaveform from './AudioWaveform';

export default function VoiceOverModal({
  isOpen,
  onClose,
  playheadSec = 0,
  onAddAudioTrack
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const previewAudioRef = useRef(null);

  // Format seconds into 00:00.0 counter display
  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      if (isRecording) stopRecording();
      setRecordingTime(0);
      setRecordedAudioUrl(null);
      setRecordedBlob(null);
      setAudioDuration(0);
      setWaveformData([]);
      setIsPlayingPreview(false);
    }
  }, [isOpen]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Web Audio API Waveform Data Extraction
  const extractWaveform = async (blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const decodedData = await audioCtx.decodeAudioData(arrayBuffer);
      const rawData = decodedData.getChannelData(0);

      const samples = 40;
      const blockSize = Math.floor(rawData.length / samples);
      const filteredData = [];

      for (let i = 0; i < samples; i++) {
        let blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[blockStart + j] || 0);
        }
        filteredData.push(Math.min(1.0, (sum / blockSize) * 2.5));
      }

      setWaveformData(filteredData);
      setAudioDuration(decodedData.duration || 3.0);
    } catch (e) {
      console.warn("Waveform extraction warning:", e);
      // Fallback amplitude samples
      setWaveformData([0.3, 0.6, 0.8, 0.4, 0.7, 0.9, 0.5, 0.8, 0.4, 0.7]);
    }
  };

  // START RECORDING
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedAudioUrl(url);

        await extractWaveform(blob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);

      setIsRecording(true);
      setRecordingTime(0);

      // Independent Timer Counter (does not touch master timeline)
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((Date.now() - startTime) / 1000);
      }, 100);
    } catch (err) {
      alert("Microphone access is required to record voice-over audio.");
    }
  };

  // STOP RECORDING
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // PREVIEW AUDIO PLAYBACK
  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  // ADD TO TIMELINE TRACK
  const handleAddToTimeline = () => {
    if (!recordedAudioUrl) return;

    const voiceAsset = {
      id: `audio_vo_${Date.now()}`,
      name: `Voice-Over ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      type: 'audio',
      category: 'Audio',
      src: recordedAudioUrl,
      url: recordedAudioUrl,
      startTimeSec: playheadSec,
      duration: Math.max(0.5, Math.round((audioDuration || recordingTime) * 10) / 10),
      waveformData: waveformData,
      volume: 1.0,
      isMuted: false
    };

    if (onAddAudioTrack) {
      onAddAudioTrack(voiceAsset);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#2A2529] border border-white/15 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4 text-[#F3F0E7]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Voice-Over Recorder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Independent Timer Display */}
        <div className="flex flex-col items-center justify-center py-4 bg-[#211C1F] border border-white/10 rounded-xl space-y-1">
          <span className="text-zinc-400 text-[11px] font-mono uppercase tracking-widest">Recording Counter</span>
          <span className={`font-mono text-3xl font-bold ${isRecording ? 'text-rose-400 animate-pulse' : 'text-[#F3F0E7]'}`}>
            {formatTime(recordingTime)}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Starts at timeline: {formatTime(playheadSec)}</span>
        </div>

        {/* Waveform Preview Display */}
        {recordedAudioUrl && (
          <div className="bg-[#211C1F] border border-emerald-500/30 rounded-xl p-3 flex flex-col items-center space-y-2">
            <div className="flex items-center justify-between w-full text-xs text-emerald-300 font-semibold">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> Preview Recording
              </span>
              <span className="font-mono">{formatTime(audioDuration)}</span>
            </div>

            <div className="w-full flex justify-center py-2">
              <AudioWaveform waveformData={waveformData} width={280} height={36} color="#34d399" />
            </div>

            <audio
              ref={previewAudioRef}
              src={recordedAudioUrl}
              onEnded={() => setIsPlayingPreview(false)}
              className="hidden"
            />

            <button
              onClick={togglePreviewPlay}
              className="w-full py-1.5 bg-[#353034] hover:bg-[#403B3F] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-white/10"
            >
              {isPlayingPreview ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Preview</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Preview</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Record & Add Controls */}
        <div className="flex items-center gap-2 pt-2">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>{recordedAudioUrl ? 'Record Again' : 'Start Recording'}</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex-1 py-2.5 bg-zinc-100 text-zinc-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 animate-pulse"
            >
              <Square className="w-4 h-4 fill-current text-rose-600" />
              <span>Stop Recording</span>
            </button>
          )}

          {recordedAudioUrl && !isRecording && (
            <button
              onClick={handleAddToTimeline}
              className="flex-1 py-2.5 bg-[#F3F0E7] text-[#2A2529] hover:bg-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Timeline</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
