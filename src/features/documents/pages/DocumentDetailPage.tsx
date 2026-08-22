import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Loader2, FileText, Calendar, Users, BookOpen } from 'lucide-react';
import { Button } from '@/core/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/ui/ui/card';
import { getDocument } from '../services/documentService';
import type { Document } from '@/core/types/documents';

const typeLabels = {
  article: 'Artigo',
  book: 'Livro',
  chapter: 'Capítulo',
  thesis: 'Tese',
  other: 'Outro',
} as const;

const statusLabels = {
  uploading: 'Enviando',
  processing: 'Processando',
  ready: 'Pronto',
  error: 'Erro',
} as const;

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadDocument = async () => {
      setIsLoading(true);
      const result = await getDocument(id);
      if (result.error) {
        setError(result.error);
      } else {
        setDocument(result.data);
      }
      setIsLoading(false);
    };

    loadDocument();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-sm text-red-600">{error || 'Documento não encontrado'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="flex items-start gap-4">
        <FileText className="h-10 w-10 text-muted-foreground shrink-0" />
        <div>
          <h1 className="text-2xl font-bold">{document.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{typeLabels[document.type]}</span>
            <span>·</span>
            <span>{statusLabels[document.status]}</span>
            {document.page_count && (
              <>
                <span>·</span>
                <span>{document.page_count} páginas</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Metadados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {document.authors.length > 0 && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Autores</p>
                  <p className="text-sm text-muted-foreground">
                    {document.authors.join(', ')}
                  </p>
                </div>
              </div>
            )}
            {document.publication_year && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Ano de publicação</p>
                  <p className="text-sm text-muted-foreground">
                    {document.publication_year}
                  </p>
                </div>
              </div>
            )}
            {document.doi && (
              <div>
                <p className="text-sm font-medium">DOI</p>
                <p className="text-sm text-muted-foreground">{document.doi}</p>
              </div>
            )}
            {document.journal && (
              <div>
                <p className="text-sm font-medium">Periódico</p>
                <p className="text-sm text-muted-foreground">{document.journal}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Arquivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {document.file_size_bytes && (
              <div>
                <p className="text-sm font-medium">Tamanho</p>
                <p className="text-sm text-muted-foreground">
                  {(document.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
            {document.language && (
              <div>
                <p className="text-sm font-medium">Idioma</p>
                <p className="text-sm text-muted-foreground">{document.language}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Criado em</p>
              <p className="text-sm text-muted-foreground">
                {new Date(document.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {document.extracted_text && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Texto Extraído</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto rounded-md bg-muted p-4">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                {document.extracted_text.slice(0, 5000)}
                {document.extracted_text.length > 5000 && '\n\n... (texto truncado)'}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
