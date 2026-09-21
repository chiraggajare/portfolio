import { create } from 'zustand'

const getInitialCosmicClouds = () => {
  const saved = localStorage.getItem('showCosmicClouds');
  if (saved !== null) {
    return JSON.parse(saved);
  }
  return true; // Default
};

export const useStore = create((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),
  showCosmicClouds: getInitialCosmicClouds(),
  toggleCosmicClouds: () => set((state) => {
    const nextState = !state.showCosmicClouds;
    localStorage.setItem('showCosmicClouds', JSON.stringify(nextState));
    return { showCosmicClouds: nextState };
  }),
}))
