export { ProceduralAudioEngine, VoiceFilterEngine, VOICE_FILTERS } from './core/ProceduralAudioEngine';
export { SFX_PRESETS, SFX_CATALOG, getProceduralSFXBuffer } from './core/SoundLibrary';
export { drawWaveform } from './core/WaveformRenderer';
export { AudioExportMixer } from './core/AudioExportMixer';
export type { ExportAudioClip } from './core/AudioExportMixer';

export { AudioTimelineEngine, TimelineSnappingEngine } from './timeline/AudioTimelineEngine';
export type { AudioClip, SnapPoint } from './timeline/AudioTimelineEngine';
export { ClipMovementEngine } from './timeline/ClipMovementEngine';
export { PlayheadScrubber } from './timeline/PlayheadScrubber';

export { AudioInspectorRack } from './components/AudioInspectorRack';
export { AssetStudioAudio } from './components/AssetStudioAudio';
