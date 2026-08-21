import { AuthProvider } from '@/core/auth/AuthProvider';
import { AppRouter } from '@/routes';
import { ErrorBoundary } from '@/core/ui/shared/ErrorBoundary';
import { Toaster } from 'sonner';

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ErrorBoundary>
  );
}
