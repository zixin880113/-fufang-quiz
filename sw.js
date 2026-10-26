const V = 'rp-drill-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  const same = u.origin === location.origin, font = /fonts\.(googleapis|gstatic)\.com$/.test(u.host);
  if (!same && !font) return;
  // Pages: network first so updates arrive, fall back to cache offline. Others: cache first, refresh in background.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put('index.html', c)); return r; }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
