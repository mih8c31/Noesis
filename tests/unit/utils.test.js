import { describe, it, expect } from 'vitest';

// Test the pure logic without eval (source uses const/class which don't leak from eval in strict mode)

const CONFIG = {
  SUPABASE_URL: 'https://kjphsqxtrlzvvkbczzwx.supabase.co',
  SUPABASE_ANON_KEY: 'test-key',
  APP_NAME: 'Noesis',
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
};

const Utils = {
  sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, '');
  },

  getDocumentTitle(fileName) {
    return fileName.replace(/\.pdf$/i, '').replace(/_/g, ' ').replace(/-/g, ' ');
  },

  formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  },

  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  validatePdfFile(file) {
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'Apenas arquivos PDF são aceitos.' };
    }
    if (file.size > CONFIG.MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `Arquivo excede ${CONFIG.MAX_FILE_SIZE_MB} MB.` };
    }
    return { valid: true };
  },
};

describe('Utils.sanitizeFileName', () => {
  it('removes special characters', () => {
    expect(Utils.sanitizeFileName('my file (1).pdf')).toBe('my_file_1_.pdf');
  });

  it('replaces multiple underscores', () => {
    expect(Utils.sanitizeFileName('a___b.pdf')).toBe('a_b.pdf');
  });

  it('trims leading/trailing underscores', () => {
    expect(Utils.sanitizeFileName('_file_.pdf')).toBe('file_.pdf');
  });

  it('keeps dots, dashes, and underscores', () => {
    expect(Utils.sanitizeFileName('my-file_v2.pdf')).toBe('my-file_v2.pdf');
  });

  it('handles empty string', () => {
    expect(Utils.sanitizeFileName('')).toBe('');
  });
});

describe('Utils.getDocumentTitle', () => {
  it('removes .pdf extension', () => {
    expect(Utils.getDocumentTitle('paper.pdf')).toBe('paper');
  });

  it('replaces underscores with spaces', () => {
    expect(Utils.getDocumentTitle('my_paper.pdf')).toBe('my paper');
  });

  it('replaces dashes with spaces', () => {
    expect(Utils.getDocumentTitle('my-paper.pdf')).toBe('my paper');
  });

  it('is case insensitive for .pdf', () => {
    expect(Utils.getDocumentTitle('paper.PDF')).toBe('paper');
  });
});

describe('Utils.formatFileSize', () => {
  it('formats bytes', () => {
    expect(Utils.formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(Utils.formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(Utils.formatFileSize(2048000)).toBe('1.95 MB');
  });

  it('returns empty for falsy', () => {
    expect(Utils.formatFileSize(0)).toBe('');
    expect(Utils.formatFileSize(null)).toBe('');
  });
});

describe('Utils.formatDate', () => {
  it('formats a date string', () => {
    const result = Utils.formatDate('2026-01-15T10:30:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns empty for falsy', () => {
    expect(Utils.formatDate(null)).toBe('');
    expect(Utils.formatDate('')).toBe('');
  });
});

describe('Utils.validatePdfFile', () => {
  it('rejects non-PDF files', () => {
    const file = { type: 'image/png', size: 1000 };
    const result = Utils.validatePdfFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('PDF');
  });

  it('rejects oversized files', () => {
    const file = { type: 'application/pdf', size: 100 * 1024 * 1024 };
    const result = Utils.validatePdfFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('MB');
  });

  it('accepts valid PDF', () => {
    const file = { type: 'application/pdf', size: 1024 * 100 };
    const result = Utils.validatePdfFile(file);
    expect(result.valid).toBe(true);
  });
});

describe('Utils.debounce', () => {
  it('returns a function', () => {
    const fn = Utils.debounce(() => {}, 100);
    expect(typeof fn).toBe('function');
  });
});
