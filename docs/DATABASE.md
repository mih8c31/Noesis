# Modelagem de Dados — Noesis

> **Versão:** 1.0  
> **Última atualização:** 2026-08-20  
> **Banco:** PostgreSQL com pgvector  
> **Arquitetura:** Multi-tenant SaaS via RLS

---

## Índice

1. [Premissas de Design](#1-premissas-de-design)
2. [Diagrama Lógico](#2-diagrama-lógico)
3. [Descrição das Tabelas](#3-descrição-das-tabelas)
4. [Storage Buckets](#4-storage-buckets)
5. [Extensões Necessárias](#5-extensões-necessárias)
6. [Estratégia de Segurança (RLS)](#6-estratégia-de-segurança-rls)
7. [Cardinalidades](#7-cardinalidades)
8. [Cache Local (IndexedDB)](#8-cache-local-indexeddb)
9. [Decisões Técnicas](#9-decisões-técnicas)

---

## 1. Premissas de Design

| Premissa | Decisão |
|---|---|
| **Multi-usuário** | RLS (Row Level Security) em todas as tabelas com `auth.uid()` |
| **Isolamento** | Dados isolados por `user_id` — sem cross-tenant access |
| **pgvector** | Extensão habilitada para busca semântica em documentos e embeddings |
| **Soft delete** | `deleted_at` em tabelas críticas (documents, fichamentos) |
| **Audit trail** | Campos `created_at`, `updated_at` em todas as tabelas + tabela `audit_logs` |
| **UUIDs** | Chaves primárias como `uuid` (gen_random_uuid()) |
| **Timestamps** | `timestamptz` (timezone-aware) em todas as tabelas |

---

## 2. Diagrama Lógico

```
┌──────────────────────────┐
│         profiles         │ ← Extende auth.users do Supabase
│──────────────────────────│
│ id (PK, uuid) → auth.users
│ full_name, avatar_url
│ bio, created_at, updated_at
└──────────┬───────────────┘
           │ 1:N
           ▼
┌──────────────────────────┐       ┌──────────────────────────┐
│     authentication       │       │    user_preferences      │
│──────────────────────────│       │──────────────────────────│
│ id (PK, uuid)            │       │ id (PK, uuid)            │
│ user_id (FK → profiles)  │       │ user_id (FK → profiles)  │
│ provider, provider_id    │       │ preferred_language       │
│ email_verified, created_at│      │ translation_target_lang  │
└──────────────────────────┘       │ tts_voice, tts_speed     │
                                   │ theme, font_size         │
┌──────────────────────────┐       └──────────────────────────┘
│     ai_providers         │
│──────────────────────────│
│ id (PK, uuid)            │
│ name, slug               │
│ api_endpoint             │
│ models (jsonb)           │
│ is_active, created_at    │
└──────────────────────────┘

┌──────────────────────────┐
│       libraries          │
│──────────────────────────│
│ id (PK, uuid)            │
│ user_id (FK → profiles)  │
│ name, description        │
│ icon, color              │
│ is_default, sort_order   │
│ created_at, updated_at   │
└──────────┬───────────────┘
           │ 1:N
           ▼
┌──────────────────────────────────────────────────────────────┐
│                        documents                              │
│──────────────────────────────────────────────────────────────│
│ id (PK, uuid)                                                │
│ user_id (FK → profiles)                                      │
│ library_id (FK → libraries)                                  │
│ type (ENUM: article, book, chapter, thesis, other)            │
│ status (ENUM: uploading, processing, ready, error)           │
│ title, abstract, authors (text[])                            │
│ publication_year, publisher, journal, volume, issue           │
│ doi, isbn, url, language                                     │
│ page_count, file_size_bytes, content_type                    │
│ extracted_text (TEXT) — conteúdo completo extraído            │
│ content_summary (TEXT) — resumo gerado por IA                │
│ embedding (vector(1536)) — busca semântica                    │
│ tags (text[]), metadata (jsonb)                               │
│ created_at, updated_at, processed_at, deleted_at             │
│                                                              │
│ INDEX: idx_documents_embedding (hnsw, vector)                │
│ INDEX: idx_documents_user_status (user_id, status)           │
│ INDEX: idx_documents_fts (to_tsvector(title || ' ' ||       │
│        abstract || extracted_text))                           │
│ INDEX: idx_documents_tags (gin, tags)                        │
└──────────┬───────────────────────────────────────────────────┘
           │
     ┌─────┴──────────────────────────────────┐
     │ 1:N                    1:N              │
     ▼                      ▼                  ▼
┌─────────────┐   ┌──────────────┐   ┌────────────────┐
│   source_   │   │  reading_    │   │  document_     │
│   files     │   │  sessions    │   │  chunks        │
│─────────────│   │──────────────│   │────────────────│
│ id (PK)     │   │ id (PK)      │   │ id (PK)        │
│ document_id │   │ document_id  │   │ document_id    │
│ (FK)        │   │ (FK)         │   │ (FK)           │
│ storage_    │   │ user_id(FK)  │   │ chunk_index    │
│ bucket      │   │ started_at   │   │ page_number    │
│ file_path   │   │ ended_at     │   │ start_offset   │
│ mime_type   │   │ duration_sec │   │ end_offset     │
│ file_size   │   │ pages_read[] │   │ content (TEXT) │
│ created_at  │   │ progress_pct │   │ embedding      │
│             │   │ bookmarks    │   │ (vector(1536)) │
│             │   │ (jsonb)      │   │ token_count    │
│             │   │ last_position│   │ created_at     │
│             │   │ created_at   │   └────────────────┘
│             │   │ updated_at   │
│             │   └──────┬───────┘
│             │          │ 1:N
│             │          ▼
│             │   ┌──────────────┐
│             │   │  session_    │
│             │   │  bookmarks   │
│             │   │──────────────│
│             │   │ id (PK)      │
│             │   │ session_id   │
│             │   │ (FK)         │
│             │   │ page_number  │
│             │   │ position_pct │
│             │   │ label        │
│             │   │ created_at   │
│             │   └──────────────┘
└─────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      conversations                            │
│──────────────────────────────────────────────────────────────│
│ id (PK, uuid)                                                │
│ user_id (FK → profiles)                                      │
│ document_id (FK → documents, nullable) — NULL = chat livre   │
│ title, conversation_type (document/general)                  │
│ ai_provider_id (FK → ai_providers)                           │
│ model_name, system_prompt (TEXT)                              │
│ total_tokens_input, total_tokens_output                      │
│ message_count                                                │
│ created_at, updated_at                                       │
│                                                              │
│ INDEX: idx_conversations_user (user_id, created_at DESC)     │
└──────────┬───────────────────────────────────────────────────┘
           │ 1:N
           ▼
┌──────────────────────────────────────────────────────────────┐
│                        messages                               │
│──────────────────────────────────────────────────────────────│
│ id (PK, uuid)                                                │
│ conversation_id (FK → conversations)                         │
│ user_id (FK → profiles)                                      │
│ role (ENUM: user, assistant, system)                          │
│ content (TEXT)                                                │
│ modality (ENUM: voice, text) — como a mensagem foi enviada   │
│ embedding (vector(1536)) — busca semântica nas conversas     │
│ tokens_input, tokens_output                                  │
│ model_used, provider_used                                    │
│ metadata (jsonb) — dados extras da resposta da IA            │
│ created_at                                                   │
│                                                              │
│ INDEX: idx_messages_conversation (conversation_id, created_at)│
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      fichamentos                              │
│──────────────────────────────────────────────────────────────│
│ id (PK, uuid)                                                │
│ user_id (FK → profiles)                                      │
│ document_id (FK → documents, nullable)                       │
│ parent_fichamento_id (FK → fichamentos, nullable) — sub-itens│
│ title, content (TEXT) — conteúdo formatado                   │
│ fichamento_type (ENUM: summary, concept_map, quote_analysis, │
│                   critical_review, methodology, custom)      │
│ key_concepts (text[]), key_quotes (jsonb)                    │
│ ai_generated (BOOLEAN), ai_model_used                        │
│ citation_format (ENUM: abnt, apa, chicago, ieee, vancouver)  │
│ tags (text[]), embedding (vector(1536))                      │
│ status (ENUM: draft, published, archived)                    │
│ created_at, updated_at, deleted_at                           │
│                                                              │
│ INDEX: idx_fichamentos_user (user_id, created_at DESC)       │
│ INDEX: idx_fichamentos_embedding (hnsw, vector)              │
│ INDEX: idx_fichamentos_fts (to_tsvector(title || ' ' ||     │
│        content))                                              │
└──────────┬───────────────────────────────────────────────────┘
           │ 1:N
           ▼
┌──────────────────────────┐
│ fichamento_attachments   │
│──────────────────────────│
│ id (PK, uuid)            │
│ fichamento_id (FK)       │
│ source_type (ENUM:       │
│   document, annotation,  │
│   conversation, external)│
│ source_id (uuid)         │
│ excerpt (TEXT)           │
│ page_number              │
│ created_at               │
└──────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       annotations                             │
│──────────────────────────────────────────────────────────────│
│ id (PK, uuid)                                                │
│ user_id (FK → profiles)                                      │
│ document_id (FK → documents)                                 │
│ annotation_type (ENUM: highlight, note, question, doubt,     │
│                    definition, important)                     │
│ color (VARCHAR(7)) — hex color                               │
│ content (TEXT) — texto da anotação                            │
│ selected_text (TEXT) — trecho selecionado do documento        │
│ page_number, start_offset, end_offset                        │
│ is_ai_generated (BOOLEAN)                                    │
│ parent_annotation_id (FK → self, nullable) — replies         │
│ tags (text[]), embedding (vector(1536))                      │
│ created_at, updated_at, deleted_at                           │
│                                                              │
│ INDEX: idx_annotations_doc (document_id, page_number)        │
│ INDEX: idx_annotations_user (user_id, created_at DESC)       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       citations                               │
│──────────────────────────────────────────────────────────────│
│ id (PK, uuid)                                                │
│ user_id (FK → profiles)                                      │
│ fichamento_id (FK → fichamentos, nullable)                   │
│ document_id (FK → documents, nullable)                       │
│ citation_format (ENUM: abnt, apa, chicago, ieee, vancouver)  │
│ formatted_citation (TEXT) — citação formatada completa       │
│ reference_id (FK → references, nullable)                     │
│ custom_fields (jsonb) — camposExtras para formatação         │
│ created_at, updated_at                                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       references                              │
│──────────────────────────────────────────────────────────────│
│ id (PK, uuid)                                                │
│ user_id (FK → profiles)                                      │
│ title, authors (text[]), publication_year                    │
│ journal_or_publisher, volume, issue, pages                   │
│ doi, isbn, url                                               │
│ reference_type (ENUM: journal_article, book, chapter,         │
│   thesis, conference, webpage, other)                        │
│ abstract (TEXT)                                              │
│ raw_bibtex (TEXT) — BibTeX original se importado             │
│ embedding (vector(1536)) — busca semântica em referências    │
│ metadata (jsonb)                                             │
│ created_at, updated_at                                       │
│                                                              │
│ INDEX: idx_references_fts (to_tsvector(title))               │
│ INDEX: idx_references_doi (doi) WHERE doi IS NOT NULL        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      ai_interactions                          │
│──────────────────────────────────────────────────────────────│
│ id (PK, uuid)                                                │
│ user_id (FK → profiles)                                      │
│ ai_provider_id (FK → ai_providers)                           │
│ interaction_type (ENUM: chat, translation, tts, stt,         │
│                   summary, embedding, analysis)              │
│ model_name, model_version                                    │
│ tokens_input, tokens_output, total_tokens                    │
│ latency_ms, cost_estimate_usd                               │
│ status (ENUM: success, error, timeout, rate_limited)         │
│ error_message (TEXT)                                         │
│ request_metadata (jsonb) — dados da requisição               │
│ response_metadata (jsonb) — dados da resposta                │
│ created_at                                                   │
│                                                              │
│ INDEX: idx_ai_interactions_user (user_id, created_at DESC)   │
│ INDEX: idx_ai_interactions_type (interaction_type, status)   │
│ INDEX: idx_ai_interactions_cost (created_at, cost_estimate)  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     system_settings                           │
│──────────────────────────────────────────────────────────────│
│ id (PK, uuid)                                                │
│ key (VARCHAR(255), UNIQUE) — chave do setting                │
│ value (jsonb) — valor flexível                               │
│ setting_type (ENUM: general, ai, storage, limits)            │
│ description (TEXT)                                           │
│ is_public (BOOLEAN) — visível ao frontend                    │
│ updated_by (FK → profiles)                                   │
│ created_at, updated_at                                       │
│                                                              │
│ INDEX: idx_settings_key (key, UNIQUE)                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      audit_logs                               │
│──────────────────────────────────────────────────────────────│
│ id (PK, uuid)                                                │
│ user_id (FK → profiles, nullable) — NULL para ações do syst  │
│ action (ENUM: create, read, update, delete, login, logout,   │
│   export, share, ai_request, upload, download,              │
│   reading_interruption, tts_request, stt_request)           │
│ entity_type (VARCHAR(50)) — tabela afetada                   │
│ entity_id (UUID) — registro afetado                          │
│ old_values (jsonb) — estado antes da alteração               │
│ new_values (jsonb) — estado depois da alteração              │
│ ip_address (INET)                                            │
│ user_agent (TEXT)                                            │
│ created_at                                                   │
│                                                              │
│ INDEX: idx_audit_user (user_id, created_at DESC)             │
│ INDEX: idx_audit_entity (entity_type, entity_id)             │
│ INDEX: idx_audit_action (action, created_at DESC)            │
│                                                              │
│ NOTA: Tabela com PARTITION BY RANGE (created_at) para       │
│       performance em alta escala. Particionar mensalmente.   │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Descrição das Tabelas

### profiles
Extende `auth.users` do Supabase. Contém dados públicos do usuário.

### authentication
Registra provedores de login vinculados (Google, email/senha).

### ai_providers
Configuração dos provedores de IA (OpenAI, Anthropic, Groq, etc.).

### user_preferences
Preferências de idioma, TTS, tema, fonte.

### libraries
Bibliotecas/categorias do usuário para organizar documentos.

### documents
Artigos, livros, PDFs. Contém metadados, texto extraído e embedding.

### source_files
Arquivos brutos armazenados no Supabase Storage.

### document_chunks
Trechos do documento com embeddings para busca semântica.

### reading_sessions
Sessões de leitura com tracking de progresso e duração.

### session_bookmarks
Marcadores específicos dentro de uma sessão de leitura.

### conversations
Conversas com IA (contextualizadas a um documento ou livres).

### messages
Mensagens das conversas, incluindo modalidade (voz/texto).

### fichamentos
Notas inteligentes e resumos gerados por IA ou manualmente.

### fichamento_attachments
Fontes e referências vinculadas a um fichamento.

### annotations
Anotações e destaques no documento (highlights, notes, questions).

### citations
Citações formatadas em diversos padrões (ABNT, APA, etc.).

### references
Referências bibliográficas detalhadas.

### ai_interactions
Log de todas as chamadas à IA (tokens, custo, latência).

### system_settings
Configurações do sistema (chave-valor, feature flags).

### audit_logs
Auditoria de todas as ações de escrita no sistema.

---

## 4. Storage Buckets

```
┌──────────────────────────────────────────────────────────────┐
│                   storage.buckets                             │
│──────────────────────────────────────────────────────────────│
│ name: "documents"     — PDFs e documentos originais          │
│ name: "avatars"       — fotos de perfil                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Extensões Necessárias

| Extensão | Finalidade | Status |
|---|---|---|
| `uuid-ossp` / `pgcrypto` | Geração de UUIDs (`gen_random_uuid()`) | ✅ Habilitada (Sprint 1) |
| `pgvector` | Vetores de embedding para busca semântica | ✅ Habilitada (Sprint 4) |
| `pg_trgm` | Busca por similaridade de texto (trigram) | ⏳ Sprint 6+ |
| `unaccent` | Normalização de acentos para FTS em PT-BR | ⏳ Sprint 6+ |

---

## 6. Estratégia de Segurança (RLS)

Todas as tabelas terão RLS habilitado com política padrão:

```sql
-- Padrão para todas as tabelas de dados do usuário:
CREATE POLICY "users_can_only_access_own_data"
ON [tabela]
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Para audit_logs (somente leitura pelo próprio usuário):
CREATE POLICY "users_can_read_own_logs"
ON audit_logs FOR SELECT
USING (user_id = auth.uid());

-- system_settings (público para leitura, admin para escrita):
CREATE POLICY "settings_public_read"
ON system_settings FOR SELECT
USING (is_public = true);
```

---

## 7. Cardinalidades

| Relação | Tipo | Descrição |
|---|---|---|
| `profiles` → `libraries` | 1:N | Um usuário possui múltiplas bibliotecas |
| `libraries` → `documents` | 1:N | Uma biblioteca contém múltiplos documentos |
| `documents` → `reading_sessions` | 1:N | Um documento tem múltiplas sessões |
| `documents` → `conversations` | 1:N | Um documento pode ter várias conversas |
| `documents` → `annotations` | 1:N | Um documento recebe múltiplas anotações |
| `documents` → `document_chunks` | 1:N | Documento dividido em chunks para embeddings |
| `conversations` → `messages` | 1:N | Conversa com múltiplas mensagens |
| `fichamentos` → `fichamentos` | 1:N (self) | Sub-fichamentos hierárquicos |
| `fichamentos` → `citations` | 1:N | Fichamento gera múltiplas citações |
| `fichamentos` → `fichamento_attachments` | 1:N | Referências a fontes |
| `annotations` → `annotations` | 1:N (self) | Respostas/replies em anotações |
| `references` → `citations` | 1:N | Referência usada em múltiplas citações |
| `ai_providers` → `conversations` | 1:N | Provedor usado em várias conversas |

---

## 8. Cache Local (IndexedDB)

Traduções e dados offline são persistidos no browser via Dexie.js:

```typescript
// Dexie DB Schema
class TranslationDB extends Dexie {
  translations: Table<TranslationCache>;
  constructor() {
    super('noesis_translations');
    this.version(1).stores({
      translations: '++id, documentId, targetLanguage, [documentId+targetLanguage]'
    });
  }
}

interface TranslationCache {
  id?: number;
  documentId: string;
  documentTitle: string;
  sourceLanguage: string;
  targetLanguage: string;
  translatedText: string;
  modelUsed: string;
  translatedAt: Date;
  version: number;
}
```

---

## 9. Decisões Técnicas

| Decisão | Alternativa considerada | Justificativa |
|---|---|---|
| **`embedding` em `documents` e `document_chunks`** | Só em chunks | Embedding no documento permite busca rápida; chunks permitem busca granular |
| **`fichamento_attachments` separado** | JSON array em fichamentos | Tabela dedicada permite busca, RLS e auditoria independentes |
| **`audit_logs` com partitioning** | Tabela simples | Em SaaS com muitos usuários, logs crescem rápido; partitioning por mês mantém performance |
| **`system_settings` como tabela** | .env ou config file | Permite alterar configurações sem deploy; Suporta feature flags |
| **Soft delete (`deleted_at`)** | Hard delete + recycle bin | Permite recuperação; mantém integridade referencial |
| **`document_chunks` separado** | Embedding direto no documento | Chunks permitem: busca granular, limite de tokens, re-embedding parcial |
| **ENUMs para tipos/status** | VARCHAR com validação | TYPE safety no PostgreSQL; evita dados inválidos |
| **`jsonb` para metadata** | Colunas fixas | Flexibilidade para dados variáveis por tipo de documento |
| **Coluna `modality` em messages** | Só no header da request | Permite ao LLM entender como a mensagem foi enviada |
| **Traduções em cache local** | Supabase DB | Evita custo de banco; funciona offline; privacy |

---

## Resumo

| # | Tabela | Local | Status |
|---|---|---|---|
| 1 | `profiles` | Supabase | ✅ Implementada (Sprint 3) |
| 2 | `authentication` | — | ❌ Não criada (Supabase Auth administra) |
| 3 | `ai_providers` | Supabase | ⏳ Sprint 6 |
| 4 | `user_preferences` | Supabase | ⏳ Sprint 13 |
| 5 | `libraries` | Supabase | ✅ Implementada (Sprint 3) |
| 6 | `documents` | Supabase | ✅ Implementada (Sprint 3) |
| 7 | `source_files` | Supabase | ✅ Implementada (Sprint 3) |
| 8 | `document_chunks` | Supabase | ✅ Implementados (Sprint 4) |
| 9 | `reading_sessions` | Supabase | ⏳ Sprint 5 |
| 10 | `session_bookmarks` | Supabase | ⏳ Sprint 5 |
| 11 | `conversations` | Supabase | ⏳ Sprint 6 |
| 12 | `messages` | Supabase | ⏳ Sprint 6 |
| 13 | `fichamentos` | Supabase | ⏳ Sprint 9 |
| 14 | `fichamento_attachments` | Supabase | ⏳ Sprint 9 |
| 15 | `annotations` | Supabase | ⏳ Sprint 9 |
| 16 | `citations` | Supabase | ⏳ Sprint 11 |
| 17 | `references` | Supabase | ⏳ Sprint 11 |
| 18 | `ai_interactions` | Supabase | ⏳ Sprint 6 |
| 19 | `audit_logs` | Supabase | ⏳ Deferred |
| 20 | `system_settings` | Supabase | ⏳ Deferred |
| — | `translations` | IndexedDB (Dexie.js) | ⏳ Sprint 10 |

**Implementadas na Sprint 3:** 4 tabelas + 2 storage buckets  
**Total planejado:** 20 tabelas + 1 schema IndexedDB + 2 buckets de storage

---

## Implementação Sprint 3

### Migrations

| # | Arquivo | Conteúdo |
|---|---|---|
| `00001` | `enable_extensions.sql` | pgcrypto |
| `00002` | `create_enums.sql` | Placeholder (TEXT+CHECK decidido) |
| `00003` | `create_profiles.sql` | profiles + RLS + trigger auto-create |
| `00004` | `create_libraries.sql` | libraries + RLS + índices |
| `00005` | `create_documents_and_source_files.sql` | documents + source_files + RLS + triggers + índices |
| `00006` | `create_updated_at_triggers.sql` | Function + triggers updated_at |
| `00007` | `create_storage_buckets.sql` | 2 buckets + 6 storage policies |

### Decisões de Implementação

| Decisão | Motivo |
|---|---|
| TEXT + CHECK (não ENUM) | Flexibilidade para evoluir schema |
| Soft delete adiado | Hard delete suficiente para MVP |
| `authentication` não criada | Supabase Auth administra providers |
| Trigger para integridade documents↔libraries | CHECK constraints não suportam subqueries |
| Profiles SELECT restrito | MVP sem compartilhamento |
| source_files sem UPDATE | Arquivos imutáveis após upload |
| is_default via partial unique index | Uma library default por usuário |
| search_path = public em functions | Segurança contra SQL injection |
