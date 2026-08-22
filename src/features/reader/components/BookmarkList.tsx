import { Bookmark, Trash2 } from 'lucide-react';
import { Button } from '@/core/ui/ui/button';
import type { Bookmark as BookmarkType } from '../types';

interface BookmarkListProps {
  bookmarks: BookmarkType[];
  currentPage: number;
  onBookmarkClick: (pageNumber: number) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
}

export function BookmarkList({
  bookmarks,
  currentPage,
  onBookmarkClick,
  onDeleteBookmark,
}: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Nenhum bookmark criado.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm cursor-pointer transition-colors ${
            bookmark.page_number === currentPage
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted'
          }`}
          onClick={() => onBookmarkClick(bookmark.page_number)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Bookmark className="h-3 w-3 shrink-0" />
            <span className="truncate text-xs">
              {bookmark.label || `Página ${bookmark.page_number}`}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">
              {bookmark.page_number}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBookmark(bookmark.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
