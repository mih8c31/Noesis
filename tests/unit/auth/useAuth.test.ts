import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { User, Session } from '@supabase/supabase-js';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

vi.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
      isInitialized: true,
    });
  });

  it('should return unauthenticated state by default', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('should return authenticated state when user and session exist', () => {
    const mockUser = { id: '123', email: 'test@test.com' } as User;
    const mockSession = { access_token: 'token' } as Session;

    useAuthStore.setState({
      user: mockUser,
      session: mockSession,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
  });

  it('should throw when requireAuth is called and not authenticated', () => {
    const { result } = renderHook(() => useAuth());

    expect(() => result.current.requireAuth()).toThrow('Authentication required');
  });

  it('should not throw when requireAuth is called and authenticated', () => {
    const mockUser = { id: '123', email: 'test@test.com' } as User;
    const mockSession = { access_token: 'token' } as Session;

    useAuthStore.setState({
      user: mockUser,
      session: mockSession,
    });

    const { result } = renderHook(() => useAuth());

    expect(() => result.current.requireAuth()).not.toThrow();
  });
});
