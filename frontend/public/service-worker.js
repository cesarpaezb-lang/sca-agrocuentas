// frontend/public/service-worker.js
const CACHE_NAME = 'sca-agrocuentas-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/manifest.json',
  '/logo192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  console.log('📦 Service Worker instalado');
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});