const CACHE = 'webbrain-v1';

const STATIC_SHELL = [
  './',
  './styles.css',
  './js/utils.js',
  './js/tools.js',
  './js/ai.js',
  './js/chat.js',
  './js/settings-ui.js',
  './js/script.js',
  './tools/db.js',
  './tools/manifest.json',
  './icons/icon.svg',
  './manifest.webmanifest',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Network-first for tools/manifest.json so updates are picked up promptly
  if (url.pathname.endsWith('/tools/manifest.json')) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // Cache-first for everything else (own assets + CDN)
  e.respondWith(cacheFirst(e.request));
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached ?? new Response('{"error":"offline"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}
