-- Migration: 00012_create_reading_sessions
-- Rollback: DROP TRIGGER IF EXISTS update_reading_sessions_updated_at ON reading_sessions;
--           DROP FUNCTION IF EXISTS update_reading_sessions_updated_at();
--           DROP POLICY IF EXISTS reading_sessions_delete_own ON reading_sessions;
--           DROP POLICY IF EXISTS reading_sessions_update_own ON reading_sessions;
--           DROP POLICY IF EXISTS reading_sessions_insert_own ON reading_sessions;
--           DROP POLICY IF EXISTS reading_sessions_select_own ON reading_sessions;
--           DROP TABLE IF EXISTS reading_sessions;

-- ============================================================
-- TABELA: reading_sessions
-- Sessões de leitura com tracking de progresso e duração.
-- ============================================================

CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ DEFAULT NULL,
  duration_sec INTEGER DEFAULT NULL,
  pages_read INTEGER[] DEFAULT '{}',
  progress_pct NUMERIC(5,2) DEFAULT NULL,
  last_position INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONSTRAINTS: reading_sessions
-- ============================================================

ALTER TABLE reading_sessions ADD CONSTRAINT reading_sessions_last_position_check
  CHECK (last_position >= 1);

ALTER TABLE reading_sessions ADD CONSTRAINT reading_sessions_progress_pct_check
  CHECK (progress_pct >= 0 AND progress_pct <= 100);

-- ============================================================
-- RLS: reading_sessions
-- ============================================================

ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: apenas o próprio usuário
CREATE POLICY "reading_sessions_select_own"
  ON reading_sessions FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: apenas o próprio usuário
CREATE POLICY "reading_sessions_insert_own"
  ON reading_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: apenas o próprio usuário
CREATE POLICY "reading_sessions_update_own"
  ON reading_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: apenas o próprio usuário
CREATE POLICY "reading_sessions_delete_own"
  ON reading_sessions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- ÍNDICES: reading_sessions
-- ============================================================

-- Busca por sessão de um documento específico do usuário
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_doc
  ON reading_sessions (user_id, document_id);

-- Busca por todas as sessões de um documento
CREATE INDEX IF NOT EXISTS idx_reading_sessions_document
  ON reading_sessions (document_id);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION update_reading_sessions_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_reading_sessions_updated_at
  BEFORE UPDATE ON reading_sessions
  FOR EACH ROW EXECUTE FUNCTION update_reading_sessions_updated_at();
