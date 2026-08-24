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

  _headers() {
    const h = {
      'Content-Type': 'application/json',
      'apikey': this.anonKey,
    };
    if (this.session?.access_token) {
      h['Authorization'] = `Bearer ${this.session.access_token}`;
    }
    return h;
  }

  _storageHeaders() {
    const h = {
      'apikey': this.anonKey,
    };
    if (this.session?.access_token) {
      h['Authorization'] = `Bearer ${this.session.access_token}`;
    }
    return h;
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

  async signUp(email, password, fullName) {
    const res = await fetch(`${this.authUrl}/signup`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({
        email,
        password,
        data: { full_name: fullName },
      }),
    });
    const data = await res.json();
    if (data.access_token) {
      this._saveSession(data);
      return { data, error: null };
    }
    return { data: null, error: data.msg || data.error_description || 'Erro ao criar conta' };
  }

  async signIn(email, password) {
    const res = await fetch(`${this.authUrl}/token?grant_type=password`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.access_token) {
      this._saveSession(data);
      return { data, error: null };
    }
    return { data: null, error: data.msg || data.error_description || 'Erro ao fazer login' };
  }

  async signOut() {
    if (this.session?.access_token) {
      await fetch(`${this.authUrl}/logout`, {
        method: 'POST',
        headers: this._headers(),
      }).catch(() => {});
    }
    this._saveSession(null);
  }

  async refreshSession() {
    if (!this.session?.refresh_token) return false;
    const res = await fetch(`${this.authUrl}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ refresh_token: this.session.refresh_token }),
    });
    const data = await res.json();
    if (data.access_token) {
      this._saveSession(data);
      return true;
    }
    this._saveSession(null);
    return false;
  }

  from(table) {
    return new QueryBuilder(this, table);
  }

  async storageUpload(bucket, path, file) {
    const headers = this._storageHeaders();
    delete headers['Content-Type'];
    const res = await fetch(`${this.storageUrl}/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'false',
      },
      body: file,
    });
    const data = await res.json();
    if (res.ok) return { data: data.Key || path, error: null };
    return { data: null, error: data.message || 'Erro ao enviar arquivo' };
  }

  async storageGetSignedUrl(bucket, path, expiresIn = 3600) {
    const res = await fetch(`${this.storageUrl}/object/sign/${bucket}/${path}`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ expiresIn }),
    });
    const raw = await res.json();
    console.log('[Supabase] sign response:', JSON.stringify(raw));
    if (res.ok) {
      const signedUrl = raw.signedUrl || raw.url || raw.signedURL;
      if (signedUrl) return { data: `${this.storageUrl}${signedUrl}`, error: null };
      return { data: null, error: `Unexpected response: ${JSON.stringify(raw)}` };
    }
    return { data: null, error: raw.message || 'Erro ao obter URL' };
  }

  async storageDelete(bucket, path) {
    const res = await fetch(`${this.storageUrl}/object/${bucket}/${path}`, {
      method: 'DELETE',
      headers: this._storageHeaders(),
    });
    if (res.ok || res.status === 204) return { error: null };
    const data = await res.json().catch(() => ({}));
    return { error: data.message || 'Erro ao deletar' };
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

  async insert(rows) {
    const res = await fetch(`${this._client.restUrl}/${this._table}`, {
      method: 'POST',
      headers: {
        ...this._client._headers(),
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(rows),
    });
    const data = await res.json();
    if (res.ok) return { data, error: null };
    return { data: null, error: data.message || data.msg || 'Insert failed' };
  }

  async update(updates) {
    let url = `${this._client.restUrl}/${this._table}?${this._filters.join('&')}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...this._client._headers(),
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (res.ok) return { data, error: null };
    return { data: null, error: data.message || data.msg || 'Update failed' };
  }

  async delete() {
    let url = `${this._client.restUrl}/${this._table}?${this._filters.join('&')}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this._client._headers(),
    });
    if (res.ok) return { error: null };
    const data = await res.json().catch(() => ({}));
    return { error: data.message || data.msg || 'Delete failed' };
  }

  async then(resolve) {
    let url = `${this._client.restUrl}/${this._table}?select=${encodeURIComponent(this._select)}`;
    if (this._filters.length) url += `&${this._filters.join('&')}`;
    if (this._orderBy) url += `&order=${this._orderBy}`;
    if (this._limit) url += `&limit=${this._limit}`;
    if (this._range) {
      const headers = { ...this._client._headers(), Range: this._range };
      const res = await fetch(url, { headers });
      const count = res.headers.get('content-range')?.split('/')[1];
      const data = await res.json();
      resolve({ data, error: null, count: parseInt(count) || data.length });
      return;
    }
    const res = await fetch(url, { headers: this._client._headers() });
    const data = await res.json();
    if (res.ok) {
      resolve({ data, error: null });
    } else {
      resolve({ data: null, error: data.message || data.msg || 'Query failed' });
    }
  }
}

const supabase = new SupabaseClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
