const Reader = {
  pdf: null,
  currentPage: 1,
  totalPages: 0,
  scale: 1.2,
  documentId: null,
  document: null,
  chatMessages: [],
  extracts: [],
  activeExtract: -1,
  _keyHandler: null,
  _selecting: false,
  _selStart: null,
  _selRect: null,

  async render(docId) {
    this.documentId = docId;
    this.currentPage = 1;
    this.totalPages = 0;
    this.chatMessages = [];
    this.extracts = [];
    this.activeExtract = -1;
    this._selecting = false;
    this._selStart = null;
    this._selRect = null;

    const app = Utils.$('#app');
    app.innerHTML = `
      <div class="reader-layout">
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
          <!-- PDF Viewer -->
          <div class="reader-panel reader-pdf-panel">
            <div class="panel-label">PDF</div>
            <div id="pdf-container" class="pdf-container">
              <div id="pdf-loading" class="pdf-loading">
                <div class="spinner"></div>
                <p>Carregando PDF...</p>
              </div>
            </div>
          </div>

          <!-- Extracted Text -->
          <div class="reader-panel reader-extract-panel">
            <div class="panel-label">
              Texto Extraido
              <span id="extract-count" class="extract-count"></span>
            </div>
            <div id="extract-content" class="extract-content">
              <div class="extract-placeholder">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="4" y="4" width="32" height="32" rx="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 2"/>
                  <path d="M12 14h16M12 20h16M12 26h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p>Arraste sobre o PDF para selecionar uma area</p>
                <p class="text-muted">O texto da area sera extraido automaticamente</p>
              </div>
            </div>
          </div>

          <!-- Chat -->
          <div class="reader-panel reader-chat-panel">
            <div class="panel-label">Chat</div>
            <div id="chat-messages" class="chat-messages">
              <div class="chat-empty">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M6 8a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H12l-4 4v-4H8a2 2 0 01-2-2V8z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <p>Pergunte sobre o documento</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Floating Chat Input -->
        <div class="reader-chat-float">
          <div class="chat-float-inner">
            <textarea id="chat-input" class="chat-input" placeholder="Pergunte sobre o documento..." rows="1"></textarea>
            <button id="chat-send" class="btn btn-primary btn-sm chat-send-btn" title="Enviar">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l12-6-6 12-2-6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>

        <!-- Selection overlay (created dynamically) -->
        <div id="selection-overlay" class="selection-overlay" style="display:none"></div>
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
    const chatInput = Utils.$('#chat-input');
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendChat();
      }
    });
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    document.addEventListener('keydown', this._keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const container = Utils.$('#pdf-container');
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        container.scrollBy({ top: container.clientHeight * 0.8, behavior: 'smooth' });
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        container.scrollBy({ top: -container.clientHeight * 0.8, behavior: 'smooth' });
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
      Utils.$('#pdf-loading').innerHTML = `<p class="text-error">Documento nao encontrado</p>`;
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
      pageContainer.dataset.page = i;

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

    this._initAreaSelection();
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
      if (item.fontName) span.style.fontFamily = item.fontName;

      if (item.width > 0) {
        const actualWidth = item.width * viewport.scale;
        span.style.letterSpacing = item.str.length > 1
          ? `${(actualWidth / item.str.length - fontSize * 0.5) / fontSize}em`
          : '0';
      }

      span.dataset.text = item.str;
      textLayer.appendChild(span);
    });

    pageContainer.appendChild(textLayer);
  },

  /* ==========================================
     AREA SELECTION
     ========================================== */
  _initAreaSelection() {
    if (this._selHandler) {
      document.removeEventListener('mousemove', this._selHandler.onMove);
      document.removeEventListener('mouseup', this._selHandler.onUp);
    }

    const pages = Utils.$$('.pdf-page-container');
    pages.forEach((pageContainer) => {
      pageContainer.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();

        const rect = pageContainer.getBoundingClientRect();
        this._selecting = true;
        this._selStart = {
          x: e.clientX,
          y: e.clientY,
          pageContainer,
          pageRect: rect,
        };

        const overlay = Utils.$('#selection-overlay');
        overlay.style.display = 'none';
        overlay.innerHTML = '';
      });
    });

    const onMove = (e) => {
      if (!this._selecting) return;

      const { pageRect } = this._selStart;
      const overlay = Utils.$('#selection-overlay');

      const x1 = Math.max(pageRect.left, Math.min(this._selStart.x, e.clientX));
      const y1 = Math.max(pageRect.top, Math.min(this._selStart.y, e.clientY));
      const x2 = Math.min(pageRect.right, Math.max(this._selStart.x, e.clientX));
      const y2 = Math.min(pageRect.bottom, Math.max(this._selStart.y, e.clientY));

      const drawW = x2 - x1;
      const drawH = y2 - y1;

      if (drawW < 3 || drawH < 3) return;

      overlay.style.display = 'block';
      overlay.style.left = `${x1}px`;
      overlay.style.top = `${y1}px`;
      overlay.style.width = `${drawW}px`;
      overlay.style.height = `${drawH}px`;
      overlay.innerHTML = `<div class="sel-rect" style="width:100%;height:100%"></div>`;
    };

    const onUp = (e) => {
      if (!this._selecting) return;
      this._selecting = false;

      const overlay = Utils.$('#selection-overlay');
      const { pageContainer, pageRect, x: startX, y: startY } = this._selStart;

      overlay.style.display = 'none';
      overlay.innerHTML = '';

      const x1 = Math.max(pageRect.left, Math.min(startX, e.clientX));
      const y1 = Math.max(pageRect.top, Math.min(startY, e.clientY));
      const x2 = Math.min(pageRect.right, Math.max(startX, e.clientX));
      const y2 = Math.min(pageRect.bottom, Math.max(startY, e.clientY));

      const drawW = x2 - x1;
      const drawH = y2 - y1;
      if (drawW < 10 || drawH < 10) return;

      const localX = x1 - pageRect.left;
      const localY = y1 - pageRect.top;

      const pageNum = parseInt(pageContainer.dataset.page);
      this._extractTextFromArea(pageContainer, localX, localY, drawW, drawH, pageNum);
    };

    this._selHandler = { onMove, onUp };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  },

  _extractTextFromArea(pageContainer, selX, selY, selW, selH, pageNum) {
    const textLayer = pageContainer.querySelector('.text-layer');
    if (!textLayer) return;

    const spans = textLayer.querySelectorAll('.text-layer-span');
    const selectedSpans = [];

    spans.forEach((span) => {
      const spanRect = {
        left: parseFloat(span.style.left),
        top: parseFloat(span.style.top),
        right: parseFloat(span.style.left) + span.offsetWidth,
        bottom: parseFloat(span.style.top) + span.offsetHeight,
      };

      const overlaps =
        spanRect.left < selX + selW &&
        spanRect.right > selX &&
        spanRect.top < selY + selH &&
        spanRect.bottom > selY;

      if (overlaps && span.dataset.text) {
        selectedSpans.push({
          text: span.dataset.text,
          top: spanRect.top,
          left: spanRect.left,
        });
      }
    });

    if (!selectedSpans.length) return;

    selectedSpans.sort((a, b) => a.top - b.top || a.left - b.left);

    let result = '';
    let lastTop = -Infinity;
    selectedSpans.forEach((s) => {
      if (Math.abs(s.top - lastTop) > 5) {
        if (result) result += '\n';
      } else {
        result += ' ';
      }
      result += s.text;
      lastTop = s.top;
    });

    if (!result.trim()) return;

    this.extracts.push({
      id: Date.now(),
      text: result.trim(),
      page: pageNum,
      timestamp: new Date().toISOString(),
    });

    this.activeExtract = this.extracts.length - 1;
    this.renderExtracts();
  },

  renderExtracts() {
    const container = Utils.$('#extract-content');
    const count = Utils.$('#extract-count');

    if (!this.extracts.length) {
      container.innerHTML = `
        <div class="extract-placeholder">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="4" y="4" width="32" height="32" rx="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 2"/>
            <path d="M12 14h16M12 20h16M12 26h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <p>Arraste sobre o PDF para selecionar uma area</p>
          <p class="text-muted">O texto da area sera extraido automaticamente</p>
        </div>
      `;
      count.textContent = '';
      return;
    }

    count.textContent = `(${this.extracts.length})`;

    container.innerHTML = this.extracts.map((ext, i) => `
      <div class="extract-card ${i === this.activeExtract ? 'extract-active' : ''}" data-index="${i}">
        <div class="extract-card-header">
          <span class="extract-page">Pag. ${ext.page}</span>
          <div class="extract-card-actions">
            <button class="btn btn-ghost btn-sm extract-goto" data-page="${ext.page}" title="Ir para pagina">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 3l3 4-3 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm extract-copy" data-index="${i}" title="Copiar">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M10 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v6a1 1 0 001 1h1" stroke="currentColor" stroke-width="1.2"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm extract-remove" data-index="${i}" title="Remover">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <div class="extract-card-text">${ext.text.replace(/\n/g, '<br>')}</div>
        <div class="extract-card-footer">
          <span class="extract-time">${Utils.formatDateTime(ext.timestamp)}</span>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.extract-card').forEach(card => {
      card.addEventListener('click', () => {
        this.activeExtract = parseInt(card.dataset.index);
        this.renderExtracts();
        this._scrollToPage(this.extracts[this.activeExtract].page);
      });
    });

    container.querySelectorAll('.extract-goto').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._scrollToPage(parseInt(btn.dataset.page));
      });
    });

    container.querySelectorAll('.extract-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ext = this.extracts[parseInt(btn.dataset.index)];
        navigator.clipboard.writeText(ext.text).catch(() => {});
      });
    });

    container.querySelectorAll('.extract-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.extracts.splice(parseInt(btn.dataset.index), 1);
        if (this.activeExtract >= this.extracts.length) {
          this.activeExtract = Math.max(0, this.extracts.length - 1);
        }
        this.renderExtracts();
      });
    });

    const active = container.querySelector('.extract-active');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },

  _scrollToPage(page) {
    const wrapper = Utils.$(`.pdf-page-wrapper[data-page="${page}"]`);
    if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  zoom(delta) {
    this.scale = Math.max(0.5, Math.min(3, this.scale + delta));
    Utils.$('#zoom-level').textContent = `${Math.round(this.scale * 100)}%`;
    this.renderAllPages();
  },

  /* ==========================================
     CHAT
     ========================================== */
  sendChat() {
    const input = Utils.$('#chat-input');
    const text = input.value.trim();
    if (!text) return;

    const contextText = this.extracts.map(e => e.text).join('\n\n---\n\n');

    this.chatMessages.push({
      role: 'user',
      content: text,
      context: contextText || null,
    });
    input.value = '';
    input.style.height = 'auto';
    this.renderChat();

    setTimeout(() => {
      let reply = `Esta e uma resposta placeholder para: "${text}"`;
      if (contextText) {
        reply += `\n\nContexto extraido do PDF:\n"${contextText.substring(0, 200)}..."`;
      }
      reply += `\n\nA integracao com IA sera implementada em uma sprint futura.`;
      this.chatMessages.push({ role: 'assistant', content: reply });
      this.renderChat();
    }, 800);
  },

  renderChat() {
    const container = Utils.$('#chat-messages');
    if (!container) return;

    if (!this.chatMessages.length) {
      container.innerHTML = `
        <div class="chat-empty">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 8a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H12l-4 4v-4H8a2 2 0 01-2-2V8z" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <p>Pergunte sobre o documento</p>
        </div>
      `;
      return;
    }

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
    if (this._selHandler) {
      document.removeEventListener('mousemove', this._selHandler.onMove);
      document.removeEventListener('mouseup', this._selHandler.onUp);
    }
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
