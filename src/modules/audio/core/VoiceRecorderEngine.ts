import { AudioBufferRegistry } from './AudioBufferRegistry';
import { ProceduralAudioEngine } from './ProceduralAudioEngine';
import { useAudioStore } from '../store/audioStore';

export class VoiceRecorderEngine {
  private static instance: VoiceRecorderEngine;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  public isRecording: boolean = false;

  private constructor() {}

  public static getInstance(): VoiceRecorderEngine {
    if (!VoiceRecorderEngine.instance) {
      VoiceRecorderEngine.instance = new VoiceRecorderEngine();
    }
    return VoiceRecorderEngine.instance;
  }

  // 1. Start live microphone capture
  public async startRecording(): Promise<void> {
    const audioEngine = ProceduralAudioEngine.getInstance();
    if (audioEngine.ctx.state === 'suspended') {
      await audioEngine.ctx.resume();
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
    this.isRecording = true;
  }

  // 2. Stop recording, decode into AudioBuffer, and register as an Uploaded Sound
  public async stopRecording(): Promise<{ id: string; name: string; duration: number; buffer: AudioBuffer }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        this.isRecording = false;
        return reject(new Error('MediaRecorder is not initialized.'));
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();

          const audioEngine = ProceduralAudioEngine.getInstance();
          const decodedBuffer = await audioEngine.ctx.decodeAudioData(arrayBuffer);

          const soundId = `rec_${Date.now()}`;
          const count = useAudioStore.getState().uploadedSounds.filter((s) => s.name.startsWith('Voice Rec')).length + 1;
          const recordingName = `Voice Rec #${count}`;

          // Save raw AudioBuffer to global registry
          AudioBufferRegistry.getInstance().register(soundId, decodedBuffer);

          // Persist metadata into the uploaded sounds library
          useAudioStore.getState().addUploadedSound({
            id: soundId,
            name: recordingName,
            category: 'Uploaded',
            duration: Math.round(decodedBuffer.duration * 100) / 100,
            uploadedAt: Date.now(),
          });

          // Cleanup microphone stream
          this.stream?.getTracks().forEach((track) => track.stop());
          this.stream = null;
          this.isRecording = false;

          resolve({
            id: soundId,
            name: recordingName,
            duration: Math.round(decodedBuffer.duration * 100) / 100,
            buffer: decodedBuffer,
          });
        } catch (error) {
          this.isRecording = false;
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }
}
