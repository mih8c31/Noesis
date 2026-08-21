# Padrões e Convenções de Desenvolvimento — Noesis

> **Versão:** 1.0  
> **Última atualização:** 2026-08-20  
> **Escopo:** Todas as camadas do projeto (frontend, backend, edge functions, banco)

---

## Índice

1. [Stack Oficial](#1-stack-oficial)
2. [Convenções de Nomenclatura](#2-convenções-de-nomenclatura)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Padrões de Código TypeScript](#4-padrões-de-código-typescript)
5. [Padrões de Componentes React](#5-padrões-de-componentes-react)
6. [Padrões de Hooks](#6-padrões-de-hooks)
7. [Padrões de Services](#7-padrões-de-services)
8. [Padrões de Zustand Stores](#8-padões-de-zustand-stores)
9. [Padrões de Edge Functions](#9-padrões-de-edge-functions)
10. [Padrões de Migrations](#10-padrões-de-migrations)
11. [Estratégia de Variáveis de Ambiente](#11-estratégia-de-variáveis-de-ambiente)
12. [Estratégia de Configuração](#12-estratégia-de-configuração)
13. [Estratégia de Tratamento de Erros](#13-estratégia-de-tratamento-de-erros)
14. [Estratégia de Logs e Auditoria](#14-estratégia-de-logs-e-auditoria)
15. [Estratégia de Testes](#15-estratégia-de-testes)
16. [Estratégia de Documentação](#16-estratégia-de-documentação)
17. [Estratégia de Storage](#17-estratégia-de-storage)
18. [Estratégia de Autenticação e Autorização](#18-estratégia-de-autenticação-e-autorização)

---

## 1. Stack Oficial

| Camada | Tecnologia | Versão |
|---|---|---|
| **Framework** | React | 19.x |
| **Bundler** | Vite | 6.x |
| **Linguagem** | TypeScript | 5.x |
| **CSS** | Tailwind CSS | 4.x |
| **Componentes** | shadcn/ui | latest |
| **Ícones** | Lucide React | latest |
| **Roteamento** | React Router | 7.x |
| **Estado global** | Zustand | 5.x |
| **Valores** | Zod | 3.x |
| **Backend** | Supabase | latest |
| **Banco** | PostgreSQL + pgvector | — |
| **Auth** | Supabase Auth | — |
| **Storage** | Supabase Storage | — |
| **Edge Functions** | Deno (Supabase Edge Runtime) | — |
| **Cache local** | Dexie.js (IndexedDB) | 4.x |
| **Testes** | Vitest + Playwright | — |
| **Deploy** | GitHub Pages | — |

> **Nota:** Todas as versões são `latest` ou `^x.x` no package.json. A versão exata será definida na inicialização do projeto.

---

## 2. Convenções de Nomenclatura

### Arquivos

| Tipo | Padrão | Exemplo |
|---|---|---|
| Componentes React | `PascalCase.tsx` | `LoginForm.tsx` |
| Hooks | `camelCase.ts` (prefixo `use`) | `useAuth.ts` |
| Services | `camelCase.ts` (sufixo `.service.ts`) | `auth.service.ts` |
| Stores | `camelCase.ts` (sufixo `Store.ts`) | `authStore.ts` |
| Utilitários | `camelCase.ts` | `formatters.ts` |
| Tipos | `camelCase.ts` | `database.ts` |
| Contexts | `PascalCase.tsx` | `ModalityContext.tsx` |
| Providers | `PascalCase.tsx` (sufixo `Provider`) | `VoiceProvider.tsx` |
| Páginas | `PascalCase.tsx` (sufixo `Page`) | `LoginPage.tsx` |
| Testes | `nome.test.ts` ou `nome.spec.ts` | `useAuth.test.ts` |
| Migrations SQL | `NNNNN_descricao.sql` | `00001_enable_extensions.sql` |
| Edge Functions | `kebab-case/` com `index.ts` | `ai-proxy/index.ts` |
| Estilos CSS | `kebab-case.css` | `globals.css` |

### Diretórios

| Tipo | Padrão | Exemplo |
|---|---|---|
| Features | `kebab-case/` | `features/auth/` |
| Core | `kebab-case/` | `core/database/` |
| Shared | `kebab-case/` | `shared/contexts/` |
| Components | `PascalCase/` | `components/LoginForm/` |

### Variáveis e Funções

| Tipo | Padrão | Exemplo |
|---|---|---|
| Variáveis | `camelCase` | `userName`, `documentId` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE`, `API_TIMEOUT` |
| Funções | `camelCase` | `handleUpload()`, `fetchDocuments()` |
| Funções de React | `camelCase` | `useAuth()`, `useDocuments()` |
| Interfaces | `PascalCase` (sem `I`) | `UserProfile`, `Document` |
| Types | `PascalCase` | `DocumentType`, `AuthProvider` |
| Enums | `PascalCase` | `DocumentStatus`, `Modality` |
| Constantes de Enum | `UPPER_SNAKE_CASE` | `UPLOADING`, `READY`, `ERROR` |

### Banco de Dados

| Tipo | Padrão | Exemplo |
|---|---|---|
| Tabelas | `snake_case` (plural) | `reading_sessions` |
| Colunas | `snake_case` | `user_id`, `created_at` |
| Índices | `idx_{tabela}_{coluna}` | `idx_documents_user_id` |
| Foreign Keys | `fk_{tabela}_{referencia}` | `fk_documents_library_id` |
| ENUMs | `snake_case` | `document_status`, `annotation_type` |
| Policies RLS | `{ação}_{tabela}_{condição}` | `users_select_own_documents` |

---

## 3. Estrutura de Pastas

```
noesis/
├── .github/workflows/      # CI/CD
├── docs/                   # Documentação
├── supabase/
│   ├── config.toml         # Configuração Supabase
│   ├── migrations/         # SQL migrations
│   └── functions/          # Edge Functions (Deno)
├── public/                 # Assets estáticos
├── src/
│   ├── main.tsx            # Entry point
│   ├── App.tsx             # Root component
│   ├── config/             # Configurações globais
│   ├── core/               # Funcionalidades transversais
│   │   ├── auth/
│   │   ├── database/
│   │   ├── storage/
│   │   ├── cache/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   └── ui/
│   ├── features/           # Módulos de funcionalidades
│   │   ├── auth/
│   │   ├── library/
│   │   ├── documents/
│   │   ├── reader/
│   │   ├── chat/
│   │   ├── fichamentos/
│   │   ├── annotations/
│   │   ├── citations/
│   │   ├── translations/
│   │   ├── voice/
│   │   └── settings/
│   ├── shared/             # Contextos e providers
│   │   ├── contexts/
│   │   ├── providers/
│   │   └── state-machine/
│   ├── routes/             # Definição de rotas
│   ├── store/              # Zustand stores
│   └── styles/             # Estilos globais
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .gitignore
├── components.json         # Config shadcn/ui
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 4. Padrões de Código TypeScript

### Regras Gerais

- **Stric mode** habilitado em `tsconfig.json`
- **Sem `any`** — usar `unknown` quando o tipo for desconhecido
- **Tipagem explícita** em funções públicas e retornos
- **NonNull Assertion** (`!`) apenas em casos justificados
- **Enum `as const`** para enums estáticos
- **Discriminated unions** para state machines

### Exemplo de Padrão de Tipo

```typescript
// core/types/database.ts

export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error';

export type DocumentType = 'article' | 'book' | 'chapter' | 'thesis' | 'other';

export type Modality = 'voice' | 'text';

export interface Document {
  id: string;
  user_id: string;
  library_id: string;
  type: DocumentType;
  status: DocumentStatus;
  title: string;
  abstract: string | null;
  authors: string[];
  page_count: number;
  file_size_bytes: number;
  extracted_text: string | null;
  content_summary: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  deleted_at: string | null;
}

export interface APIResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

---

## 5. Padrões de Componentes React

### Regras

- **Functional components** exclusivamente
- **Props com interface** — nunca `any`
- **Componentes nomeados** — sem arrow functions anônimas
- **Um componente por arquivo**
- **Exportação nomeada** — sem `export default`
- **Separação de responsabilidade**: UI pura + lógica em hooks

### Estrutura de Componente

```typescript
// features/auth/components/LoginForm.tsx

import { useState } from 'react';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { Button } from '@/core/ui/ui/button';
import { Input } from '@/core/ui/ui/input';
import type { LoginFormProps } from '../types';

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn({ email, password });
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" disabled={isLoading}>
        Entrar
      </Button>
    </form>
  );
}
```

### Barrel Exports

Cada módulo `features/` e `core/` possui `index.ts` para exportações públicas:

```typescript
// features/auth/index.ts
export { LoginForm } from './components/LoginForm';
export { OAuthButtons } from './components/OAuthButtons';
export { LoginPage } from './pages/LoginPage';
```

---

## 6. Padrões de Hooks

### Regras

- **Sempre** com prefixo `use`
- **Um hook por arquivo**
- **Tipagem explícita** no retorno
- **Cleanup** de efeitos colaterais
- **Memoização** quando necessário (`useCallback`, `useMemo`)

### Exemplo

```typescript
// core/auth/hooks/useAuth.ts

import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, session, signIn, signOut, isLoading } = useAuthStore();

  const isAuthenticated = !!user && !!session;

  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }
  }, [isAuthenticated]);

  return {
    user,
    session,
    signIn,
    signOut,
    isLoading,
    isAuthenticated,
    requireAuth,
  };
}
```

---

## 7. Padrões de Services

### Regras

- **Services** encapsulam chamadas Supabase e APIs externas
- **Retornam** `APIResponse<T>` tipado
- **Tratam erros** internamente e retornam `{ error }` em vez de throw
- **Um service por módulo** ou por domínio

### Exemplo

```typescript
// features/documents/services/document.service.ts

import { supabase } from '@/config/supabase';
import type { Document, APIResponse } from '@/core/types/database';

export const documentService = {
  async list(userId: string): Promise<APIResponse<Document[]>> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message, status: 500 };
    }

    return { data, error: null, status: 200 };
  },

  async upload(file: File, userId: string): Promise<APIResponse<Document>> {
    // Implementação...
  },
};
```

---

## 8. Padrões de Zustand Stores

### Regras

- **Um store por domínio**
- **Tipagem explícita** do state
- **Actions** como funções dentro do store
- **Persist** para dados que devem sobreviver refresh (opcional)
- **Devtools** habilitado em desenvolvimento

### Exemplo

```typescript
// store/authStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      session: null,
      isLoading: false,

      signIn: async (credentials) => {
        set({ isLoading: true });
        // Implementação...
        set({ isLoading: false });
      },

      signOut: async () => {
        set({ user: null, session: null });
      },

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
    }),
    { name: 'auth-store' }
  )
);
```

---

## 9. Padrões de Edge Functions

### Regras

- **Linguagem:** TypeScript (Deno runtime)
- **Uma função por arquivo** `index.ts`
- **Validação** de input com Zod
- **Autenticação** via JWT do Supabase
- **Retorno** padronizado: `{ data, error, status }`
- **Logging** estruturado (JSON)
- **Timeout** configurável (máximo 30s)

### Estrutura

```typescript
// supabase/functions/ai-proxy/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  provider: z.string(),
  model: z.string().optional(),
});

