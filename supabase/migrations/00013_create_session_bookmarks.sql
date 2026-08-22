-- Migration: 00013_create_session_bookmarks
-- Rollback: DROP POLICY IF EXISTS session_bookmarks_delete_own ON session_bookmarks;
--           DROP POLICY IF EXISTS session_bookmarks_update_own ON session_bookmarks;
--           DROP POLICY IF EXISTS session_bookmarks_insert_own ON session_bookmarks;
--           DROP POLICY IF EXISTS session_bookmarks_select_own ON session_bookmarks;
--           DROP INDEX IF EXISTS idx_session_bookmarks_page;
--           DROP INDEX IF EXISTS idx_session_bookmarks_session;
--           DROP TABLE IF EXISTS session_bookmarks;

-- ============================================================
-- TABELA: session_bookmarks
-- Marcadores de páginas dentro de sessões de leitura.
-- ============================================================

CREATE TABLE IF NOT EXISTS session_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES reading_sessions(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  position_pct NUMERIC(5,2) DEFAULT NULL,
  label TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONSTRAINTS: session_bookmarks
-- ============================================================

ALTER TABLE session_bookmarks ADD CONSTRAINT session_bookmarks_page_number_check
  CHECK (page_number >= 1);

-- ============================================================
-- RLS: session_bookmarks
-- ============================================================

ALTER TABLE session_bookmarks ENABLE ROW LEVEL SECURITY;

-- SELECT: dono da sessão (via join com reading_sessions)
CREATE POLICY "session_bookmarks_select_own"
  ON session_bookmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reading_sessions
      WHERE reading_sessions.id = session_bookmarks.session_id
      AND reading_sessions.user_id = auth.uid()
    )
  );

-- INSERT: dono da sessão (via join com reading_sessions)
CREATE POLICY "session_bookmarks_insert_own"
  ON session_bookmarks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reading_sessions
      WHERE reading_sessions.id = session_bookmarks.session_id
      AND reading_sessions.user_id = auth.uid()
    )
  );

-- UPDATE: dono da sessão (via join com reading_sessions)
CREATE POLICY "session_bookmarks_update_own"
  ON session_bookmarks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM reading_sessions
      WHERE reading_sessions.id = session_bookmarks.session_id
      AND reading_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reading_sessions
      WHERE reading_sessions.id = session_bookmarks.session_id
      AND reading_sessions.user_id = auth.uid()
    )
  );

-- DELETE: dono da sessão (via join com reading_sessions)
CREATE POLICY "session_bookmarks_delete_own"
  ON session_bookmarks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM reading_sessions
      WHERE reading_sessions.id = session_bookmarks.session_id
      AND reading_sessions.user_id = auth.uid()
    )
  );

-- ============================================================
-- ÍNDICES: session_bookmarks
-- ============================================================

-- Busca por bookmarks de uma sessão
CREATE INDEX IF NOT EXISTS idx_session_bookmarks_session
  ON session_bookmarks (session_id);

-- Busca por bookmark de página específica numa sessão
CREATE INDEX IF NOT EXISTS idx_session_bookmarks_page
  ON session_bookmarks (session_id, page_number);
