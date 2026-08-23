import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createBookmark,
  getBookmarks,
  deleteBookmark,
} from '@/features/reader/services/bookmarkService';

const mockFrom = vi.fn();

vi.mock('@/config/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const mockBookmark = {
  id: 'bookmark-1',
  session_id: 'session-1',
  page_number: 5,
  position_pct: null,
  label: 'Test bookmark',
  created_at: '2026-08-22T00:00:00Z',
};

describe('bookmarkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBookmark', () => {
    it('should create a bookmark and return it', async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockBookmark, error: null }),
          }),
        }),
      });

      const result = await createBookmark('session-1', 5, 'Test bookmark');

      expect(result.data).toEqual(mockBookmark);
      expect(result.error).toBeNull();
      expect(result.status).toBe(201);
    });

    it('should create a bookmark without label', async () => {
      const bookmarkNoLabel = { ...mockBookmark, label: null };
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: bookmarkNoLabel, error: null }),
          }),
        }),
      });

      const result = await createBookmark('session-1', 5);

      expect(result.data?.label).toBeNull();
    });

    it('should return error when creation fails', async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
          }),
        }),
      });

      const result = await createBookmark('session-1', 5);

      expect(result.data).toBeNull();
      expect(result.error).toBe('insert failed');
      expect(result.status).toBe(500);
    });
  });

  describe('getBookmarks', () => {
    it('should return bookmarks for a session', async () => {
      const bookmarks = [mockBookmark];
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: bookmarks, error: null }),
          }),
        }),
      });

      const result = await getBookmarks('session-1');

      expect(result.data).toEqual(bookmarks);
      expect(result.status).toBe(200);
    });

    it('should return empty array when no bookmarks exist', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const result = await getBookmarks('session-1');

      expect(result.data).toEqual([]);
      expect(result.status).toBe(200);
    });

    it('should return error when query fails', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'query failed' } }),
          }),
        }),
      });

      const result = await getBookmarks('session-1');

      expect(result.data).toBeNull();
      expect(result.error).toBe('query failed');
      expect(result.status).toBe(500);
    });
  });

  describe('deleteBookmark', () => {
    it('should delete a bookmark successfully', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await deleteBookmark('bookmark-1');

      expect(result.error).toBeNull();
      expect(result.status).toBe(200);
    });

    it('should return error when deletion fails', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'delete failed' } }),
        }),
      });

      const result = await deleteBookmark('bookmark-1');

      expect(result.error).toBe('delete failed');
      expect(result.status).toBe(500);
    });
  });
});
