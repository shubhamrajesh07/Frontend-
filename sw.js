/* ═══════════════════════════════════════════════════════════════════════
   My Task Library — Service Worker v5.1 (Fixed)
   ✅ Web Push (works when browser is closed)
   ✅ Background sync
   ✅ Offline-first caching
   ✅ Periodic sync for reminders
═══════════════════════════════════════════════════════════════════════ */
'use strict';

const CACHE_NAME   = 'mytasklibrary-v5';
const FONT_CACHE   = 'mytasklibrary-fonts-v2';
const STATIC_CACHE = 'mytasklibrary-static-v5';
const PRECACHE_URLS = ['./', './index.html'];

// ── INSTALL ──────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll(PRECACHE_URLS).catch(err =>
        console.warn('[SW] Pre-cache partial failure:', err)
      )
    )
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== CACHE_NAME && k !== FONT_CACHE && k !== STATIC_CACHE)
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = event.request.url;
  const req = event.request;

  if (req.method !== 'GET') return;
  if (!url.startsWith('http')) return;

  // Google Fonts: Cache-first
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

  // API calls: Network-first, no cache
  if (url.includes('/api/') || url.includes('onrender.com')) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(
          JSON.stringify({ success: false, message: 'Offline — changes queued locally.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Cloudflare analytics: skip caching
  if (url.includes('cloudflareinsights.com') || url.includes('beacon.min.js')) {
    event.respondWith(fetch(req).catch(() => new Response('', { status: 200 })));
    return;
  }

  // HTML / App shell: Network-first with cache fallback
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

  // Static assets: Cache-first
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

// ── WEB PUSH ──────────────────────────────────────────────────────────────
self.addEventListener('push', event => {
  let data = {
    title: '🔔 Task Reminder',
    body:  'You have pending tasks!',
    icon:  './icon-192.png',
    badge: './icon-192.png',
    tag:   'mytasklibrary-push',
    url:   './',
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    try { if (event.data) data.body = event.data.text(); } catch (_) {}
  }

  const options = {
    body:    data.body,
    icon:    data.icon  || './icon-192.png',
    badge:   data.badge || './icon-192.png',
    tag:     data.tag   || 'mytasklibrary-push',
    data:    { url: data.url || './', ...data },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'open',    title: '📋 Open App' },
      { action: 'dismiss', title: '✕ Dismiss'   },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── NOTIFICATION CLICK ────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      for (const client of cls) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ── BACKGROUND SYNC ───────────────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(
      self.clients.matchAll().then(cls => {
        cls.forEach(client => client.postMessage({ type: 'BG_SYNC_REQUEST' }));
      })
    );
  }
});

// ── PERIODIC SYNC ─────────────────────────────────────────────────────────
let _bgReminders = [];

self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SET_REMINDERS') {
    _bgReminders = event.data.reminders || [];
  }
  if (event.data.type === 'PING') {
    if (event.source) event.source.postMessage({ type: 'PONG' });
  }
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'reminder-check') {
    event.waitUntil((async () => {
      const now  = new Date();
      const day  = now.getDay();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      for (const r of _bgReminders) {
        if (!r.active || r.time !== hhmm) continue;
        const ok =
          r.repeat === 'daily'   ||
          r.repeat === 'once'    ||
          (r.repeat === 'weekdays' && day >= 1 && day <= 5) ||
          (r.repeat === 'weekends' && (day === 0 || day === 6));
        if (ok) {
          await self.registration.showNotification('🔔 My Task Library', {
            body:    r.note || 'Task reminder!',
            icon:    './icon-192.png',
            badge:   './icon-192.png',
            tag:     'bg-rem-' + r.id,
            vibrate: [200, 100, 200],
          });
        }
      }
    })());
  }
});
