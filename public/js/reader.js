const Reader = {
  pdf: null,
  currentPage: 1,
  totalPages: 0,
  scale: 1.2,
  documentId: null,
  document: null,
  chatMessages: [],

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
              <canvas id="pdf-canvas"></canvas>
            </div>
            <div class="pdf-nav">
              <button id="prev-page" class="btn btn-ghost btn-sm" disabled>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3l-5 5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <span id="page-indicator" class="pdf-page-indicator">- / -</span>
              <button id="next-page" class="btn btn-ghost btn-sm" disabled>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
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
    Utils.$('#reader-back').addEventListener('click', () => router.navigate('/dashboard'));

    Utils.$('#prev-page').addEventListener('click', () => this.goToPage(this.currentPage - 1));
    Utils.$('#next-page').addEventListener('click', () => this.goToPage(this.currentPage + 1));

    Utils.$('#zoom-in').addEventListener('click', () => {
      this.scale = Math.min(this.scale + 0.2, 3);
      Utils.$('#zoom-level').textContent = `${Math.round(this.scale * 100)}%`;
      this.renderPage();
    });

    Utils.$('#zoom-out').addEventListener('click', () => {
      this.scale = Math.max(this.scale - 0.2, 0.5);
      Utils.$('#zoom-level').textContent = `${Math.round(this.scale * 100)}%`;
      this.renderPage();
    });

    Utils.$('#chat-send').addEventListener('click', () => this.sendChat());
    Utils.$('#chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendChat();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', this._keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') this.goToPage(this.currentPage - 1);
      if (e.key === 'ArrowRight') this.goToPage(this.currentPage + 1);
    });
  },

  async loadDocument() {
    const { data: doc, error } = await supabase.from('documents')
      .select('*')
      .eq('id', this.documentId)
      .then(r => r);

    if (error || !doc?.length) {
      Utils.$('#pdf-loading').innerHTML = '<p class="text-error">Documento nao encontrado.</p>';
      return;
    }

    this.document = doc[0];
    Utils.$('#reader-title').textContent = this.document.title;

    if (!this.document.file_path) {
      Utils.$('#pdf-loading').innerHTML = '<p class="text-error">Arquivo nao encontrado.</p>';
      return;
    }

    const { data: signedUrl, error: urlErr } = await supabase.storageGetSignedUrl(
      this.document.storage_bucket,
      this.document.file_path
    );

    if (urlErr || !signedUrl) {
      Utils.$('#pdf-loading').innerHTML = `<p class="text-error">Erro ao obter URL: ${urlErr}</p>`;
      return;
    }

    try {
      await this.waitForPdfjs();
      const loadingTask = pdfjsLib.getDocument({ url: signedUrl, withCredentials: false });
      this.pdf = await loadingTask.promise;
      this.totalPages = this.pdf.numPages;
      this.updatePageInfo();
      await this.renderPage();
      Utils.$('#pdf-loading').style.display = 'none';
    } catch (err) {
      Utils.$('#pdf-loading').innerHTML = `<p class="text-error">Erro ao carregar PDF: ${err.message}</p>`;
    }
  },

  async renderPage() {
    if (!this.pdf) return;

    try {
      const page = await this.pdf.getPage(this.currentPage);
      const viewport = page.getViewport({ scale: this.scale });
      const canvas = Utils.$('#pdf-canvas');
      const ctx = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error('Render error:', err);
    }
  },

  goToPage(num) {
    if (num < 1 || num > this.totalPages) return;
    this.currentPage = num;
    this.updatePageInfo();
    this.renderPage();
  },

  updatePageInfo() {
    const info = `${this.currentPage} / ${this.totalPages}`;
    Utils.$('#page-indicator').textContent = info;
    Utils.$('#page-info').textContent = info;
    Utils.$('#prev-page').disabled = this.currentPage <= 1;
    Utils.$('#next-page').disabled = this.currentPage >= this.totalPages;
  },

  sendChat() {
    const input = Utils.$('#chat-input');
    const text = input.value.trim();
    if (!text) return;

    this.chatMessages.push({ role: 'user', content: text });
    input.value = '';

    this.renderInteraction();

    // Placeholder AI response
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
    document.removeEventListener('keydown', this._keyHandler);
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
