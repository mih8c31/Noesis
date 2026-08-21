-- Migration: 00007_create_storage_buckets
-- Rollback: DELETE FROM storage.policies WHERE bucket_id IN ('documents', 'avatars'); DELETE FROM storage.buckets WHERE id IN ('documents', 'avatars');

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Bucket: documents (PDFs e documentos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: avatars (fotos de perfil)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- leitura pública
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE POLICIES: documents bucket
-- ============================================================

-- SELECT: apenas o dono (verifica caminho = user_id)
CREATE POLICY "storage_documents_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- INSERT: apenas o dono
CREATE POLICY "storage_documents_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: apenas o dono
CREATE POLICY "storage_documents_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- STORAGE POLICIES: avatars bucket
-- ============================================================

-- SELECT: público (bucket é público)
CREATE POLICY "storage_avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- INSERT: apenas o dono
CREATE POLICY "storage_avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: apenas o dono
CREATE POLICY "storage_avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: apenas o dono (necessário para upsert de avatar)
CREATE POLICY "storage_avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
