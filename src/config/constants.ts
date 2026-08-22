export const APP_NAME = 'Noesis';
export const APP_VERSION = '0.1.0';

// ============================================
// LIMITES DE ARQUIVO
// ============================================
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const MAX_PROCESSING_SIZE_MB = 20;
export const MAX_PROCESSING_SIZE_BYTES = MAX_PROCESSING_SIZE_MB * 1024 * 1024;

export const ALLOWED_FILE_TYPES = ['application/pdf'] as const;

// ============================================
// CHUNKING
// ============================================
export const CHUNK_SIZE_CHARS = 2000;
export const CHUNK_OVERLAP_CHARS = 200;

// ============================================
// EMBEDDINGS — NÃO DEFINIDO NESTA SPRINT
// A dimensão do embedding será definida na Sprint 6,
// após escolha do modelo/provedor.
// ============================================

// ============================================
// OUTROS
// ============================================
export const AI_REQUEST_TIMEOUT_MS = 60_000;
export const TTS_REQUEST_TIMEOUT_MS = 30_000;

export const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

export const PAGINATION_PAGE_SIZE = 20;
