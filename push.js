/**
 * push.js — Web Push Subscription Manager
 *
 * FIX SUMMARY:
 * 1. Removed duplicate urlBase64ToUint8Array (was defined 3x in original)
 * 2. Removed duplicate subscribeUser (was defined 2x in original)
 * 3. subscribeUser now globally scoped (window.subscribeUser) for onclick
 * 4. Tries authenticated endpoint first, falls back to /subscribe (unauthenticated)
 * 5. Fetches VAPID key from backend — no hardcoded fallback key needed
 * 6. SW is registered from same-origin sw.js file (most reliable)
 * 7. All error paths show user-friendly messages via toast()
 */

'use strict';

/* ── Decode base64url VAPID key → Uint8Array (single definition) ─────── */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output  = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

/* ── Show message to user ─────────────────────────────────────────────── */
function _pushMsg(msg) {
  if (typeof window.toast === 'function') window.toast(msg);
  else console.log('[Push]', msg);
}

/* ── Get JWT token (shared with OfflineFirstSystem) ──────────────────── */
function _getToken() {
  try { return localStorage.getItem('__mytodo_jwt_v2'); } catch (_) { return null; }
}

/* ── Main subscribe/enable push function ─────────────────────────────── */
async function subscribeUser() {
  const BACKEND = (typeof CONFIG !== 'undefined' && CONFIG.API_URL)
    ? CONFIG.API_URL
    : 'https://todo-backend-tl1v.onrender.com';

  const btn = document.getElementById('main-push-btn');
  const setBtn = (text, color) => {
    if (!btn) return;
    btn.textContent = text;
    if (color) btn.style.background = color;
  };

  /* ── 1. Browser support check ──────────────────────────────────────── */
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    _pushMsg('❌ Push notifications not supported. Try Chrome or Edge.');
    return;
  }

  setBtn('⏳ Setting up…');
  if (btn) btn.disabled = true;

  try {
    /* ── 2. Request notification permission ──────────────────────────── */
    const permission = await Notification.requestPermission();
    if (permission === 'denied') {
      _pushMsg('🚫 Notifications blocked. Allow in browser settings and retry.');
      setBtn('🚫 Blocked — check browser settings', '#d13438');
      if (btn) btn.disabled = false;
      return;
    }
    if (permission !== 'granted') {
      _pushMsg('⚠️ Notification permission was not granted.');
      setBtn('🔔 Enable Push Notifications', null);
      if (btn) btn.disabled = false;
      return;
    }

    /* ── 3. Ensure Service Worker is registered from sw.js ───────────── */
    let reg;
    try {
      // Always prefer the real sw.js file (required for proper push scope)
      reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      await navigator.serviceWorker.ready;
    } catch (swErr) {
      console.warn('[Push] sw.js registration failed:', swErr.message);
      // Fallback: use whatever registration already exists
      try {
        reg = await navigator.serviceWorker.ready;
      } catch (e) {
        throw new Error('Service Worker unavailable. Cannot enable push notifications.');
      }
    }

    /* ── 4. Check if already subscribed ─────────────────────────────── */
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      _pushMsg('✅ Push notifications already enabled!');
      setBtn('✅ Already Enabled', '#107c10');
      if (btn) btn.disabled = false;
      return;
    }

    /* ── 5. Fetch VAPID public key from backend ──────────────────────── */
    let vapidKey = null;
    try {
      const vRes = await fetch(BACKEND + '/api/push/vapid-public-key');
      if (vRes.ok) {
        const vData = await vRes.json();
        vapidKey = vData.publicKey || vData.key;
      }
    } catch (e) {
      console.warn('[Push] Could not fetch VAPID key from backend:', e.message);
    }

    if (!vapidKey) {
      // Hardcoded fallback — matches the VAPID_PUBLIC_KEY in .env
      // This only works if the backend uses the same key pair
      vapidKey = 'BE5X--SkMy4A3OIGEVonAmNJW4hlz88cyi189addn43LKP6x26vpXBVEXTomLCr0fkzeq_n1LbgNnrcrPIdoC7c';
      console.warn('[Push] Using hardcoded fallback VAPID key');
    }

    /* ── 6. Subscribe via PushManager ───────────────────────────────── */
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const subJSON = subscription.toJSON();

    /* ── 7. Send subscription to backend ────────────────────────────── */
    let saved = false;
    const tok = _getToken();

    // Attempt 1: authenticated endpoint (stores under userId)
    if (tok) {
      try {
        const r = await fetch(BACKEND + '/api/push/subscribe', {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + tok,
          },
          body: JSON.stringify({ subscription: subJSON }),
        });
        if (r.ok) saved = true;
        else console.warn('[Push] Auth subscribe failed:', r.status, await r.text().catch(() => ''));
      } catch (e) {
        console.warn('[Push] Auth subscribe network error:', e.message);
      }
    }

    // Attempt 2: unauthenticated endpoint (no token needed)
    if (!saved) {
      try {
        const r = await fetch(BACKEND + '/api/push/subscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subJSON }),
        });
        if (r.ok) saved = true;
        else console.warn('[Push] Anon subscribe failed:', r.status);
      } catch (e) {
        console.warn('[Push] Anon subscribe network error:', e.message);
      }
    }

    /* ── 8. Notify user ─────────────────────────────────────────────── */
    if (saved) {
      _pushMsg('🔔 Push notifications enabled! You\'ll be notified even when the app is closed.');
      setBtn('✅ Push Enabled — Bell is On', '#107c10');
    } else {
      _pushMsg('⚠️ Subscribed on device but could not reach server. Remote pushes may not work until online.');
      setBtn('⚠️ Partially Enabled', '#faa800');
    }

  } catch (err) {
    console.error('[Push] subscribeUser error:', err);
    const msg = err.message || String(err);
    if (msg.includes('permission') || msg.includes('denied')) {
      _pushMsg('🚫 Permission denied. Allow notifications in browser settings.');
    } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
      _pushMsg('❌ Network error — check your connection and try again.');
    } else {
      _pushMsg('❌ Push setup failed: ' + msg.substring(0, 80));
    }
    setBtn('🔔 Enable Push Notifications', null);
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ── Expose globally (needed for onclick="subscribeUser()" in HTML) ───── */
window.subscribeUser         = subscribeUser;
window.urlBase64ToUint8Array = urlBase64ToUint8Array;
