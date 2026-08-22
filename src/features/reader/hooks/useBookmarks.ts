import { useState, useCallback } from 'react';
import {
  createBookmark,
  getBookmarks,
  deleteBookmark,
} from '../services/bookmarkService';
import type { Bookmark } from '../types';

export function useBookmarks(sessionId: string | null) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const loadBookmarks = useCallback(async () => {
    if (!sessionId) return;

    const result = await getBookmarks(sessionId);
    if (result.data) {
      setBookmarks(result.data);
    }
  }, [sessionId]);

  const addBookmark = useCallback(
    async (pageNumber: number, label?: string) => {
      if (!sessionId) return null;

      const result = await createBookmark(sessionId, pageNumber, label);
      if (result.data) {
        setBookmarks((prev) => [...prev, result.data!].sort((a, b) => a.page_number - b.page_number));
        return result.data;
      }
      return null;
    },
    [sessionId]
  );

  const removeBookmark = useCallback(async (bookmarkId: string) => {
    const result = await deleteBookmark(bookmarkId);
    if (result.status === 200) {
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      return true;
    }
    return false;
  }, []);

  const hasBookmarkOnPage = useCallback(
    (pageNumber: number) => {
      return bookmarks.some((b) => b.page_number === pageNumber);
    },
    [bookmarks]
  );

  return {
    bookmarks,
    loadBookmarks,
    addBookmark,
    removeBookmark,
    hasBookmarkOnPage,
  };
}
