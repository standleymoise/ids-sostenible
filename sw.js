// Service worker: cachea la "app shell" y los datos para uso sin conexión.
const CACHE = 'ids-v1.1.0';
const ASSETS = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/engine.js', 'js/i18n.js', 'js/stats.js', 'js/sensitivity.js',
  'data/indicators.json', 'data/i18n.es.json', 'data/i18n.en.json', 'data/cr-cantones.json', 'data/sdg-map.json', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // red primero (para ver actualizaciones), caché como respaldo sin conexión
  e.respondWith(fetch(e.request).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
});
