import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function loadPdfDocument(url: string): Promise<PDFDocumentProxy> {
  return pdfjsLib.getDocument({ url, withCredentials: false }).promise;
}

export async function renderPageToCanvas(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number
): Promise<void> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({ canvas, viewport }).promise;
}

export async function extractToc(
  pdf: PDFDocumentProxy
): Promise<{ title: string; pageNumber: number }[]> {
  try {
    const outline = await pdf.getOutline();
    if (!outline || outline.length === 0) {
      return [];
    }

    const items: { title: string; pageNumber: number }[] = [];

    for (const item of outline) {
      if (item.dest) {
        let pageNumber: number;
        if (typeof item.dest === 'string') {
          const resolved = await pdf.getDestination(item.dest);
          if (resolved) {
            const index = await pdf.getPageIndex(resolved[0]);
            pageNumber = index + 1;
          } else {
            continue;
          }
        } else {
          const index = await pdf.getPageIndex(item.dest[0]);
          pageNumber = index + 1;
        }
        items.push({ title: item.title, pageNumber });
      }
    }

    return items;
  } catch {
    return [];
  }
}

export function calculateProgress(currentPage: number, totalPages: number): number {
  if (totalPages === 0) return 0;
  return Math.round((currentPage / totalPages) * 100 * 100) / 100;
}
