const CACHE = 'itqan-v3'
const PRECACHE = ['/', '/manifest.json']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  // Network-first for API / Supabase; cache-first for static
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
    return
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      }).catch(() => cached)
      return cached || fetched
    })
  )
})