serve(async (req) => {
  try {
    // 1. Autenticar
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', status: 401 }),
        { status: 401 }
      );
    }

    // 2. Validar input
    const body = await req.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validated.error.issues, status: 400 }),
        { status: 400 }
      );
    }

    // 3. Processar
    const { messages, provider, model } = validated.data;
    // Implementação...

    // 4. Retornar
    return new Response(
      JSON.stringify({ data: result, error: null, status: 200 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', status: 500 }),
      { status: 500 }
    );
  }
});
```

---

## 10. Padrões de Migrations

### Regras

- **Numeração sequencial:** `NNNNN_descricao.sql`
- **Uma migration por Change** — não agrupar mudanças não relacionadas
- **Idempotência** quando possível (`IF NOT EXISTS`)
- **Rollback documentado** em comentário no topo
- **RLS** habilitado e configurado na mesma migration da tabela
- **Índices** em migration separada após tabelas criadas

### Estrutura

```sql
-- Migration: 00003_create_profiles.sql
-- Rollback: DROP TABLE IF EXISTS profiles;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy padrão
CREATE POLICY "users_can_only_access_own_data"
ON profiles
FOR ALL
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
ON profiles(created_at);
```

---

## 11. Estratégia de Variáveis de Ambiente

### Arquivos

| Arquivo | Propósito | Versionado |
|---|---|---|
| `.env.example` | Template das variáveis necessárias | ✅ Sim |
| `.env.local` | Valores reais (local) | ❌ Nunca (gitignore) |
| `.env` | Valores padrão (opcional) | ⚠️ Cuidado |

### Variáveis Necessárias

```bash
# .env.example

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Providers (só no .env.local — nunca expostos ao frontend)
# Estas variáveis são usadas APENAS em Edge Functions
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GROQ_API_KEY=gsk_...

