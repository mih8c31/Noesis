import { Outlet } from 'react-router';
import { Header } from '@/core/ui/layout/Header';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
