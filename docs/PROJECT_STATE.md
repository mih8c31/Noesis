# Estado do Projeto — Noesis

> **Última atualização:** 2026-08-22  
> **Status geral:** Sprint 4.2 concluída (diagnóstico funcional pós-deploy). Deploy validado em GitHub Pages. Aguardando aprovação para Sprint 5.

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
| Processamento PDF (pdfjs-dist) | ✅ Implementado (Sprint 4) |
| Chunking + Storage + Services | ✅ Implementados (Sprint 4) |
| Documentos CRUD + UI | ✅ Implementado (Sprint 4) |
| pgvector extension | ✅ Habilitado (Sprint 4) |
| document_chunks + RLS + índices | ✅ Implementados (Sprint 4) |
| Funcionalidades de negócio (IA) | ⏳ Sprint 5+ |
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
| `docs/ARCHITECTURE.md` | Arquitetura completa do sistema | ✅ Atualizado (Sprint 4) |
| `docs/DATABASE.md` | Modelagem do banco de dados | ✅ Atualizado (Sprint 4) |
| `docs/CONVENTIONS.md` | Padrões e convenções de desenvolvimento | ✅ Atualizado (Sprint 2) |
| `docs/SECURITY.md` | Diretrizes de segurança | ✅ Atualizado (Sprint 3) |
| `docs/ROADMAP.md` | Roadmap de sprints | ✅ Atualizado (Sprint 4) |
| `docs/PROJECT_STATE.md` | Este arquivo | ✅ Atualizado (Sprint 4) |
| `.env.example` | Template de variáveis de ambiente | ✅ Criado |
| `.gitignore` | Arquivos ignorados pelo Git | ✅ Criado |
| `supabase/migrations/*.sql` | 11 migrations do banco | ✅ Criadas (Sprint 3-4.2) |

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
| `00007` | `create_storage_buckets.sql` | 2 buckets + 7 storage policies |

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
| `idx_documents_user_created` | documents | user_id, created_at DESC | Listagem cronológica |

**NOTA:** `idx_source_files_document_id` foi removido — o UNIQUE constraint em `document_id` já cria índice implícito.

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
| `storage_avatars_update_own` | avatars | UPDATE | folder[1] = auth.uid() |

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

**Sprint 3 — EXECUTADA EM SUPABASE REAL ✅**

7 migrations aplicadas com sucesso via `supabase db push`. Banco validado.

### Validação do banco real (2026-08-21):

| Verificação | Status |
|---|---|
| profiles table | ✅ Criada |
| libraries table | ✅ Criada |
| documents table | ✅ Criada |
| source_files table | ✅ Criada |
| RLS ativo (anon vê 0 linhas) | ✅ Funcionando |
| 10 índices criados | ✅ Todos confirmados |
| Storage buckets (documents, avatars) | ✅ Criados via migration |
| 14 table RLS policies | ✅ Aplicadas |
| 7 storage policies | ✅ Aplicadas |
| Triggers (updated_at, validate_document_library, handle_new_user) | ✅ Aplicados |

### Próximo passo: Sprint 4 — Processamento + RAG

Antes de iniciar, definir:
- Provider de IA (OpenAI como padrão, key necessária)
- Modelo de embeddings (text-embedding-3-small)
- Chunking strategy
- Edge Function para proxy de IA

---

## Sprint 4 — Concluída ✅

**Objetivo:** Processamento de PDF no client-side + preparação para RAG

### Migrations Criadas

| # | Arquivo | Conteúdo |
|---|---|---|
| `00008` | `enable_pgvector.sql` | Extensão pgvector |
| `00009` | `create_document_chunks.sql` | Tabela document_chunks + RLS + constraints |
| `00010` | `create_document_chunks_indexes.sql` | 2 índices para chunks |

### Tabela document_chunks

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() |
| `document_id` | UUID | NOT NULL, FK → documents(id) ON DELETE CASCADE |
| `chunk_index` | INTEGER | NOT NULL, CHECK >= 0 |
| `content` | TEXT | NOT NULL |
| `metadata` | JSONB | DEFAULT '{}' |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |

