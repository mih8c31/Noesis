import { describe, it, expect, vi, beforeEach } from 'vitest';

const CONFIG = {
  SUPABASE_URL: 'https://kjphsqxtrlzvvkbczzwx.supabase.co',
  SUPABASE_ANON_KEY: 'test-key',
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
};

const Utils = {
  validatePdfFile(file) {
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'Apenas arquivos PDF são aceitos.' };
    }
    if (file.size > CONFIG.MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `Arquivo excede ${CONFIG.MAX_FILE_SIZE_MB} MB.` };
    }
    return { valid: true };
  },
  getDocumentTitle(fileName) {
    return fileName.replace(/\.pdf$/i, '').replace(/_/g, ' ').replace(/-/g, ' ');
  },
  sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, '');
  },
  showToast: vi.fn(),
};

describe('Upload.handleFile validation', () => {
  it('rejects non-PDF files', () => {
    const file = { type: 'image/png', size: 1000, name: 'image.png' };
    const result = Utils.validatePdfFile(file);
    expect(result.valid).toBe(false);
  });

  it('rejects oversized files', () => {
    const file = { type: 'application/pdf', size: 100 * 1024 * 1024, name: 'big.pdf' };
    const result = Utils.validatePdfFile(file);
    expect(result.valid).toBe(false);
  });

  it('accepts valid PDF within size limit', () => {
    const file = { type: 'application/pdf', size: 1000, name: 'test.pdf' };
    const result = Utils.validatePdfFile(file);
    expect(result.valid).toBe(true);
  });
});

describe('Upload file path construction', () => {
  it('builds correct storage path', () => {
    const userId = 'user-123';
    const docId = 'doc-456';
    const fileName = 'my_paper.pdf';
    const sanitized = Utils.sanitizeFileName(fileName);
    const filePath = `${userId}/${docId}/${sanitized}`;
    expect(filePath).toBe('user-123/doc-456/my_paper.pdf');
  });
});
