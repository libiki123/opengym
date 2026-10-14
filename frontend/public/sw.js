/* openGym service worker — runtime caching (works with Vite's hashed asset names).
   Media (img/gif) cache-first; everything else network-first with offline fallback. */
const CACHE = 'opengym-rt-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()))
})
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {}
  e.waitUntil(self.registration.showNotification(data.title || 'openGym', {
    body: data.body || '',
    icon: 'icon-512.png',
    badge: 'icon-180.png',
    tag: data.tag || 'opengym',
    renotify: true
  }))
})
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(clients => {
    const c = clients.find(c => 'focus' in c)
    return c ? c.focus() : self.clients.openWindow('./')
  }))
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET') return
  const exerciseMedia = url.origin === 'https://cdn.jsdelivr.net' &&
    /^\/gh\/hasaneyldrm\/exercises-dataset@[\w.-]+\/(images|videos)\//.test(url.pathname)
  if (url.origin !== location.origin && !exerciseMedia) return
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return // never cache auth/data

  const isMedia = exerciseMedia || url.pathname.includes('/img/') || url.pathname.includes('/gif/')
  if (isMedia) {
    const cached = caches.open(CACHE).then(async c => ({ c, hit: await c.match(e.request) })).catch(() => null)
    e.respondWith(cached.then(state => {
      if (state && state.hit) return state.hit
      return fetch(e.request).then(async res => {
        if (state && (res.ok || res.type === 'opaque')) {
          try { await state.c.put(e.request, res.clone()) } catch {}
        }
        return res
      })
    }))
  } else {
    e.respondWith(fetch(e.request).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()))
      return res
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html'))))
  }
})
