import { create } from 'zustand'

export const useStore = create((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),
}))
