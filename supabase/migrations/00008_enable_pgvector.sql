-- Migration: 00008_enable_pgvector
-- Rollback: DROP EXTENSION IF EXISTS vector;

-- Habilitar pgvector para futuras operações vetoriais.
-- NOTA: A coluna embedding e o índice HNSW serão criados na Sprint 6,
-- após definição do provedor/modelo de embeddings.
CREATE EXTENSION IF NOT EXISTS vector;
