/* =========================================================
   DRAGFORCE · SERVICE WORKER (deixa o site instalável como app)
   Estratégia:
   - "App shell" (HTML/CSS/JS/fontes/logos/ícones) fica em cache e é
     atualizado em segundo plano (stale-while-revalidate) — abre rápido
     e funciona offline, mas sempre busca a versão nova pra próxima vez.
   - Chamadas ao Supabase (dados dos carros) NUNCA passam pelo cache —
     são sempre direto na rede, senão a equipe veria dados desatualizados
     ou "carro cadastrado" que não existe de verdade.

   IMPORTANTE: sempre que os arquivos do site mudarem, troque o número
   da CACHE_VERSION abaixo — é isso que força os navegadores da equipe a
   baixarem a versão nova em vez de continuar servindo a antiga do cache.
   ========================================================= */

const CACHE_VERSION = 'dragforce-v3';

const APP_SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/fonts.css',
  'css/tokens.css',
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'assets/vendor/chart.js',
  'assets/vendor/supabase.js',
  'js/config.js',
  'js/users.js',
  'js/db.js',
  'js/db-supabase.js',
  'js/auth.js',
  'js/utils.js',
  'js/seed.js',
  'js/ui.js',
  'js/pages/dashboard.js',
  'js/pages/cars.js',
  'js/pages/car-detail.js',
  'js/pages/about.js',
  'js/pages/login.js',
  'js/app.js',
  'assets/logos/dragforce-motorsport.png',
  'assets/logos/dragforce-emblem.png',
  'assets/logos/dragforce-logo.png',
  'assets/logos/boostclub-logo.png',
  'assets/logos/favicon.png',
  'assets/logos/favicon-32.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-192.png',
  'assets/icons/icon-maskable-512.png',
  'assets/icons/apple-touch-icon.png',
  'assets/fonts/orbitron-latin-700-normal.woff2',
  'assets/fonts/orbitron-latin-900-normal.woff2',
  'assets/fonts/rajdhani-latin-500-normal.woff2',
  'assets/fonts/rajdhani-latin-600-normal.woff2',
  'assets/fonts/rajdhani-latin-700-normal.woff2',
  'assets/fonts/inter-latin-400-normal.woff2',
  'assets/fonts/inter-latin-500-normal.woff2',
  'assets/fonts/inter-latin-600-normal.woff2',
  'assets/fonts/inter-latin-700-normal.woff2',
  'assets/fonts/jetbrains-mono-latin-400-normal.woff2',
  'assets/fonts/jetbrains-mono-latin-500-normal.woff2',
  'assets/fonts/jetbrains-mono-latin-600-normal.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isSupabaseOrCrossOrigin(url) {
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // nunca intercepta POST/PATCH/DELETE (ex: Supabase)

  const url = new URL(req.url);
  if (isSupabaseOrCrossOrigin(url)) return; // deixa passar direto pra rede (dados, APIs externas)

  // navegação entre telas do SPA (hash routing) — sempre serve o index.html do cache/rede
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('index.html'))
    );
    return;
  }

  // stale-while-revalidate pros arquivos estáticos do app shell
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok) {
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
