// BioMur Service Worker v5 — push notifications
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => self.clients.claim())
  );
});

// Показываем уведомление из SW (работает в фоне и на iOS)
self.addEventListener('message', e => {
  if (e.data?.type === 'NOTIFY') {
    const { title, body, icon } = e.data;
    self.registration.showNotification(title, {
      body,
      icon: icon || '/biomediki/icon-192.png',
      badge: '/biomediki/icon-192.png',
      vibrate: [200, 100, 200],
      tag: title, // группируем одинаковые уведомления
      renotify: false
    });
  }
});

// Клик по уведомлению — открываем приложение
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const app = list.find(c => c.url.includes('biomediki'));
      if (app) return app.focus();
      return clients.openWindow('/biomediki/');
    })
  );
});
