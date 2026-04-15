import { create } from 'zustand';

export const useOfferStore = create((set) => ({
  assessment: null,
  policyResult: null,
  offers: [],
  isAssessing: false,
  error: null,

  setAssessment: (data) => set({ 
    assessment: data.assessment, 
    policyResult: data.policyResult, 
    offers: data.offers,
    isAssessing: false,
    error: null
  }),

  setAssessing: (val) => set({ isAssessing: val }),
  setError: (err) => set({ error: err, isAssessing: false }),
  
  clearOffers: () => set({ assessment: null, policyResult: null, offers: [], isAssessing: false, error: null })
}));
