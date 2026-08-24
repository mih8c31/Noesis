import { useState, useCallback } from 'react';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { validatePdfFile, getDocumentTitle } from '../utils/pdfValidation';
import { uploadDocument } from '../services/storageService';
import { createDocument, updateDocumentStatus } from '../services/documentService';
import { createSourceFile } from '../services/sourceFileService';
import type { Document } from '@/core/types/documents';

interface UploadState {
  isUploading: boolean;
  progress: number;
  status: 'idle' | 'validating' | 'uploading' | 'processing' | 'chunking' | 'done' | 'error';
  error: string | null;
  documentId: string | null;
}

export function useDocumentUpload() {
  const { user } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    status: 'idle',
    error: null,
    documentId: null,
  });

  const uploadPdf = useCallback(async (
    file: File,
    libraryId: string,
    documentType: Document['type'] = 'article'
  ): Promise<Document | null> => {
    if (!user) {
      setUploadState(prev => ({ ...prev, error: 'Usuário não autenticado', status: 'error' }));
      return null;
    }

    setUploadState({
      isUploading: true,
      progress: 0,
      status: 'validating',
      error: null,
      documentId: null,
    });

    try {
      const validation = validatePdfFile(file);
      if (!validation.valid) {
        setUploadState(prev => ({
          ...prev,
          error: validation.error ?? 'Arquivo inválido',
          status: 'error',
        }));
        return null;
      }

      setUploadState(prev => ({ ...prev, progress: 10, status: 'validating' }));

      const createResult = await createDocument({
        user_id: user.id,
        library_id: libraryId,
        type: documentType,
        status: 'processing',
        title: getDocumentTitle(file.name),
        abstract: null,
        authors: [],
        publication_year: null,
        publisher: null,
        journal: null,
        volume: null,
        issue: null,
        doi: null,
        isbn: null,
        url: null,
        language: null,
        page_count: null,
        file_size_bytes: file.size,
        content_type: 'application/pdf',
        extracted_text: null,
        content_summary: null,
        tags: [],
        metadata: {},
      });

      if (createResult.error) {
        setUploadState(prev => ({
          ...prev,
          error: createResult.error ?? 'Erro ao criar documento',
          status: 'error',
        }));
        return null;
      }

      const realDocId = createResult.data!.id;

      setUploadState(prev => ({ ...prev, progress: 20, status: 'uploading', documentId: realDocId }));

      const uploadResult = await uploadDocument(user.id, realDocId, file);
      if (uploadResult.error) {
        await updateDocumentStatus(realDocId, 'error', {
          error_code: 'UPLOAD_FAILED',
          error_message: uploadResult.error,
        });
        setUploadState(prev => ({
          ...prev,
          error: uploadResult.error ?? 'Erro ao enviar arquivo',
          status: 'error',
        }));
        return null;
      }

      const sourceResult = await createSourceFile({
        document_id: realDocId,
        storage_bucket: 'documents',
        file_path: uploadResult.data!,
        mime_type: 'application/pdf',
        file_size: file.size,
      });

      if (sourceResult.error) {
        await updateDocumentStatus(realDocId, 'error', {
          error_code: 'UPLOAD_FAILED',
          error_message: sourceResult.error,
        });
        setUploadState(prev => ({
          ...prev,
          error: sourceResult.error ?? 'Erro ao registrar arquivo',
          status: 'error',
        }));
        return null;
      }

      // TODO (Sprint 6+): reativar extração de texto quando IA/RAG estiver pronto
      // Extração de texto desabilitada temporariamente (muito lenta em PDFs grandes)
      const statusResult = await updateDocumentStatus(realDocId, 'ready');
      if (statusResult.error) {
        setUploadState(prev => ({
          ...prev,
          error: statusResult.error ?? 'Erro ao finalizar processamento',
          status: 'error',
        }));
        return null;
      }

      setUploadState(prev => ({
        ...prev,
        progress: 100,
        status: 'done',
        isUploading: false,
      }));

      return createResult.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setUploadState(prev => ({
        ...prev,
        error: message,
        status: 'error',
      }));
      return null;
    }
  }, [user]);

  const resetUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      status: 'idle',
      error: null,
      documentId: null,
    });
  }, []);

  return {
    ...uploadState,
    uploadPdf,
    resetUpload,
  };
}
