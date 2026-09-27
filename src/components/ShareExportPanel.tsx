import { useState } from 'react'
import { Bookmark, Copy, Download, Trash2 } from 'lucide-react'
import { buildMissionExportRows, missionRowsToCsv, missionRowsToJson, SAFE_EXPORT_INTERVAL_MINUTES } from '../lib/shareExport'
import type { MissionConfig } from '../data/missionData'

type BookmarkCamera = 'overview' | 'earth' | 'moon' | 'orion'
interface BookmarkEntry { id: string; label: string; epoch: string; view: '2d' | '3d'; camera: BookmarkCamera; eventId?: string }

function loadBookmarks(missionId: string): BookmarkEntry[] {
  try {
    const entries = JSON.parse(localStorage.getItem(`artemis-bookmarks:${missionId}`) || '[]') as unknown
    return Array.isArray(entries) ? entries.filter((entry): entry is BookmarkEntry => Boolean(entry && typeof entry === 'object' && typeof (entry as BookmarkEntry).id === 'string' && typeof (entry as BookmarkEntry).epoch === 'string')) : []
  } catch { return [] }
}

function download(filename: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  } finally { URL.revokeObjectURL(url) }
}

export function ShareExportPanel({ mission, missionTime, view, camera, onSeek, eventId, onRestoreBookmark }: {
  mission: MissionConfig
  missionTime: string
  view: '2d' | '3d'
  camera: BookmarkCamera
  onSeek: (time: string) => void
  eventId?: string
  onRestoreBookmark: (time: string, view: '2d' | '3d', camera: BookmarkCamera, eventId?: string) => void
}) {
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks(mission.id))
  const [status, setStatus] = useState('')
  const [label, setLabel] = useState('')
  const [start, setStart] = useState(mission.launchDate)
  const [end, setEnd] = useState(mission.splashdownDate || mission.launchDate)
  const [interval, setInterval] = useState(60)
  const [error, setError] = useState('')

  const momentUrl = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('t', missionTime)
    url.searchParams.set('view', view)
    url.searchParams.set('cam', camera)
    if (eventId) url.searchParams.set('event', eventId)
    else url.searchParams.delete('event')
    return url.toString()
  }

  const saveBookmarks = (entries: BookmarkEntry[]) => {
    setBookmarks(entries)
    try { localStorage.setItem(`artemis-bookmarks:${mission.id}`, JSON.stringify(entries)) }
    catch { setStatus('Browser storage is unavailable. Copy a link to keep this moment.') }
  }

  const saveMoment = () => {
    const entry: BookmarkEntry = { id: crypto.randomUUID(), label: label.trim() || `${mission.name} · ${new Date(missionTime).toISOString()}`, epoch: missionTime, view, camera, eventId }
    saveBookmarks([entry, ...bookmarks])
    setLabel('')
    setStatus('Moment saved in this browser only.')
  }

  const copyMoment = async () => {
    const url = momentUrl()
    try {
      await navigator.clipboard.writeText(url)
      setStatus('Share link copied.')
    } catch {
      window.prompt('Copy this mission moment link:', url)
      setStatus('The link is ready to copy.')
    }
  }

  const exportRows = () => buildMissionExportRows({ missionId: mission.id, start, end, intervalMinutes: interval })
  const exportFile = (format: 'csv' | 'json') => {
    try {
      const rows = exportRows()
      download(`${mission.id}-mission-profile.${format}`, format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8', format === 'csv' ? missionRowsToCsv(rows) : missionRowsToJson(rows))
      setError('')
      setStatus(`Exported ${rows.length.toLocaleString()} time samples from source flight ephemeris.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The selected range could not be exported.') }
  }

  return (
    <section className="glass-panel border-glow p-4 sm:p-6" aria-labelledby="share-export-title">
      <p className="text-xs uppercase tracking-[.2em] text-cyan-glow">Share and reuse</p>
      <h2 id="share-export-title" className="mt-1 font-display text-xl font-semibold text-slate-100">Keep this mission moment</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">Moment links preserve the mission, UTC time, and view. Bookmarks stay in this browser and are not synced to an account.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={copyMoment} className="inline-flex min-h-11 items-center gap-2 rounded border border-cyan-mid/30 px-3 text-sm text-cyan-glow hover:bg-cyan-glow/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"><Copy className="h-4 w-4" />Copy moment link</button>
      </div>
      <form className="mt-4 grid gap-2 sm:grid-cols-[minmax(150px,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); saveMoment() }}>
        <label className="text-sm text-slate-300">Bookmark name<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Lunar flyby" className="mt-1 min-h-11 w-full rounded border border-slate-600 bg-space-900 px-3 text-sm text-slate-100" /></label>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-slate-600 px-3 text-sm text-slate-100 hover:border-cyan-glow/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"><Bookmark className="h-4 w-4" />Save moment here</button>
      </form>
      {bookmarks.length > 0 && <ul className="mt-3 space-y-2">{bookmarks.map((bookmark) => <li key={bookmark.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-700/60 px-3 py-2"><button type="button" onClick={() => onRestoreBookmark(bookmark.epoch, bookmark.view, bookmark.camera, bookmark.eventId)} className="min-h-11 text-left text-sm text-slate-200 underline underline-offset-4 hover:text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">{bookmark.label}<span className="block font-mono text-xs text-slate-500">{bookmark.epoch} · {bookmark.view} · {bookmark.camera}</span></button><button type="button" aria-label={`Delete bookmark ${bookmark.label}`} onClick={() => saveBookmarks(bookmarks.filter((entry) => entry.id !== bookmark.id))} className="min-h-11 min-w-11 text-slate-300 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"><Trash2 className="mx-auto h-4 w-4" /></button></li>)}</ul>}

      <div className="mt-6 border-t border-slate-700/60 pt-4">
        <h3 className="text-sm font-semibold text-slate-100">Export the replay profile</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">Exports include source epochs, interpolation quality, units, coordinate frame, target ID, checksum, and explicit nulls outside coverage.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-sm text-slate-300">Start time · UTC<input value={start} onChange={(event) => setStart(event.target.value)} className="mt-1 min-h-11 w-full rounded border border-slate-600 bg-space-900 px-2 font-mono text-xs text-slate-100" /></label>
          <label className="text-sm text-slate-300">End time · UTC<input value={end} onChange={(event) => setEnd(event.target.value)} className="mt-1 min-h-11 w-full rounded border border-slate-600 bg-space-900 px-2 font-mono text-xs text-slate-100" /></label>
          <label className="text-sm text-slate-300">Sampling interval<select value={interval} onChange={(event) => setInterval(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded border border-slate-600 bg-space-900 px-2 text-sm text-slate-100">{SAFE_EXPORT_INTERVAL_MINUTES.map((minutes) => <option key={minutes} value={minutes}>{minutes === 0 ? 'Every source epoch' : `At least every ${minutes === 60 ? 'hour' : `${minutes / 60} hours`}`}</option>)}</select></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => exportFile('csv')} className="inline-flex min-h-11 items-center gap-2 rounded border border-slate-600 px-3 text-sm text-slate-100 hover:border-cyan-glow/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"><Download className="h-4 w-4" />Download CSV</button>
          <button type="button" onClick={() => exportFile('json')} className="inline-flex min-h-11 items-center gap-2 rounded border border-slate-600 px-3 text-sm text-slate-100 hover:border-cyan-glow/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"><Download className="h-4 w-4" />Download JSON</button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
        <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-green-300">{status}</p>
      </div>
    </section>
  )
}
