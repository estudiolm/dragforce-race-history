/* =========================================================
   DRAGFORCE · TELA DE LOGIN
   Nota: sem backend de autenticação real ainda — esta tela é a
   camada visual/UX pronta para ser conectada a uma autenticação
   de verdade no futuro (ex.: e-mail/senha, SSO da equipe, etc.).
   ========================================================= */

var DF = window.DF || {};
DF.pages = DF.pages || {};

DF.pages.login = {
  async render(root) {
    // tela cheia, substitui o layout padrão (sem header/nav) para reforçar o clima de "entrada da equipe"
    document.body.classList.add('df-auth-mode');
    root.innerHTML = `
      <div class="auth-shell">
        <img class="auth-shell__watermark" src="assets/logos/dragforce-emblem.png" alt="" aria-hidden="true" />
        <div class="auth-card">
          <img class="brand__logo" src="assets/logos/dragforce-logo.png" alt="DragForce" />
          <div class="auth-card__tag">${DF.mode === 'supabase' ? 'Área da equipe — acesso restrito' : 'Área da equipe — modo local (sem login real ainda)'}</div>
          <form id="login-form">
            <div class="field">
              <label>E-mail</label>
              <input type="email" id="login-email" placeholder="voce@equipe.com" required />
            </div>
            <div class="field">
              <label>Senha</label>
              <input type="password" id="login-password" placeholder="••••••••" required />
            </div>
            <button type="submit" class="btn btn-primary btn-block" style="margin-top:6px" id="login-submit">Entrar</button>
            ${DF.mode === 'supabase' ? '' : '<a href="#/" class="btn btn-ghost btn-block">Continuar sem login</a>'}
          </form>
          <div class="auth-card__footer">
            <div class="app-footer__powered" style="display:inline-flex">
              <span>Powered by</span>
              <img src="assets/logos/boostclub-logo.png" alt="Boost Club" />
            </div>
          </div>
        </div>
      </div>
    `;
    root.querySelector('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (DF.mode !== 'supabase') {
        DF.utils.toast('Modo local: não há backend de autenticação conectado ainda — seguindo para o dashboard.');
        window.location.hash = '#/';
        return;
      }
      const email = root.querySelector('#login-email').value.trim();
      const password = root.querySelector('#login-password').value;
      const btn = root.querySelector('#login-submit');
      btn.disabled = true;
      btn.textContent = 'Entrando...';
      try {
        await DF.auth.signIn(email, password);
        window.location.hash = '#/';
      } catch (err) {
        DF.utils.toast(err.message || 'Não foi possível entrar.');
        btn.disabled = false;
        btn.textContent = 'Entrar';
      }
    });
  },
  cleanup() {
    document.body.classList.remove('df-auth-mode');
  },
};

window.DF = DF;
