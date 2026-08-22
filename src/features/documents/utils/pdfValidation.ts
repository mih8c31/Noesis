import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_PROCESSING_SIZE_BYTES,
} from '@/config/constants';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
  needsProcessing?: boolean;
}

export function validatePdfFile(file: File): ValidationResult {
  if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
    return {
      valid: false,
      error: 'Apenas arquivos PDF são aceitos.',
      errorCode: 'INVALID_TYPE',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Arquivo excede o limite máximo de ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)} MB.`,
      errorCode: 'FILE_TOO_LARGE',
    };
  }

  if (file.size > MAX_PROCESSING_SIZE_BYTES) {
    return {
      valid: true,
      needsProcessing: false,
    };
  }

  return {
    valid: true,
    needsProcessing: true,
  };
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getDocumentTitle(fileName: string): string {
  return fileName.replace(/\.pdf$/i, '').replace(/_/g, ' ');
}
