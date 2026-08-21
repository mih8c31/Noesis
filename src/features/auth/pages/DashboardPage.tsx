import { useAuth } from '@/core/auth/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/ui/ui/card';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Noesis</CardTitle>
          <CardDescription>Sua plataforma de pesquisa científica com IA</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Logado como: <span className="font-medium text-foreground">{user?.email}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
