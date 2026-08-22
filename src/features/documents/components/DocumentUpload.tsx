import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/core/ui/ui/button';
import { Card, CardContent } from '@/core/ui/ui/card';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import type { Document } from '@/core/types/documents';

interface DocumentUploadProps {
  libraryId: string;
  onUploadComplete?: (document: Document) => void;
}

export function DocumentUpload({ libraryId, onUploadComplete }: DocumentUploadProps) {
  const { isUploading, progress, status, error, uploadPdf, resetUpload } = useDocumentUpload();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const doc = await uploadPdf(file, libraryId);
    if (doc && onUploadComplete) {
      onUploadComplete(doc);
    }
  }, [uploadPdf, libraryId, onUploadComplete]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const getStatusIcon = () => {
    switch (status) {
      case 'validating':
      case 'uploading':
      case 'processing':
      case 'chunking':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'done':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Upload className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'validating':
        return 'Validando arquivo...';
      case 'uploading':
        return `Enviando... ${progress}%`;
      case 'processing':
        return 'Extraindo texto do PDF...';
      case 'chunking':
        return 'Criando chunks para busca...';
      case 'done':
        return 'Documento processado com sucesso!';
      case 'error':
        return error || 'Erro ao processar documento';
      default:
        return 'Arraste um PDF ou clique para selecionar';
    }
  };

  return (
    <Card
      className={`border-2 border-dashed transition-colors ${
        dragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4">{getStatusIcon()}</div>

        <p className="text-sm font-medium mb-2">{getStatusText()}</p>

        {status === 'idle' && (
          <p className="text-xs text-muted-foreground mb-4">
            PDF até 20 MB será processado automaticamente
          </p>
        )}

        {status === 'error' && (
          <Button variant="outline" size="sm" onClick={resetUpload}>
            Tentar novamente
          </Button>
        )}

        {status === 'idle' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Selecionar arquivo
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
