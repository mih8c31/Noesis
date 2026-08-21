import { Outlet } from 'react-router';
import { BookOpen } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-8 flex items-center gap-2">
        <BookOpen className="h-8 w-8" />
        <span className="text-2xl font-semibold">Noesis</span>
      </div>
      <Outlet />
    </div>
  );
}
