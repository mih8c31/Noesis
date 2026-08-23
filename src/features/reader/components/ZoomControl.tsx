import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/core/ui/ui/button';

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const ZOOM_OPTIONS = [50, 75, 100, 125, 150, 200];

export function ZoomControl({ zoom, onZoomChange }: ZoomControlProps) {
  const handleZoomIn = () => {
    const currentIndex = ZOOM_OPTIONS.indexOf(zoom);
    if (currentIndex >= 0 && currentIndex < ZOOM_OPTIONS.length - 1) {
      onZoomChange(ZOOM_OPTIONS[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_OPTIONS.indexOf(zoom);
    if (currentIndex > 0) {
      onZoomChange(ZOOM_OPTIONS[currentIndex - 1]);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomOut}
        disabled={zoom <= ZOOM_OPTIONS[0]}
        className="h-8 w-8 p-0"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomIn}
        disabled={zoom >= ZOOM_OPTIONS[ZOOM_OPTIONS.length - 1]}
        className="h-8 w-8 p-0"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  );
}
