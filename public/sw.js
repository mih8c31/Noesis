const CACHE_NAME = 'noesis-v3';
const BASE = self.location.pathname.replace(/\/sw\.js$/, '/');
const PRECACHE = [
  BASE,
  BASE + 'index.html',
  BASE + 'css/main.css',
  BASE + 'js/config.js',
  BASE + 'js/supabase.js',
  BASE + 'js/utils.js',
  BASE + 'js/router.js',
  BASE + 'js/auth.js',
  BASE + 'js/upload.js',
  BASE + 'js/documents.js',
  BASE + 'js/reader.js',
  BASE + 'js/app.js',
  BASE + 'manifest.json',
  BASE + 'icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(response => {
        if (response.ok && request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      });
    }).catch(() => {
      if (request.mode === 'navigate') return caches.match(BASE + 'index.html');
    })
  );
});
