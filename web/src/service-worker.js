self.addEventListener("install", (event) => {
  // Skip waiting, so the new service worker activates immediately after installation.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("fetch", (event) => {
  // Always fetch from the network, never use the cache.
  event.respondWith(fetch(event.request));
});

self.addEventListener("activate", (event) => {
  // Skip clearing caches since we're not using any.
  event.waitUntil(self.clients.claim());
});
