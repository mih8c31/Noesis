import { BookOpen } from 'lucide-react';

interface TocItem {
  title: string;
  pageNumber: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  currentPage: number;
  onTocClick: (pageNumber: number) => void;
}

export function TableOfContents({ items, currentPage, onTocClick }: TableOfContentsProps) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Nenhuma tabela de conteúdo disponível.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {items.map((item, index) => (
        <div
          key={`${item.pageNumber}-${index}`}
          className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer transition-colors ${
            item.pageNumber === currentPage
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted'
          }`}
          onClick={() => onTocClick(item.pageNumber)}
        >
          <BookOpen className="h-3 w-3 shrink-0" />
          <span className="truncate text-xs">{item.title}</span>
          <span className="text-xs text-muted-foreground ml-auto shrink-0">
            {item.pageNumber}
          </span>
        </div>
      ))}
    </div>
  );
}
