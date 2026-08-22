import { describe, it, expect } from 'vitest';
import { validatePdfFile, sanitizeFileName, getDocumentTitle } from '@/features/documents/utils/pdfValidation';

describe('pdfValidation', () => {
  describe('validatePdfFile', () => {
    it('should accept valid PDF file within size limit', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const result = validatePdfFile(file);

      expect(result.valid).toBe(true);
      expect(result.needsProcessing).toBe(true);
    });

    it('should reject non-PDF files', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const result = validatePdfFile(file);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_TYPE');
    });

    it('should reject files exceeding 50 MB', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 });

      const result = validatePdfFile(file);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('FILE_TOO_LARGE');
    });

    it('should mark files 20-50 MB as not needing processing', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 30 * 1024 * 1024 });

      const result = validatePdfFile(file);

      expect(result.valid).toBe(true);
      expect(result.needsProcessing).toBe(false);
    });
  });

  describe('sanitizeFileName', () => {
    it('should replace special characters with underscores', () => {
      expect(sanitizeFileName('my file (1).pdf')).toBe('my_file_1_.pdf');
    });

    it('should collapse multiple underscores', () => {
      expect(sanitizeFileName('file___name.pdf')).toBe('file_name.pdf');
    });

    it('should remove leading and trailing underscores', () => {
      expect(sanitizeFileName('_file_.pdf')).toBe('file_.pdf');
    });
  });

  describe('getDocumentTitle', () => {
    it('should remove .pdf extension', () => {
      expect(getDocumentTitle('paper.pdf')).toBe('paper');
    });

    it('should replace underscores with spaces', () => {
      expect(getDocumentTitle('my_paper.pdf')).toBe('my paper');
    });
  });
});
