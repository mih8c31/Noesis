import { supabase } from '@/config/supabase';
import type { APIResponse } from '@/core/types/common';
import type { Document } from '@/core/types/documents';

export async function createDocument(
  doc: Omit<Document, 'id' | 'created_at' | 'updated_at' | 'processed_at'>
): Promise<APIResponse<Document>> {
  const { data, error } = await supabase
    .from('documents')
    .insert(doc)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data, error: null, status: 201 };
}

export async function updateDocumentStatus(
  documentId: string,
  status: Document['status'],
  metadata?: Record<string, unknown>
): Promise<APIResponse<Document>> {
  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'processing') {
    update.processed_at = null;
  }
  if (status === 'ready') {
    update.processed_at = new Date().toISOString();
  }
  if (metadata) {
    update.metadata = metadata;
  }

  const { data, error } = await supabase
    .from('documents')
    .update(update)
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data, error: null, status: 200 };
}

export async function updateDocumentExtractedText(
  documentId: string,
  extractedText: string,
  pageCount: number
): Promise<APIResponse<Document>> {
  const { data, error } = await supabase
    .from('documents')
    .update({
      extracted_text: extractedText,
      page_count: pageCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data, error: null, status: 200 };
}

export async function getDocument(
  documentId: string
): Promise<APIResponse<Document>> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data, error: null, status: 200 };
}

export async function getDocuments(
  userId: string,
  page = 1,
  pageSize = 20
): Promise<APIResponse<{ data: Document[]; total: number }>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const [result, countResult] = await Promise.all([
    supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  if (result.error) {
    return { data: null, error: result.error.message, status: 500 };
  }

  return {
    data: {
      data: result.data ?? [],
      total: countResult.count ?? 0,
    },
    error: null,
    status: 200,
  };
}

export async function deleteDocument(
  documentId: string
): Promise<APIResponse<void>> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data: null, error: null, status: 200 };
}
