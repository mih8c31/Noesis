const Auth = {
  init() {
    if (supabase.isAuthenticated) {
      router.navigate('/dashboard');
    } else {
      this.renderLogin();
    }
  },

  renderLogin() {
    const app = Utils.$('#app');
    app.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <svg class="auth-logo" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2"/>
              <path d="M12 28V12h6c3 0 5 1.5 5 4s-2 4-5 4h-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 20h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <h1>Noesis</h1>
            <p class="auth-subtitle">Plataforma de pesquisa cientifica com IA</p>
          </div>

          <div id="auth-tabs" class="auth-tabs">
            <button class="auth-tab active" data-tab="login">Entrar</button>
            <button class="auth-tab" data-tab="register">Criar conta</button>
          </div>

          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" placeholder="seu@email.com" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="login-password">Senha</label>
              <input type="password" id="login-password" placeholder="Sua senha" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary btn-full">Entrar</button>
            <div id="login-error" class="form-error"></div>
          </form>

          <form id="register-form" class="auth-form" style="display:none">
            <div class="form-group">
              <label for="reg-name">Nome completo</label>
              <input type="text" id="reg-name" placeholder="Seu nome" required>
            </div>
            <div class="form-group">
              <label for="reg-email">Email</label>
              <input type="email" id="reg-email" placeholder="seu@email.com" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="reg-password">Senha</label>
              <input type="password" id="reg-password" placeholder="Minimo 6 caracteres" required minlength="6" autocomplete="new-password">
            </div>
            <div class="form-group">
              <label for="reg-password2">Confirmar senha</label>
              <input type="password" id="reg-password2" placeholder="Repita a senha" required minlength="6" autocomplete="new-password">
            </div>
            <button type="submit" class="btn btn-primary btn-full">Criar conta</button>
            <div id="register-error" class="form-error"></div>
          </form>
        </div>
      </div>
    `;

    Utils.$$('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        Utils.$$('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isLogin = tab.dataset.tab === 'login';
        Utils.$('#login-form').style.display = isLogin ? '' : 'none';
        Utils.$('#register-form').style.display = isLogin ? 'none' : '';
        Utils.$('#login-error').textContent = '';
        Utils.$('#register-error').textContent = '';
      });
    });

    Utils.$('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = Utils.$('#login-email').value.trim();
      const password = Utils.$('#login-password').value;
      const errEl = Utils.$('#login-error');
      errEl.textContent = '';

      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Entrando...';

      const { error } = await supabase.signIn(email, password);
      if (error) {
        errEl.textContent = error;
        btn.disabled = false;
        btn.textContent = 'Entrar';
      } else {
        router.navigate('/dashboard');
      }
    });

    Utils.$('#register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = Utils.$('#reg-name').value.trim();
      const email = Utils.$('#reg-email').value.trim();
      const password = Utils.$('#reg-password').value;
      const password2 = Utils.$('#reg-password2').value;
      const errEl = Utils.$('#register-error');
      errEl.textContent = '';

      if (password !== password2) {
        errEl.textContent = 'As senhas nao coincidem.';
        return;
      }

      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Criando...';

      const { error } = await supabase.signUp(email, password, name);
      if (error) {
        errEl.textContent = error;
        btn.disabled = false;
        btn.textContent = 'Criar conta';
      } else {
        router.navigate('/dashboard');
      }
    });
  },
};
