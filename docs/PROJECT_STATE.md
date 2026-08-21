# Estado do Projeto — Noesis

> **Última atualização:** 2026-08-20  
> **Status geral:** Sprint 3 concluída (banco de dados + migrations). Aguardando aprovação.

---

## Resumo

| Item | Status |
|---|---|
| Visão do produto | ✅ Aprovada |
| Regras do projeto | ✅ Definidas |
| Modelagem do banco de dados | ✅ Aprovada |
| Arquitetura do sistema | ✅ Aprovada conceitualmente |
| Padrões de desenvolvimento | ✅ Definidos (Sprint 1) |
| Convenções de nomenclatura | ✅ Definidas (Sprint 1) |
| Regras de segurança | ✅ Definidas (Sprint 1) |
| Estratégia de configuração | ✅ Definida (Sprint 1) |
| Estratégia de testes | ✅ Definida (Sprint 1) |
| Estratégia de tratamento de erros | ✅ Definida (Sprint 1) |
| Estratégia de logs/auditoria | ✅ Definida (Sprint 1) |
| Estratégia de storage | ✅ Definida (Sprint 1) |
| Estratégia de autenticação | ✅ Definida (Sprint 1) |
| Setup do projeto | ✅ Concluído (Sprint 2) |
| Autenticação email/senha | ✅ Implementada (Sprint 2) |
| Rotas protegidas | ✅ Implementadas (Sprint 2) |
| Layout base | ✅ Implementado (Sprint 2) |
| ESLint + Prettier | ✅ Configurados (Sprint 2) |
| Testes unitários | ✅ Implementados (Sprint 2) |
| Banco de dados + Migrations | ✅ Implementados (Sprint 3) |
| Storage buckets + policies | ✅ Implementados (Sprint 3) |
| RLS completo (4 tabelas) | ✅ Implementado (Sprint 3) |
| Funcionalidades de negócio | ⏳ Sprint 4+ |
| Deploy | ⏳ Sprint 13 |

---

## Decisões Aprovadas

| Decisão | Valor | Data |
|---|---|---|
| Stack frontend | React 19 + Vite 8 + TypeScript + Tailwind 4 + shadcn/ui | 2026-08-20 |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) | 2026-08-20 |
| Deploy inicial | GitHub Pages | 2026-08-20 |
| Banco de dados | PostgreSQL + pgvector (pgvector adiado para Sprint 4) | 2026-08-20 |
| Estratégia ENUMs | TEXT + CHECK (não PostgreSQL ENUM) | 2026-08-20 |
| Soft delete | Adiado para Sprint 9 | 2026-08-20 |
| Tabela authentication | NÃO criada (Supabase Auth já gerencia) | 2026-08-20 |
| Integridade documents↔libraries | Trigger validate_document_library | 2026-08-20 |
| Profiles SELECT | Restrito ao dono (não público) | 2026-08-20 |
| source_files UPDATE | NÃO permitido (arquivos imutáveis) | 2026-08-20 |
| Migrations | 7 migrations sequenciais | 2026-08-20 |
| Storage via migrations | Criado via SQL (versionado) | 2026-08-20 |
| is_default libraries | Partial unique index | 2026-08-20 |

---

## Arquivos de Documentação

| Arquivo | Descrição | Status |
|---|---|---|
| `README.md` | Visão geral do projeto | ✅ Atualizado (Sprint 3) |
| `docs/ARCHITECTURE.md` | Arquitetura completa do sistema | ✅ Atualizado (Sprint 3) |
| `docs/DATABASE.md` | Modelagem do banco de dados | ✅ Atualizado (Sprint 3) |
| `docs/CONVENTIONS.md` | Padrões e convenções de desenvolvimento | ✅ Atualizado (Sprint 2) |
| `docs/SECURITY.md` | Diretrizes de segurança | ✅ Atualizado (Sprint 3) |
| `docs/ROADMAP.md` | Roadmap de sprints | ✅ Atualizado (Sprint 3) |
| `docs/PROJECT_STATE.md` | Este arquivo | ✅ Atualizado (Sprint 3) |
| `.env.example` | Template de variáveis de ambiente | ✅ Criado |
| `.gitignore` | Arquivos ignorados pelo Git | ✅ Criado |
| `supabase/migrations/*.sql` | 7 migrations do banco | ✅ Criadas (Sprint 3) |

