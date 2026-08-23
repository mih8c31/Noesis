import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageNavigation } from '@/features/reader/components/PageNavigation';

describe('PageNavigation', () => {
  let onPageChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onPageChange = vi.fn();
  });

  const defaultProps = {
    currentPage: 5,
    totalPages: 10,
    onPageChange: vi.fn(),
  };

  it('should render current page and total pages', () => {
    render(<PageNavigation currentPage={5} totalPages={10} onPageChange={onPageChange} />);
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByText('de')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should call onPageChange with previous page when clicking left arrow', () => {
    render(<PageNavigation currentPage={5} totalPages={10} onPageChange={onPageChange} />);
    const prevButton = screen.getAllByRole('button')[0];
    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('should call onPageChange with next page when clicking right arrow', () => {
    render(<PageNavigation currentPage={5} totalPages={10} onPageChange={onPageChange} />);
    const nextButton = screen.getAllByRole('button')[1];
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  it('should disable previous button on first page', () => {
    render(<PageNavigation currentPage={1} totalPages={10} onPageChange={onPageChange} />);
    const prevButton = screen.getAllByRole('button')[0];
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    render(<PageNavigation currentPage={10} totalPages={10} onPageChange={onPageChange} />);
    const nextButton = screen.getAllByRole('button')[1];
    expect(nextButton).toBeDisabled();
  });

  it('should call onPageChange when typing a valid page number', () => {
    render(<PageNavigation currentPage={5} totalPages={10} onPageChange={onPageChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '3' } });
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('should not call onPageChange when typing an invalid page number (0)', () => {
    render(<PageNavigation currentPage={5} totalPages={10} onPageChange={onPageChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '0' } });
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('should not call onPageChange when typing a page number beyond total', () => {
    render(<PageNavigation currentPage={5} totalPages={10} onPageChange={onPageChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '11' } });
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('should not call onPageChange for non-numeric input', () => {
    render(<PageNavigation currentPage={5} totalPages={10} onPageChange={onPageChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
