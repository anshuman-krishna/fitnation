const version = 'fitnation-v3'
const core = [
  '/', '/css/main.css', '/manifest.json', '/icon.svg',
  '/js/app.js', '/js/api.js', '/js/store.js', '/js/ui.js', '/js/charts.js',
  '/js/units.js', '/js/anatomy.js',
  '/js/pages/landing.js', '/js/pages/auth.js', '/js/pages/dashboard.js',
  '/js/pages/workouts.js', '/js/pages/session.js', '/js/pages/exercises.js',
  '/js/pages/nutrition.js', '/js/pages/progress.js', '/js/pages/profile.js',
]

self.addEventListener('install', e => {
  e.waitUntil(caches.open(version).then(c => c.addAll(core)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== version).map(k => caches.delete(k))))
      .then(() => self.clients.claim()))
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/')) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone()
        caches.open(version).then(c => c.put(e.request, copy))
        return res
      })
      .catch(() =>
        caches.match(e.request).then(hit =>
          hit || (e.request.mode === 'navigate' ? caches.match('/') : Response.error()))))
})
