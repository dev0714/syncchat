// SyncChat service worker — minimal, network-first.
// Its main job is to make the app installable as a PWA. We deliberately avoid
// caching HTML/API responses so the dashboard always shows live data; we only
// fall back to a tiny offline notice when the network is completely down.
const OFFLINE_URL = "/offline.html";
const CACHE = "syncchat-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only handle top-level navigations; let everything else hit the network.
  if (req.mode !== "navigate") return;
  event.respondWith(
    fetch(req).catch(() => caches.match(OFFLINE_URL))
  );
});
