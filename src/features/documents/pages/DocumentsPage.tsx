import { useEffect, useState } from 'react';
import { Plus, Loader2, FolderOpen } from 'lucide-react';
import { Button } from '@/core/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/ui/ui/card';
import type { Document } from '@/core/types/documents';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentCard } from '../components/DocumentCard';
import { DocumentUpload } from '../components/DocumentUpload';

export function DocumentsPage() {
  const { documents, total, isLoading, error, loadDocuments, removeDocument } = useDocuments();
  const [showUpload, setShowUpload] = useState(false);
  const [libraryId] = useState<string>('default');

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDelete = async (document: Document) => {
    if (window.confirm(`Deletar "${document.title}"?`)) {
      await removeDocument(document);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">
            {total} {total === 1 ? 'documento' : 'documentos'}
          </p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      {showUpload && (
        <DocumentUpload
          libraryId={libraryId}
          onUploadComplete={() => {
            setShowUpload(false);
            loadDocuments();
          }}
        />
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading && documents.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <FolderOpen className="h-5 w-5" />
              Nenhum documento encontrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Faça upload de um PDF para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
