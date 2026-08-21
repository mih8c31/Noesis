-- Migration: 00006_create_updated_at_triggers
-- Rollback: DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles; DROP TRIGGER IF EXISTS update_libraries_updated_at ON libraries; DROP TRIGGER IF EXISTS update_documents_updated_at ON documents; DROP FUNCTION IF EXISTS update_updated_at_column();

-- ============================================================
-- FUNÇÃO: update_updated_at_column()
-- Atualiza automaticamente a coluna updated_at em operações UPDATE.
-- Aplicada em: profiles, libraries, documents.
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS: updated_at para cada tabela
-- ============================================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_libraries_updated_at
  BEFORE UPDATE ON libraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
