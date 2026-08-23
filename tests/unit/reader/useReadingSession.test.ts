import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReadingSession } from '@/features/reader/hooks/useReadingSession';

vi.mock('@/core/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@test.com' },
    isAuthenticated: true,
  })),
}));

const mockCreateReadingSession = vi.fn();
const mockGetReadingSession = vi.fn();
const mockUpdateReadingSession = vi.fn();

vi.mock('@/features/reader/services/readingService', () => ({
  createReadingSession: (...args: unknown[]) => mockCreateReadingSession(...args),
  getReadingSession: (...args: unknown[]) => mockGetReadingSession(...args),
  updateReadingSession: (...args: unknown[]) => mockUpdateReadingSession(...args),
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

describe('useReadingSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockGetReadingSession.mockResolvedValue({ data: null, error: 'not found', status: 404 });
    mockCreateReadingSession.mockResolvedValue({ data: mockSession, error: null, status: 201 });
    mockUpdateReadingSession.mockResolvedValue({ data: mockSession, error: null, status: 200 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null session initially', () => {
    const { result } = renderHook(() => useReadingSession('doc-1'));
    expect(result.current.session).toBeNull();
  });

  it('should create a new session when initSession is called and no existing session', async () => {
    const { result } = renderHook(() => useReadingSession('doc-1'));

    let session;
    await act(async () => {
      session = await result.current.initSession();
    });

    expect(mockCreateReadingSession).toHaveBeenCalledWith('doc-1', 'user-1');
    expect(session).toEqual(mockSession);
  });

  it('should return existing session when one already exists', async () => {
    const existingSession = { ...mockSession, last_position: 5, pages_read: [1, 2, 3] };
    mockGetReadingSession.mockResolvedValue({ data: existingSession, error: null, status: 200 });

    const { result } = renderHook(() => useReadingSession('doc-1'));

    let session;
    await act(async () => {
      session = await result.current.initSession();
    });

    expect(mockCreateReadingSession).not.toHaveBeenCalled();
    expect(session?.last_position).toBe(5);
    expect(session?.pages_read).toEqual([1, 2, 3]);
  });

  it('should not init when documentId is null', async () => {
    const { result } = renderHook(() => useReadingSession(null));

    let session;
    await act(async () => {
      session = await result.current.initSession();
    });

    expect(session).toBeUndefined();
    expect(mockGetReadingSession).not.toHaveBeenCalled();
    expect(mockCreateReadingSession).not.toHaveBeenCalled();
  });

  it('should update progress and persist to database', async () => {
    const { result } = renderHook(() => useReadingSession('doc-1'));

    await act(async () => {
      await result.current.initSession();
    });

    await act(async () => {
      await result.current.updateProgress(5, 10);
    });

    expect(mockUpdateReadingSession).toHaveBeenCalledWith('session-1', {
      last_position: 5,
      pages_read: expect.arrayContaining([5]),
      progress_pct: 50,
      duration_sec: expect.any(Number),
    });
  });

  it('should not update if session is not initialized', async () => {
    const { result } = renderHook(() => useReadingSession('doc-1'));

    await act(async () => {
      await result.current.updateProgress(5, 10);
    });

    expect(mockUpdateReadingSession).not.toHaveBeenCalled();
  });

  it('should track visited pages correctly', async () => {
    const { result } = renderHook(() => useReadingSession('doc-1'));

    await act(async () => {
      await result.current.initSession();
    });

    await act(async () => {
      await result.current.updateProgress(3, 10);
    });

    await act(async () => {
      await result.current.updateProgress(5, 10);
    });

    const pagesRead = mockUpdateReadingSession.mock.calls[1][1].pages_read;
    expect(pagesRead).toContain(3);
    expect(pagesRead).toContain(5);
  });

  it('should not duplicate visited pages', async () => {
    const { result } = renderHook(() => useReadingSession('doc-1'));

    await act(async () => {
      await result.current.initSession();
    });

    await act(async () => {
      await result.current.updateProgress(3, 10);
    });

    await act(async () => {
      await result.current.updateProgress(3, 10);
    });

    const pagesRead = mockUpdateReadingSession.mock.calls[1][1].pages_read;
    const count3 = pagesRead.filter((p: number) => p === 3).length;
    expect(count3).toBe(1);
  });

  it('should calculate progress percentage correctly', async () => {
    const { result } = renderHook(() => useReadingSession('doc-1'));

    await act(async () => {
      await result.current.initSession();
    });

    await act(async () => {
      await result.current.updateProgress(5, 20);
    });

    const progressPct = mockUpdateReadingSession.mock.calls[0][1].progress_pct;
    expect(progressPct).toBe(25);
  });

  it('should save progress independently via saveProgress', async () => {
    const { result } = renderHook(() => useReadingSession('doc-1'));

    await act(async () => {
      await result.current.initSession();
    });

    await act(async () => {
      await result.current.saveProgress(8, 10);
    });

    expect(mockUpdateReadingSession).toHaveBeenCalledWith('session-1', {
      last_position: 8,
      duration_sec: expect.any(Number),
    });
  });

  it('should return null session after init when creation fails', async () => {
    mockCreateReadingSession.mockResolvedValue({ data: null, error: 'db error', status: 500 });

    const { result } = renderHook(() => useReadingSession('doc-1'));

    let session;
    await act(async () => {
      session = await result.current.initSession();
    });

    expect(session).toBeNull();
  });

  it('should calculate duration from start time', async () => {
    vi.setSystemTime(new Date('2026-08-22T00:00:00Z'));

    const { result } = renderHook(() => useReadingSession('doc-1'));

    await act(async () => {
      await result.current.initSession();
    });

    vi.setSystemTime(new Date('2026-08-22T00:05:00Z'));

    await act(async () => {
      await result.current.updateProgress(1, 10);
    });

    const durationSec = mockUpdateReadingSession.mock.calls[0][1].duration_sec;
    expect(durationSec).toBe(300);
  });
});
