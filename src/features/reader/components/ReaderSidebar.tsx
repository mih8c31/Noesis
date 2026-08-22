import { Bookmark } from 'lucide-react';
import { Button } from '@/core/ui/ui/button';
import { BookmarkList } from './BookmarkList';
import { TableOfContents } from './TableOfContents';
import type { Bookmark as BookmarkType } from '../types';

interface TocEntry {
  title: string;
  pageNumber: number;
}

interface ReaderSidebarProps {
  isOpen: boolean;
  bookmarks: BookmarkType[];
  tocItems: TocEntry[];
  currentPage: number;
  onBookmarkClick: (pageNumber: number) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onTocClick: (pageNumber: number) => void;
  onAddBookmark: () => void;
}

export function ReaderSidebar({
  isOpen,
  bookmarks,
  tocItems,
  currentPage,
  onBookmarkClick,
  onDeleteBookmark,
  onTocClick,
  onAddBookmark,
}: ReaderSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="w-64 border-r bg-background flex flex-col shrink-0">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">Painel</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onAddBookmark}
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Bookmark nesta página
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={onAddBookmark}
          >
            <Bookmark className="h-3 w-3" />
            Adicionar bookmark na página {currentPage}
          </Button>
        </div>

        <div className="px-3 py-2 border-t">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Bookmarks ({bookmarks.length})
          </h3>
          <BookmarkList
            bookmarks={bookmarks}
            currentPage={currentPage}
            onBookmarkClick={onBookmarkClick}
            onDeleteBookmark={onDeleteBookmark}
          />
        </div>

        {tocItems.length > 0 && (
          <div className="px-3 py-2 border-t">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Tabela de Conteúdo
            </h3>
            <TableOfContents
              items={tocItems}
              currentPage={currentPage}
              onTocClick={onTocClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}
