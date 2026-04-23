/* ═══════════════════════════════════════════════════════════════════════
   My Task Library — Production Service Worker v4.0
   Offline-first: Cache-first for static assets, Network-first for API
═══════════════════════════════════════════════════════════════════════ */
'use strict';

const CACHE_NAME    = 'mytasklibrary-v4';
const FONT_CACHE    = 'mytasklibrary-fonts-v2';
const STATIC_CACHE  = 'mytasklibrary-static-v4';

// Assets to pre-cache on install
const PRECACHE_URLS = [
  './',
  './index.html',
];

// ── INSTALL ────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('[SW] Pre-cache partial failure (ok on first deploy):', err);
      });
    })
  );
});

// ── ACTIVATE ───────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== FONT_CACHE && k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ──────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = event.request.url;
  const req = event.request;

  // Skip non-GET
  if (req.method !== 'GET') return;

  // Skip chrome-extension and non-http
  if (!url.startsWith('http')) return;

  // ── Google Fonts: Cache-first with network fallback
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(req).then(cached => {
          if (cached) return cached;
          return fetch(req).then(res => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // ── API calls: Network-first, no cache
  if (url.includes('/api/') || url.includes('onrender.com')) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          JSON.stringify({ success: false, message: 'Offline — changes queued locally.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // ── Cloudflare analytics: skip (non-critical)
  if (url.includes('cloudflareinsights.com') || url.includes('beacon.min.js')) {
    event.respondWith(fetch(req).catch(() => new Response('', { status: 200 })));
    return;
  }

  // ── HTML / App shell: Network-first with cache fallback (offline support)
  if (req.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            caches.open(STATIC_CACHE).then(c => c.put(req, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then(cached => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // ── Static assets (JS, CSS, images): Cache-first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          caches.open(STATIC_CACHE).then(c => c.put(req, res.clone()));
        }
        return res;
      });
    })
  );
});

// ── PUSH NOTIFICATIONS ─────────────────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'My Task Library', body: 'You have tasks pending!' };
  try { if (event.data) data = event.data.json(); } catch(_) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  data.icon  || './icon-192.png',
      badge: data.badge || './icon-72.png',
      tag:   data.tag   || 'mytasklibrary',
      data,
      actions: [
        { action: 'open',    title: '📋 Open App' },
        { action: 'dismiss', title: '✕ Dismiss'  },
      ],
    })
  );
});

// ── NOTIFICATION CLICK ─────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      if (cls.length) return cls[0].focus();
      return clients.openWindow('./');
    })
  );
});

// ── BACKGROUND SYNC ────────────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(
      self.clients.matchAll().then(cls => {
        cls.forEach(client => client.postMessage({ type: 'BG_SYNC_REQUEST' }));
      })
    );
  }
});

// ── PERIODIC SYNC (reminder checks) ───────────────────────────────────
let _bgReminders = [];
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SET_REMINDERS') {
    _bgReminders = event.data.reminders || [];
  }
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'reminder-check') {
    event.waitUntil((async () => {
      const now  = new Date();
      const day  = now.getDay();
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      for (const r of _bgReminders) {
        if (!r.active || r.time !== hhmm) continue;
        const ok =
          r.repeat === 'daily'    ||
          r.repeat === 'once'     ||
          (r.repeat === 'weekdays'  && day >= 1 && day <= 5) ||
          (r.repeat === 'weekends'  && (day === 0 || day === 6));
        if (ok) {
          await self.registration.showNotification('🔔 My Task Library', {
            body: r.note || 'Task reminder!',
            tag:  'bg-rem-' + r.id,
          });
        }
      }
    })());
  }
});
