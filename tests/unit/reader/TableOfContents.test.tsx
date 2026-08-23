import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableOfContents } from '@/features/reader/components/TableOfContents';

describe('TableOfContents', () => {
  const mockItems = [
    { title: 'Introdução', pageNumber: 1 },
    { title: 'Metodologia', pageNumber: 5 },
    { title: 'Resultados', pageNumber: 15 },
    { title: 'Conclusão', pageNumber: 25 },
  ];

  const defaultProps = {
    items: mockItems,
    currentPage: 1,
    onTocClick: vi.fn(),
  };

  it('should show empty state when no items exist', () => {
    render(<TableOfContents {...defaultProps} items={[]} />);
    expect(screen.getByText('Nenhuma tabela de conteúdo disponível.')).toBeInTheDocument();
  });

  it('should render all TOC items', () => {
    render(<TableOfContents {...defaultProps} />);
    expect(screen.getByText('Introdução')).toBeInTheDocument();
    expect(screen.getByText('Metodologia')).toBeInTheDocument();
    expect(screen.getByText('Resultados')).toBeInTheDocument();
    expect(screen.getByText('Conclusão')).toBeInTheDocument();
  });

  it('should call onTocClick with correct page number when clicking an item', () => {
    render(<TableOfContents {...defaultProps} />);
    fireEvent.click(screen.getByText('Metodologia'));
    expect(defaultProps.onTocClick).toHaveBeenCalledWith(5);
  });

  it('should show page numbers for each item', () => {
    render(<TableOfContents {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should highlight the item matching current page', () => {
    render(<TableOfContents {...defaultProps} currentPage={5} />);
    const item = screen.getByText('Metodologia').closest('div')!;
    expect(item.className).toContain('bg-primary/10');
  });

  it('should not highlight items on different pages', () => {
    render(<TableOfContents {...defaultProps} currentPage={3} />);
    const item = screen.getByText('Metodologia').closest('div')!;
    expect(item.className).not.toContain('bg-primary/10');
  });
});
