import { describe, it, expect } from 'vitest';
import { calculateProgress } from '@/features/reader/utils/pdfUtils';

describe('calculateProgress', () => {
  it('should return 0 when totalPages is 0', () => {
    expect(calculateProgress(1, 0)).toBe(0);
  });

  it('should return 0 when totalPages is 0 even if currentPage is 0', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('should calculate 100% when on last page', () => {
    expect(calculateProgress(10, 10)).toBe(100);
  });

  it('should calculate 50% when on middle page', () => {
    expect(calculateProgress(5, 10)).toBe(50);
  });

  it('should calculate correct percentage for page 1 of 200', () => {
    expect(calculateProgress(1, 200)).toBe(0.5);
  });

  it('should calculate 1% for page 1 of 100', () => {
    expect(calculateProgress(1, 100)).toBe(1);
  });

  it('should round to 2 decimal places', () => {
    expect(calculateProgress(1, 3)).toBe(33.33);
  });

  it('should handle single page document at 100%', () => {
    expect(calculateProgress(1, 1)).toBe(100);
  });

  it('should return 0 for page 0 of any total', () => {
    expect(calculateProgress(0, 10)).toBe(0);
  });

  it('should handle large document (1000 pages)', () => {
    expect(calculateProgress(500, 1000)).toBe(50);
  });

  it('should handle page beyond total (edge case)', () => {
    expect(calculateProgress(11, 10)).toBe(110);
  });
});