**Constraints:** UNIQUE(document_id, chunk_index), CHECK(chunk_index >= 0)

**RLS:** 3 policies (SELECT, INSERT, DELETE via documents JOIN)

**Índices:** 2 (document_id), (document_id, chunk_index)

### Dependências Adicionadas

| Pacote | Versão | Uso |
|---|---|---|
| `pdfjs-dist` | 6.2.108 | Extração de texto PDF client-side |
| `uuid` | latest | Geração de IDs de documentos |

### Arquivos Criados/Modificados

| Arquivo | Ação |
|---|---|
| `src/config/constants.ts` | Modificado: removido EMBEDDING_DIMENSIONS, adicionados MAX_PROCESSING_SIZE, CHUNK_SIZE_CHARS, CHUNK_OVERLAP_CHARS |
| `src/core/types/documents.ts` | Criado: interfaces Document, SourceFile, DocumentChunk, ChunkMetadata, types DocumentStatus, DocumentErrorCode |
| `src/features/documents/utils/pdfValidation.ts` | Criado: validatePdfFile, sanitizeFileName, getDocumentTitle |
| `src/features/documents/services/storageService.ts` | Criado: uploadDocument, deleteDocumentFile, getDocumentFileUrl, downloadDocumentFile |
| `src/features/documents/services/documentService.ts` | Criado: createDocument, updateDocumentStatus, updateDocumentExtractedText, getDocument, getDocuments, deleteDocument |
| `src/features/documents/services/sourceFileService.ts` | Criado: createSourceFile, getSourceFileByDocumentId |
| `src/features/documents/services/chunkService.ts` | Criado: createChunks, deleteChunksByDocumentId, getChunksByDocumentId |
| `src/features/documents/services/chunkingService.ts` | Criado: chunkText (paragraph-aware, ~2000 chars, ~200 overlap) |
| `src/features/documents/services/processingService.ts` | Criado: extractPdfText, extractTextFromUrl |
| `src/features/documents/hooks/useDocumentUpload.ts` | Criado: uploadPdf com pipeline completo |
| `src/features/documents/hooks/useDocuments.ts` | Criado: loadDocuments, removeDocument |
| `src/features/documents/components/DocumentUpload.tsx` | Criado: drag & drop + status feedback |
| `src/features/documents/components/DocumentCard.tsx` | Criado: card de documento com status |
| `src/features/documents/pages/DocumentsPage.tsx` | Criado: listagem com upload |
| `src/features/documents/pages/DocumentDetailPage.tsx` | Criado: detalhes do documento |
| `src/routes/index.tsx` | Modificado: adicionadas rotas /documents e /documents/:id |
| `src/features/auth/pages/DashboardPage.tsx` | Modificado: cards de features com navegação |
| `tests/setup.ts` | Modificado: adicionado mock de pdfjs-dist |
| `tests/unit/documents/pdfValidation.test.ts` | Criado: 9 testes |

### Decisões Tomadas nesta Sprint

| Decisão | Motivo |
|---|---|
| Processamento client-side (pdfjs-dist) | MVP sem Edge Functions; simplifica deploy |
| Sem coluna embedding (Sprint 4) | Dimensão definida na Sprint 6 após escolha de modelo |
| Sem índice HNSW (Sprint 4) | Criado na Sprint 6 com pgvector completo |
| Sem Edge Functions (Sprint 4) | Adiado para IA (Sprint 5+) |
| Sem OCR (Sprint 4) | Documentado como evolução futura |
| Máx processamento: 20 MB | Limitação de memória client-side; arquivos >20MB armazenados com status=error |
| PDFs sem texto: status=error | error_code=NO_EXTRACTABLE_TEXT; suporte a OCR futuro |
| Frontend validation é UX only | Segurança via RLS + Storage Policies |
| pgvector habilitado agora | Preparação para Sprint 6; sem custo |

### Validação do banco real (2026-08-21):

