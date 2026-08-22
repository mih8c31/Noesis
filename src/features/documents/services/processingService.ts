import { MAX_PROCESSING_SIZE_BYTES } from '@/config/constants';
import type { DocumentErrorCode } from '@/core/types/documents';
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface ExtractionResult {
  text: string;
  pageCount: number;
  hasText: boolean;
  error?: string;
  errorCode?: DocumentErrorCode;
}

export async function extractPdfText(
  file: File
): Promise<ExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;

    const pageTexts: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item): item is TextItem => 'str' in item)
        .map((item) => item.str)
        .join(' ');
      pageTexts.push(pageText);
    }

    const fullText = pageTexts.join('\n\n').trim();
    const hasText = fullText.length > 10;

    if (!hasText) {
      return {
        text: '',
        pageCount,
        hasText: false,
        error: 'PDF não contém texto extraível. Pode ser um PDF baseado em imagem.',
        errorCode: 'NO_EXTRACTABLE_TEXT',
      };
    }

    return {
      text: fullText,
      pageCount,
      hasText: true,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erro desconhecido ao processar PDF';
    return {
      text: '',
      pageCount: 0,
      hasText: false,
      error: message,
      errorCode: 'EXTRACTION_FAILED',
    };
  }
}

export async function extractTextFromUrl(
  url: string
): Promise<ExtractionResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        text: '',
        pageCount: 0,
        hasText: false,
        error: `Falha ao baixar PDF: ${response.status}`,
        errorCode: 'EXTRACTION_FAILED',
      };
    }

    const blob = await response.blob();
    const file = new File([blob], 'document.pdf', { type: 'application/pdf' });

    if (file.size > MAX_PROCESSING_SIZE_BYTES) {
      return {
        text: '',
        pageCount: 0,
        hasText: false,
        error: 'Arquivo excede o limite de processamento (20 MB)',
        errorCode: 'PROCESSING_SIZE_EXCEEDED',
      };
    }

    return extractPdfText(file);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erro ao baixar PDF';
    return {
      text: '',
      pageCount: 0,
      hasText: false,
      error: message,
      errorCode: 'EXTRACTION_FAILED',
    };
  }
}
