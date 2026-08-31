// Service worker minimal : cache-first sur la même origine, pour que Rihla
// fonctionne hors-ligne une fois visitée (les leçons sont 100 % locales).
const CACHE = 'rihla-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return
  e.respondWith(
    caches.match(request).then(
      (enCache) =>
        enCache ||
        fetch(request)
          .then((reponse) => {
            if (reponse.ok) {
              const copie = reponse.clone()
              caches.open(CACHE).then((c) => c.put(request, copie))
            }
            return reponse
          })
          .catch(() => (request.mode === 'navigate' ? caches.match('/') : undefined))
    )
  )
})
