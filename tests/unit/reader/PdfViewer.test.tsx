import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PdfViewer } from '@/features/reader/components/PdfViewer';

const mockLoadPdfDocument = vi.fn();
const mockRenderPageToCanvas = vi.fn();

vi.mock('@/features/reader/utils/pdfUtils', () => ({
  loadPdfDocument: (...args: unknown[]) => mockLoadPdfDocument(...args),
  renderPageToCanvas: (...args: unknown[]) => mockRenderPageToCanvas(...args),
}));

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 0 }),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}) as unknown as CanvasRenderingContext2D;

describe('PdfViewer', () => {
  const defaultProps = {
    fileUrl: 'https://example.com/test.pdf',
    pageNumber: 1,
    scale: 100,
    onTotalPages: vi.fn(),
    onPdfLoaded: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadPdfDocument.mockResolvedValue({
      numPages: 10,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 800, height: 600 }),
        render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
      }),
      getOutline: vi.fn().mockResolvedValue(null),
    });
    mockRenderPageToCanvas.mockResolvedValue(undefined);
  });

  it('should show loading state initially', () => {
    render(<PdfViewer {...defaultProps} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should call loadPdfDocument with the file URL', async () => {
    render(<PdfViewer {...defaultProps} />);
    await waitFor(() => {
      expect(mockLoadPdfDocument).toHaveBeenCalledWith('https://example.com/test.pdf');
    });
  });

  it('should call onTotalPages with correct page count', async () => {
    render(<PdfViewer {...defaultProps} />);
    await waitFor(() => {
      expect(defaultProps.onTotalPages).toHaveBeenCalledWith(10);
    });
  });

  it('should call onPdfLoaded with the PDF document', async () => {
    render(<PdfViewer {...defaultProps} />);
    await waitFor(() => {
      expect(defaultProps.onPdfLoaded).toHaveBeenCalled();
    });
  });

  it('should show error state when PDF fails to load', async () => {
    mockLoadPdfDocument.mockRejectedValueOnce(new Error('Falha ao carregar PDF: 404'));

    render(<PdfViewer {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Falha ao carregar PDF: 404')).toBeInTheDocument();
    });
  });

  it('should call renderPageToCanvas after PDF loads', async () => {
    render(<PdfViewer {...defaultProps} pageNumber={5} />);
    await waitFor(() => {
      expect(mockRenderPageToCanvas).toHaveBeenCalled();
    });
  });

  it('should pass scale divided by 100 to renderPageToCanvas', async () => {
    render(<PdfViewer {...defaultProps} scale={150} />);
    await waitFor(() => {
      expect(mockRenderPageToCanvas).toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.anything(),
        1.5
      );
    });
  });
});
