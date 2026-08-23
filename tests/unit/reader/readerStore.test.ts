import { describe, it, expect, beforeEach } from 'vitest';
import { useReaderStore } from '@/store/readerStore';

describe('readerStore', () => {
  beforeEach(() => {
    useReaderStore.setState({
      currentPage: 1,
      totalPages: 0,
      zoom: 100,
      isFullscreen: false,
      isSidebarOpen: true,
    });
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useReaderStore.getState();
      expect(state.currentPage).toBe(1);
      expect(state.totalPages).toBe(0);
      expect(state.zoom).toBe(100);
      expect(state.isFullscreen).toBe(false);
      expect(state.isSidebarOpen).toBe(true);
    });
  });

  describe('setCurrentPage', () => {
    it('should set current page', () => {
      useReaderStore.getState().setCurrentPage(5);
      expect(useReaderStore.getState().currentPage).toBe(5);
    });

    it('should set page to 1', () => {
      useReaderStore.getState().setCurrentPage(10);
      useReaderStore.getState().setCurrentPage(1);
      expect(useReaderStore.getState().currentPage).toBe(1);
    });

    it('should not validate page bounds (no range check)', () => {
      useReaderStore.getState().setCurrentPage(999);
      expect(useReaderStore.getState().currentPage).toBe(999);
    });

    it('should allow setting page 0 (no validation)', () => {
      useReaderStore.getState().setCurrentPage(0);
      expect(useReaderStore.getState().currentPage).toBe(0);
    });

    it('should allow setting negative page (no validation)', () => {
      useReaderStore.getState().setCurrentPage(-1);
      expect(useReaderStore.getState().currentPage).toBe(-1);
    });
  });

  describe('setTotalPages', () => {
    it('should set total pages', () => {
      useReaderStore.getState().setTotalPages(42);
      expect(useReaderStore.getState().totalPages).toBe(42);
    });

    it('should allow setting 0', () => {
      useReaderStore.getState().setTotalPages(100);
      useReaderStore.getState().setTotalPages(0);
      expect(useReaderStore.getState().totalPages).toBe(0);
    });
  });

  describe('setZoom', () => {
    it('should set zoom level', () => {
      useReaderStore.getState().setZoom(150);
      expect(useReaderStore.getState().zoom).toBe(150);
    });

    it('should not validate zoom bounds (no min/max check in store)', () => {
      useReaderStore.getState().setZoom(10);
      expect(useReaderStore.getState().zoom).toBe(10);

      useReaderStore.getState().setZoom(500);
      expect(useReaderStore.getState().zoom).toBe(500);
    });
  });

  describe('toggleFullscreen', () => {
    it('should toggle from false to true', () => {
      expect(useReaderStore.getState().isFullscreen).toBe(false);
      useReaderStore.getState().toggleFullscreen();
      expect(useReaderStore.getState().isFullscreen).toBe(true);
    });

    it('should toggle from true to false', () => {
      useReaderStore.setState({ isFullscreen: true });
      useReaderStore.getState().toggleFullscreen();
      expect(useReaderStore.getState().isFullscreen).toBe(false);
    });

    it('should toggle multiple times', () => {
      useReaderStore.getState().toggleFullscreen();
      useReaderStore.getState().toggleFullscreen();
      expect(useReaderStore.getState().isFullscreen).toBe(false);
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle from true to false', () => {
      expect(useReaderStore.getState().isSidebarOpen).toBe(true);
      useReaderStore.getState().toggleSidebar();
      expect(useReaderStore.getState().isSidebarOpen).toBe(false);
    });

    it('should toggle from false to true', () => {
      useReaderStore.setState({ isSidebarOpen: false });
      useReaderStore.getState().toggleSidebar();
      expect(useReaderStore.getState().isSidebarOpen).toBe(true);
    });
  });

  describe('state persistence across actions', () => {
    it('should preserve other state when setting page', () => {
      useReaderStore.setState({ zoom: 150, totalPages: 20 });
      useReaderStore.getState().setCurrentPage(5);
      const state = useReaderStore.getState();
      expect(state.currentPage).toBe(5);
      expect(state.zoom).toBe(150);
      expect(state.totalPages).toBe(20);
    });
  });
});
