import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { Button } from '@/core/ui/ui/button';
import { Input } from '@/core/ui/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/core/ui/ui/card';
import { toast } from 'sonner';
import { getAuthErrorMessage } from '@/core/lib/errors';

export function LoginForm() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await signIn({ email, password });

    if (result.error) {
      toast.error(getAuthErrorMessage(result.error));
    } else {
      toast.success('Login realizado com sucesso!');
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Entre com sua conta para acessar o Noesis
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
