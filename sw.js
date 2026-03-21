// BioMur Service Worker
const CACHE = 'biomur-v2';
const STATIC = [
  '/biomediki/',
  '/biomediki/index.html',
  '/biomediki/manifest.json',
  '/biomediki/icon-192.png',
  '/biomediki/icon-512.png',
  '/biomediki/css/style.css',
  '/biomediki/js/data.js',
  '/biomediki/js/firebase.js',
  '/biomediki/js/cloudinary.js',
  '/biomediki/js/feed.js',
  '/biomediki/js/auth.js',
  '/biomediki/js/nav.js',
  '/biomediki/js/home.js',
  '/biomediki/js/schedule.js',
  '/biomediki/js/chat.js',
  '/biomediki/js/cat.js',
  '/biomediki/js/admin.js',
  '/biomediki/js/profile.js',
  '/biomediki/js/calendar.js',
  '/biomediki/js/dm.js',
  '/biomediki/js/utils.js',
  '/biomediki/js/editor.js',
  '/biomediki/js/faq.js',
  '/biomediki/js/boot.js',
];

// Install — кэшируем статику
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate — удаляем старые кэши
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first для Firebase/Cloudinary, cache first для статики
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase и Cloudinary — всегда сеть
  if (url.hostname.includes('firebase') || url.hostname.includes('cloudinary')) {
    return; // браузер сам обрабатывает
  }

  // Статика — сначала кэш, потом сеть
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('/biomediki/'));
    })
  );
});

// Push уведомления
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'BioMur', {
      body: data.body || '',
      icon: '/biomediki/icon-192.png',
      badge: '/biomediki/icon-192.png',
    })
  );
});
