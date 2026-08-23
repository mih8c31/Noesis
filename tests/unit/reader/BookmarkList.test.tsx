import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookmarkList } from '@/features/reader/components/BookmarkList';
import type { Bookmark } from '@/features/reader/types';

describe('BookmarkList', () => {
  const mockBookmarks: Bookmark[] = [
    { id: 'b1', session_id: 's1', page_number: 3, position_pct: null, label: 'Capítulo 1', created_at: '2026-08-22T00:00:00Z' },
    { id: 'b2', session_id: 's1', page_number: 7, position_pct: null, label: null, created_at: '2026-08-22T00:01:00Z' },
    { id: 'b3', session_id: 's1', page_number: 12, position_pct: null, label: 'Referências', created_at: '2026-08-22T00:02:00Z' },
  ];

  let onBookmarkClick: ReturnType<typeof vi.fn>;
  let onDeleteBookmark: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onBookmarkClick = vi.fn();
    onDeleteBookmark = vi.fn();
  });

  it('should show empty state when no bookmarks exist', () => {
    render(<BookmarkList bookmarks={[]} currentPage={5} onBookmarkClick={onBookmarkClick} onDeleteBookmark={onDeleteBookmark} />);
    expect(screen.getByText('Nenhum bookmark criado.')).toBeInTheDocument();
  });

  it('should render all bookmarks', () => {
    render(<BookmarkList bookmarks={mockBookmarks} currentPage={5} onBookmarkClick={onBookmarkClick} onDeleteBookmark={onDeleteBookmark} />);
    expect(screen.getByText('Capítulo 1')).toBeInTheDocument();
    expect(screen.getByText('Referências')).toBeInTheDocument();
  });

  it('should show page number as label when no label is provided', () => {
    render(<BookmarkList bookmarks={mockBookmarks} currentPage={5} onBookmarkClick={onBookmarkClick} onDeleteBookmark={onDeleteBookmark} />);
    expect(screen.getByText('Página 7')).toBeInTheDocument();
  });

  it('should call onBookmarkClick with correct page number when clicking a bookmark', () => {
    render(<BookmarkList bookmarks={mockBookmarks} currentPage={5} onBookmarkClick={onBookmarkClick} onDeleteBookmark={onDeleteBookmark} />);
    const bookmarkElement = screen.getByText('Capítulo 1').closest('[class*="cursor-pointer"]')!;
    fireEvent.click(bookmarkElement);
    expect(onBookmarkClick).toHaveBeenCalledWith(3);
  });

  it('should call onDeleteBookmark when clicking delete button', () => {
    render(<BookmarkList bookmarks={mockBookmarks} currentPage={5} onBookmarkClick={onBookmarkClick} onDeleteBookmark={onDeleteBookmark} />);
    const deleteButtons = screen.getAllByRole('button');
    fireEvent.click(deleteButtons[0]);
    expect(onDeleteBookmark).toHaveBeenCalledWith('b1');
  });

  it('should highlight the bookmark matching current page', () => {
    render(<BookmarkList bookmarks={mockBookmarks} currentPage={3} onBookmarkClick={onBookmarkClick} onDeleteBookmark={onDeleteBookmark} />);
    const bookmarkRow = screen.getByText('Capítulo 1').closest('[class*="cursor-pointer"]')!;
    expect(bookmarkRow.className).toContain('bg-primary/10');
  });

  it('should not highlight bookmarks on different pages', () => {
    render(<BookmarkList bookmarks={mockBookmarks} currentPage={5} onBookmarkClick={onBookmarkClick} onDeleteBookmark={onDeleteBookmark} />);
    const bookmarkRow = screen.getByText('Capítulo 1').closest('[class*="cursor-pointer"]')!;
    expect(bookmarkRow.className).not.toContain('bg-primary/10');
  });

  it('should stop propagation when delete is clicked (not trigger bookmark click)', () => {
    render(<BookmarkList bookmarks={mockBookmarks} currentPage={5} onBookmarkClick={onBookmarkClick} onDeleteBookmark={onDeleteBookmark} />);
    const deleteButtons = screen.getAllByRole('button');
    fireEvent.click(deleteButtons[0]);
    expect(onBookmarkClick).not.toHaveBeenCalled();
    expect(onDeleteBookmark).toHaveBeenCalledWith('b1');
  });

  it('should show page number for each bookmark', () => {
    render(<BookmarkList bookmarks={mockBookmarks} currentPage={5} onBookmarkClick={onBookmarkClick} onDeleteBookmark={onDeleteBookmark} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
