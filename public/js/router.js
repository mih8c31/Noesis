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

const router = new Router();
