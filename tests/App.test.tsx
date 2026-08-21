import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '@/App';

vi.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

describe('App', () => {
  it('should render without crashing', async () => {
    render(<App />);
    
    await vi.waitFor(() => {
      expect(screen.getByText('Noesis')).toBeInTheDocument();
    });
  });

  it('should show login page by default', async () => {
    render(<App />);
    
    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    });
  });
});
