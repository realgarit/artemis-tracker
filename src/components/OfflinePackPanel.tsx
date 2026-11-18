import { useEffect, useState } from 'react'
import { Download, HardDrive, Trash2 } from 'lucide-react'
import type { MissionConfig } from '../data/missionData'
import { downloadMissionPack, estimateMissionPackBytes, explainOfflinePackFailure, getOfflinePack, hasOfflinePackData, removeOfflinePack, type OfflinePackManifest } from '../lib/offline'

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatCacheAge(instant: string): string {
  const elapsed = Date.now() - Date.parse(instant)
  if (!Number.isFinite(elapsed) || elapsed < 0) return 'installation time has clock skew'
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return hours < 48 ? `${hours} h ago` : `${Math.floor(hours / 24)} d ago`
}

export function OfflinePackPanel({ mission, onPackChange }: { mission: MissionConfig; onPackChange?: (manifest: OfflinePackManifest | null) => void }) {
  const [manifest, setManifest] = useState<OfflinePackManifest | null>(null)
  const [include3D, setInclude3D] = useState(false)
  const [estimate, setEstimate] = useState<number | null>(null)
  const [storage, setStorage] = useState<string>('')
  const [status, setStatus] = useState('')
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [busy, setBusy] = useState(false)
  const supported = typeof window !== 'undefined' && 'caches' in window && 'serviceWorker' in navigator

  useEffect(() => {
    if (!supported || mission.status !== 'completed') return
    let active = true
    void getOfflinePack(mission.id).then(async (value) => {
      const needsRefresh = !value && await hasOfflinePackData(mission.id)
      if (active) { setManifest(value); onPackChange?.(value); setNeedsRefresh(needsRefresh) }
    }).catch(() => { if (active) { setManifest(null); onPackChange?.(null); setNeedsRefresh(false) } })
    void navigator.storage?.estimate?.().then((estimate) => {
      if (active) setStorage(estimate.quota ? `${formatBytes(estimate.usage || 0)} used of about ${formatBytes(estimate.quota)}` : 'Storage quota is not reported by this browser.')
    }).catch(() => { if (active) setStorage('Storage availability is not reported by this browser.') })
    return () => { active = false }
  }, [mission.id, mission.status, supported, onPackChange])

  const refreshEstimate = async (threeD: boolean) => {
    setEstimate(null)
    try { setEstimate(await estimateMissionPackBytes(mission.id, threeD)) }
    catch { setStatus('A size estimate is not available. The pack can still be downloaded when the connection is stable.') }
  }

  const installPack = async () => {
    setBusy(true)
    setStatus('Preparing the offline pack…')
    try {
      const result = await downloadMissionPack(mission.id, include3D, (progress) => setStatus(`Downloading ${progress.loaded} of ${progress.total}: ${progress.resource}`))
      setManifest(result)
      setNeedsRefresh(false)
      onPackChange?.(result)
      setStatus(`Offline pack ready: ${formatBytes(result.bytes)} across ${result.resources.length} resources.`)
      void navigator.storage?.estimate?.().then((value) => setStorage(value.quota ? `${formatBytes(value.usage || 0)} used of about ${formatBytes(value.quota)}` : 'Storage quota is not reported by this browser.'))
    } catch (error) { setStatus(explainOfflinePackFailure(error)) }
    finally { setBusy(false) }
  }

  const removePack = async () => {
    setBusy(true)
    try {
      await removeOfflinePack(mission.id)
      setManifest(null)
      setNeedsRefresh(false)
      onPackChange?.(null)
      setStatus(`${mission.name} offline pack removed.`)
      void navigator.storage?.estimate?.().then((value) => setStorage(value.quota ? `${formatBytes(value.usage || 0)} used of about ${formatBytes(value.quota)}` : 'Storage quota is not reported by this browser.'))
    } catch { setStatus('The browser could not remove the offline pack.') }
    finally { setBusy(false) }
  }

  const clearAllPacks = async () => {
    setBusy(true)
    try {
      await removeOfflinePack()
      setManifest(null)
      setNeedsRefresh(false)
      onPackChange?.(null)
      setStatus('All Artemis offline mission packs were removed from this browser.')
      void navigator.storage?.estimate?.().then((value) => setStorage(value.quota ? `${formatBytes(value.usage || 0)} used of about ${formatBytes(value.quota)}` : 'Storage quota is not reported by this browser.'))
    } catch { setStatus('The browser could not clear offline mission packs.') }
    finally { setBusy(false) }
  }

  if (mission.status !== 'completed') return null

  return (
    <section className="sheet p-4 sm:p-6" aria-labelledby="offline-pack-title">
      <p className="eyebrow">Classroom and travel mode</p>
      <h2 id="offline-pack-title" className="mt-1 font-display text-2xl font-semibold text-ink">Download this mission for offline use</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-2">The pack saves the app shell, mission replay, story text, NASA links, and the last published Earth-context snapshots. Offline mode labels cached values and their observation times. External pages and videos still need a connection.</p>
      {!supported ? <p className="mt-3 text-sm text-signal">This browser does not provide service workers and local caches, so offline packs are unavailable.</p> : <>
        <div className="mt-4 rounded-xs border border-rule p-3">
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink"><input type="checkbox" checked={include3D} onChange={(event) => { setInclude3D(event.target.checked); void refreshEstimate(event.target.checked) }} className="h-5 w-5 accent-signal-hot"/>Include the optional Orion model and 3D textures</label>
          <p className="mt-1 pl-8 text-xs text-ink-3">The 2D and text replay is always included. Adding the optional model and textures increases the download size and storage use; the Orion model retains its published GPL-3.0 license.</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-3"><button type="button" onClick={() => void refreshEstimate(include3D)} className="min-h-11 underline underline-offset-4 hover:text-blue">Estimate download size</button>{estimate !== null && <span>Estimated transfer: {formatBytes(estimate)}</span>}</div>
        </div>
        {storage && <p className="mt-3 flex items-center gap-2 text-xs text-ink-3"><HardDrive className="h-4 w-4"/>{storage}</p>}
        {manifest && <p className="mt-2 text-xs text-ok">Verified app v{manifest.appVersion} · installed {formatCacheAge(manifest.installedAt)} · {formatBytes(manifest.bytes)} · {manifest.resources.length} checked resources{manifest.optional3D ? ' · 3D included' : ''}</p>}
        {needsRefresh && <p role="status" className="mt-2 rounded-xs border border-signal p-3 text-sm text-signal">An older or damaged mission pack is not compatible with this app version. Connect to update the pack, or clear all offline content. It will not be used for replay.</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => void installPack()} className="btn btn-solid"><Download className="h-4 w-4"/>{busy ? 'Working…' : manifest ? 'Update offline pack' : 'Download offline pack'}</button>
          {manifest && <button type="button" disabled={busy} onClick={() => void removePack()} className="btn"><Trash2 className="h-4 w-4"/>Remove this pack</button>}
          <button type="button" disabled={busy} onClick={() => void clearAllPacks()} className="min-h-11 rounded-xs px-3 text-sm text-ink-2 underline underline-offset-4 hover:text-bad">Clear all offline mission packs</button>
        </div>
        <p role="status" aria-live="polite" className="mt-2 min-h-5 break-words text-sm text-ink-2">{status}</p>
      </>}
    </section>
  )
}
