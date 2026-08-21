import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, session, isLoading, signIn, signUp, signOut, resetPassword } = useAuthStore();

  const isAuthenticated = !!user && !!session;

  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }
  }, [isAuthenticated]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
    requireAuth,
  };
}
