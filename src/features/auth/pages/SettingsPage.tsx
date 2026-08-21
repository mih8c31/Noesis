import { useAuth } from '@/core/auth/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/ui/ui/card';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Gerencie suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium">ID do usuário</p>
            <p className="text-sm text-muted-foreground font-mono">{user?.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
