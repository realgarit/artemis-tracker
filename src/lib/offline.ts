const CACHE_PREFIX = 'artemis-mission-pack-v2:'
const LEGACY_CACHE_PREFIX = 'artemis-mission-pack-v1:'
const MANIFEST_KEY = '/__artemis_offline_manifest__'
const ASSET_MANIFEST_PATH = '/asset-manifest.json'

export interface OfflinePackManifest {
  schemaVersion: 2
  missionId: string
  appVersion: string
  datasetSchemaVersion: 1
  installedAt: string
  optional3D: boolean
  bytes: number
  resources: string[]
  checksums: Record<string, string>
}

export interface PackProgress { loaded: number; total: number; resource: string }

const verifiedPacks = new Map<string, OfflinePackManifest | null>()

export async function sha256Hex(bytes: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function cachePrefix(missionId: string): string { return `${CACHE_PREFIX}${missionId}:` }
function cacheName(missionId: string): string { return `${cachePrefix(missionId)}${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}` }

function extractLocalAssets(html: string): string[] {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const urls = [...document.querySelectorAll('script[src],link[rel="stylesheet"][href],link[rel="modulepreload"][href]')]
    .map((element) => element instanceof HTMLScriptElement ? element.src : (element as HTMLLinkElement).href)
    .filter((url) => new URL(url).origin === location.origin)
  return [...new Set(urls.map((url) => new URL(url).pathname))]
}

const BASE_RESOURCES = ['/','/404.html','/manifest.json','/favicon.svg','/favicon.png','/data/status.json','/data/spaceweather.json','/data/dsn.json','/crew/wiseman.jpg','/crew/glover.jpg','/crew/koch.jpg','/crew/hansen.jpg']
const THREE_D_RESOURCES = ['/models/orion.glb','/textures/earth.jpg','/textures/moon.jpg']

interface ViteAsset { file?: string; css?: string[]; assets?: string[]; imports?: string[]; dynamicImports?: string[] }
type ViteAssets = Record<string, ViteAsset>

async function getCompiledAssets(include3D: boolean): Promise<string[]> {
  try {
    const manifest = await (await fetchLocal(ASSET_MANIFEST_PATH)).json() as ViteAssets
    const entry = manifest['index.html']
    if (!entry) return []
    const included = new Set<string>()
    const visit = (key: string) => {
      if (included.has(key)) return
      included.add(key)
      const asset = manifest[key]
      if (!asset) return
      for (const dependency of asset.imports || []) visit(dependency)
      for (const dependency of asset.dynamicImports || []) {
        const target = manifest[dependency]
        const isThreeDimensionalChunk = dependency.includes('TrajectoryMap') || target?.file?.includes('TrajectoryMap')
        if (include3D || !isThreeDimensionalChunk) visit(dependency)
      }
    }
    visit('index.html')
    return [...included].flatMap((key) => {
      const asset = manifest[key]
      return asset ? [asset.file, ...(asset.css || []), ...(asset.assets || [])].filter((path): path is string => typeof path === 'string').map((path) => `/${path}`) : []
    })
  } catch { return [] }
}

async function fetchLocal(path: string): Promise<Response> {
  const response = await fetch(path, { cache: 'no-store' })
  if (!response.ok) throw new Error(`${path} could not be downloaded (HTTP ${response.status}).`)
  return response
}

export async function estimateMissionPackBytes(missionId: string, include3D: boolean): Promise<number> {
  if (!('caches' in window)) return 0
  const html = await (await fetchLocal('/')).text()
  const assets = extractLocalAssets(html)
  const compiledAssets = await getCompiledAssets(include3D)
  const paths = [...new Set([...BASE_RESOURCES, `/data/missionEphemerides-${missionId}.json`, `/data/missionEphemerides-${missionId}.json.gz`, ...assets, ...compiledAssets, ...(include3D ? THREE_D_RESOURCES : [])])]
  const sizes = await Promise.all(paths.map(async (path) => {
    try {
      const response = await fetch(path, { method: 'HEAD' })
      const size = Number(response.headers.get('content-length'))
      return Number.isFinite(size) ? size : 0
    } catch { return 0 }
  }))
  return sizes.reduce((sum, size) => sum + size, 0)
}

export async function downloadMissionPack(missionId: string, include3D: boolean, onProgress: (progress: PackProgress) => void): Promise<OfflinePackManifest> {
  if (!('caches' in window) || !('serviceWorker' in navigator)) throw new Error('This browser does not support downloadable offline mission packs.')
  if (!/^artemis-(i|ii)$/.test(missionId)) throw new Error('Offline replay packs are available for flown Artemis I and Artemis II only.')
  await navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
  const html = await (await fetchLocal('/')).text()
  const assets = extractLocalAssets(html)
  const compiledAssets = await getCompiledAssets(include3D)
  const paths = [...new Set([...BASE_RESOURCES, `/data/missionEphemerides-${missionId}.json`, `/data/missionEphemerides-${missionId}.json.gz`, ...assets, ...compiledAssets, ...(include3D ? THREE_D_RESOURCES : [])])]
  const name = cacheName(missionId)
  const cache = await caches.open(name)
  let bytes = 0
  const downloaded: string[] = []
  const checksums: Record<string, string> = {}
  try {
    for (let index = 0; index < paths.length; index++) {
      const path = paths[index]
      const response = await fetchLocal(path)
      const copy = response.clone()
      const body = await copy.arrayBuffer()
      bytes += body.byteLength
      checksums[path] = await sha256Hex(body)
      if (path === `/data/missionEphemerides-${missionId}.json`) {
        const bundle = JSON.parse(new TextDecoder().decode(body)) as { schemaVersion?: number; missions?: { missionId?: string; schemaVersion?: number }[] }
        if (bundle.schemaVersion !== 1 || !bundle.missions?.some((mission) => mission.missionId === missionId && mission.schemaVersion === 1)) throw new Error('The selected mission ephemeris failed schema validation; no offline pack was installed.')
      }
      await cache.put(path, response)
      downloaded.push(path)
      onProgress({ loaded: index + 1, total: paths.length, resource: path })
    }
    for (const path of downloaded) {
      const stored = await cache.match(path)
      if (!stored || await sha256Hex(await stored.arrayBuffer()) !== checksums[path]) throw new Error(`Cached resource failed integrity verification: ${path}`)
    }
    const manifest: OfflinePackManifest = { schemaVersion: 2, missionId, appVersion: __APP_VERSION__, datasetSchemaVersion: 1, installedAt: new Date().toISOString(), optional3D: include3D, bytes, resources: downloaded, checksums }
    await cache.put(MANIFEST_KEY, new Response(JSON.stringify(manifest), { headers: { 'content-type': 'application/json' } }))
    await navigator.serviceWorker.ready
    const oldPacks = (await caches.keys()).filter((existing) => existing.startsWith(cachePrefix(missionId)) && existing !== name)
    await Promise.all(oldPacks.map((old) => caches.delete(old)))
    verifiedPacks.set(name, manifest)
    return manifest
  } catch (error) {
    await caches.delete(name)
    verifiedPacks.delete(name)
    throw error
  }
}

export async function getOfflinePack(missionId: string): Promise<OfflinePackManifest | null> {
  if (!('caches' in window)) return null
  const names = (await caches.keys()).filter((key) => key.startsWith(cachePrefix(missionId))).sort()
  const name = names[names.length - 1]
  if (!name) return null
  if (verifiedPacks.has(name)) return verifiedPacks.get(name) || null
  const cache = await caches.open(name)
  const response = await cache.match(MANIFEST_KEY)
  if (!response) return null
  let manifest: OfflinePackManifest
  try { manifest = await response.json() as OfflinePackManifest } catch { verifiedPacks.set(name, null); return null }
  if (manifest.schemaVersion !== 2 || manifest.datasetSchemaVersion !== 1 || manifest.missionId !== missionId || !manifest.appVersion || !Number.isFinite(Date.parse(manifest.installedAt)) || !Number.isFinite(manifest.bytes) || !Array.isArray(manifest.resources) || !manifest.checksums || typeof manifest.checksums !== 'object' || Object.keys(manifest.checksums).length !== manifest.resources.length) {
    verifiedPacks.set(name, null)
    return null
  }
  for (const path of manifest.resources) {
    let resourceUrl: URL
    try { resourceUrl = new URL(path, location.origin) } catch { verifiedPacks.set(name, null); return null }
    if (resourceUrl.origin !== location.origin || resourceUrl.pathname !== path || !path.startsWith('/')) { verifiedPacks.set(name, null); return null }
    const cached = await cache.match(path)
    const expected = manifest.checksums[path]
    if (!cached || !/^[a-f0-9]{64}$/i.test(expected || '') || await sha256Hex(await cached.arrayBuffer()) !== expected.toLowerCase()) {
      verifiedPacks.set(name, null)
      return null
    }
  }
  verifiedPacks.set(name, manifest)
  return manifest
}

export async function hasOfflinePackData(missionId: string): Promise<boolean> {
  if (!('caches' in window)) return false
  const names = await caches.keys()
  return names.some((name) => name.startsWith(cachePrefix(missionId)) || name.startsWith(`${LEGACY_CACHE_PREFIX}${missionId}:`))
}

export async function removeOfflinePack(missionId?: string): Promise<void> {
  const names = await caches.keys()
  const matches = names.filter((name) => (name.startsWith(CACHE_PREFIX) || name.startsWith(LEGACY_CACHE_PREFIX)) && (!missionId || name.includes(`:${missionId}:`)))
  await Promise.all(matches.map((name) => caches.delete(name)))
  matches.forEach((name) => verifiedPacks.delete(name))
}
