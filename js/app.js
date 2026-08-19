/* =========================================================
   DRAGFORCE · ROTEADOR PRINCIPAL
   Decide o modo (local vs. Supabase), monta DF.db, cuida da guarda
   de rota quando há autenticação real, e despacha para as páginas.
   ========================================================= */

var DF = window.DF || {};

function detectMode() {
  const cfg = window.DF_CONFIG || {};
  const hasSupabase = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  DF.mode = hasSupabase ? 'supabase' : 'local';
  DF.db = hasSupabase ? DF.dbSupabase : DF.dbLocal;
}

DF.router = {
  root: null,

  async render() {
    const root = DF.router.root || (DF.router.root = document.getElementById('page-root'));
    const path = window.location.hash.replace(/^#/, '') || '/';

    // cleanup de páginas com modo especial (ex: login em tela cheia)
    if (DF.pages.login && DF.pages.login.cleanup) DF.pages.login.cleanup();

    // guarda de rota: só existe de verdade no modo Supabase (com login real)
    if (DF.mode === 'supabase' && path !== '/login') {
      const user = await DF.auth.getUser();
      if (!user) { window.location.hash = '#/login'; return; }
    }

    DF.ui.setActiveNav(path);
    await updateAccountButton();
    root.scrollTo && root.scrollTo(0, 0);
    window.scrollTo(0, 0);

    const carMatch = path.match(/^\/carros\/(.+)$/);

    try {
      if (path === '/' || path === '') {
        await DF.pages.dashboard.render(root);
      } else if (path === '/carros') {
        await DF.pages.cars.render(root);
      } else if (carMatch) {
        await DF.pages.carDetail.render(root, decodeURIComponent(carMatch[1]));
      } else if (path === '/sobre') {
        await DF.pages.about.render(root);
      } else if (path === '/login') {
        await DF.pages.login.render(root);
      } else {
        root.innerHTML = `<div class="empty-state">Página não encontrada. <a href="#/" style="color:var(--df-red-bright)">Voltar ao início</a>.</div>`;
      }
    } catch (err) {
      console.error(err);
      root.innerHTML = `<div class="empty-state">Ocorreu um erro ao carregar esta página.<br/><span class="mono" style="font-size:12px">${DF.utils.escapeHtml(err.message || String(err))}</span></div>`;
    }
  },
};

async function updateAccountButton() {
  const btn = document.getElementById('account-btn');
  if (!btn) return;
  if (DF.mode !== 'supabase') {
    btn.href = '#/sobre';
    btn.title = 'Modo local (sem login)';
    return;
  }
  const user = await DF.auth.getUser();
  if (user) {
    btn.href = '#';
    btn.title = `Sair (${user.email})`;
    btn.onclick = async (e) => {
      e.preventDefault();
      await DF.auth.signOut();
      window.location.hash = '#/login';
    };
  } else {
    btn.href = '#/login';
    btn.title = 'Entrar';
    btn.onclick = null;
  }
}

function initNavToggle() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
}

async function bootstrap() {
  detectMode();
  if (DF.mode === 'local') {
    await DF.seed.run(); // dados de exemplo só fazem sentido no modo local/demonstração
  }
  initNavToggle();
  window.addEventListener('hashchange', DF.router.render);
  await DF.router.render();
}

document.addEventListener('DOMContentLoaded', bootstrap);

window.DF = DF;
