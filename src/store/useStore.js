import { create } from 'zustand'

export const useStore = create((set) => ({
  // ---- Flight (scroll) mode: the main website ----
  progress: 0,
  velocity: 0, // signed progress change per second (smoothed)
  setProgress: (progress, velocity = 0) => set({ progress, velocity }),

  // ---- Star system mode ----
  // mode: 'flight' = scroll-driven journey, 'system' = explorable star system
  mode: 'flight',
  // the body we are landing on / landed on (null = orbiting the system)
  selected: null,
  // true once the landing approach has settled (the floating info appears)
  landed: false,

  enterSystem: () => set({ mode: 'system', selected: null, landed: false }),
  exitSystem: () => set({ mode: 'flight', selected: null, landed: false }),
  select: (selected) => set({ selected, landed: false }),
  setLanded: (landed) => set({ landed }),
}))