---

## Fluxo de Trabalho

```
Documentação → Revisão → Aprovação → Implementação → Validação
     ↑                                              │
     └──────── Atualização de docs ←────────────────┘
```

**Regra:** Nenhuma funcionalidade é implementada sem antes:
1. Estar documentada
2. Ser revisada pelo responsável técnico
3. Receber aprovação explícita

---

## Sprint 3 — Concluída ✅

**Objetivo:** Modelar e criar a estrutura inicial do banco de dados

### Migrations Criadas

| # | Arquivo | Conteúdo |
|---|---|---|
| `00001` | `enable_extensions.sql` | pgcrypto (gen_random_uuid) |
| `00002` | `create_enums.sql` | Placeholder (TEXT+CHECK decidido) |
| `00003` | `create_profiles.sql` | Tabela profiles + RLS + trigger auto-create |
| `00004` | `create_libraries.sql` | Tabela libraries + RLS + índices |
| `00005` | `create_documents_and_source_files.sql` | Tabelas documents + source_files + RLS + triggers + índices |
| `00006` | `create_updated_at_triggers.sql` | Function + 3 triggers updated_at |
| `00007` | `create_storage_buckets.sql` | 2 buckets + 6 storage policies |

### Tabelas Criadas

| Tabela | Colunas | PK | FKs | Constraints | Índices | RLS |
|---|---|---|---|---|---|---|
| `profiles` | 6 | id | → auth.users | — | — | 3 policies |
| `libraries` | 10 | id | → profiles | name_check, unique_default | 2 | 4 policies |
| `documents` | 25 | id | → profiles, libraries | type_check, status_check, title_check | 3 | 4 policies |
| `source_files` | 7 | id | → documents | UNIQUE(document_id), bucket_check | 1 | 3 policies |

### Constraints

| Tabela | Constraint | Tipo | Detalhe |
|---|---|---|---|
| `profiles` | `profiles_pkey` | PK | `id` |
| `profiles` | `profiles_id_fk` | FK | `id → auth.users(id) ON DELETE CASCADE` |
| `libraries` | `libraries_pkey` | PK | `id` |
| `libraries` | `libraries_user_id_fk` | FK | `user_id → profiles(id) ON DELETE CASCADE` |
| `libraries` | `libraries_name_check` | CHECK | `length(name) > 0 AND length(name) <= 255` |
| `libraries` | `idx_libraries_unique_default` | UNIQUE INDEX | `(user_id) WHERE is_default = true` |
| `documents` | `documents_pkey` | PK | `id` |
| `documents` | `documents_user_id_fk` | FK | `user_id → profiles(id) ON DELETE CASCADE` |
| `documents` | `documents_library_id_fk` | FK | `library_id → libraries(id) ON DELETE CASCADE` |
| `documents` | `documents_type_check` | CHECK | `type IN ('article','book','chapter','thesis','other')` |
| `documents` | `documents_status_check` | CHECK | `status IN ('uploading','processing','ready','error')` |
| `documents` | `documents_title_check` | CHECK | `length(title) > 0 AND length(title) <= 500` |
| `source_files` | `source_files_pkey` | PK | `id` |
| `source_files` | `source_files_document_id_fk` | FK | `document_id → documents(id) ON DELETE CASCADE` |
| `source_files` | `source_files_document_id_unique` | UNIQUE | `document_id` |
| `source_files` | `source_files_bucket_check` | CHECK | `storage_bucket IN ('documents')` |

### Índices

| Índice | Tabela | Colunas | Otimiza |
|---|---|---|---|
| `idx_libraries_user_id` | libraries | user_id | Listagem de bibliotecas do usuário |
| `idx_libraries_unique_default` | libraries | user_id WHERE is_default=true | Constraint de integridade |
| `idx_documents_user_status` | documents | user_id, status | Filtro por status |
| `idx_documents_user_library` | documents | user_id, library_id | Filtro por biblioteca |
| `idx_documents_created_at` | documents | created_at DESC | Listagem cronológica |
| `idx_source_files_document_id` | source_files | document_id | Lookup por documento + RLS JOIN |

