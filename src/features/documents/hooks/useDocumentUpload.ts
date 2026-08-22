import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { validatePdfFile, getDocumentTitle } from '../utils/pdfValidation';
import { uploadDocument } from '../services/storageService';
import { createDocument, updateDocumentStatus } from '../services/documentService';
import { createSourceFile } from '../services/sourceFileService';
import { extractPdfText } from '../services/processingService';
import { chunkText } from '../services/chunkingService';
import { createChunks } from '../services/chunkService';
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

      const documentId = uuidv4();

      setUploadState(prev => ({ ...prev, progress: 20, status: 'uploading' }));

      const uploadResult = await uploadDocument(user.id, documentId, file);
      if (uploadResult.error) {
        setUploadState(prev => ({
          ...prev,
          error: uploadResult.error ?? 'Erro ao enviar arquivo',
          status: 'error',
        }));
        return null;
      }

      const createResult = await createDocument({
        user_id: user.id,
        library_id: libraryId,
        type: documentType,
        status: validation.needsProcessing ? 'processing' : 'ready',
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

      await createSourceFile({
        document_id: documentId,
        storage_bucket: 'documents',
        file_path: uploadResult.data!,
        mime_type: 'application/pdf',
        file_size: file.size,
      });

      setUploadState(prev => ({
        ...prev,
        progress: 50,
        status: 'processing',
        documentId,
      }));

      if (validation.needsProcessing) {
        const extraction = await extractPdfText(file);

        if (!extraction.hasText) {
          await updateDocumentStatus(documentId, 'error', {
            error_code: extraction.errorCode,
            error_message: extraction.error,
          });

          setUploadState(prev => ({
            ...prev,
            error: extraction.error ?? 'Erro ao processar PDF',
            status: 'error',
          }));
          return null;
        }

        setUploadState(prev => ({ ...prev, progress: 70, status: 'chunking' }));

        const chunks = chunkText(documentId, [
          { pageNumber: 1, text: extraction.text },
        ]);

        await createChunks(chunks);

        await updateDocumentStatus(documentId, 'ready');

        setUploadState(prev => ({
          ...prev,
          progress: 100,
          status: 'done',
          isUploading: false,
        }));

        const docResult = await createResult;
        return docResult.data;
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
