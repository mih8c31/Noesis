# Banco de Dados — Noesis

## Tabelas

### `profiles`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, FK -> auth.users(id) ON DELETE CASCADE |
| `email` | TEXT | |
| `full_name` | TEXT | DEFAULT '' |
| `avatar_url` | TEXT | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() |

### `documents`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() |
| `user_id` | UUID | NOT NULL, FK -> profiles(id) ON DELETE CASCADE |
| `title` | TEXT | NOT NULL, CHECK (length > 0 AND length <= 500) |
| `file_name` | TEXT | NOT NULL |
| `file_size` | BIGINT | |
| `file_path` | TEXT | NOT NULL |
| `storage_bucket` | TEXT | DEFAULT 'documents' |
| `status` | TEXT | DEFAULT 'uploading', CHECK IN ('uploading','processing','ready','error') |
| `page_count` | INTEGER | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() |

## Índices

| Nome | Tabela | Colunas | Tipo |
|------|--------|---------|------|
| `idx_documents_user_id` | documents | user_id | INDEX |
| `idx_documents_user_created` | documents | user_id, created_at DESC | INDEX |

## RLS Policies

### profiles

| Operacao | Condicao |
|----------|----------|
| SELECT | auth.uid() = id |
| INSERT | auth.uid() = id |
| UPDATE | auth.uid() = id |

### documents

| Operacao | Condicao |
|----------|----------|
| SELECT | auth.uid() = user_id |
| INSERT | auth.uid() = user_id |
| UPDATE | auth.uid() = user_id |
| DELETE | auth.uid() = user_id |

## Triggers

| Trigger | Tabela | Evento | Funcao |
|---------|--------|--------|--------|
| `on_auth_user_created` | auth.users | AFTER INSERT | handle_new_user() |
| `update_profiles_updated_at` | profiles | BEFORE UPDATE | update_updated_at_column() |
| `update_documents_updated_at` | documents | BEFORE UPDATE | update_updated_at_column() |

## Storage

| Bucket | Publico | file_size_limit |
|--------|---------|-----------------|
| `documents` | Nao | 50MB |
| `avatars` | Sim | 5MB |

### Storage Policies (documents)

| Operacao | Condicao |
|----------|----------|
| INSERT | folder[1] = auth.uid() |
| SELECT | folder[1] = auth.uid() |
| DELETE | folder[1] = auth.uid() |

### Storage Policies (avatars)

| Operacao | Condicao |
|----------|----------|
| SELECT | Publico |
| INSERT | folder[1] = auth.uid() |
| UPDATE | folder[1] = auth.uid() |
| DELETE | folder[1] = auth.uid() |
