-- Migration: 00005_create_documents_and_source_files
-- Rollback: DROP TRIGGER IF EXISTS validate_document_library_trigger ON documents; DROP FUNCTION IF EXISTS validate_document_library(); DROP POLICY IF EXISTS documents_select_own ON documents; DROP POLICY IF EXISTS documents_insert_own ON documents; DROP POLICY IF EXISTS documents_update_own ON documents; DROP POLICY IF EXISTS documents_delete_own ON documents; DROP POLICY IF EXISTS source_files_select_own ON source_files; DROP POLICY IF EXISTS source_files_insert_own ON source_files; DROP POLICY IF EXISTS source_files_delete_own ON source_files; DROP INDEX IF EXISTS idx_documents_user_status; DROP INDEX IF EXISTS idx_documents_user_library; DROP INDEX IF EXISTS idx_documents_user_created; DROP TABLE IF EXISTS source_files; DROP TABLE IF EXISTS documents;

-- ============================================================
-- TABELA: documents
-- Artigos, livros, PDFs. Metadados acadêmicos + texto extraído.
-- NOTA: deleted_at NÃO é criado nesta sprint (adiado para Sprint 9).
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'article',
  status TEXT NOT NULL DEFAULT 'uploading',
  title VARCHAR(500) NOT NULL,
  abstract TEXT DEFAULT NULL,
  authors TEXT[] DEFAULT '{}',
  publication_year INTEGER DEFAULT NULL,
  publisher VARCHAR(255) DEFAULT NULL,
  journal VARCHAR(255) DEFAULT NULL,
  volume VARCHAR(50) DEFAULT NULL,
  issue VARCHAR(50) DEFAULT NULL,
  doi VARCHAR(255) DEFAULT NULL,
  isbn VARCHAR(20) DEFAULT NULL,
  url TEXT DEFAULT NULL,
  language VARCHAR(10) DEFAULT NULL,
  page_count INTEGER DEFAULT NULL,
  file_size_bytes BIGINT DEFAULT NULL,
  content_type VARCHAR(100) DEFAULT NULL,
  extracted_text TEXT DEFAULT NULL,
  content_summary TEXT DEFAULT NULL,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================
-- CONSTRAINTS: documents
-- ============================================================

ALTER TABLE documents ADD CONSTRAINT documents_type_check
  CHECK (type IN ('article', 'book', 'chapter', 'thesis', 'other'));

ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('uploading', 'processing', 'ready', 'error'));

ALTER TABLE documents ADD CONSTRAINT documents_title_check
  CHECK (length(title) > 0 AND length(title) <= 500);

-- ============================================================
-- RLS: documents
-- ============================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- SELECT: apenas o próprio usuário
CREATE POLICY "documents_select_own"
  ON documents FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: apenas o próprio usuário
CREATE POLICY "documents_insert_own"
  ON documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: apenas o próprio usuário
CREATE POLICY "documents_update_own"
  ON documents FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: apenas o próprio usuário
CREATE POLICY "documents_delete_own"
  ON documents FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- TRIGGER: validar que library pertence ao mesmo usuário
-- ============================================================

CREATE OR REPLACE FUNCTION validate_document_library()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM libraries
    WHERE id = NEW.library_id
    AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'library_id does not belong to the same user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER validate_document_library_trigger
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION validate_document_library();

-- ============================================================
-- ÍNDICES: documents
-- ============================================================

-- Filtro por status do documento
CREATE INDEX IF NOT EXISTS idx_documents_user_status
  ON documents (user_id, status);

-- Filtro por biblioteca
CREATE INDEX IF NOT EXISTS idx_documents_user_library
  ON documents (user_id, library_id);

-- Listagem cronológica (com user_id para compatibilidade com RLS)
CREATE INDEX IF NOT EXISTS idx_documents_user_created
  ON documents (user_id, created_at DESC);

-- ============================================================
-- TABELA: source_files
-- Referência ao arquivo binário no Supabase Storage.
-- Relação 1:1 com documents (UNIQUE constraint).
-- ============================================================

CREATE TABLE IF NOT EXISTS source_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
  storage_bucket VARCHAR(50) NOT NULL DEFAULT 'documents',
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONSTRAINTS: source_files
-- ============================================================

ALTER TABLE source_files ADD CONSTRAINT source_files_bucket_check
  CHECK (storage_bucket IN ('documents'));

-- ============================================================
-- RLS: source_files
-- ============================================================

ALTER TABLE source_files ENABLE ROW LEVEL SECURITY;

-- SELECT: dono do documento (via join com documents)
CREATE POLICY "source_files_select_own"
  ON source_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = source_files.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- INSERT: dono do documento (via join com documents)
CREATE POLICY "source_files_insert_own"
  ON source_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = source_files.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- UPDATE: NÃO permitido — arquivos são imutáveis após upload
-- Para substituir um arquivo, delete + create (ON DELETE CASCADE cuida da integridade)

-- DELETE: dono do documento (via join com documents)
CREATE POLICY "source_files_delete_own"
  ON source_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = source_files.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================
-- ÍNDICES: source_files
-- ============================================================

-- NOTA: idx_source_files_document_id NÃO é necessário.
-- O UNIQUE constraint em document_id já cria um índice implícito.
