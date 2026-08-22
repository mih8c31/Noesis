import { supabase } from '@/config/supabase';
import type { APIResponse } from '@/core/types/common';
import { sanitizeFileName } from '../utils/pdfValidation';

const STORAGE_BUCKET = 'documents';

export async function uploadDocument(
  userId: string,
  documentId: string,
  file: File
): Promise<APIResponse<string>> {
  const sanitized = sanitizeFileName(file.name);
  const filePath = `${userId}/${documentId}/${sanitized}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data: filePath, error: null, status: 200 };
}

export async function deleteDocumentFile(
  userId: string,
  documentId: string,
  fileName: string
): Promise<APIResponse<void>> {
  const sanitized = sanitizeFileName(fileName);
  const filePath = `${userId}/${documentId}/${sanitized}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data: null, error: null, status: 200 };
}

export async function getDocumentFileUrl(
  filePath: string
): Promise<APIResponse<string>> {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return { data: data.publicUrl, error: null, status: 200 };
}

export async function downloadDocumentFile(
  filePath: string
): Promise<APIResponse<Blob>> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(filePath);

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data, error: null, status: 200 };
}
