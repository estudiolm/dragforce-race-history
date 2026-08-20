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
    btn.title = `Sair (${user.name})`;
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

let deferredInstallPrompt = null;

function isIosDevice() {
  // iPad moderno se identifica como "Macintosh" no user-agent, mas tem touch — o teste
  // clássico de "é iOS de verdade" precisa cobrir os dois casos
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

function openIosInstallInstructions() {
  DF.ui.openModal({
    title: 'Instalar o DragForce no iPhone',
    bodyHtml: `
      <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;margin-bottom:var(--space-5)">
        O iPhone não deixa instalar direto pelo botão — é rapidinho pelo Safari:
      </p>
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div style="display:flex;gap:var(--space-4);align-items:flex-start">
          <div style="flex:none;width:34px;height:34px;border-radius:50%;background:var(--bg-surface-2);border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:700;color:var(--df-red-bright)">1</div>
          <div style="padding-top:5px">
            <div style="font-size:14px">Toque no ícone de <strong>Compartilhar</strong> na barra do Safari</div>
            <div style="margin-top:6px;color:var(--text-muted)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-5px;margin-right:6px"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              (quadrado com uma seta pra cima — no rodapé, ou ao lado da barra de endereço)
            </div>
          </div>
        </div>
        <div style="display:flex;gap:var(--space-4);align-items:flex-start">
          <div style="flex:none;width:34px;height:34px;border-radius:50%;background:var(--bg-surface-2);border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:700;color:var(--df-red-bright)">2</div>
          <div style="padding-top:5px">
            <div style="font-size:14px">Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong></div>
          </div>
        </div>
        <div style="display:flex;gap:var(--space-4);align-items:flex-start">
          <div style="flex:none;width:34px;height:34px;border-radius:50%;background:var(--bg-surface-2);border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:700;color:var(--df-red-bright)">3</div>
          <div style="padding-top:5px">
            <div style="font-size:14px">Toque em <strong>"Adicionar"</strong> no canto superior direito</div>
          </div>
        </div>
      </div>
      <p style="color:var(--text-muted);font-size:12.5px;line-height:1.5;margin-top:var(--space-5)">
        Pronto — o ícone do DragForce aparece na tela de início, abrindo em tela cheia como um app de verdade.
      </p>
    `,
    footerHtml: `<button class="btn btn-primary" data-close>Entendi</button>`,
  });
}

function initInstallPrompt() {
  const btn = document.getElementById('install-app-btn');
  if (!btn) return;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) return; // já instalado — nada a fazer

  if (isIosDevice()) {
    // Safari/iOS não dispara beforeinstallprompt — mostra o botão direto,
    // que abre um passo a passo (não existe prompt nativo pra chamar)
    btn.style.display = '';
    btn.addEventListener('click', openIosInstallInstructions);
    return;
  }

  // Chrome/Edge/Android disparam esse evento quando o app "pode" ser instalado
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    btn.style.display = '';
  });

  btn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    btn.disabled = true;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    btn.style.display = 'none';
    btn.disabled = false;
  });

  window.addEventListener('appinstalled', () => {
    btn.style.display = 'none';
    deferredInstallPrompt = null;
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // só registra em http(s) — evita erro ao abrir o index.html direto via file://
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // instalação como app é "progressive enhancement" — se falhar, o site
      // continua funcionando normalmente pelo navegador
    });
  });
}

async function bootstrap() {
  detectMode();
  if (DF.mode === 'local') {
    await DF.seed.run(); // dados de exemplo só fazem sentido no modo local/demonstração
  }
  initNavToggle();
  initInstallPrompt();
  registerServiceWorker();
  window.addEventListener('hashchange', DF.router.render);
  await DF.router.render();
}

document.addEventListener('DOMContentLoaded', bootstrap);

window.DF = DF;
