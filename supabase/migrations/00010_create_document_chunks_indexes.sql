-- Migration: 00010_create_document_chunks_indexes
-- Rollback: DROP INDEX IF EXISTS idx_document_chunks_doc_index;
--           DROP INDEX IF EXISTS idx_document_chunks_document_id;

-- Índice para filtrar chunks por documento
CREATE INDEX idx_document_chunks_document_id
  ON document_chunks (document_id);

-- Índice para ordenar chunks por documento + índice
CREATE INDEX idx_document_chunks_doc_index
  ON document_chunks (document_id, chunk_index);
