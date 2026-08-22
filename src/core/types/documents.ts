export interface Document {
  id: string;
  user_id: string;
  library_id: string;
  type: 'article' | 'book' | 'chapter' | 'thesis' | 'other';
  status: 'uploading' | 'processing' | 'ready' | 'error';
  title: string;
  abstract: string | null;
  authors: string[];
  publication_year: number | null;
  publisher: string | null;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  doi: string | null;
  isbn: string | null;
  url: string | null;
  language: string | null;
  page_count: number | null;
  file_size_bytes: number | null;
  content_type: string | null;
  extracted_text: string | null;
  content_summary: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

export interface SourceFile {
  id: string;
  document_id: string;
  storage_bucket: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  metadata: ChunkMetadata;
  created_at: string;
}

export interface ChunkMetadata {
  page_number: number | null;
  char_start: number;
  char_end: number;
  token_count_estimated: number;
}

export type DocumentStatus = Document['status'];

export type DocumentErrorCode =
  | 'PROCESSING_SIZE_EXCEEDED'
  | 'NO_EXTRACTABLE_TEXT'
  | 'PDF_PROTECTED'
  | 'PDF_CORRUPTED'
  | 'PDF_EMPTY'
  | 'EXTRACTION_FAILED'
  | 'UPLOAD_FAILED';
