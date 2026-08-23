import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createReadingSession,
  getReadingSession,
  updateReadingSession,
} from '@/features/reader/services/readingService';

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: (...args: unknown[]) => {
        mockInsert(...args);
        return {
          select: () => {
            mockSelect();
            return {
              single: () => mockSingle(),
            };
          },
        };
      },
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return {
              eq: (...eqArgs2: unknown[]) => {
                mockEq(...eqArgs2);
                return {
                  order: (...orderArgs: unknown[]) => {
                    mockOrder(...orderArgs);
                    return {
                      limit: (...limitArgs: unknown[]) => {
                        mockLimit(...limitArgs);
                        return {
                          single: () => mockSingle(),
                        };
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return {
              select: () => {
                mockSelect();
                return {
                  single: () => mockSingle(),
                };
              },
            };
          },
        };
      },
    })),
  },
}));

const mockSession = {
  id: 'session-1',
  document_id: 'doc-1',
  user_id: 'user-1',
  started_at: '2026-08-22T00:00:00Z',
  ended_at: null,
  duration_sec: null,
  pages_read: [],
  progress_pct: null,
  last_position: 1,
  created_at: '2026-08-22T00:00:00Z',
  updated_at: '2026-08-22T00:00:00Z',
};

describe('readingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReadingSession', () => {
    it('should create a reading session and return it', async () => {
      mockSingle.mockResolvedValue({ data: mockSession, error: null });

      const result = await createReadingSession('doc-1', 'user-1');

      expect(result.data).toEqual(mockSession);
      expect(result.error).toBeNull();
      expect(result.status).toBe(201);
    });

    it('should return error when creation fails', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'insert failed' } });

      const result = await createReadingSession('doc-1', 'user-1');

      expect(result.data).toBeNull();
      expect(result.error).toBe('insert failed');
      expect(result.status).toBe(500);
    });
  });

  describe('getReadingSession', () => {
    it('should return existing session', async () => {
      mockSingle.mockResolvedValue({ data: mockSession, error: null });

      const result = await getReadingSession('doc-1', 'user-1');

      expect(result.data).toEqual(mockSession);
      expect(result.error).toBeNull();
      expect(result.status).toBe(200);
    });

    it('should return 404 when no session found', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

      const result = await getReadingSession('doc-1', 'user-1');

      expect(result.data).toBeNull();
      expect(result.error).toBe('not found');
      expect(result.status).toBe(404);
    });
  });

  describe('updateReadingSession', () => {
    it('should update session and return updated data', async () => {
      const updatedSession = { ...mockSession, last_position: 5 };
      mockSingle.mockResolvedValue({ data: updatedSession, error: null });

      const result = await updateReadingSession('session-1', { last_position: 5 });

      expect(result.data).toEqual(updatedSession);
      expect(result.error).toBeNull();
      expect(result.status).toBe(200);
    });

    it('should return error when update fails', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'update failed' } });

      const result = await updateReadingSession('session-1', { last_position: 5 });

      expect(result.data).toBeNull();
      expect(result.error).toBe('update failed');
      expect(result.status).toBe(500);
    });

    it('should handle pages_read update', async () => {
      const updatedSession = { ...mockSession, pages_read: [1, 2, 3] };
      mockSingle.mockResolvedValue({ data: updatedSession, error: null });

      const result = await updateReadingSession('session-1', { pages_read: [1, 2, 3] });

      expect(result.data?.pages_read).toEqual([1, 2, 3]);
    });

    it('should handle progress_pct update', async () => {
      const updatedSession = { ...mockSession, progress_pct: 50 };
      mockSingle.mockResolvedValue({ data: updatedSession, error: null });

      const result = await updateReadingSession('session-1', { progress_pct: 50 });

      expect(result.data?.progress_pct).toBe(50);
    });

    it('should handle ended_at update (session end)', async () => {
      const updatedSession = { ...mockSession, ended_at: '2026-08-22T01:00:00Z', duration_sec: 3600 };
      mockSingle.mockResolvedValue({ data: updatedSession, error: null });

      const result = await updateReadingSession('session-1', {
        ended_at: '2026-08-22T01:00:00Z',
        duration_sec: 3600,
      });

      expect(result.data?.ended_at).toBe('2026-08-22T01:00:00Z');
      expect(result.data?.duration_sec).toBe(3600);
    });
  });
});
