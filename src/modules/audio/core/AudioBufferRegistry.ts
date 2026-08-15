export class AudioBufferRegistry {
  private static instance: AudioBufferRegistry;
  private buffers: Map<string, AudioBuffer> = new Map();

  private constructor() {}

  public static getInstance(): AudioBufferRegistry {
    if (!AudioBufferRegistry.instance) {
      AudioBufferRegistry.instance = new AudioBufferRegistry();
    }
    return AudioBufferRegistry.instance;
  }

  public register(id: string, buffer: AudioBuffer): void {
    this.buffers.set(id, buffer);
  }

  public get(id: string): AudioBuffer | undefined {
    return this.buffers.get(id);
  }

  public has(id: string): boolean {
    return this.buffers.has(id);
  }

  public remove(id: string): void {
    this.buffers.delete(id);
  }

  public clear(): void {
    this.buffers.clear();
  }

  public getAll(): Map<string, AudioBuffer> {
    return this.buffers;
  }
}
