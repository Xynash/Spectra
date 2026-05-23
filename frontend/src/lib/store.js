import { create } from 'zustand';

export const useStore = create((set) => ({
  isDark: false,
  revelationData: null,
  activeRepo: "meshery/meshery", // Default for UI
  activePanel: null, // 'guide', 'scope', 'community', 'chat'
  
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
  setRevelationData: (data) => set({ revelationData: data }),
  setActivePanel: (panel) => set({ activePanel: panel }),
}));