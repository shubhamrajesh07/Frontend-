// 🔥 My Task Library — Stable Production Service Worker

const CACHE_VERSION = "v1.0.1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// Files to cache (minimal)
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js"
];

// ── INSTALL ──
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// ── ACTIVATE ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== STATIC_CACHE)
            .map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// ── FETCH ──
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only GET requests
  if (req.method !== "GET") return;

  // HTML → ALWAYS NETWORK FIRST (important)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // JS/CSS → NETWORK FIRST (no stale bug)
  if (req.url.includes(".js") || req.url.includes(".css")) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Images/fonts → CACHE FIRST
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put(req, copy));
        return res;
      });
    })
  );
});
