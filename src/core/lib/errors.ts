export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleSupabaseError(error: unknown): AppError {
  if (error instanceof Error) {
    return new AppError(error.message, 'SUPABASE_ERROR', 500);
  }
  return new AppError('Erro desconhecido', 'UNKNOWN_ERROR', 500);
}

export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    invalid_credentials: 'Email ou senha incorretos',
    email_not_confirmed: 'Por favor, confirme seu email antes de fazer login',
    user_not_found: 'Usuário não encontrado',
    weak_password: 'A senha deve ter pelo menos 6 caracteres',
    email_already_in_use: 'Este email já está em uso',
    too_many_requests: 'Muitas tentativas. Por favor, aguarde alguns minutos',
    network_error: 'Erro de conexão. Verifique sua internet',
  };
  return messages[code] || 'Ocorreu um erro inesperado';
}
