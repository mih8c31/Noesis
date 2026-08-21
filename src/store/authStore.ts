import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';
import type { APIResponse } from '@/core/types/common';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  signIn: (credentials: { email: string; password: string }) => Promise<APIResponse<void>>;
  signUp: (data: {
    email: string;
    password: string;
    fullName: string;
  }) => Promise<APIResponse<void>>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<APIResponse<void>>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      session: null,
      isLoading: false,
      isInitialized: false,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),

      signIn: async (credentials) => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            return { data: null, error: error.message, status: 400 };
          }

          return { data: null, error: null, status: 200 };
        } catch {
          return { data: null, error: 'Erro de conexão', status: 500 };
        } finally {
          set({ isLoading: false });
        }
      },

      signUp: async (data) => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: { full_name: data.fullName },
            },
          });

          if (error) {
            return { data: null, error: error.message, status: 400 };
          }

          return { data: null, error: null, status: 200 };
        } catch {
          return { data: null, error: 'Erro de conexão', status: 500 };
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
      },

      resetPassword: async (email) => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${import.meta.env.VITE_APP_URL}/login`,
          });

          if (error) {
            return { data: null, error: error.message, status: 400 };
          }

          return { data: null, error: null, status: 200 };
        } catch {
          return { data: null, error: 'Erro de conexão', status: 500 };
        } finally {
          set({ isLoading: false });
        }
      },

      initialize: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        set({
          session,
          user: session?.user ?? null,
          isInitialized: true,
        });

        supabase.auth.onAuthStateChange((_event, session) => {
          set({
            session,
            user: session?.user ?? null,
          });
        });
      },
    }),
    { name: 'auth-store' }
  )
);
