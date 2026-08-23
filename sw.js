// Service worker do item 9 do ROADMAP (uso offline sem servidor local).
// Registrado por common.js a partir de qualquer página do site; o escopo é
// sempre a raiz do site (este arquivo mora na raiz), cobrindo /en/ também.
// Bump em CACHE_NAME quando data/*.json ou os arquivos estáticos abaixo mudarem
// de forma relevante, pra forçar a limpeza do cache antigo em `activate`.
const CACHE_NAME = 'lifebar-v2';

const ASSET_PATHS = [
  './',
  'index.html',
  'game.html',
  'credits.html',
  'manifest.json',
  'style.css',
  'app.js',
  'game.js',
  'common.js',
  'en/',
  'en/index.html',
  'en/game.html',
  'en/credits.html',
  'en/manifest.json',
  'assets/lifebar-logo.svg',
  'assets/life-gauge.svg',
  'assets/boxart-placeholder.svg',
  'assets/icon.svg',
  'data/games.json',
  'data/played.json',
  'data/boxarts.json',
  'data/details.json',
  'data/tectoy.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSET_PATHS.map((path) => new URL(path, self.registration.scope).toString())))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// Cache-first pros arquivos do próprio site (cobre uso 100% offline depois da
// primeira visita); requisições cross-origin (capas via jsdelivr/thumbnails.libretro.com)
// passam direto pra rede, sem interceptar - o fallback entre CDNs já é tratado em common.js.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    // ignoreSearch: game.html?id=<id> etc. têm query string, mas o que está em
    // cache é só 'game.html' (sem query) - sem isso o match falha e a navegação
    // quebra offline.
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
