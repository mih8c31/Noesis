import { FileText, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/core/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/ui/ui/card';
import type { Document } from '@/core/types/documents';

interface DocumentCardProps {
  document: Document;
  onDelete?: (document: Document) => void;
  onClick?: (document: Document) => void;
}

const statusConfig = {
  uploading: { icon: Clock, color: 'text-yellow-500', label: 'Enviando' },
  processing: { icon: Clock, color: 'text-blue-500', label: 'Processando' },
  ready: { icon: CheckCircle, color: 'text-green-500', label: 'Pronto' },
  error: { icon: AlertCircle, color: 'text-red-500', label: 'Erro' },
} as const;

const typeLabels = {
  article: 'Artigo',
  book: 'Livro',
  chapter: 'Capítulo',
  thesis: 'Tese',
  other: 'Outro',
} as const;

export function DocumentCard({ document, onDelete, onClick }: DocumentCardProps) {
  const statusInfo = statusConfig[document.status];
  const StatusIcon = statusInfo.icon;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(document)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <CardTitle className="text-sm font-medium truncate">
              {document.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(document);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{typeLabels[document.type]}</span>
          {document.page_count && (
            <>
              <span>·</span>
              <span>{document.page_count} páginas</span>
            </>
          )}
          {document.file_size_bytes && (
            <>
              <span>·</span>
              <span>{(document.file_size_bytes / 1024 / 1024).toFixed(1)} MB</span>
            </>
          )}
        </div>
        {document.authors.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {document.authors.join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
