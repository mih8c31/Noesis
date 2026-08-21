import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';
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

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
      isInitialized: false,
    });
  });

  it('should have initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(false);
  });

  it('should set user', () => {
    const mockUser = { id: '123', email: 'test@test.com' } as User;
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('should set session', () => {
    const mockSession = { access_token: 'token' } as Session;
    useAuthStore.getState().setSession(mockSession);
    expect(useAuthStore.getState().session).toEqual(mockSession);
  });

  it('should set loading state', async () => {
    const { signIn } = useAuthStore.getState();

    vi.mocked(
      (await import('@/config/supabase')).supabase.auth.signInWithPassword
    ).mockResolvedValue({ data: { user: null, session: null }, error: null });

    const promise = signIn({ email: 'test@test.com', password: 'password' });
    expect(useAuthStore.getState().isLoading).toBe(true);

    await promise;
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
