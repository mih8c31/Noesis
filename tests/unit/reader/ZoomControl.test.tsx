import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControl } from '@/features/reader/components/ZoomControl';

describe('ZoomControl', () => {
  let onZoomChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onZoomChange = vi.fn();
  });

  it('should render current zoom level', () => {
    render(<ZoomControl zoom={100} onZoomChange={onZoomChange} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should call onZoomChange with next level on zoom in', () => {
    render(<ZoomControl zoom={100} onZoomChange={onZoomChange} />);
    const zoomInButton = screen.getAllByRole('button')[1];
    fireEvent.click(zoomInButton);
    expect(onZoomChange).toHaveBeenCalledWith(125);
  });

  it('should call onZoomChange with previous level on zoom out', () => {
    render(<ZoomControl zoom={100} onZoomChange={onZoomChange} />);
    const zoomOutButton = screen.getAllByRole('button')[0];
    fireEvent.click(zoomOutButton);
    expect(onZoomChange).toHaveBeenCalledWith(75);
  });

  it('should disable zoom out button at minimum level (50%)', () => {
    render(<ZoomControl zoom={50} onZoomChange={onZoomChange} />);
    const zoomOutButton = screen.getAllByRole('button')[0];
    expect(zoomOutButton).toBeDisabled();
  });

  it('should disable zoom in button at maximum level (200%)', () => {
    render(<ZoomControl zoom={200} onZoomChange={onZoomChange} />);
    const zoomInButton = screen.getAllByRole('button')[1];
    expect(zoomInButton).toBeDisabled();
  });

  it('should not call onZoomChange for zoom in when at custom zoom (not in presets)', () => {
    render(<ZoomControl zoom={90} onZoomChange={onZoomChange} />);
    const zoomInButton = screen.getAllByRole('button')[1];
    fireEvent.click(zoomInButton);
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it('should not call onZoomChange for zoom out when at custom zoom', () => {
    render(<ZoomControl zoom={90} onZoomChange={onZoomChange} />);
    const zoomOutButton = screen.getAllByRole('button')[0];
    fireEvent.click(zoomOutButton);
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it('should cycle through all zoom presets', () => {
    const presets = [50, 75, 100, 125, 150, 200];

    for (let i = 0; i < presets.length - 1; i++) {
      onZoomChange.mockClear();
      const { unmount } = render(<ZoomControl zoom={presets[i]} onZoomChange={onZoomChange} />);
      const zoomInButton = screen.getAllByRole('button')[1];
      fireEvent.click(zoomInButton);
      expect(onZoomChange).toHaveBeenCalledWith(presets[i + 1]);
      unmount();
    }
  });
});
