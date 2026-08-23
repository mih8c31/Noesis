import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ReaderPage } from '@/features/reader/pages/ReaderPage';

vi.mock('@/core/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@test.com' },
    isAuthenticated: true,
  })),
}));

const mockGetDocument = vi.fn();
const mockGetSourceFileByDocumentId = vi.fn();
const mockGetDocumentFileUrl = vi.fn();

vi.mock('@/features/documents/services/documentService', () => ({
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
}));

vi.mock('@/features/documents/services/sourceFileService', () => ({
  getSourceFileByDocumentId: (...args: unknown[]) => mockGetSourceFileByDocumentId(...args),
}));

vi.mock('@/features/documents/services/storageService', () => ({
  getDocumentFileUrl: (...args: unknown[]) => mockGetDocumentFileUrl(...args),
}));

const mockCreateReadingSession = vi.fn();
const mockGetReadingSession = vi.fn();
const mockUpdateReadingSession = vi.fn();

vi.mock('@/features/reader/services/readingService', () => ({
  createReadingSession: (...args: unknown[]) => mockCreateReadingSession(...args),
  getReadingSession: (...args: unknown[]) => mockGetReadingSession(...args),
  updateReadingSession: (...args: unknown[]) => mockUpdateReadingSession(...args),
}));

const mockCreateBookmark = vi.fn();
const mockGetBookmarks = vi.fn();
const mockDeleteBookmark = vi.fn();

vi.mock('@/features/reader/services/bookmarkService', () => ({
  createBookmark: (...args: unknown[]) => mockCreateBookmark(...args),
  getBookmarks: (...args: unknown[]) => mockGetBookmarks(...args),
  deleteBookmark: (...args: unknown[]) => mockDeleteBookmark(...args),
}));

vi.mock('pdfjs-dist', () => ({
  version: '4.0.0',
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 10,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 800, height: 600 }),
        render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
      }),
      getOutline: vi.fn().mockResolvedValue(null),
    }),
  }),
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

function renderReaderPage(docId = 'doc-1') {
  return render(
    <MemoryRouter initialEntries={[`/reader/${docId}`]}>
      <Routes>
        <Route path="/reader/:id" element={<ReaderPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ReaderPage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetDocument.mockResolvedValue({
      data: { id: 'doc-1', title: 'Test Document', status: 'ready' },
      error: null,
      status: 200,
    });

    mockGetSourceFileByDocumentId.mockResolvedValue({
      data: { file_path: 'user-1/doc-1/test.pdf' },
      error: null,
      status: 200,
    });

    mockGetDocumentFileUrl.mockResolvedValue({
      data: 'https://signed-url.com/test.pdf',
      error: null,
      status: 200,
    });

    mockGetReadingSession.mockResolvedValue({ data: null, error: 'not found', status: 404 });
    mockCreateReadingSession.mockResolvedValue({
      data: {
        id: 'session-1',
        document_id: 'doc-1',
        user_id: 'user-1',
        started_at: new Date().toISOString(),
        ended_at: null,
        duration_sec: null,
        pages_read: [],
        progress_pct: null,
        last_position: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
      status: 201,
    });
    mockUpdateReadingSession.mockResolvedValue({ data: {}, error: null, status: 200 });
    mockGetBookmarks.mockResolvedValue({ data: [], error: null, status: 200 });
  });

  it('should show loading state initially', () => {
    renderReaderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should load and display document title', async () => {
    renderReaderPage();
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
  });

  it('should fetch the document file URL from source file', async () => {
    renderReaderPage();
    await waitFor(() => {
      expect(mockGetDocument).toHaveBeenCalledWith('doc-1');
      expect(mockGetSourceFileByDocumentId).toHaveBeenCalledWith('doc-1');
      expect(mockGetDocumentFileUrl).toHaveBeenCalledWith('user-1/doc-1/test.pdf');
    });
  });

  it('should create a reading session', async () => {
    renderReaderPage();
    await waitFor(() => {
      expect(mockCreateReadingSession).toHaveBeenCalledWith('doc-1', 'user-1');
    });
  });

  it('should show error when document is not found', async () => {
    mockGetDocument.mockResolvedValue({ data: null, error: 'Documento não encontrado', status: 404 });

    renderReaderPage();
    await waitFor(() => {
      expect(screen.getByText('Documento não encontrado')).toBeInTheDocument();
    });
  });

  it('should show error when source file is not found', async () => {
    mockGetSourceFileByDocumentId.mockResolvedValue({ data: null, error: 'not found', status: 404 });

    renderReaderPage();
    await waitFor(() => {
      expect(screen.getByText('Arquivo fonte não encontrado')).toBeInTheDocument();
    });
  });

  it('should show error when file URL cannot be obtained', async () => {
    mockGetDocumentFileUrl.mockResolvedValue({ data: null, error: 'url failed', status: 500 });

    renderReaderPage();
    await waitFor(() => {
      expect(screen.getByText('Não foi possível obter URL do arquivo')).toBeInTheDocument();
    });
  });

  it('should restore last position from existing session', async () => {
    mockGetReadingSession.mockResolvedValue({
      data: {
        id: 'session-old',
        document_id: 'doc-1',
        user_id: 'user-1',
        started_at: new Date().toISOString(),
        ended_at: null,
        duration_sec: 300,
        pages_read: [1, 2, 3],
        progress_pct: 30,
        last_position: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
      status: 200,
    });

    renderReaderPage();
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
    expect(mockCreateReadingSession).not.toHaveBeenCalled();
  });

  it('should render the reader toolbar with controls', async () => {
    renderReaderPage();
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
    expect(screen.getByText('Painel')).toBeInTheDocument();
  });
});