| Verificação | Status |
|---|---|
| pgvector extension v0.8.2 | ✅ Habilitada |
| document_chunks table | ✅ Criada (6 colunas) |
| RLS ativo em document_chunks | ✅ Funcionando |
| 3 RLS policies document_chunks | ✅ Aplicadas |
| 2 índices document_chunks | ✅ Criados |
| 4 constraints document_chunks | ✅ Aplicadas |
| 10 migrations (00001-00010) | ✅ Todas aplicadas |

### Validação de código

| Verificação | Status |
|---|---|
| `npm run lint` | ✅ 0 errors, 0 warnings |
| `npx tsc -b` | ✅ Sem erros |
| `npm run test` | ✅ 22 testes passando (5 arquivos) |
| `npm run build` | ✅ Build produzido (972.86 kB gzip 285.93 kB) |

**NOTA:** Chunk do bundle >500 kB devido ao pdfjs-dist. Code-splitting será avaliado no futuro.

### Próximo passo: Sprint 4.2 — Diagnóstico Funcional Pós-Deploy

---

## Sprint 4.2 — Diagnóstico Funcional Pós-Deploy ✅ CONCLUÍDA

**Objetivo:** Diagnosticar e corrigir problemas que impediam o fluxo completo da aplicação após deploy em GitHub Pages.

### Problemas Identificados e Corrigidos

| # | Problema | Severidade | Arquivo | Correção | Status |
|---|---|---|---|---|---|
| 1 | Sem navegação pós-login | Crítico | `LoginForm.tsx`, `RegisterForm.tsx` | `useNavigate()` + `navigate('/dashboard')` | ✅ |
| 2 | `VITE_APP_URL=localhost` no build | Médio | `.env.production` | Criado com URL de produção | ✅ |
| 3 | `mailer_autoconfirm: false` | Médio | Supabase Dashboard | Habilitado via Management API | ✅ |
| 4 | `library_id='default'` hardcoded | Baixo | `DocumentsPage.tsx` | Query dinâmica para library padrão | ✅ |
| 5 | Nenhuma library existente | Baixo | `handle_new_user()` | Trigger atualizado + library criada | ✅ |
| 6 | Erros de auth genéricos | Baixo | `errors.ts` | Mapeamento de mensagens Supabase SDK | ✅ |

### Configurações Supabase Alteradas

| Configuração | Antes | Depois |
|---|---|---|
| `mailer_autoconfirm` | `false` | `true` |

### Banco de Dados Alterado

| Mudança | Detalhe |
|---|---|
| `handle_new_user()` atualizado | Cria library padrão "Minha Biblioteca" junto com profile |
| Library padrão criada | Para o usuário existente (`x3x31@hotmail.com`) |

### Arquivos Modificados/Criados

| Arquivo | Ação |
|---|---|
| `src/features/auth/components/LoginForm.tsx` | Modificado: adicionado `useNavigate` + `navigate('/dashboard')` |
| `src/features/auth/components/RegisterForm.tsx` | Modificado: adicionado `useNavigate` + `navigate('/dashboard')` |
| `src/core/lib/errors.ts` | Modificado: `getAuthErrorMessage` aceita mensagens do Supabase SDK |
| `src/features/documents/pages/DocumentsPage.tsx` | Modificado: busca library padrão via query em vez de hardcoded |
| `.env.production` | Criado: `VITE_APP_URL=https://mih8c31.github.io/Noesis` |
| `.env.example` | Modificado: documentação de ambientes |
| `supabase/migrations/00011_create_default_library_and_update_trigger.sql` | Criado: migration para library padrão |

### Validação

| Verificação | Status |
|---|---|
| `npm run lint` | ✅ 0 errors, 0 warnings |
| `npx tsc -b` | ✅ Sem erros |
| `npm run test` | ✅ 25 testes passando (6 arquivos) |
| `npm run build` | ✅ 973.57 kB (gzip 286.17 kB) |
| `VITE_APP_URL` no build | ✅ `https://mih8c31.github.io/Noesis` |
| `localhost:5173` no build | ✅ Removido |
| Deploy GitHub Pages | ✅ Funcional |

