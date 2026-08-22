import { useState, useCallback } from 'react';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { getDocuments, deleteDocument } from '../services/documentService';
import { deleteDocumentFile } from '../services/storageService';
import { deleteChunksByDocumentId } from '../services/chunkService';
import { getSourceFileByDocumentId } from '../services/sourceFileService';
import type { Document } from '@/core/types/documents';

interface DocumentsState {
  documents: Document[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

export function useDocuments() {
  const { user } = useAuth();
  const [state, setState] = useState<DocumentsState>({
    documents: [],
    total: 0,
    isLoading: false,
    error: null,
  });

  const loadDocuments = useCallback(async (page = 1, pageSize = 20) => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await getDocuments(user.id, page, pageSize);

    if (result.error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error ?? 'Erro ao carregar documentos',
      }));
      return;
    }

    setState({
      documents: result.data?.data ?? [],
      total: result.data?.total ?? 0,
      isLoading: false,
      error: null,
    });
  }, [user]);

  const removeDocument = useCallback(async (document: Document) => {
    if (!user) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const sourceFile = await getSourceFileByDocumentId(document.id);
      if (sourceFile.data) {
        await deleteChunksByDocumentId(document.id);
        await deleteDocumentFile(user.id, document.id, document.title + '.pdf');
      }

      const result = await deleteDocument(document.id);

      if (result.error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error ?? 'Erro ao deletar documento',
        }));
        return false;
      }

      setState(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.id !== document.id),
        total: prev.total - 1,
        isLoading: false,
      }));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  }, [user]);

  return {
    ...state,
    loadDocuments,
    removeDocument,
  };
}
