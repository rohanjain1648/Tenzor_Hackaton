import { create } from 'zustand';

export const useKYCStore = create((set) => ({
  estimatedAge: null,
  location: null,
  deviceMetadata: null,
  isAgeVerified: false,
  
  setEstimatedAge: (age) => set({ estimatedAge: age, isAgeVerified: true }),
  setLocation: (loc) => set({ location: loc }),
  setDeviceMetadata: (meta) => set({ deviceMetadata: meta }),
  
  clearKYC: () => set({ estimatedAge: null, location: null, deviceMetadata: null, isAgeVerified: false })
}));
