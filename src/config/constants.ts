export const APP_NAME = 'Noesis';
export const APP_VERSION = '0.1.0';

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_FILE_TYPES = ['application/pdf'] as const;

export const CHUNK_SIZE_TOKENS = 500;
export const CHUNK_OVERLAP_TOKENS = 50;

export const EMBEDDING_DIMENSIONS = 1536;

export const AI_REQUEST_TIMEOUT_MS = 60_000;
export const TTS_REQUEST_TIMEOUT_MS = 30_000;

export const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

export const PAGINATION_PAGE_SIZE = 20;
