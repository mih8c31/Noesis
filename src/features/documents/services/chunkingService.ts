import { CHUNK_SIZE_CHARS, CHUNK_OVERLAP_CHARS } from '@/config/constants';
import type { ChunkMetadata, DocumentChunk } from '@/core/types/documents';

interface PageText {
  pageNumber: number;
  text: string;
}

interface ChunkInput {
  document_id: string;
  content: string;
  metadata: ChunkMetadata;
}

export function chunkText(
  documentId: string,
  pages: PageText[]
): Omit<DocumentChunk, 'id' | 'created_at'>[] {
  const chunks: ChunkInput[] = [];
  let charOffset = 0;

  for (const page of pages) {
    const text = page.text.trim();
    if (text.length === 0) continue;

    const pageChunks = chunkPageText(documentId, text, page.pageNumber, charOffset);
    chunks.push(...pageChunks);
    charOffset += text.length;
  }

  return chunks.map((c, i) => ({
    document_id: c.document_id,
    chunk_index: i,
    content: c.content,
    metadata: c.metadata,
  }));
}

function chunkPageText(
  documentId: string,
  text: string,
  pageNumber: number,
  globalOffset: number
): ChunkInput[] {
  if (text.length <= CHUNK_SIZE_CHARS) {
    return [
      {
        document_id: documentId,
        content: text,
        metadata: {
          page_number: pageNumber,
          char_start: globalOffset,
          char_end: globalOffset + text.length,
          token_count_estimated: Math.ceil(text.length / 4),
        },
      },
    ];
  }

  const chunks: ChunkInput[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE_CHARS, text.length);

    if (end < text.length) {
      const breakPoint = findParagraphBreak(text, start, end);
      if (breakPoint > start) {
        end = breakPoint;
      }
    }

    const content = text.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({
        document_id: documentId,
        content,
        metadata: {
          page_number: pageNumber,
          char_start: globalOffset + start,
          char_end: globalOffset + end,
          token_count_estimated: Math.ceil(content.length / 4),
        },
      });
    }

    start = end - CHUNK_OVERLAP_CHARS;
    if (start >= text.length) break;
  }

  return chunks;
}

function findParagraphBreak(text: string, start: number, end: number): number {
  const searchStart = Math.max(end - 200, start);
  const region = text.slice(searchStart, end);
  const lastDoubleNewline = region.lastIndexOf('\n\n');

  if (lastDoubleNewline > 0) {
    return searchStart + lastDoubleNewline;
  }

  const lastSingleNewline = region.lastIndexOf('\n');
  if (lastSingleNewline > 0) {
    return searchStart + lastSingleNewline;
  }

  const lastPeriod = region.lastIndexOf('. ');
  if (lastPeriod > 0) {
    return searchStart + lastPeriod + 1;
  }

  return end;
}
