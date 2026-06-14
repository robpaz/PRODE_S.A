// ============================================================
// PRODE MUNDIAL FIFA 2026 — SERVICE WORKER (PWA)
// ============================================================
// Estrategia:
//  - App shell (HTML/CSS/JS/imágenes) → cache-first.
//  - Datos dinámicos (Supabase, ipify, flagcdn) → siempre red (no cachear).
// Subir CACHE_VERSION cuando cambien los assets para invalidar la caché.
// ============================================================

const CACHE_VERSION = 'prode-v1';
const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/config.js',
  './js/utils.js',
  './js/fixture.js',
  './js/supabase-client.js',
  './js/home.js',
  './js/predictions.js',
  './js/ranking.js',
  './js/rules.js',
  './js/miprode.js',
  './js/app.js',
  './images/logo.png',
  './images/copa.png',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // No cachear datos dinámicos / terceros.
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('ipify.org') ||
    url.hostname.includes('flagcdn.com')
  ) {
    return; // dejar pasar a la red
  }

  // App shell same-origin → cache-first con actualización en segundo plano.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
