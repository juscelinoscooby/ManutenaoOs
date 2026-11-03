const CACHE_NAME = 'manutencao-os-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/config.js',
  './js/store.js',
  './js/router.js',
  './js/ui.js',
  './js/camera.js',
  './js/export.js',
  './js/app.js',
  './js/modules/dashboard.js',
  './js/modules/atividade.js',
  './js/modules/checklists.js',
  './js/modules/relatorios.js',
  './js/modules/vistorias.js',
  './js/modules/coleta.js',
  './js/modules/inventario.js',
  './js/modules/atendimentos.js',
  './js/modules/reparos.js',
  './js/modules/terceiros.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request).catch(() => {
      if (e.request.mode === 'navigate') return caches.match('./index.html');
    }))
  );
});
