-- Migration: 00003_create_profiles
-- Rollback: DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; DROP FUNCTION IF EXISTS handle_new_user(); DROP POLICY IF EXISTS profiles_select_own ON profiles; DROP POLICY IF EXISTS profiles_insert_own ON profiles; DROP POLICY IF EXISTS profiles_update_own ON profiles; DROP TABLE IF EXISTS profiles;

-- ============================================================
-- TABELA: profiles
-- Estende auth.users do Supabase.
-- Dados públicos do perfil (nome, avatar, bio).
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) DEFAULT '',
  avatar_url TEXT DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: apenas o próprio usuário
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- INSERT: apenas o próprio usuário (via trigger handle_new_user)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- UPDATE: apenas o próprio usuário
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: não permitido — exclusão via CASCADE de auth.users

-- ============================================================
-- TRIGGER: auto-create profile quando usuário se cadastra
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