# App
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Noesis
```

### Regras de Segurança

- **`VITE_` prefixo:** Variáveis expostas ao frontend (somente seguras)
- **Sem prefixo `VITE_`:** Variáveis sensíveis (só em Edge Functions ou build server)
- **Nunca** commitar `.env.local`
- **Nunca** colocar API keys de IA no frontend
- **Supabase anon key** é segura para uso no frontend (RLS protege)

---

## 12. Estratégia de Configuração

### Camadas de Configuração

```
1. Variáveis de ambiente (.env)     → Configuração por ambiente
2. src/config/constants.ts          → Constantes da aplicação
3. src/config/supabase.ts           → Inicialização do Supabase
4. src/config/ai-providers.ts       → Configuração de provedores IA
5. system_settings (banco)          → Configurações dinâmicas
```

### Exemplo de Constants

```typescript
// src/config/constants.ts

export const APP_NAME = 'Noesis';
export const APP_VERSION = '1.0.0';

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_FILE_TYPES = ['application/pdf'] as const;

export const CHUNK_SIZE_TOKENS = 500;
export const CHUNK_OVERLAP_TOKENS = 50;

export const EMBEDDING_DIMENSIONS = 1536;

export const AI_REQUEST_TIMEOUT_MS = 60_000;
export const TTS_REQUEST_TIMEOUT_MS = 30_000;

