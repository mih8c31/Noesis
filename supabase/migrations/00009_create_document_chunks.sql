-- Migration: 00009_create_document_chunks
-- Rollback: DROP POLICY IF EXISTS document_chunks_delete_own ON document_chunks;
--           DROP POLICY IF EXISTS document_chunks_insert_own ON document_chunks;
--           DROP POLICY IF EXISTS document_chunks_select_own ON document_chunks;
--           ALTER TABLE document_chunks DROP CONSTRAINT IF EXISTS document_chunks_document_id_chunk_index_unique;
--           ALTER TABLE document_chunks DROP CONSTRAINT IF EXISTS document_chunks_chunk_index_check;
--           DROP TABLE IF EXISTS document_chunks;

-- ============================================================
-- TABELA: document_chunks
-- Trechos do documento para busca semântica.
-- NOTA: Coluna embedding será criada na Sprint 6.
-- ============================================================

CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONSTRAINTS: document_chunks
-- ============================================================

ALTER TABLE document_chunks ADD CONSTRAINT document_chunks_chunk_index_check
  CHECK (chunk_index >= 0);

ALTER TABLE document_chunks ADD CONSTRAINT document_chunks_document_id_chunk_index_unique
  UNIQUE (document_id, chunk_index);

-- ============================================================
-- RLS: document_chunks
-- ============================================================

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- SELECT: dono do documento (via join com documents)
CREATE POLICY "document_chunks_select_own"
  ON document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- INSERT: dono do documento (via join com documents)
CREATE POLICY "document_chunks_insert_own"
  ON document_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- DELETE: dono do documento (via join com documents)
CREATE POLICY "document_chunks_delete_own"
  ON document_chunks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- UPDATE: NÃO permitido — chunks são imutáveis após criação.
-- Para reprocessamento, deletar chunks antigos e criar novos.
