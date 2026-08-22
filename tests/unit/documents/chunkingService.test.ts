import { describe, it, expect } from 'vitest';
import { chunkText } from '@/features/documents/services/chunkingService';

const DOC_ID = 'test-doc-001';

describe('chunkText - basic chunking', () => {
  it('should handle empty pages array', () => {
    expect(chunkText(DOC_ID, [])).toHaveLength(0);
  });

  it('should skip empty page text', () => {
    const c = chunkText(DOC_ID, [
      { pageNumber: 1, text: '' },
      { pageNumber: 2, text: '   ' },
      { pageNumber: 3, text: 'Content' },
    ]);
    expect(c).toHaveLength(1);
    expect(c[0].content).toBe('Content');
    expect(c[0].metadata.page_number).toBe(3);
  });

  it('should return single chunk for text < 2000', () => {
    const c = chunkText(DOC_ID, [{ pageNumber: 1, text: 'Short text.' }]);
    expect(c).toHaveLength(1);
    expect(c[0].content).toBe('Short text.');
    expect(c[0].chunk_index).toBe(0);
    expect(c[0].document_id).toBe(DOC_ID);
  });
});
