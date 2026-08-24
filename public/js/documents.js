const Documents = {
  documents: [],

  renderDashboard() {
    const app = Utils.$('#app');
    app.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <div class="dashboard-brand">
            <svg class="brand-icon" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2"/>
              <path d="M12 28V12h6c3 0 5 1.5 5 4s-2 4-5 4h-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 20h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>Noesis</span>
          </div>
          <div class="dashboard-user">
            <span id="user-name" class="user-name"></span>
            <button id="btn-logout" class="btn btn-ghost btn-sm">Sair</button>
          </div>
        </header>

        <main class="dashboard-content">
          <div class="dashboard-toolbar">
            <h2>Meus Documentos</h2>
            <button id="btn-upload" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Enviar PDF
            </button>
          </div>

          <div id="upload-zone" class="upload-zone" style="display:none">
            <div class="upload-zone-inner">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
                <path d="M24 18v12M18 24h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <p>Arraste um PDF aqui ou <label for="file-input" class="upload-link">selecione um arquivo</label></p>
              <input type="file" id="file-input" accept=".pdf" hidden>
              <div id="upload-progress" class="upload-progress" style="display:none">
                <div class="progress-bar"><div id="progress-fill" class="progress-fill"></div></div>
                <span id="progress-text">Enviando...</span>
              </div>
            </div>
          </div>

          <div id="documents-grid" class="documents-grid">
            <div class="documents-loading">
              <div class="spinner"></div>
              <p>Carregando documentos...</p>
            </div>
          </div>

          <div id="documents-empty" class="documents-empty" style="display:none">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="4" width="48" height="56" rx="6" stroke="currentColor" stroke-width="2"/>
              <path d="M20 20h24M20 28h24M20 36h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <h3>Nenhum documento</h3>
            <p>Envie seu primeiro PDF para comecar.</p>
          </div>
        </main>
      </div>
    `;

    this.bindEvents();
    this.loadDocuments();
  },

  bindEvents() {
    const user = supabase.user;
    if (user) {
      Utils.$('#user-name').textContent = user.user_metadata?.full_name || user.email;
    }

    Utils.$('#btn-logout').addEventListener('click', async () => {
      await supabase.signOut();
      router.navigate('/login');
    });

    Utils.$('#btn-upload').addEventListener('click', () => {
      const zone = Utils.$('#upload-zone');
      zone.style.display = zone.style.display === 'none' ? '' : 'none';
    });

    const fileInput = Utils.$('#file-input');
    const zone = Utils.$('#upload-zone');

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('upload-zone-drag');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('upload-zone-drag');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('upload-zone-drag');
      const file = e.dataTransfer.files[0];
      if (file) this.uploadFile(file);
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.uploadFile(file);
      fileInput.value = '';
    });
  },

  async uploadFile(file) {
    const progressEl = Utils.$('#upload-progress');
    const fillEl = Utils.$('#progress-fill');
    const textEl = Utils.$('#progress-text');

    progressEl.style.display = '';
    fillEl.style.width = '20%';
    textEl.textContent = 'Validando...';

    await new Promise(r => setTimeout(r, 200));
    fillEl.style.width = '40%';
    textEl.textContent = 'Enviando para o servidor...';

    const doc = await Upload.handleFile(file);

    if (doc) {
      fillEl.style.width = '100%';
      textEl.textContent = 'Concluido!';
      Utils.showToast('Documento enviado com sucesso!', 'success');
      this.documents.unshift(doc);
      this.renderDocuments();
      setTimeout(() => {
        progressEl.style.display = 'none';
        fillEl.style.width = '0%';
        Utils.$('#upload-zone').style.display = 'none';
      }, 1000);
    } else {
      progressEl.style.display = 'none';
    }
  },

  async loadDocuments() {
    const user = supabase.user;
    if (!user) return;

    const { data, error } = await supabase.from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      Utils.showToast('Erro ao carregar documentos', 'error');
      return;
    }

    this.documents = data || [];
    this.renderDocuments();
  },

  renderDocuments() {
    const grid = Utils.$('#documents-grid');
    const empty = Utils.$('#documents-empty');

    if (!this.documents.length) {
      grid.style.display = 'none';
      empty.style.display = '';
      return;
    }

    grid.style.display = '';
    empty.style.display = 'none';

    grid.innerHTML = this.documents.map(doc => `
      <div class="doc-card" data-id="${doc.id}">
        <div class="doc-card-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="2" width="24" height="28" rx="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 10h12M10 15h12M10 20h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="doc-card-info">
          <h3 class="doc-card-title">${doc.title}</h3>
          <div class="doc-card-meta">
            <span class="doc-card-size">${Utils.formatFileSize(doc.file_size)}</span>
            <span class="doc-card-date">${Utils.formatDate(doc.created_at)}</span>
          </div>
          <span class="doc-card-status doc-status-${doc.status}">${doc.status === 'ready' ? 'Pronto' : doc.status === 'processing' ? 'Processando' : doc.status === 'error' ? 'Erro' : 'Enviando'}</span>
        </div>
        <button class="doc-card-open" data-id="${doc.id}" title="Abrir leitor">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `).join('');

    Utils.$$('.doc-card', grid).forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.doc-card-delete')) return;
        const id = card.dataset.id;
        router.navigate(`/reader/${id}`);
      });
    });
  },
};