export const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hora

export const PAGINATION_PAGE_SIZE = 20;
```

---

## 13. Estratégia de Tratamento de Erros

### Camadas

| Camada | Tratamento |
|---|---|
| **React Components** | Error Boundary + Toast notification |
| **Hooks** | Retorno `{ data, error }` em vez de throw |
| **Services** | Catch e retorna `APIResponse<T>` com error |
| **Edge Functions** | Try/catch + retorno JSON padronizado |
| **Supabase/RLS** | Erros retornam HTTP 403/404 genéricos |
| **AI Providers** | Fallback entre provedores + retry |

### Padrão de Erro

```typescript
// core/lib/errors.ts

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
    return new AppError(
      error.message,
      'SUPABASE_ERROR',
      500
    );
  }
  return new AppError(
    'Erro desconhecido',
    'UNKNOWN_ERROR',
    500
  );
}
```

---

## 14. Estratégia de Logs e Auditoria

### Níveis de Log

| Nível | Uso | Exemplo |
|---|---|---|
| `error` | Erros que precisam de atenção | Falha de conexão com IA |
| `warn` | Avisos não críticos | Rate limit próximo |
| `info` | Informações relevantes | Upload concluído |
| `debug` | Detalhes para desenvolvimento | Query SQL executada |

### Onde Logar

| Local | Ferramenta | Uso |
|---|---|---|
| **Edge Functions** | `console.log` (JSON) | Logs estruturados |
| **Frontend (dev)** | `console.log/warn/error` | Debug |
| **Frontend (prod)** | Sentry (futuro) | Error tracking |
| **Banco de dados** | `audit_logs` | Auditoria de ações |
| **AI interactions** | `ai_interactions` | Custo, tokens, latência |

### Regras de Auditoria

- **Todas as operações de escrita** são auditadas
- **Login/logout** são auditados
- **Chamadas à IA** são auditadas com tokens e custo
- **Dados antigos** podem ser purgados após 90 dias

---

## 15. Estratégia de Testes

### Hierarquia

```
┌─────────────────────────────────────┐
│  E2E Tests (Playwright)             │  ← Fluxos críticos de negócio
│  - Login completo                   │
│  - Upload de documento              │
│  - Chat com IA                      │
├─────────────────────────────────────┤
│  Integration Tests (Vitest)         │  ← Integração entre módulos
│  - Service + Supabase               │
│  - Hook + Store                     │
├─────────────────────────────────────┤
│  Unit Tests (Vitest)                │  ← Lógica isolada
│  - Utilitários                      │
│  - Funções de formatação            │
│  - Validações Zod                   │
└─────────────────────────────────────┘
```

### Convenções de Teste

- **Arquivo:** `nome.test.ts` (unit/integration) ou `nome.spec.ts` (E2E)
- **Localização:** `tests/unit/`, `tests/integration/`, `tests/e2e/`
- **Framework:** Vitest (unit/integration), Playwright (E2E)
- **Cobertura mínima:** 80% para services e utils
- **Mocking:** `vi.mock()` do Vitest para Supabase e APIs externas
- **Dados de teste:** Fixtures em `tests/fixtures/`

### Comandos

```bash
npm run test          # Roda todos os testes
npm run test:unit     # Só unitários
npm run test:integration  # Só integração
npm run test:e2e      # Só E2E
npm run test:coverage # Relatório de cobertura
```

---

## 16. Estratégia de Documentação

### Regra Principal

**Documentação → Revisão → Aprovação → Implementação → Testes → Validação → Atualização da documentação**

### Arquivos de Documentação

| Arquivo | Conteúdo | Atualizado por |
|---|---|---|
| `README.md` | Visão geral do projeto | Arquiteto |
| `docs/ARCHITECTURE.md` | Arquitetura completa | Arquiteto |
| `docs/DATABASE.md` | Modelagem do banco | Arquiteto |
| `docs/CONVENTIONS.md` | Padrões de desenvolvimento | Tech Lead |
| `docs/SECURITY.md` | Regras de segurança | Security Specialist |
| `docs/ROADMAP.md` | Roadmap de sprints | Tech Lead |
| `docs/PROJECT_STATE.md` | Estado atual do projeto | Tech Lead |
| `docs/API.md` | Documentação de APIs | Backend Developer |
| `docs/DECISIONS.md` | Architecture Decision Records | Arquiteto |

### Regras

- **Nenhuma funcionalidade** é implementada sem estar documentada
- **Toda decisão técnica** é registrada em `DECISIONS.md` (ADR)
- **PROJECT_STATE.md** é a fonte oficial do estado atual
- **ARCHITECTURE.md** é a fonte oficial da arquitetura
- **DATABASE.md** é a fonte oficial do modelo de dados

---

## 17. Estratégia de Storage

### Buckets

| Bucket | Conteúdo | Acesso | Tamanho máximo |
|---|---|---|---|
| `documents` | PDFs e documentos | Privado (RLS) | 50MB por arquivo |
| `avatars` | Fotos de perfil | Público (leitura), Privado (escrita) | 5MB por arquivo |

### Estrutura de Caminhos

```
documents/
└── {user_id}/
    └── {document_id}/
        └── original.pdf

