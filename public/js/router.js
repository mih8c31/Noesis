class Router {
  constructor() {
    this.routes = [];
    this.current = null;
    window.addEventListener('hashchange', () => this.navigate());
  }

  on(pattern, handler) {
    this.routes.push({ pattern, handler });
    return this;
  }

  navigate(path) {
    if (path) {
      window.location.hash = path;
      return;
    }
    const hash = window.location.hash.slice(1) || '/';

    for (const route of this.routes) {
      const params = this._match(route.pattern, hash);
      if (params !== null) {
        this.current = hash;
        this.currentParams = params;
        route.handler(params);
        return;
      }
    }

    if (this._match('*', hash)) {
      this.current = hash;
      this.routes.find(r => r.pattern === '*')?.handler({});
    }
  }

  _match(pattern, hash) {
    if (pattern === '*') return pattern === hash ? {} : null;
    const patternParts = pattern.split('/').filter(Boolean);
    const hashParts = hash.split('/').filter(Boolean);
    if (patternParts.length !== hashParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = hashParts[i];
      } else if (patternParts[i] !== hashParts[i]) {
        return null;
      }
    }
    return params;
  }

  get currentPath() {
    return window.location.hash.slice(1) || '/';
  }
}

const router = new Router();
