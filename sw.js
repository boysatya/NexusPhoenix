// Nexus Phoenix — service worker
// Handles: (1) basic offline caching so the PWA loads instantly, and
// (2) real Web Push notifications that arrive even when the app is closed.

const CACHE_NAME = 'nexus-phoenix-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Basic network-first fetch passthrough (safe default — extend later with
// real caching if you want full offline support).
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ---- Push notifications ----
// The Cloudflare Worker sends a JSON payload shaped like:
//   { title: "🏛️ Capital Contest", body: "Starts in 1 hour", tag: "capital-2026-07-14" }
self.addEventListener('push', (event) => {
  let data = { title: 'Nexus Phoenix', body: 'An event is starting soon.' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: 'icon-192.png',   // replace with your actual PWA icon path
    badge: 'icon-192.png',
    tag: data.tag || 'nexus-reminder',
    renotify: true,
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Tapping the notification focuses/opens the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
