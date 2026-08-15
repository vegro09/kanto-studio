/**
 * Kanto Audio Engineer - AudioExportMixer
 * Multi-track OfflineAudioContext rendering and WAV export mixdown engine
 */

import { VoiceFilterEngine } from './ProceduralAudioEngine';
import { getProceduralSFXBuffer } from './SoundLibrary';

export interface ExportAudioClip {
  id: string;
  name: string;
  trackId?: string;
  startTime?: number;
  startTimeSec?: number;
  duration?: number;
  buffer?: AudioBuffer | null;
  sfxId?: string;
  volume?: number;
  pitchShift?: number;
  speed?: number;
  trimStart?: number;
  fadeIn?: number;
  fadeOut?: number;
  filterId?: string;
  url?: string;
  src?: string;
}

export class AudioExportMixer {
  public static async mixdownAudioTracks(
    clips: ExportAudioClip[],
    totalDurationSec: number,
    sampleRate: number = 44100
  ): Promise<{ wavBlob: Blob; audioBuffer: AudioBuffer } | null> {
    if (!clips || clips.length === 0 || totalDurationSec <= 0) {
      return null;
    }

    const duration = Math.max(0.5, totalDurationSec);
    const totalFrames = Math.ceil(sampleRate * duration);
    const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);
    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.9, 0);

    const limiter = offlineCtx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-0.5, 0);
    limiter.ratio.setValueAtTime(20.0, 0);
    limiter.attack.setValueAtTime(0.002, 0);
    limiter.release.setValueAtTime(0.05, 0);

    masterGain.connect(limiter);
    limiter.connect(offlineCtx.destination);

    const voiceFilterEngine = new VoiceFilterEngine(offlineCtx);

    for (const clip of clips) {
      let buffer: AudioBuffer | null = clip.buffer || null;

      // 1. Resolve buffer if not already decoded
      if (!buffer && clip.sfxId) {
        buffer = await getProceduralSFXBuffer(clip.sfxId);
      } else if (!buffer && (clip.src || clip.url)) {
        try {
          const resp = await fetch(clip.src || clip.url!);
          const arrayBuffer = await resp.arrayBuffer();
          buffer = await offlineCtx.decodeAudioData(arrayBuffer);
        } catch (err) {
          console.warn('[AudioExportMixer] Failed to decode audio clip:', clip.name, err);
        }
      }

      if (!buffer) continue;

      const startTime = typeof clip.startTime === 'number' ? clip.startTime : (clip.startTimeSec || 0);
      if (startTime >= duration) continue;

      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;

      const speed = clip.speed && clip.speed > 0 ? clip.speed : 1.0;
      const pitchShift = clip.pitchShift || 0;
      const totalDetune = pitchShift * 100;
      source.playbackRate.setValueAtTime(speed, 0);
      source.detune.setValueAtTime(totalDetune, 0);

      // Volume & Envelope Node
      const gainNode = offlineCtx.createGain();
      const vol = clip.volume !== undefined ? clip.volume : 1.0;
      const clipDuration = typeof clip.duration === 'number' && clip.duration > 0 ? clip.duration : buffer.duration;
      const fadeIn = clip.fadeIn || 0;
      const fadeOut = clip.fadeOut || 0;

      const start = Math.max(0, startTime);
      const end = start + clipDuration;

      if (fadeIn > 0) {
        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.linearRampToValueAtTime(vol, start + fadeIn);
      } else {
        gainNode.gain.setValueAtTime(vol, start);
      }

      if (fadeOut > 0) {
        gainNode.gain.setValueAtTime(vol, Math.max(start, end - fadeOut));
        gainNode.gain.linearRampToValueAtTime(0.0001, end);
      }

      // Voice DSP Filter if specified
      if (clip.filterId && clip.filterId !== 'none') {
        const filterGraph = voiceFilterEngine.createFilterGraph(clip.filterId);
        source.connect(filterGraph.inputNode);
        filterGraph.outputNode.connect(gainNode);
      } else {
        source.connect(gainNode);
      }

      gainNode.connect(masterGain);

      const trimStart = clip.trimStart || 0;
      const playDur = Math.min(clipDuration, duration - start);
      if (playDur > 0) {
        source.start(start, trimStart, playDur);
      }
    }

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = this.bufferToWavBlob(renderedBuffer);

    return { wavBlob, audioBuffer: renderedBuffer };
  }

  public static bufferToWavBlob(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    let sample = 0;
    let offset = 0;
    let pos = 0;

    const writeString = (view: DataView, offsetPos: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offsetPos + i, str.charCodeAt(i));
      }
    };

    writeString(out, pos, 'RIFF'); pos += 4;
    out.setUint32(pos, length - 8, true); pos += 4;
    writeString(out, pos, 'WAVE'); pos += 4;

    writeString(out, pos, 'fmt '); pos += 4;
    out.setUint32(pos, 16, true); pos += 4;
    out.setUint16(pos, 1, true); pos += 2;
    out.setUint16(pos, numOfChan, true); pos += 2;
    out.setUint32(pos, buffer.sampleRate, true); pos += 4;
    out.setUint32(pos, buffer.sampleRate * 2 * numOfChan, true); pos += 4;
    out.setUint16(pos, numOfChan * 2, true); pos += 2;
    out.setUint16(pos, 16, true); pos += 2;

    writeString(out, pos, 'data'); pos += 4;
    out.setUint32(pos, length - pos - 4, true); pos += 4;

    const channels: Float32Array[] = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (offset < buffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
  }
}
