import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { Button } from '@/core/ui/ui/button';
import { Input } from '@/core/ui/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/core/ui/ui/card';
import { toast } from 'sonner';
import { getAuthErrorMessage } from '@/core/lib/errors';
import { CheckCircle2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await resetPassword(email);

    if (result.error) {
      toast.error(getAuthErrorMessage(result.error));
    } else {
      setIsSent(true);
      toast.success('Email de recuperação enviado!');
    }
  }

  if (isSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <CardTitle>Email enviado</CardTitle>
          <CardDescription>
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-sm text-primary hover:underline">
            Voltar para o login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Esqueceu a senha?</CardTitle>
        <CardDescription>
          Informe seu email para receber um link de recuperação
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
          </Button>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
            Voltar para o login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
