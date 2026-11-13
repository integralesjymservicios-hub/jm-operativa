/*
 * Guarda la app en el móvil para que se abra aunque no haya cobertura.
 * Al publicar una versión nueva de la app, cambia el número de VERSION.
 */
const VERSION = 'jm-1';
const ARCHIVOS = ['./', 'index.html', 'config.js', 'qrcode.js', 'manifest.webmanifest', 'logo.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;                       // las llamadas al servidor no se tocan
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // La app: primero intenta la versión nueva; sin señal, usa la guardada (también con ?p=CÓDIGO de un QR)
    e.respondWith(fetch(req).then(function (r) {
      if (r.ok) { const copia = r.clone(); caches.open(VERSION).then(function (c) { c.put(req.mode === 'navigate' ? 'index.html' : req, copia); }); }
      return r;
    }).catch(function () {
      return caches.match(req.mode === 'navigate' ? 'index.html' : req, { ignoreSearch: true });
    }));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    // Tipografías: se guardan la primera vez
    e.respondWith(caches.match(req).then(function (m) {
      return m || fetch(req).then(function (r) { const copia = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, copia); }); return r; });
    }));
  }
});
