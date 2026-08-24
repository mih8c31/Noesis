const Reader = {
  pdf: null,
  currentPage: 1,
  totalPages: 0,
  scale: 1.2,
  documentId: null,
  document: null,
  chatMessages: [],
  _keyHandler: null,
  _wheelHandler: null,

  async render(docId) {
    this.documentId = docId;
    this.currentPage = 1;
    this.totalPages = 0;
    this.chatMessages = [];

    const app = Utils.$('#app');
    app.innerHTML = `
      <div class="reader">
        <header class="reader-header">
          <button id="reader-back" class="btn btn-ghost btn-sm" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Voltar</span>
          </button>
          <h2 id="reader-title" class="reader-title">Carregando...</h2>
          <div class="reader-controls">
            <button id="zoom-out" class="btn btn-ghost btn-sm" title="Diminuir zoom">-</button>
            <span id="zoom-level" class="reader-zoom">120%</span>
            <button id="zoom-in" class="btn btn-ghost btn-sm" title="Aumentar zoom">+</button>
            <span id="page-info" class="reader-page-info">- / -</span>
          </div>
        </header>

        <div class="reader-body">
          <div class="reader-pdf-panel">
            <div id="pdf-container" class="pdf-container">
              <div id="pdf-loading" class="pdf-loading">
                <div class="spinner"></div>
                <p>Carregando PDF...</p>
              </div>
            </div>
          </div>

          <div class="reader-interaction-panel">
            <div class="interaction-header">
              <h3>Interação</h3>
            </div>
            <div id="interaction-content" class="interaction-content">
              <div class="interaction-placeholder">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="6" y="6" width="36" height="36" rx="8" stroke="currentColor" stroke-width="2"/>
                  <path d="M16 18h16M16 24h12M16 30h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p>Selecione uma pagina para interagir com o conteudo.</p>
                <p class="text-muted">Use o chat abaixo para fazer perguntas sobre o documento.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="reader-chat-bar">
          <div class="chat-input-container">
            <input type="text" id="chat-input" class="chat-input" placeholder="Pergunte sobre o documento..." autocomplete="off">
            <button id="chat-send" class="btn btn-primary btn-sm chat-send-btn" title="Enviar">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l12-6-6 12-2-6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.loadDocument();
  },

  bindEvents() {
    Utils.$('#reader-back').addEventListener('click', () => {
      this.destroy();
      router.navigate('/dashboard');
    });

    Utils.$('#zoom-in').addEventListener('click', () => this.zoom(0.2));
    Utils.$('#zoom-out').addEventListener('click', () => this.zoom(-0.2));

    Utils.$('#chat-send').addEventListener('click', () => this.sendChat());
    Utils.$('#chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendChat();
      }
    });

    document.addEventListener('keydown', this._keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const container = Utils.$('#pdf-container');
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        this.scrollDown();
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        this.scrollUp();
      }
    });
  },

  scrollDown() {
    const container = Utils.$('#pdf-container');
    if (!container) return;
    const pageH = this._getPageHeight();
    container.scrollBy({ top: pageH, behavior: 'smooth' });
  },

  scrollUp() {
    const container = Utils.$('#pdf-container');
    if (!container) return;
    const pageH = this._getPageHeight();
    container.scrollBy({ top: -pageH, behavior: 'smooth' });
  },

  _getPageHeight() {
    if (!this.pdf) return 400;
    const canvas = Utils.$('.pdf-page-canvas');
    return canvas ? canvas.offsetHeight + 12 : 400;
  },

  zoom(delta) {
    this.scale = Math.max(0.5, Math.min(3, this.scale + delta));
    Utils.$('#zoom-level').textContent = `${Math.round(this.scale * 100)}%`;
    this.renderAllPages();
  },

  _status(msg) {
    console.log('[Reader]', msg);
    const el = Utils.$('#pdf-loading');
    if (el) {
      const p = el.querySelector('p');
      if (p) p.textContent = msg;
    }
  },

  async loadDocument() {
    this._status('Buscando documento...');
    const { data: doc, error } = await supabase.from('documents')
      .select('*')
      .eq('id', this.documentId);

    if (error || !doc?.length) {
      Utils.$('#pdf-loading').innerHTML = `<p class="text-error">Documento nao encontrado: ${error || ''}</p>`;
      return;
    }

    this.document = doc[0];
    Utils.$('#reader-title').textContent = this.document.title;

    if (!this.document.file_path) {
      Utils.$('#pdf-loading').innerHTML = '<p class="text-error">Arquivo nao encontrado.</p>';
      return;
    }

    this._status('Obtendo URL assinada...');
    const { data: signedUrl, error: urlErr } = await supabase.storageGetSignedUrl(
      this.document.storage_bucket,
      this.document.file_path
    );

    if (urlErr || !signedUrl) {
      Utils.$('#pdf-loading').innerHTML = `<p class="text-error">Erro ao obter URL: ${urlErr}</p>`;
      return;
    }

    this._status('Carregando pdf.js...');
    try {
      await this.waitForPdfjs();
    } catch (e) {
      Utils.$('#pdf-loading').innerHTML = `<p class="text-error">pdf.js nao carregou: ${e.message}</p>`;
      return;
    }

    this._status('Baixando PDF...');
    let arrayBuf;
    try {
      const res = await fetch(signedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      arrayBuf = await res.arrayBuffer();
    } catch (e) {
      Utils.$('#pdf-loading').innerHTML = `<p class="text-error">Falha ao baixar PDF: ${e.message}</p>`;
      return;
    }

    this._status('Renderizando PDF...');
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuf });
      this.pdf = await loadingTask.promise;
      this.totalPages = this.pdf.numPages;
      this.currentPage = 1;
      this.updatePageInfo();
      await this.renderAllPages();
    } catch (err) {
      console.error('[Reader] render error:', err);
      Utils.$('#pdf-loading').innerHTML = `<p class="text-error">Erro ao renderizar: ${err.message}</p>`;
    }
  },

  async renderAllPages() {
    if (!this.pdf) return;

    const container = Utils.$('#pdf-container');
    const loading = Utils.$('#pdf-loading');

    container.innerHTML = '';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';

    const gap = 12;
    for (let i = 1; i <= this.totalPages; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-page-wrapper';
      wrapper.dataset.page = i;

      const pageLabel = document.createElement('div');
      pageLabel.className = 'pdf-page-label';
      pageLabel.textContent = i;
      wrapper.appendChild(pageLabel);

      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page-canvas';
      wrapper.appendChild(canvas);

      container.appendChild(wrapper);

      if (i < this.totalPages) {
        const sep = document.createElement('div');
        sep.className = 'pdf-page-gap';
        sep.style.height = `${gap}px`;
        container.appendChild(sep);
      }

      try {
        await this._renderPageOnCanvas(i, canvas);
      } catch (err) {
        console.error(`[Reader] page ${i} error:`, err);
      }
    }

    if (loading) loading.style.display = 'none';

    container.addEventListener('scroll', () => this._onScroll());
  },

  async _renderPageOnCanvas(pageNum, canvas) {
    const page = await this.pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: this.scale });

    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    await page.render({ canvasContext: ctx, viewport }).promise;
  },

  _onScroll() {
    const container = Utils.$('#pdf-container');
    if (!container) return;

    const canvases = Utils.$$('.pdf-page-canvas');
    if (!canvases.length) return;

    const containerRect = container.getBoundingClientRect();
    const center = containerRect.top + containerRect.height / 2;

    let closest = 1;
    let minDist = Infinity;

    canvases.forEach((canvas, i) => {
      const rect = canvas.getBoundingClientRect();
      const canvasCenter = rect.top + rect.height / 2;
      const dist = Math.abs(canvasCenter - center);
      if (dist < minDist) {
        minDist = dist;
        closest = i + 1;
      }
    });

    if (closest !== this.currentPage) {
      this.currentPage = closest;
      this.updatePageInfo();
    }
  },

  updatePageInfo() {
    const info = `${this.currentPage} / ${this.totalPages}`;
    Utils.$('#page-info').textContent = info;
  },

  sendChat() {
    const input = Utils.$('#chat-input');
    const text = input.value.trim();
    if (!text) return;

    this.chatMessages.push({ role: 'user', content: text });
    input.value = '';

    this.renderInteraction();

    setTimeout(() => {
      this.chatMessages.push({
        role: 'assistant',
        content: `Esta e uma resposta placeholder para: "${text}"\n\nA integracao com IA sera implementada em uma sprint futura.`,
      });
      this.renderInteraction();
    }, 800);
  },

  renderInteraction() {
    const container = Utils.$('#interaction-content');
    if (!container) return;

    container.innerHTML = this.chatMessages.map(msg => `
      <div class="chat-message chat-${msg.role}">
        <div class="chat-avatar">${msg.role === 'user' ? 'Voce' : 'IA'}</div>
        <div class="chat-bubble">${msg.content.replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  },

  destroy() {
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    this.pdf = null;
  },

  waitForPdfjs(timeout = 10000) {
    if (window.pdfjsLib) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (window.pdfjsLib) return resolve();
        if (Date.now() - start > timeout) return reject(new Error('pdf.js timeout'));
        requestAnimationFrame(check);
      };
      window.addEventListener('pdfjs-ready', () => resolve(), { once: true });
      check();
    });
  },
};
