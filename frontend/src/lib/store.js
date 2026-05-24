import { create } from 'zustand';

export const useStore = create((set) => ({
  isDark: false,
  revelationData: null,
  activeRepoUrl: "", // New: Track current repo
  activePanel: null, 
  
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
  setRevelationData: (data) => set({ revelationData: data }),
  setActiveRepoUrl: (url) => set({ activeRepoUrl: url }), // New
  setActivePanel: (panel) => set({ activePanel: panel }),
}));