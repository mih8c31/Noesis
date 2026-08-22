import { supabase } from '@/config/supabase';
import type { APIResponse } from '@/core/types/common';
import type { SourceFile } from '@/core/types/documents';

export async function createSourceFile(
  sourceFile: Omit<SourceFile, 'id' | 'created_at'>
): Promise<APIResponse<SourceFile>> {
  const { data, error } = await supabase
    .from('source_files')
    .insert(sourceFile)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data, error: null, status: 201 };
}

export async function getSourceFileByDocumentId(
  documentId: string
): Promise<APIResponse<SourceFile>> {
  const { data, error } = await supabase
    .from('source_files')
    .select('*')
    .eq('document_id', documentId)
    .single();

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data, error: null, status: 200 };
}
