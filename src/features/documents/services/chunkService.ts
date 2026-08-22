import { supabase } from '@/config/supabase';
import type { APIResponse } from '@/core/types/common';
import type { DocumentChunk } from '@/core/types/documents';

export async function createChunks(
  chunks: Omit<DocumentChunk, 'id' | 'created_at'>[]
): Promise<APIResponse<DocumentChunk[]>> {
  if (chunks.length === 0) {
    return { data: [], error: null, status: 200 };
  }

  const { data, error } = await supabase
    .from('document_chunks')
    .insert(chunks)
    .select();

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data: data ?? [], error: null, status: 201 };
}

export async function deleteChunksByDocumentId(
  documentId: string
): Promise<APIResponse<void>> {
  const { error } = await supabase
    .from('document_chunks')
    .delete()
    .eq('document_id', documentId);

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data: null, error: null, status: 200 };
}

export async function getChunksByDocumentId(
  documentId: string
): Promise<APIResponse<DocumentChunk[]>> {
  const { data, error } = await supabase
    .from('document_chunks')
    .select('*')
    .eq('document_id', documentId)
    .order('chunk_index', { ascending: true });

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data: data ?? [], error: null, status: 200 };
}