avatars/
└── {user_id}/
    └── avatar.{ext}
```

### Regras

- **Upload** direto do browser ao Supabase Storage
- **RLS policies** por usuário (`user_id` no path)
- **Validação** de tipo e tamanho antes do upload
- **Nomes de arquivo** sanitizados (sem caracteres especiais)
- **Metadados** armazenados na tabela `source_files`

---

## 18. Estratégia de Autenticação e Autorização

### Autenticação

| Provider | Status | Prioridade |
|---|---|---|
| Email + Senha | ✅ Suportado | Primário |
| Google OAuth | ✅ Suportado | Secundário |
| GitHub OAuth | 📋 Futuro | Terciário |

### Fluxo

1. Usuário faz login via Supabase Auth
2. Supabase retorna JWT com `auth.uid()`
3. JWT armazenado no cliente (automático pelo Supabase JS)
4. Todas as queries incluem Bearer token
5. RLS filtra dados automaticamente

### Autorização (RLS)

- **Todas as tabelas** com RLS habilitado
- **Política padrão:** `USING (user_id = auth.uid())`
- **Sem cross-tenant access** — garantido pelo RLS
- **Edge Functions** herdam JWT do client

---

## 19. Regras de Zustand

### Uso do Zustand

Zustand é usado **somente** para estados verdadeiramente globais, compartilhados entre múltiplas features.

### Onde USAR Zustand

- Estado de autenticação (user, session)
- Estado de configurações de usuário (quando existir)
- Estado de preferências globais do app

### Onde NÃO USAR Zustand

- Estado de componentes (formulários, modais, dropdowns)
- Estado de uma feature específica (usar React state local)
- Cache de dados (usar React Query ou state local)
- Substituir Context do React indiscriminadamente

### Padrão de Store

```typescript
// store/exampleStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ExampleState {
  data: DataType | null;
  isLoading: boolean;
  setData: (data: DataType | null) => void;
}

