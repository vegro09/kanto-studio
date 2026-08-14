import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  Check, 
  X, 
  Radio, 
  Volume2, 
  Video,
  Sparkles,
  Layers,
  Sliders
} from 'lucide-react';

export default function AudioRecordingStudio({
  isOpen,
  onClose,
  playheadSec = 0,
  onAddRecordedAudioTrack,
  onRecordVideoAction
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recordMode, setRecordMode] = useState('voice'); // 'voice' | 'video'
  const [recordingName, setRecordingName] = useState('Voice Recording');
  const [inputDevices, setInputDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [inputGain, setInputGain] = useState(1.0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Web Audio Visualizer Refs
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Enumerate Microphones
  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices?.enumerateDevices()
        .then((devices) => {
          const audioInputs = devices.filter((d) => d.kind === 'audioinput');
          setInputDevices(audioInputs);
          if (audioInputs.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(audioInputs[0].deviceId);
          }
        })
        .catch((err) => console.warn("Mic enumeration warning:", err));
    }
  }, [isOpen]);

  // Clean up stream & timer on close
  useEffect(() => {
    if (!isOpen) {
      stopRecordingProcess();
    }
  }, [isOpen]);

  const startRecordingProcess = async () => {
    try {
      audioChunksRef.current = [];
      const constraints = {
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Setup Web Audio Analyser for live visualizer
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const gainNode = ctx.createGain();
      gainNode.gain.value = inputGain;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;

      source.connect(gainNode);
      gainNode.connect(analyser);
      analyserRef.current = analyser;

      drawVisualizerWaveform();

      // Setup MediaRecorder
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setElapsedTime(0);

      timerIntervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 0.1);
      }, 100);

    } catch (err) {
      alert("Microphone permission denied or device not found: " + err.message);
    }
  };

  const pauseRecordingProcess = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const stopRecordingProcess = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => null);
      audioCtxRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleSaveRecording = () => {
    if (!mediaRecorderRef.current || audioChunksRef.current.length === 0) {
      stopRecordingProcess();
      onClose();
      return;
    }

    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64DataUrl = e.target.result;
      const finalDuration = Math.max(0.5, Math.round(elapsedTime * 10) / 10);

      if (onAddRecordedAudioTrack) {
        onAddRecordedAudioTrack({
          id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: recordingName.trim() || 'Voice Recording',
          type: 'audio',
          category: 'Audio',
          isVoiceRecording: true,
          src: base64DataUrl,
          url: base64DataUrl,
          startTimeSec: Math.round(playheadSec * 10) / 10,
          duration: finalDuration
        });
      }

      stopRecordingProcess();
      onClose();
    };
    reader.readAsDataURL(blob);
  };

  const drawVisualizerWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animFrameRef.current = requestAnimationFrame(renderFrame);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#181416';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = isRecording ? '#10b981' : '#a855f7';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };
    renderFrame();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-[#211C1F] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1A1618]">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-[#F3F0E7]">Audio Recording Studio System</h3>
              <p className="text-[10px] text-zinc-400 font-mono">Capture high-fidelity vocal tracks & sync to video timeline</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopRecordingProcess();
              onClose();
            }}
            className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          
          {/* Mode Switcher (Voice Recording vs Video Sync Button) */}
          <div className="flex bg-[#181416] p-1 rounded-xl border border-white/10 gap-1">
            <button
              onClick={() => setRecordMode('voice')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                recordMode === 'voice'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Voice Recording</span>
            </button>

            <button
              onClick={() => {
                setRecordMode('video');
                if (onRecordVideoAction) onRecordVideoAction();
              }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                recordMode === 'video'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Sync Video Buttons</span>
            </button>
          </div>

          {/* Recording Name & Mic Device Input Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-zinc-400 block mb-1">Track Label Name</label>
              <input
                type="text"
                value={recordingName}
                onChange={(e) => setRecordingName(e.target.value)}
                className="w-full bg-[#181416] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-[#F3F0E7] focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 block mb-1">Microphone Input</label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full bg-[#181416] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-[#F3F0E7] focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                {inputDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Audio Waveform Canvas Visualizer */}
          <div className="h-28 bg-[#181416] border border-white/15 rounded-xl overflow-hidden relative flex flex-col justify-end">
            <canvas ref={canvasRef} width={500} height={110} className="w-full h-full block" />
            
            {/* Live Recording Timer Overlay */}
            <div className="absolute top-3 left-3 bg-black/80 border border-white/15 px-3 py-1 rounded-lg flex items-center gap-2 shadow-md">
              <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? (isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-ping') : 'bg-zinc-500'}`} />
              <span className="text-xs font-mono font-bold tracking-widest text-[#F3F0E7]">
                {elapsedTime.toFixed(1)}s
              </span>
            </div>
          </div>

          {/* Controls: Start / Pause / Stop */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {!isRecording ? (
              <button
                onClick={startRecordingProcess}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording</span>
              </button>
            ) : (
              <>
                <button
                  onClick={pauseRecordingProcess}
                  className="px-4 py-2 bg-[#2A2529] hover:bg-[#353034] text-white border border-white/20 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>

                <button
                  onClick={handleSaveRecording}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save to Voice Track</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
