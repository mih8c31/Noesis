import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBookmarks } from '@/features/reader/hooks/useBookmarks';

const mockCreateBookmark = vi.fn();
const mockGetBookmarks = vi.fn();
const mockDeleteBookmark = vi.fn();

vi.mock('@/features/reader/services/bookmarkService', () => ({
  createBookmark: (...args: unknown[]) => mockCreateBookmark(...args),
  getBookmarks: (...args: unknown[]) => mockGetBookmarks(...args),
  deleteBookmark: (...args: unknown[]) => mockDeleteBookmark(...args),
}));

const mockBookmark1 = {
  id: 'b1',
  session_id: 'session-1',
  page_number: 3,
  position_pct: null,
  label: 'Capítulo 1',
  created_at: '2026-08-22T00:00:00Z',
};

const mockBookmark2 = {
  id: 'b2',
  session_id: 'session-1',
  page_number: 7,
  position_pct: null,
  label: null,
  created_at: '2026-08-22T00:01:00Z',
};

describe('useBookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBookmarks.mockResolvedValue({ data: [], error: null, status: 200 });
    mockCreateBookmark.mockResolvedValue({ data: mockBookmark1, error: null, status: 201 });
    mockDeleteBookmark.mockResolvedValue({ data: null, error: null, status: 200 });
  });

  describe('with valid sessionId', () => {
    it('should return empty bookmarks initially', () => {
      const { result } = renderHook(() => useBookmarks('session-1'));
      expect(result.current.bookmarks).toEqual([]);
    });

    it('should load bookmarks from database', async () => {
      mockGetBookmarks.mockResolvedValue({ data: [mockBookmark1, mockBookmark2], error: null, status: 200 });

      const { result } = renderHook(() => useBookmarks('session-1'));

      await act(async () => {
        await result.current.loadBookmarks();
      });

      expect(result.current.bookmarks).toHaveLength(2);
      expect(result.current.bookmarks[0].page_number).toBe(3);
    });

    it('should add a bookmark and update local state', async () => {
      mockCreateBookmark.mockResolvedValue({ data: mockBookmark1, error: null, status: 201 });

      const { result } = renderHook(() => useBookmarks('session-1'));

      let bookmark;
      await act(async () => {
        bookmark = await result.current.addBookmark(3, 'Capítulo 1');
      });

      expect(bookmark).toEqual(mockBookmark1);
      expect(result.current.bookmarks).toHaveLength(1);
      expect(mockCreateBookmark).toHaveBeenCalledWith('session-1', 3, 'Capítulo 1');
    });

    it('should sort bookmarks by page number after adding', async () => {
      // First add bookmark on page 10
      const bm10 = { ...mockBookmark1, id: 'b10', page_number: 10 };
      mockCreateBookmark.mockResolvedValueOnce({ data: bm10, error: null, status: 201 });

      const { result } = renderHook(() => useBookmarks('session-1'));

      await act(async () => {
        await result.current.addBookmark(10, 'Page 10');
      });

      // Then add bookmark on page 5
      const bm5 = { ...mockBookmark1, id: 'b5', page_number: 5 };
      mockCreateBookmark.mockResolvedValueOnce({ data: bm5, error: null, status: 201 });

      await act(async () => {
        await result.current.addBookmark(5, 'Page 5');
      });

      expect(result.current.bookmarks[0].page_number).toBe(5);
      expect(result.current.bookmarks[1].page_number).toBe(10);
    });

    it('should remove a bookmark from local state', async () => {
      mockGetBookmarks.mockResolvedValue({ data: [mockBookmark1], error: null, status: 200 });

      const { result } = renderHook(() => useBookmarks('session-1'));

      await act(async () => {
        await result.current.loadBookmarks();
      });

      expect(result.current.bookmarks).toHaveLength(1);

      await act(async () => {
        await result.current.removeBookmark('b1');
      });

      expect(result.current.bookmarks).toHaveLength(0);
      expect(mockDeleteBookmark).toHaveBeenCalledWith('b1');
    });

    it('should return true when removeBookmark succeeds', async () => {
      const { result } = renderHook(() => useBookmarks('session-1'));

      let success;
      await act(async () => {
        success = await result.current.removeBookmark('b1');
      });

      expect(success).toBe(true);
    });

    it('should return false when removeBookmark fails', async () => {
      mockDeleteBookmark.mockResolvedValue({ data: null, error: 'delete failed', status: 500 });

      const { result } = renderHook(() => useBookmarks('session-1'));

      let success;
      await act(async () => {
        success = await result.current.removeBookmark('b1');
      });

      expect(success).toBe(false);
    });

    it('should correctly report hasBookmarkOnPage', async () => {
      mockGetBookmarks.mockResolvedValue({ data: [mockBookmark1], error: null, status: 200 });

      const { result } = renderHook(() => useBookmarks('session-1'));

      await act(async () => {
        await result.current.loadBookmarks();
      });

      expect(result.current.hasBookmarkOnPage(3)).toBe(true);
      expect(result.current.hasBookmarkOnPage(5)).toBe(false);
    });
  });

  describe('with null sessionId', () => {
    it('should not load bookmarks when sessionId is null', async () => {
      const { result } = renderHook(() => useBookmarks(null));

      await act(async () => {
        await result.current.loadBookmarks();
      });

      expect(mockGetBookmarks).not.toHaveBeenCalled();
      expect(result.current.bookmarks).toEqual([]);
    });

    it('should not create bookmark when sessionId is null', async () => {
      const { result } = renderHook(() => useBookmarks(null));

      let bookmark;
      await act(async () => {
        bookmark = await result.current.addBookmark(5);
      });

      expect(bookmark).toBeNull();
      expect(mockCreateBookmark).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should add bookmark without label', async () => {
      const bookmarkNoLabel = { ...mockBookmark1, label: null };
      mockCreateBookmark.mockResolvedValue({ data: bookmarkNoLabel, error: null, status: 201 });

      const { result } = renderHook(() => useBookmarks('session-1'));

      await act(async () => {
        await result.current.addBookmark(5);
      });

      expect(mockCreateBookmark).toHaveBeenCalledWith('session-1', 5, undefined);
    });

    it('should handle loadBookmarks error gracefully', async () => {
      mockGetBookmarks.mockResolvedValue({ data: null, error: 'db error', status: 500 });

      const { result } = renderHook(() => useBookmarks('session-1'));

      await act(async () => {
        await result.current.loadBookmarks();
      });

      expect(result.current.bookmarks).toEqual([]);
    });
  });
});
