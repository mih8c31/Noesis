import { vi, beforeEach } from 'vitest';

// Mock browser globals
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = val; },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; },
};

global.document = {
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  createElement: vi.fn((tag) => ({
    tagName: tag,
    className: '',
    innerHTML: '',
    textContent: '',
    style: {},
    attributes: {},
    children: [],
    setAttribute: vi.fn(),
    addEventListener: vi.fn(),
    appendChild: vi.fn(),
    remove: vi.fn(),
    classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() },
  })),
  body: { appendChild: vi.fn() },
  addEventListener: vi.fn(),
};

global.window = {
  location: { hash: '', origin: 'http://localhost' },
  addEventListener: vi.fn(),
  requestAnimationFrame: vi.fn(cb => cb()),
};

Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: { register: vi.fn(() => Promise.resolve()) },
  },
  writable: true,
  configurable: true,
});

global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}), headers: new Map() }));
global.Request = global.Request || vi.fn();
global.Response = global.Response || vi.fn();

// Reset between tests
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