### Functions

| Function | Propósito | Security |
|---|---|---|
| `handle_new_user()` | Auto-create profile on signup | SECURITY DEFINER, search_path=public |
| `update_updated_at_column()` | Atualizar updated_at em UPDATE | SECURITY DEFINER, search_path=public |
| `validate_document_library()` | Validar library pertence ao mesmo user | SECURITY DEFINER, search_path=public |

### Triggers

| Trigger | Tabela | Evento | Função |
|---|---|---|---|
| `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` |
| `update_profiles_updated_at` | profiles | BEFORE UPDATE | `update_updated_at_column()` |
| `update_libraries_updated_at` | libraries | BEFORE UPDATE | `update_updated_at_column()` |
| `update_documents_updated_at` | documents | BEFORE UPDATE | `update_updated_at_column()` |
| `validate_document_library_trigger` | documents | BEFORE INSERT OR UPDATE | `validate_document_library()` |

### RLS Policies (tabelas)

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | `id = auth.uid()` | `id = auth.uid()` | `id = auth.uid()` | Via CASCADE |
| `libraries` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `documents` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `source_files` | JOIN documents | JOIN documents | **NÃO** | JOIN documents |

### Storage

| Bucket | Leitura | Escrita | Tamanho | MIME Types |
|---|---|---|---|---|
| `documents` | Dono (policy) | Dono (policy) | 50MB | application/pdf |
| `avatars` | Público (policy) | Dono (policy) | 5MB | image/jpeg, image/png, image/webp |

### Storage Policies

| Policy | Bucket | Operação | Condição |
|---|---|---|---|
| `storage_documents_select_own` | documents | SELECT | folder[1] = auth.uid() |
| `storage_documents_insert_own` | documents | INSERT | folder[1] = auth.uid() |
| `storage_documents_delete_own` | documents | DELETE | folder[1] = auth.uid() |
| `storage_avatars_select_public` | avatars | SELECT | bucket_id = 'avatars' |
| `storage_avatars_insert_own` | avatars | INSERT | folder[1] = auth.uid() |
| `storage_avatars_delete_own` | avatars | DELETE | folder[1] = auth.uid() |

### Decisões Tomadas nesta Sprint

| Decisão | Motivo |
|---|---|
| TEXT + CHECK (não ENUM) | Flexibilidade para evoluir schema sem ALTER TYPE |
| Soft delete adiado | Complexidade desnecessária para MVP; hard delete suficiente |
| `authentication` não criada | Supabase Auth já gerencia providers |
| Trigger para integridade documents↔libraries | CHECK constraints não suportam subqueries no PostgreSQL |
| Profiles SELECT restrito | MVP sem compartilhamento; privacidade por padrão |
| source_files sem UPDATE | Arquivos são imutáveis após upload |
| 7 migrations separadas | Clareza, rastreabilidade, rollback facilitado |
| is_default via partial unique index | Impede múltiplas libraries default por usuário |
| handle_new_user idempotente | ON CONFLICT DO NOTHING permite re-executar migrations |
| search_path = public em todas functions | Segurança contra SQL injection via search_path |

---

## Próximo Passo

**Sprint 3 — IMPLEMENTAÇÃO CONCLUÍDA, EXECUÇÃO REAL PENDENTE** ⚠️

Migrations criadas e validadas (SQL). 3 correções aplicadas após validação. Execução real pendente de configuração Supabase.

### Para executar as migrations manualmente:

1. Criar um projeto no [Supabase](https://supabase.com)
2. Criar `.env.local` com as credenciais:
   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key
   ```
3. Instalar Supabase CLI: `npm install -g supabase`
4. Executar: `supabase db push` ou copiar cada migration para o SQL Editor do Dashboard
5. Ordem: `00001` → `00002` → `00003` → `00004` → `00005` → `00006` → `00007`

### Após execução, testar:
- Criar usuário (deve auto-criar profile)
- Criar library
- Criar document associado à library
- Tentar associar document a library de outro usuário (deve falhar)
- Upload de avatar (deve funcionar com upsert)
- Verificar isolamento entre usuários

Aguardando configuração Supabase para validação real.
