// src/stores/reader.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ReaderTheme = 'parchment' | 'sepia' | 'dark';
export type PageSpread = 'single' | 'spread';
export type ViewMode = 'single' | 'continuous';

const MIN_SCALE = 0.25;
const MAX_SCALE = 2.5;
const ZOOM_STEP = 0.15;

interface ReaderState {
  theme: ReaderTheme;
  scale: number;
  pageSpread: PageSpread;
  viewMode: ViewMode;
  lastReadPages: Record<string, number>;
  setTheme: (theme: ReaderTheme) => void;
  setScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setPageSpread: (spread: PageSpread) => void;
  setViewMode: (mode: ViewMode) => void;
  saveLastReadPage: (documentId: string, pageNumber: number) => void;
  getLastReadPage: (documentId: string) => number;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      theme: 'parchment',
      scale: 1.2,
      pageSpread: 'single',
      viewMode: 'single',
      lastReadPages: {},

      setTheme: (theme) => set({ theme }),

      setScale: (scale) => {
        const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
        set({ scale: parseFloat(clamped.toFixed(2)) });
      },

      zoomIn: () => {
        const next = Math.min(MAX_SCALE, get().scale + ZOOM_STEP);
        set({ scale: parseFloat(next.toFixed(2)) });
      },

      zoomOut: () => {
        const next = Math.max(MIN_SCALE, get().scale - ZOOM_STEP);
        set({ scale: parseFloat(next.toFixed(2)) });
      },

      setPageSpread: (pageSpread) => set({ pageSpread }),

      setViewMode: (viewMode) => set({ viewMode }),

      saveLastReadPage: (documentId, pageNumber) =>
        set((state) => ({
          lastReadPages: { ...state.lastReadPages, [documentId]: pageNumber },
        })),

      getLastReadPage: (documentId) => get().lastReadPages[documentId] ?? 1,
    }),
    {
      name: 'vcmd-reader-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        scale: state.scale,
        pageSpread: state.pageSpread,
        viewMode: state.viewMode,
        lastReadPages: state.lastReadPages,
      }),
    }
  )
);
