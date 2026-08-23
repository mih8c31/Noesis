import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReaderSidebar } from '@/features/reader/components/ReaderSidebar';
import type { Bookmark } from '@/features/reader/types';

describe('ReaderSidebar', () => {
  const defaultProps = {
    isOpen: true,
    bookmarks: [] as Bookmark[],
    tocItems: [{ title: 'Cap 1', pageNumber: 1 }],
    currentPage: 1,
    onBookmarkClick: vi.fn(),
    onDeleteBookmark: vi.fn(),
    onTocClick: vi.fn(),
    onAddBookmark: vi.fn(),
  };

  it('should not render when isOpen is false', () => {
    const { container } = render(<ReaderSidebar {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render when isOpen is true', () => {
    render(<ReaderSidebar {...defaultProps} />);
    expect(screen.getByText('Painel')).toBeInTheDocument();
  });

  it('should show "Adicionar bookmark" button with current page number', () => {
    render(<ReaderSidebar {...defaultProps} currentPage={5} />);
    expect(screen.getByText('Adicionar bookmark na página 5')).toBeInTheDocument();
  });

  it('should call onAddBookmark when clicking add bookmark button', () => {
    render(<ReaderSidebar {...defaultProps} />);
    const addBtn = screen.getByText('Adicionar bookmark na página 1');
    fireEvent.click(addBtn);
    expect(defaultProps.onAddBookmark).toHaveBeenCalled();
  });

  it('should call onAddBookmark when clicking the bookmark icon in header', () => {
    render(<ReaderSidebar {...defaultProps} />);
    const headerButton = screen.getAllByRole('button')[0];
    fireEvent.click(headerButton);
    expect(defaultProps.onAddBookmark).toHaveBeenCalled();
  });

  it('should show bookmarks count in header', () => {
    const bookmarks = [
      { id: 'b1', session_id: 's1', page_number: 3, position_pct: null, label: 'Test', created_at: '' },
    ] as Bookmark[];
    render(<ReaderSidebar {...defaultProps} bookmarks={bookmarks} />);
    expect(screen.getByText('Bookmarks (1)')).toBeInTheDocument();
  });

  it('should render TOC when items are provided', () => {
    render(<ReaderSidebar {...defaultProps} />);
    expect(screen.getByText('Tabela de Conteúdo')).toBeInTheDocument();
    expect(screen.getByText('Cap 1')).toBeInTheDocument();
  });

  it('should not render TOC section when no items', () => {
    render(<ReaderSidebar {...defaultProps} tocItems={[]} />);
    expect(screen.queryByText('Tabela de Conteúdo')).not.toBeInTheDocument();
  });
});
