import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/core/auth/hooks/useAuth';
import {
  createReadingSession,
  getReadingSession,
  updateReadingSession,
} from '../services/readingService';
import type { ReadingSession } from '../types';

export function useReadingSession(documentId: string | null) {
  const { user } = useAuth();
  const sessionRef = useRef<ReadingSession | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pagesVisitedRef = useRef<Set<number>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initSession = useCallback(async () => {
    if (!documentId || !user) return;

    const existing = await getReadingSession(documentId, user.id);
    if (existing.data) {
      sessionRef.current = existing.data;
      startTimeRef.current = Date.now();
      pagesVisitedRef.current = new Set(existing.data.pages_read);
      return existing.data;
    }

    const created = await createReadingSession(documentId, user.id);
    if (created.data) {
      sessionRef.current = created.data;
      startTimeRef.current = Date.now();
      pagesVisitedRef.current = new Set();
      return created.data;
    }

    return null;
  }, [documentId, user]);

  const updateProgress = useCallback(
    async (currentPage: number, totalPages: number) => {
      if (!sessionRef.current) return;

      pagesVisitedRef.current.add(currentPage);
      const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const progressPct = totalPages > 0
        ? Math.round((currentPage / totalPages) * 100 * 100) / 100
        : 0;

      await updateReadingSession(sessionRef.current.id, {
        last_position: currentPage,
        pages_read: Array.from(pagesVisitedRef.current),
        progress_pct: progressPct,
        duration_sec: durationSec,
      });
    },
    []
  );

  const saveProgress = useCallback(
    async (currentPage: number, _totalPages: number) => {
      if (!sessionRef.current) return;

      const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      await updateReadingSession(sessionRef.current.id, {
        last_position: currentPage,
        duration_sec: durationSec,
      });
    },
    []
  );

  useEffect(() => {
    const currentInterval = intervalRef.current;
    return () => {
      if (currentInterval) {
        clearInterval(currentInterval);
      }
    };
  }, []);

  return {
    session: sessionRef.current,
    initSession,
    updateProgress,
    saveProgress,
    getSessionId: () => sessionRef.current?.id ?? null,
  };
}
