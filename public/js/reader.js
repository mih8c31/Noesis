const Reader = {
  pdf: null,
  currentPage: 1,
  totalPages: 0,
  scale: 1.2,
  documentId: null,
  document: null,
  chatMessages: [],
  selections: [],
  activeSelection: -1,
  _keyHandler: null,

  async render(docId) {
    this.documentId = docId;
    this.currentPage = 1;
    this.totalPages = 0;
    this.chatMessages = [];
    this.selections = [];
    this.activeSelection = -1;

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
              <h3>Interacao</h3>
              <div id="selection-nav" class="selection-nav" style="display:none">
                <button id="sel-prev" class="btn btn-ghost btn-sm" title="Anterior">&laquo;</button>
                <span id="sel-counter" class="sel-counter">0/0</span>
                <button id="sel-next" class="btn btn-ghost btn-sm" title="Proximo">&raquo;</button>
                <button id="sel-clear" class="btn btn-ghost btn-sm sel-clear-btn" title="Limpar todos">Limpar</button>
              </div>
            </div>
            <div id="interaction-content" class="interaction-content">
              <div class="interaction-placeholder" id="interaction-placeholder">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="6" y="6" width="36" height="36" rx="8" stroke="currentColor" stroke-width="2"/>
                  <path d="M16 18h16M16 24h12M16 30h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p>Selecione texto no PDF para extrair trechos.</p>
                <p class="text-muted">Selecione um paragrafo e clique em "Extrair" para salvar aqui.</p>
              </div>
              <div id="selections-list" class="selections-list"></div>
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

      <div id="extract-popup" class="extract-popup" style="display:none">
        <button id="extract-btn" class="btn btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h10M2 7h7M2 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Extrair trecho
        </button>
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

    Utils.$('#sel-prev').addEventListener('click', () => this.navigateSelection(-1));
    Utils.$('#sel-next').addEventListener('click', () => this.navigateSelection(1));
    Utils.$('#sel-clear').addEventListener('click', () => this.clearSelections());

    Utils.$('#chat-send').addEventListener('click', () => this.sendChat());
    Utils.$('#chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendChat();
      }
    });

    Utils.$('#extract-btn').addEventListener('click', () => this.extractSelection());

    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.extract-popup') && !e.target.closest('.text-layer')) {
        Utils.$('#extract-popup').style.display = 'none';
      }
    });

    document.addEventListener('keydown', this._keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
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
    container.innerHTML = '';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';

    for (let i = 1; i <= this.totalPages; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-page-wrapper';
      wrapper.dataset.page = i;

      const pageLabel = document.createElement('div');
      pageLabel.className = 'pdf-page-label';
      pageLabel.textContent = i;
      wrapper.appendChild(pageLabel);

      const pageContainer = document.createElement('div');
      pageContainer.className = 'pdf-page-container';

      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page-canvas';
      pageContainer.appendChild(canvas);

      wrapper.appendChild(pageContainer);
      container.appendChild(wrapper);

      if (i < this.totalPages) {
        const sep = document.createElement('div');
        sep.className = 'pdf-page-gap';
        container.appendChild(sep);
      }

      try {
        await this._renderPageWithTextLayer(i, pageContainer, canvas);
      } catch (err) {
        console.error(`[Reader] page ${i} error:`, err);
      }
    }

    Utils.$('#pdf-loading').style.display = 'none';
    container.addEventListener('scroll', () => this._onScroll());
  },

  async _renderPageWithTextLayer(pageNum, pageContainer, canvas) {
    const page = await this.pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: this.scale });

    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    pageContainer.style.width = `${viewport.width}px`;
    pageContainer.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const textContent = await page.getTextContent();
    const textLayer = document.createElement('div');
    textLayer.className = 'text-layer';
    textLayer.dataset.page = pageNum;

    textContent.items.forEach((item) => {
      if (!item.str || !item.str.trim()) return;

      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);

      const span = document.createElement('span');
      span.textContent = item.str;
      span.className = 'text-layer-span';

      const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
      span.style.left = `${tx[4]}px`;
      span.style.top = `${tx[5] - fontSize}px`;
      span.style.fontSize = `${fontSize}px`;
      span.style.fontFamily = item.fontName ? item.fontName : 'sans-serif';

      if (item.width > 0) {
        const actualWidth = item.width * viewport.scale;
        span.style.letterSpacing = item.str.length > 1
          ? `${(actualWidth / item.str.length - fontSize * 0.5) / fontSize}em`
          : '0';
      }

      textLayer.appendChild(span);
    });

    textLayer.addEventListener('mouseup', (e) => this._onTextSelection(e, pageNum));
    pageContainer.appendChild(textLayer);
  },

  _onTextSelection(e, pageNum) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      return;
    }

    const text = sel.toString().trim();
    if (!text) return;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    sel.removeAllRanges();

    const popup = Utils.$('#extract-popup');
    popup.style.display = 'flex';
    popup.style.left = `${rect.left + rect.width / 2}px`;
    popup.style.top = `${rect.top - 8 + window.scrollY}px`;
    popup.dataset.text = text;
    popup.dataset.page = pageNum;
  },

  extractSelection() {
    const popup = Utils.$('#extract-popup');
    const text = popup.dataset.text;
    const page = parseInt(popup.dataset.page);

    if (!text) return;

    const existing = this.selections.find(s => s.text === text && s.page === page);
    if (!existing) {
      this.selections.push({
        id: Date.now(),
        text,
        page,
        timestamp: new Date().toISOString(),
      });
    }

    popup.style.display = 'none';
    window.getSelection().removeAllRanges();
    this.activeSelection = this.selections.length - 1;
    this.renderSelections();
  },

  renderSelections() {
    const list = Utils.$('#selections-list');
    const placeholder = Utils.$('#interaction-placeholder');
    const nav = Utils.$('#selection-nav');

    if (!this.selections.length) {
      if (placeholder) placeholder.style.display = '';
      if (nav) nav.style.display = 'none';
      list.innerHTML = '';
      return;
    }

    if (placeholder) placeholder.style.display = 'none';
    if (nav) nav.style.display = 'flex';

    Utils.$('#sel-counter').textContent = `${this.activeSelection + 1}/${this.selections.length}`;

    list.innerHTML = this.selections.map((sel, i) => `
      <div class="selection-card ${i === this.activeSelection ? 'selection-active' : ''}" data-index="${i}">
        <div class="selection-card-header">
          <span class="selection-page">Pag. ${sel.page}</span>
          <div class="selection-card-actions">
            <button class="btn btn-ghost btn-sm selection-goto" data-page="${sel.page}" title="Ir para pagina">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 3l3 4-3 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm selection-remove" data-index="${i}" title="Remover">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <div class="selection-card-text">${sel.text.replace(/\n/g, '<br>')}</div>
        <div class="selection-card-footer">
          <span class="selection-time">${Utils.formatDateTime(sel.timestamp)}</span>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.selection-card').forEach(card => {
      card.addEventListener('click', () => {
        this.activeSelection = parseInt(card.dataset.index);
        this.renderSelections();
        this.scrollToSelection(this.selections[this.activeSelection].page);
      });
    });

    list.querySelectorAll('.selection-goto').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.scrollToSelection(parseInt(btn.dataset.page));
      });
    });

    list.querySelectorAll('.selection-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        this.selections.splice(idx, 1);
        if (this.activeSelection >= this.selections.length) {
          this.activeSelection = Math.max(0, this.selections.length - 1);
        }
        this.renderSelections();
      });
    });

    const activeCard = list.querySelector('.selection-active');
    if (activeCard) activeCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },

  navigateSelection(dir) {
    if (!this.selections.length) return;
    this.activeSelection = (this.activeSelection + dir + this.selections.length) % this.selections.length;
    this.renderSelections();
    this.scrollToSelection(this.selections[this.activeSelection].page);
  },

  scrollToSelection(page) {
    const wrapper = Utils.$(`.pdf-page-wrapper[data-page="${page}"]`);
    if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  clearSelections() {
    this.selections = [];
    this.activeSelection = -1;
    this.renderSelections();
  },

  zoom(delta) {
    this.scale = Math.max(0.5, Math.min(3, this.scale + delta));
    Utils.$('#zoom-level').textContent = `${Math.round(this.scale * 100)}%`;
    this.renderAllPages();
  },

  scrollDown() {
    const container = Utils.$('#pdf-container');
    if (!container) return;
    container.scrollBy({ top: container.clientHeight * 0.8, behavior: 'smooth' });
  },

  scrollUp() {
    const container = Utils.$('#pdf-container');
    if (!container) return;
    container.scrollBy({ top: -container.clientHeight * 0.8, behavior: 'smooth' });
  },

  _onScroll() {
    const container = Utils.$('#pdf-container');
    if (!container) return;
    const wrappers = Utils.$$('.pdf-page-wrapper');
    if (!wrappers.length) return;

    const containerRect = container.getBoundingClientRect();
    const center = containerRect.top + containerRect.height / 2;
    let closest = 1;
    let minDist = Infinity;

    wrappers.forEach((w) => {
      const rect = w.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(mid - center);
      if (dist < minDist) {
        minDist = dist;
        closest = parseInt(w.dataset.page);
      }
    });

    if (closest !== this.currentPage) {
      this.currentPage = closest;
      this.updatePageInfo();
    }
  },

  updatePageInfo() {
    Utils.$('#page-info').textContent = `${this.currentPage} / ${this.totalPages}`;
  },

  sendChat() {
    const input = Utils.$('#chat-input');
    const text = input.value.trim();
    if (!text) return;

    this.chatMessages.push({ role: 'user', content: text });
    input.value = '';
    this.renderChatMessages();

    setTimeout(() => {
      this.chatMessages.push({
        role: 'assistant',
        content: `Esta e uma resposta placeholder para: "${text}"\n\nA integracao com IA sera implementada em uma sprint futura.`,
      });
      this.renderChatMessages();
    }, 800);
  },

  renderChatMessages() {
    const container = Utils.$('#interaction-content');
    if (!container || !this.chatMessages.length) return;

    let html = this.selections.length ? this._renderSelectionsHTML() : '';
    html += this.chatMessages.map(msg => `
      <div class="chat-message chat-${msg.role}">
        <div class="chat-avatar">${msg.role === 'user' ? 'Voce' : 'IA'}</div>
        <div class="chat-bubble">${msg.content.replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');

    container.innerHTML = html;
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