### Próximo passo: Sprint 5 — Leitor de PDF

---

## Auditoria Final da Sprint 3 (2026-08-21)

### 1. Projeto Supabase Conectado

| Item | Valor |
|---|---|
| Project Ref | `kjphsqxtrlzvvkbczzwx` |
| Project URL | `https://kjphsqxtrlzvvkbczzwx.supabase.co` |
| Conexão CLI | `supabase link --project-ref kjphsqxtrlzvvkbczzwx` |
| Credenciais CLI | Armazenadas em `~/.supabase/` (fora do repositório) |

### 2. Migrations Aplicadas (ordem)

| # | Migration | Status |
|---|---|---|
| 00001 | `enable_extensions.sql` | ✅ Aplicada |
| 00002 | `create_enums.sql` | ✅ Aplicada (placeholder) |
| 00003 | `create_profiles.sql` | ✅ Aplicada |
| 00004 | `create_libraries.sql` | ✅ Aplicada |
| 00005 | `create_documents_and_source_files.sql` | ✅ Aplicada |
| 00006 | `create_updated_at_triggers.sql` | ✅ Aplicada |
| 00007 | `create_storage_buckets.sql` | ✅ Aplicada |

### 3. Tabelas Existentes (banco real)

| Tabela | Colunas | Status |
|---|---|---|
| `profiles` | 6 (id, full_name, avatar_url, bio, created_at, updated_at) | ✅ Confirmada |
| `libraries` | 10 (id, user_id, name, description, icon, color, is_default, sort_order, created_at, updated_at) | ✅ Confirmada |
| `documents` | 25 (id, user_id, library_id, type, status, title, abstract, authors, publication_year, publisher, journal, volume, issue, doi, isbn, url, language, page_count, file_size_bytes, content_type, extracted_text, content_summary, tags, metadata, created_at, updated_at, processed_at) | ✅ Confirmada |
| `source_files` | 7 (id, document_id, storage_bucket, file_path, mime_type, file_size, created_at) | ✅ Confirmada |

### 4. ENUMs e CHECK Constraints

**ENUMs:** Nenhum (estratégia TEXT+CHECK conforme decidido).

**CHECK Constraints (5):**

| Constraint | Tabela | Definição |
|---|---|---|
| `documents_type_check` | documents | `type IN ('article','book','chapter','thesis','other')` |
| `documents_status_check` | documents | `status IN ('uploading','processing','ready','error')` |
| `documents_title_check` | documents | `length(title) > 0 AND length(title) <= 500` |
| `libraries_name_check` | libraries | `length(name) > 0 AND length(name) <= 255` |
| `source_files_bucket_check` | source_files | `storage_bucket = 'documents'` |

### 5. Índices (10)

| Índice | Tabela | Colunas | Tipo |
|---|---|---|---|
| `documents_pkey` | documents | id | UNIQUE (PK) |
| `idx_documents_user_status` | documents | user_id, status | INDEX |
| `idx_documents_user_library` | documents | user_id, library_id | INDEX |
| `idx_documents_user_created` | documents | user_id, created_at DESC | INDEX |
| `libraries_pkey` | libraries | id | UNIQUE (PK) |
| `idx_libraries_user_id` | libraries | user_id | INDEX |
| `idx_libraries_unique_default` | libraries | user_id WHERE is_default=true | UNIQUE (partial) |
| `profiles_pkey` | profiles | id | UNIQUE (PK) |
| `source_files_pkey` | source_files | id | UNIQUE (PK) |
| `source_files_document_id_key` | source_files | document_id | UNIQUE |

**NOTA:** `idx_source_files_document_id` foi removido durante a validação — o UNIQUE constraint em `document_id` já cria índice implícito.

### 6. Foreign Keys (5)

