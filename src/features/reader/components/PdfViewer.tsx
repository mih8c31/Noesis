import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { loadPdfDocument, renderPageToCanvas } from '../utils/pdfUtils';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PdfViewerProps {
  fileUrl: string;
  pageNumber: number;
  scale: number;
  onTotalPages: (total: number) => void;
  onPdfLoaded?: (pdf: PDFDocumentProxy) => void;
}

export function PdfViewer({ fileUrl, pageNumber, scale, onTotalPages, onPdfLoaded }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const pdf = await loadPdfDocument(fileUrl);
        if (cancelled) return;
        pdfRef.current = pdf;
        onTotalPages(pdf.numPages);
        onPdfLoaded?.(pdf);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Erro ao carregar PDF';
        setError(message);
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, onTotalPages, onPdfLoaded]);

  useEffect(() => {
    if (!pdfRef.current || !canvasRef.current) return;

    let cancelled = false;

    async function render() {
      try {
        await renderPageToCanvas(pdfRef.current!, pageNumber, canvasRef.current!, scale / 100);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Erro ao renderizar página';
          setError(message);
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [pageNumber, scale]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex justify-center overflow-auto bg-muted rounded-lg p-4">
      <canvas ref={canvasRef} className="shadow-lg" />
    </div>
  );
}
