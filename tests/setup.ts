import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('pdfjs-dist', () => ({
  version: '4.0.0',
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getTextContent: vi.fn().mockResolvedValue({ items: [] }),
      }),
    }),
  }),
}));
