const CACHE_PREFIX = 'artemis-mission-pack-v2:'
const MANIFEST_KEY = '/__artemis_offline_manifest__'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

async function getCompletedPacks() {
  const names = (await caches.keys()).filter((name) => name.startsWith(CACHE_PREFIX))
  const completed = []
  for (const name of names) {
    const cache = await caches.open(name)
    const response = await cache.match(MANIFEST_KEY)
    if (!response) continue
    try {
      const manifest = await response.json()
      if (manifest.schemaVersion === 2 && manifest.datasetSchemaVersion === 1 && manifest.appVersion && manifest.missionId && Array.isArray(manifest.resources) && manifest.checksums && typeof manifest.checksums === 'object' && manifest.resources.every((path) => /^[a-f0-9]{64}$/i.test(manifest.checksums[path] || ''))) completed.push({ cache, manifest })
    } catch {
      // An incomplete or unsupported manifest is never an offline source.
    }
  }
  return completed
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith((async () => {
    try {
      const response = await fetch(request)
      return response
    } catch {
      const url = new URL(request.url)
      const packs = await getCompletedPacks()
      for (const pack of packs) {
        if (!pack.manifest.resources.includes(url.pathname)) continue
        const cached = await pack.cache.match(url.pathname, { ignoreSearch: true, ignoreVary: true })
        if (cached) return cached
      }
      if (request.mode === 'navigate') {
        for (const pack of packs) {
          const shell = await pack.cache.match('/')
          if (shell) return shell
        }
      }
      return new Response(`Offline resource unavailable: ${url.pathname}`, { status: 503, headers: { 'content-type': 'text/plain;charset=utf-8' } })
    }
  })())
})
