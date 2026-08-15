import { create } from 'zustand';

export interface UploadedSoundItem {
  id: string;
  name: string;
  category: 'Uploaded';
  duration: number;
  uploadedAt: number;
}

interface AudioStoreState {
  uploadedSounds: UploadedSoundItem[];
  addUploadedSound: (sound: UploadedSoundItem) => void;
  removeUploadedSound: (id: string) => void;
  clearUploadedSounds: () => void;
}

export const useAudioStore = create<AudioStoreState>((set) => ({
  uploadedSounds: [],
  addUploadedSound: (sound) =>
    set((state) => ({
      uploadedSounds: [sound, ...state.uploadedSounds.filter((s) => s.id !== sound.id)],
    })),
  removeUploadedSound: (id) =>
    set((state) => ({
      uploadedSounds: state.uploadedSounds.filter((s) => s.id !== id),
    })),
  clearUploadedSounds: () => set({ uploadedSounds: [] }),
}));
