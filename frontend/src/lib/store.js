"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      isDark: false,
      revelationData: null,
      activeRepoUrl: "",
      activePanel: null,

      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),

      setRevelationData: (data) => set({ revelationData: data }),

      setActiveRepoUrl: (url) => set({ activeRepoUrl: url }),

      setActivePanel: (panel) =>
        set((state) => ({
          activePanel: state.activePanel === panel ? null : panel,
        })),

      clearRevelation: () => set({ revelationData: null, activeRepoUrl: "" }),
    }),
    {
      name: 'spectra-store',          // localStorage key
      partialize: (state) => ({       // only persist these fields
        revelationData: state.revelationData,
        activeRepoUrl: state.activeRepoUrl,
        isDark: state.isDark,
      }),
    }
  )
);
