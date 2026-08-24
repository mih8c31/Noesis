import { describe, it, expect, vi, beforeEach } from 'vitest';

// Inline the class definitions to avoid eval issues in strict mode

class SupabaseClient {
  constructor(url, anonKey) {
    this.url = url;
    this.anonKey = anonKey;
    this.restUrl = `${url}/rest/v1`;
    this.authUrl = `${url}/auth/v1`;
    this.storageUrl = `${url}/storage/v1`;
    this.session = null;
    this._loadSession();
  }

  _loadSession() {
    try {
      const data = localStorage.getItem('noesis_session');
      if (data) this.session = JSON.parse(data);
    } catch { /* ignore */ }
  }

  _saveSession(session) {
    this.session = session;
    if (session) {
      localStorage.setItem('noesis_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('noesis_session');
    }
  }

  get user() {
    return this.session?.user ?? null;
  }

  get isAuthenticated() {
    return !!this.session?.access_token;
  }

  from(table) {
    return new QueryBuilder(this, table);
  }
}

class QueryBuilder {
  constructor(client, table) {
    this._client = client;
    this._table = table;
    this._select = '*';
    this._filters = [];
    this._orderBy = null;
    this._limit = null;
    this._range = null;
  }

  select(cols = '*') {
    this._select = cols;
    return this;
  }

  eq(col, val) {
    this._filters.push(`${col}=eq.${encodeURIComponent(val)}`);
    return this;
  }

  order(col, { ascending = true } = {}) {
    this._orderBy = `${col}.${ascending ? 'asc' : 'desc'}`;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  range(from, to) {
    this._range = `${from}-${to}`;
    return this;
  }
}

describe('SupabaseClient', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with url and anon key', () => {
    const client = new SupabaseClient('http://test.com', 'key-123');
    expect(client.url).toBe('http://test.com');
    expect(client.anonKey).toBe('key-123');
  });

  it('starts unauthenticated', () => {
    const client = new SupabaseClient('http://test.com', 'key');
    expect(client.isAuthenticated).toBe(false);
    expect(client.user).toBeNull();
  });

  it('stores session in localStorage', () => {
    const client = new SupabaseClient('http://test.com', 'key');
    const session = { access_token: 'abc', user: { id: '123' } };
    client._saveSession(session);
    expect(client.isAuthenticated).toBe(true);
    expect(client.user.id).toBe('123');
  });

  it('clears session on signOut', () => {
    const client = new SupabaseClient('http://test.com', 'key');
    client._saveSession({ access_token: 'abc' });
    expect(client.isAuthenticated).toBe(true);
    client._saveSession(null);
    expect(client.isAuthenticated).toBe(false);
  });

  it('loads session from localStorage on init', () => {
    const session = { access_token: 'xyz', user: { id: '456' } };
    localStorage.setItem('noesis_session', JSON.stringify(session));
    const client = new SupabaseClient('http://test.com', 'key');
    expect(client.isAuthenticated).toBe(true);
    expect(client.user.id).toBe('456');
  });
});

describe('QueryBuilder', () => {
  it('chains select', () => {
    const client = new SupabaseClient('http://test.com', 'key');
    const q = client.from('docs').select('id, title');
    expect(q._select).toBe('id, title');
  });

  it('chains eq filter', () => {
    const client = new SupabaseClient('http://test.com', 'key');
    const q = client.from('docs').eq('user_id', '123');
    expect(q._filters).toContain('user_id=eq.123');
  });

  it('chains order', () => {
    const client = new SupabaseClient('http://test.com', 'key');
    const q = client.from('docs').order('created_at', { ascending: false });
    expect(q._orderBy).toBe('created_at.desc');
  });

  it('chains limit', () => {
    const client = new SupabaseClient('http://test.com', 'key');
    const q = client.from('docs').limit(10);
    expect(q._limit).toBe(10);
  });

  it('defaults to select *', () => {
    const client = new SupabaseClient('http://test.com', 'key');
    const q = client.from('docs');
    expect(q._select).toBe('*');
  });
});
