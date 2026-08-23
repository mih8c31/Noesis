import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { getDocument } from '@/features/documents/services/documentService';
import { getSourceFileByDocumentId } from '@/features/documents/services/sourceFileService';
import { getDocumentFileUrl } from '@/features/documents/services/storageService';
import { useReadingSession } from '../hooks/useReadingSession';
import { useBookmarks } from '../hooks/useBookmarks';
import { useReaderStore } from '@/store/readerStore';
import { calculateProgress, extractToc } from '../utils/pdfUtils';
import { PdfViewer } from '../components/PdfViewer';
import { ReaderSidebar } from '../components/ReaderSidebar';
import { ReaderToolbar } from '../components/ReaderToolbar';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export function ReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    currentPage,
    totalPages,
    zoom,
    isFullscreen,
    isSidebarOpen,
    setCurrentPage,
    setTotalPages,
    setZoom,
    toggleFullscreen,
    toggleSidebar,
  } = useReaderStore();

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tocItems, setTocItems] = useState<{ title: string; pageNumber: number }[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { initSession: initReadingSession, updateProgress, saveProgress } = useReadingSession(id ?? null);
  const {
    bookmarks,
    loadBookmarks,
    addBookmark,
    removeBookmark,
  } = useBookmarks(sessionId);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  /* eslint-disable react-hooks/exhaustive-deps -- initReadingSession & setCurrentPage are stable refs, omitting prevents infinite re-render */
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      const docResult = await getDocument(id!);
      if (cancelled) return;
      if (docResult.error || !docResult.data) {
        setError(docResult.error || 'Documento não encontrado');
        setIsLoading(false);
        return;
      }

      setDocTitle(docResult.data.title);

      const sourceResult = await getSourceFileByDocumentId(id!);
      if (cancelled) return;
      if (sourceResult.error || !sourceResult.data) {
        setError('Arquivo fonte não encontrado');
        setIsLoading(false);
        return;
      }

      const urlResult = await getDocumentFileUrl(sourceResult.data.file_path);
      if (cancelled) return;
      if (urlResult.error || !urlResult.data) {
        setError('Não foi possível obter URL do arquivo');
        setIsLoading(false);
        return;
      }

      setFileUrl(urlResult.data);

      const session = await initReadingSession();
      if (cancelled) return;
      if (session) {
        setSessionId(session.id);
        if (session.last_position) {
          setCurrentPage(session.last_position);
        }
      }

      setIsLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handlePdfLoaded = useCallback(async (pdf: PDFDocumentProxy) => {
    setTotalPages(pdf.numPages);
    const toc = await extractToc(pdf);
    setTocItems(toc);
  }, [setTotalPages]);

  const handlePageChange = useCallback(async (page: number) => {
    setCurrentPage(page);
    const total = useReaderStore.getState().totalPages;
    updateProgress(page, total);
  }, [setCurrentPage, updateProgress]);

  const handleAddBookmark = useCallback(async () => {
    if (!sessionId) return;
    await addBookmark(currentPage);
  }, [sessionId, currentPage, addBookmark]);

  const handleBookmarkClick = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, [setCurrentPage]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleToggleFullscreen = useCallback(() => {
    toggleFullscreen();
  }, [toggleFullscreen]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  useEffect(() => {
    if (sessionId) {
      loadBookmarks();
    }
  }, [sessionId, loadBookmarks]);

  useEffect(() => {
    return () => {
      const currentPageVal = useReaderStore.getState().currentPage;
      const totalPagesVal = useReaderStore.getState().totalPages;
      saveProgress(currentPageVal, totalPagesVal);
    };
  }, [saveProgress]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-sm text-red-500">{error || 'Arquivo não encontrado'}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-primary underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  const progress = calculateProgress(currentPage, totalPages);

  return (
    <div className="flex flex-col h-screen">
      <ReaderToolbar
        documentTitle={docTitle}
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        progress={progress}
        isFullscreen={isFullscreen}
        isSidebarOpen={isSidebarOpen}
        onPageChange={handlePageChange}
        onZoomChange={setZoom}
        onBack={handleBack}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="flex flex-1 overflow-hidden">
        <ReaderSidebar
          isOpen={isSidebarOpen}
          bookmarks={bookmarks}
          tocItems={tocItems}
          currentPage={currentPage}
          onBookmarkClick={handleBookmarkClick}
          onDeleteBookmark={removeBookmark}
          onTocClick={handlePageChange}
          onAddBookmark={handleAddBookmark}
        />

        <main className="flex-1 overflow-auto p-4">
          <PdfViewer
            fileUrl={fileUrl}
            pageNumber={currentPage}
            scale={zoom}
            onTotalPages={setTotalPages}
            onPdfLoaded={handlePdfLoaded}
          />
        </main>
      </div>
    </div>
  );
}
