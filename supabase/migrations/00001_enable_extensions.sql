-- Migration: 00001_enable_extensions
-- Rollback: DROP EXTENSION IF EXISTS pgcrypto;

-- Habilitar pgcrypto para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
