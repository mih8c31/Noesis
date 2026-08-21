-- Migration: 00004_create_libraries
-- Rollback: DROP POLICY IF EXISTS libraries_select_own ON libraries; DROP POLICY IF EXISTS libraries_insert_own ON libraries; DROP POLICY IF EXISTS libraries_update_own ON libraries; DROP POLICY IF EXISTS libraries_delete_own ON libraries; DROP INDEX IF EXISTS idx_libraries_user_id; DROP INDEX IF EXISTS idx_libraries_unique_default; DROP TABLE IF EXISTS libraries;

-- ============================================================
-- TABELA: libraries
-- Bibliotecas/categorias do usuário para organizar documentos.
-- ============================================================

CREATE TABLE IF NOT EXISTS libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  icon VARCHAR(50) DEFAULT NULL,
  color VARCHAR(7) DEFAULT NULL,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONSTRAINTS
-- ============================================================

ALTER TABLE libraries ADD CONSTRAINT libraries_name_check
  CHECK (length(name) > 0 AND length(name) <= 255);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE libraries ENABLE ROW LEVEL SECURITY;

-- SELECT: apenas o próprio usuário
CREATE POLICY "libraries_select_own"
  ON libraries FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: apenas o próprio usuário
CREATE POLICY "libraries_insert_own"
  ON libraries FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: apenas o próprio usuário
CREATE POLICY "libraries_update_own"
  ON libraries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: apenas o próprio usuário
CREATE POLICY "libraries_delete_own"
  ON libraries FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Listagem de bibliotecas do usuário
CREATE INDEX IF NOT EXISTS idx_libraries_user_id
  ON libraries (user_id);

-- Garantir no máximo uma library default por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_libraries_unique_default
  ON libraries (user_id)
  WHERE is_default = true;