| Constraint | Tabela | Coluna → Referência | ON DELETE |
|---|---|---|---|
| `profiles_id_fkey` | profiles | id → auth.users(id) | CASCADE |
| `libraries_user_id_fkey` | libraries | user_id → profiles(id) | CASCADE |
| `documents_user_id_fkey` | documents | user_id → profiles(id) | CASCADE |
| `documents_library_id_fkey` | documents | library_id → libraries(id) | CASCADE |
| `source_files_document_id_fkey` | source_files | document_id → documents(id) | CASCADE |

### 7. Functions (3)

| Function | Tipo | Security | search_path |
|---|---|---|---|
| `handle_new_user()` | TRIGGER FUNCTION | SECURITY DEFINER | public |
| `update_updated_at_column()` | TRIGGER FUNCTION | SECURITY DEFINER | public |
| `validate_document_library()` | TRIGGER FUNCTION | SECURITY DEFINER | public |

### 8. Triggers (5)

| Trigger | Tabela | Evento | Timing | Função |
|---|---|---|---|---|
| `on_auth_user_created` | auth.users | INSERT | AFTER | `handle_new_user()` |
| `update_profiles_updated_at` | profiles | UPDATE | BEFORE | `update_updated_at_column()` |
| `update_libraries_updated_at` | libraries | UPDATE | BEFORE | `update_updated_at_column()` |
| `update_documents_updated_at` | documents | UPDATE | BEFORE | `update_updated_at_column()` |
| `validate_document_library_trigger` | documents | INSERT OR UPDATE | BEFORE | `validate_document_library()` |

**NOTA:** O `validate_document_library_trigger` aparece como 2 linhas no `information_schema.triggers` (uma para INSERT, outra para UPDATE), mas é um único trigger definido com `BEFORE INSERT OR UPDATE`.

### 9. RLS Habilitado

| Tabela | RLS |
|---|---|
| profiles | ✅ `rowsecurity = true` |
| libraries | ✅ `rowsecurity = true` |
| documents | ✅ `rowsecurity = true` |
| source_files | ✅ `rowsecurity = true` |

### 10. Table RLS Policies (14)

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | `id = auth.uid()` | `id = auth.uid()` | `id = auth.uid()` | Via CASCADE |
| `libraries` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `documents` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `source_files` | JOIN documents | JOIN documents | **NÃO** | JOIN documents |

### 11. Storage Buckets (2)

| Bucket | Leitura | file_size_limit | MIME Types |
|---|---|---|---|
| `documents` | Privada (policy) | 50MB | application/pdf |
| `avatars` | Pública (policy) | 5MB | image/jpeg, image/png, image/webp |

### 12. Storage Policies (7)

| Policy | Bucket | Operação | Condição |
|---|---|---|---|
| `storage_documents_select_own` | documents | SELECT | folder[1] = auth.uid() |
| `storage_documents_insert_own` | documents | INSERT | folder[1] = auth.uid() |
| `storage_documents_delete_own` | documents | DELETE | folder[1] = auth.uid() |
| `storage_avatars_select_public` | avatars | SELECT | bucket_id = 'avatars' |
| `storage_avatars_insert_own` | avatars | INSERT | folder[1] = auth.uid() |
| `storage_avatars_delete_own` | avatars | DELETE | folder[1] = auth.uid() |
| `storage_avatars_update_own` | avatars | UPDATE | folder[1] = auth.uid() |

### 13. Configurações Adicionais (não previstas no plano original)

| Configuração | Motivo | Impacto |
|---|---|---|
| `supabase init` → `supabase/config.toml` | Necessário para `supabase link` e `supabase db push` | Config padrão local, sem dados sensíveis |
| `supabase link` → credenciais em `~/.supabase/` | Necessário para autenticar CLI com projeto remoto | Fora do repositório |
| Supabase CLI install (`npm install -g supabase`) | Necessário para executar migrations | Dependência global |

### 14. Arquivos Modificados/Criados durante Configuração

| Arquivo | Ação | Sensível? |
|---|---|---|
| `.env.local` | Criado (credenciais Supabase) | ⚠️ SIM — gitignored |
| `supabase/config.toml` | Criado por `supabase init` | Não (valores padrão) |
| `supabase/.gitignore` | Criado por `supabase init` | Não |

