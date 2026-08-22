import { ArrowLeft, PanelLeftClose, PanelLeftOpen, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/core/ui/ui/button';
import { PageNavigation } from './PageNavigation';
import { ZoomControl } from './ZoomControl';

interface ReaderToolbarProps {
  documentTitle: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  progress: number;
  isFullscreen: boolean;
  isSidebarOpen: boolean;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onBack: () => void;
  onToggleFullscreen: () => void;
  onToggleSidebar: () => void;
}

export function ReaderToolbar({
  documentTitle,
  currentPage,
  totalPages,
  zoom,
  progress,
  isFullscreen,
  isSidebarOpen,
  onPageChange,
  onZoomChange,
  onBack,
  onToggleFullscreen,
  onToggleSidebar,
}: ReaderToolbarProps) {
  return (
    <div className="h-12 border-b bg-background flex items-center px-4 gap-4 shrink-0">
      <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{documentTitle}</p>
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>

      <PageNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <ZoomControl zoom={zoom} onZoomChange={onZoomChange} />

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleSidebar}
        className="h-8 w-8 p-0"
      >
        {isSidebarOpen ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeftOpen className="h-4 w-4" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleFullscreen}
        className="h-8 w-8 p-0"
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
