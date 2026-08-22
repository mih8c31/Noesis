import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ReaderState {
  currentPage: number;
  totalPages: number;
  zoom: number;
  isFullscreen: boolean;
  isSidebarOpen: boolean;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setZoom: (zoom: number) => void;
  toggleFullscreen: () => void;
  toggleSidebar: () => void;
}

export const useReaderStore = create<ReaderState>()(
  devtools(
    (set) => ({
      currentPage: 1,
      totalPages: 0,
      zoom: 100,
      isFullscreen: false,
      isSidebarOpen: true,

      setCurrentPage: (page) => set({ currentPage: page }),
      setTotalPages: (total) => set({ totalPages: total }),
      setZoom: (zoom) => set({ zoom }),
      toggleFullscreen: () =>
        set((state) => ({ isFullscreen: !state.isFullscreen })),
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    { name: 'reader-store' }
  )
);
