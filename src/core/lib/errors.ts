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

export function getAuthErrorMessage(error: string): string {
  const lower = error.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'Email ou senha incorretos';
  }
  if (lower.includes('email not confirmed') || lower.includes('email_address_not_confirmed')) {
    return 'Por favor, confirme seu email antes de fazer login';
  }
  if (lower.includes('user not found') || lower.includes('user_already_exists')) {
    return 'Usuário não encontrado';
  }
  if (lower.includes('password should be at least') || lower.includes('weak_password')) {
    return 'A senha deve ter pelo menos 6 caracteres';
  }
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'Este email já está em uso';
  }
  if (lower.includes('too many') || lower.includes('rate limit')) {
    return 'Muitas tentativas. Por favor, aguarde alguns minutos';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet';
  }
  if (lower.includes('signup requires') || lower.includes('signup requires a valid password')) {
    return 'A senha deve ter pelo menos 6 caracteres';
  }

  return 'Ocorreu um erro inesperado';
}