### 15. Alterações no Git

| Commit | Descrição | Arquivos |
|---|---|---|
| `31c35e6` | Sprint 1-3: docs, auth, migrations | 67 files |
| `9ae3508` | Sprint 3: execução real, docs atualizadas | 6 files |

### 16. Commits Realizados

| Hash | Data | Mensagem |
|---|---|---|
| `31c35e6` | 2026-08-20 | `feat: Sprint 1-3 complete — documentation, auth, database migrations` |
| `9ae3508` | 2026-08-20 | `feat: Sprint 3 executed in real Supabase — 7 migrations applied, all tables verified` |

### 17. Verificação do Commit 9ae3508

O commit `9ae3508` contém:
- `README.md` (atualizado)
- `docs/PROJECT_STATE.md` (atualizado)
- `docs/ROADMAP.md` (atualizado)
- `docs/SECURITY.md` (atualizado)
- `supabase/.gitignore` (criado)
- `supabase/config.toml` (criado)

**Status:** ✅ Este commit reflete o estado aprovado da Sprint 3 (com as correções de documentação aplicadas posteriormente).

### 18. Alterações Locais Não Commitadas

| Status |
|---|
| `git status`: **working tree clean** |
| `git diff HEAD`: **vazio** |
| Nenhuma alteração não commitada |

### 19. Migrations Criadas/Alteradas Após Execução

| Status |
|---|
| Nenhuma migration foi criada ou alterada após `supabase db push` |

### 20. Divergências

#### Banco Real vs Migrations: ✅ IDÊNTICO
Todas as 7 migrations foram aplicadas fielmente. O `supabase_migrations.schema_migrations` confirma todas as 7 versões.

#### Banco Real vs Documentação (PROJECT_STATE.md): ✅ CORRIGIDO
Foram encontradas e corrigidas 5 divergências no PROJECT_STATE.md durante esta auditoria:

| # | Divergência | Antes | Depois | Problema |
|---|---|---|---|---|
| 1 | Storage policies (linha 105) | "6 storage policies" | "7 storage policies" | Contagem incorreta — `storage_avatars_update_own` não contada |
| 2 | Nome do índice (linha 145) | `idx_documents_created_at` | `idx_documents_user_created` | Nome incorref — índice foi renomeado para incluir user_id |
| 3 | Índice removido (linha 146) | `idx_source_files_document_id` | Removido + nota | Índice foi removido mas documentação não atualizada |
| 4 | Storage Policies table (linha 192) | Sem `storage_avatars_update_own` | Adicionada | Policy existente mas não documentada |
| 5 | Table RLS policies count (linha 227) | "13 table policies" | "14 table policies" | Contagem incorreta |

**ROADMAP.md** também foi corrigido: "13 table policies" → "14 table policies".

#### Migrations vs Documentação: ✅ CONSISTENTE
Após as correções acima, todas as outras documentações (DATABASE.md, SECURITY.md, ARCHITECTURE.md) estão consistentes com o estado real.

### Verificação de Segurança

| Verificação | Status |
|---|---|
| Frontend usa apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` | ✅ Confirmado em `src/config/supabase.ts` |
| Nenhuma `service_role` key no frontend | ✅ Nenhum match em `src/` |
| Nenhuma chave de IA no repositório | ✅ Nenhum match de `sk-`, `sk-ant-`, `gsk_` |
| Nenhuma senha ou token no repositório | ✅ Nenhum match de `sbp_`, `password`, `secret` |
| `.env.local` gitignored | ✅ Confirmado via `git check-ignore` |
| `.env.local` não rastreado pelo git | ✅ Confirmado via `git ls-files` |
| `supabase/.temp` não commitado | ✅ Confirmado via `git ls-files` |
| Credenciais Supabase CLI fora do repo | ✅ Armazenadas em `~/.supabase/` |
| `supabase/config.toml` sem dados sensíveis | ✅ Apenas `project_id = "Noesis"` e config padrão |
