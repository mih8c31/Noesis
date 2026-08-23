import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReaderToolbar } from '@/features/reader/components/ReaderToolbar';

describe('ReaderToolbar', () => {
  const defaultProps = {
    documentTitle: 'Test Document',
    currentPage: 5,
    totalPages: 10,
    zoom: 100,
    progress: 50,
    isFullscreen: false,
    isSidebarOpen: true,
    onPageChange: vi.fn(),
    onZoomChange: vi.fn(),
    onBack: vi.fn(),
    onToggleFullscreen: vi.fn(),
    onToggleSidebar: vi.fn(),
  };

  it('should render document title', () => {
    render(<ReaderToolbar {...defaultProps} />);
    expect(screen.getByText('Test Document')).toBeInTheDocument();
  });

  it('should render progress percentage', () => {
    render(<ReaderToolbar {...defaultProps} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render zoom level', () => {
    render(<ReaderToolbar {...defaultProps} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should call onBack when clicking back button', () => {
    render(<ReaderToolbar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('should call onToggleSidebar when clicking sidebar button', () => {
    render(<ReaderToolbar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const sidebarButton = buttons[buttons.length - 2];
    fireEvent.click(sidebarButton);
    expect(defaultProps.onToggleSidebar).toHaveBeenCalled();
  });

  it('should call onToggleFullscreen when clicking fullscreen button', () => {
    render(<ReaderToolbar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const fullscreenButton = buttons[buttons.length - 1];
    fireEvent.click(fullscreenButton);
    expect(defaultProps.onToggleFullscreen).toHaveBeenCalled();
  });

  it('should show progress bar width as style', () => {
    render(<ReaderToolbar {...defaultProps} progress={75} />);
    const progressBar = document.querySelector('.bg-primary');
    expect(progressBar).toHaveStyle({ width: '75%' });
  });

  it('should truncate long titles', () => {
    const longTitle = 'A'.repeat(200);
    render(<ReaderToolbar {...defaultProps} documentTitle={longTitle} />);
    const titleElement = screen.getByText(longTitle);
    expect(titleElement.className).toContain('truncate');
  });
});
