import { Link } from 'react-router';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { Button } from '@/core/ui/ui/button';
import { LogOut, Settings, BookOpen } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-6 w-6" />
          <span>Noesis</span>
        </Link>

        {user && (
          <nav className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
