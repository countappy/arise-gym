/* ARISE — service worker: funciona sin cobertura en el gimnasio.
   Núcleo (html/js/css): red primero para que lleguen las actualizaciones, caché si no hay conexión.
   Imágenes y audio: caché primero (se guardan la primera vez que se ven). */
const VERSION = 'arise-v3';
const CORE = ['./', './index.html', './style.css', './app.js', './js/supabase.js', './manifest.json', './snd/levelup.m4a'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const core = url.pathname.endsWith('/') || /\.(html|js|css|json)$/.test(url.pathname);
  if (core) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copy = r.clone();
          caches.open(VERSION).then(c => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        if (r.ok) {
          const copy = r.clone();
          caches.open(VERSION).then(c => c.put(e.request, copy));
        }
        return r;
      }))
    );
  }
});
