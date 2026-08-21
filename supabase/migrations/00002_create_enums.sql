-- Migration: 00002_create_enums
-- Rollback: N/A (CHECK constraints são removidas com as tabelas)

-- Estratégia: TEXT + CHECK (não PostgreSQL ENUM)
-- Decisão: MVP usa TEXT + CHECK para flexibilidade na evolução do schema.
-- Se no futuro for necessário type safety mais forte, migrar para ENUM.
--
-- As CHECK constraints são definidas diretamente nas tabelas (00005).
-- Esta migration existe como placeholder para manter a numeração sequencial.
-- Pode ser removida futuramente se não houver necessidade de criar ENUMs separados.
