-- Migration: 00011_create_default_library_and_update_trigger.sql
-- Rollback: Revert trigger to previous version; DROP default library.

-- 1. Atualizar handle_new_user para criar library padrão automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.libraries (user_id, name, description, is_default, sort_order)
  VALUES (
    NEW.id,
    'Minha Biblioteca',
    'Biblioteca padrão',
    true,
    0
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 2. Criar library padrão para o usuário existente que não possui
DO $$
DECLARE
  existing_user_id UUID;
BEGIN
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE NOT EXISTS (
    SELECT 1 FROM public.libraries WHERE libraries.user_id = auth.users.id
  )
  LIMIT 1;

  IF existing_user_id IS NOT NULL THEN
    INSERT INTO public.libraries (user_id, name, description, is_default, sort_order)
    VALUES (existing_user_id, 'Minha Biblioteca', 'Biblioteca padrão', true, 0)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
