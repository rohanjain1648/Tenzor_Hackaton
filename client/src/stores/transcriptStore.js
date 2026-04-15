import { create } from 'zustand';

export const useTranscriptStore = create((set) => ({
  transcripts: [], // Array of { id, text, isFinal, timestamp, speaker }
  interimText: '',
  
  addTranscript: (transcript) => set((state) => ({
    transcripts: [...state.transcripts, { ...transcript, id: Date.now() + Math.random() }]
  })),

  setInterimText: (text) => set({ interimText: text }),

  clearTranscripts: () => set({ transcripts: [], interimText: '' })
}));