export const useExampleStore = create<ExampleState>()(
  devtools(
    (set) => ({
      data: null,
      isLoading: false,
      setData: (data) => set({ data }),
    }),
    { name: 'example-store' }
  )
);
```

---

## 20. Configuração de ESLint e Prettier

### ESLint

- **Configuração:** `eslint.config.js` (flat config)
- **Plugins:** `typescript-eslint`, `react-hooks`, `react-refresh`
- **Regras principais:**
  - `@typescript-eslint/no-explicit-any`: error
  - `@typescript-eslint/no-unused-vars`: error (com `argsIgnorePattern: '^_'`)
  - `@typescript-eslint/consistent-type-imports`: error
  - `react-refresh/only-export-components`: warn

### Prettier

- **Configuração:** `.prettierrc`
- **Configurações padrão:**
  - `semi: true`
  - `singleQuote: true`
  - `trailingComma: 'es5'`
  - `tabWidth: 2`
  - `printWidth: 100`

### Comandos

```bash
npm run lint          # Verificar lint
npm run lint:fix      # Corrigir lint automaticamente
npm run format        # Formatar com Prettier
npm run format:check  # Verificar formatação
```

---

## 21. Sistema de Notificações (Sonner)

### Configuração

```typescript
// No App.tsx
import { Toaster } from 'sonner';

<Toaster richColors position="top-right" />
```

### Uso

```typescript
import { toast } from 'sonner';

toast.success('Operação realizada com sucesso!');
toast.error('Ocorreu um erro');
toast.info('Informação importante');
```

---

## Validação

Esta documentação foi revisada e validada como parte das Sprints 1 e 2.

**Status:** Sprint 2 concluída.
