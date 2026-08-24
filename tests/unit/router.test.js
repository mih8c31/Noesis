import { describe, it, expect, vi, beforeEach } from 'vitest';

class Router {
  constructor() {
    this.routes = {};
    this.current = null;
    window.addEventListener('hashchange', () => this.navigate());
  }

  on(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  navigate(path) {
    if (path) {
      window.location.hash = path;
      return;
    }
    const hash = window.location.hash.slice(1) || '/';
    const route = this.routes[hash];
    if (route) {
      this.current = hash;
      route();
    } else if (this.routes['*']) {
      this.routes['*']();
    }
  }

  get currentPath() {
    return window.location.hash.slice(1) || '/';
  }
}

describe('Router', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('creates a router instance', () => {
    const r = new Router();
    expect(r).toBeDefined();
    expect(typeof r.on).toBe('function');
    expect(typeof r.navigate).toBe('function');
  });

  it('registers routes', () => {
    const r = new Router();
    const handler = vi.fn();
    r.on('/test', handler);
    expect(r.routes['/test']).toBe(handler);
  });

  it('returns current path from hash', () => {
    window.location.hash = '#/dashboard';
    const r = new Router();
    expect(r.currentPath).toBe('/dashboard');
  });

  it('defaults to / when no hash', () => {
    window.location.hash = '';
    const r = new Router();
    expect(r.currentPath).toBe('/');
  });

  it('navigate with arg sets hash', () => {
    const r = new Router();
    r.navigate('/login');
    expect(window.location.hash).toBe('#/login');
  });
});
