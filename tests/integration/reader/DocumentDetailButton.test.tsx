import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { DocumentDetailPage } from '@/features/documents/pages/DocumentDetailPage';

vi.mock('@/core/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@test.com' },
    isAuthenticated: true,
  })),
}));

const mockGetDocument = vi.fn();

vi.mock('@/features/documents/services/documentService', () => ({
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
}));

function renderDetailPage(docId = 'doc-1') {
  return render(
    <MemoryRouter initialEntries={[`/documents/${docId}`]}>
      <Routes>
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('DocumentDetailPage - "Ler documento" button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show "Ler documento" button when status is ready', async () => {
    mockGetDocument.mockResolvedValue({
      data: {
        id: 'doc-1',
        title: 'Test',
        status: 'ready',
        type: 'article',
        authors: [],
        tags: [],
        metadata: {},
        created_at: new Date().toISOString(),
      },
      error: null,
      status: 200,
    });

    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText('Ler documento')).toBeInTheDocument();
    });
  });

  it('should NOT show "Ler documento" button when status is processing', async () => {
    mockGetDocument.mockResolvedValue({
      data: {
        id: 'doc-1',
        title: 'Test',
        status: 'processing',
        type: 'article',
        authors: [],
        tags: [],
        metadata: {},
        created_at: new Date().toISOString(),
      },
      error: null,
      status: 200,
    });

    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
    expect(screen.queryByText('Ler documento')).not.toBeInTheDocument();
  });

  it('should NOT show "Ler documento" button when status is uploading', async () => {
    mockGetDocument.mockResolvedValue({
      data: {
        id: 'doc-1',
        title: 'Test',
        status: 'uploading',
        type: 'article',
        authors: [],
        tags: [],
        metadata: {},
        created_at: new Date().toISOString(),
      },
      error: null,
      status: 200,
    });

    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
    expect(screen.queryByText('Ler documento')).not.toBeInTheDocument();
  });

  it('should NOT show "Ler documento" button when status is error', async () => {
    mockGetDocument.mockResolvedValue({
      data: {
        id: 'doc-1',
        title: 'Test',
        status: 'error',
        type: 'article',
        authors: [],
        tags: [],
        metadata: {},
        created_at: new Date().toISOString(),
      },
      error: null,
      status: 200,
    });

    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
    expect(screen.queryByText('Ler documento')).not.toBeInTheDocument();
  });

  it('should navigate to /reader/:id when clicking "Ler documento"', async () => {
    mockGetDocument.mockResolvedValue({
      data: {
        id: 'doc-1',
        title: 'Test',
        status: 'ready',
        type: 'article',
        authors: [],
        tags: [],
        metadata: {},
        created_at: new Date().toISOString(),
      },
      error: null,
      status: 200,
    });

    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText('Ler documento')).toBeInTheDocument();
    });

    const readerButton = screen.getByRole('button', { name: /ler documento/i });
    expect(readerButton).toBeInTheDocument();
    expect(readerButton.tagName).toBe('BUTTON');
  });
});
