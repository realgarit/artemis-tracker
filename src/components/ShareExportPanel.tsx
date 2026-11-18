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
    <section className="sheet p-4 sm:p-6" aria-labelledby="share-export-title">
      <p className="eyebrow">Share and reuse</p>
      <h2 id="share-export-title" className="mt-1 font-display text-2xl font-semibold text-ink">Keep this mission moment</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">Moment links preserve the mission, UTC time, and view. Bookmarks stay in this browser and are not synced to an account.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={copyMoment} className="btn btn-solid"><Copy className="h-4 w-4" />Copy moment link</button>
      </div>
      <form className="mt-4 grid gap-2 sm:grid-cols-[minmax(150px,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); saveMoment() }}>
        <label className="text-sm text-ink-2">Bookmark name<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Lunar flyby" className="mt-1 field w-full " /></label>
        <button type="submit" className="btn self-end"><Bookmark className="h-4 w-4" />Save moment here</button>
      </form>
      {bookmarks.length > 0 && <ul className="mt-3 space-y-2">{bookmarks.map((bookmark) => <li key={bookmark.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xs border border-rule px-3 py-2"><button type="button" onClick={() => onRestoreBookmark(bookmark.epoch, bookmark.view, bookmark.camera, bookmark.eventId)} className="min-h-11 text-left text-sm text-ink underline underline-offset-4 hover:text-blue">{bookmark.label}<span className="block font-mono text-xs text-ink-3">{bookmark.epoch} · {bookmark.view} · {bookmark.camera}</span></button><button type="button" aria-label={`Delete bookmark ${bookmark.label}`} onClick={() => saveBookmarks(bookmarks.filter((entry) => entry.id !== bookmark.id))} className="min-h-11 min-w-11 text-ink-2 hover:text-bad"><Trash2 className="mx-auto h-4 w-4" /></button></li>)}</ul>}

      <div className="mt-6 border-t border-rule pt-4">
        <h3 className="text-sm font-semibold text-ink">Export the replay profile</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-3">Exports include source epochs, interpolation quality, center distances, sampled velocity-vector acceleration, units, coordinate frame, target ID, checksum, and explicit nulls outside coverage.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-sm text-ink-2">Start time · UTC<input value={start} onChange={(event) => setStart(event.target.value)} className="mt-1 field w-full  font-mono text-xs text-ink" /></label>
          <label className="text-sm text-ink-2">End time · UTC<input value={end} onChange={(event) => setEnd(event.target.value)} className="mt-1 field w-full  font-mono text-xs text-ink" /></label>
          <label className="text-sm text-ink-2">Sampling interval<select value={interval} onChange={(event) => setInterval(Number(event.target.value))} className="mt-1 field w-full ">{SAFE_EXPORT_INTERVAL_MINUTES.map((minutes) => <option key={minutes} value={minutes}>{minutes === 0 ? 'Every source epoch' : `At least every ${minutes === 60 ? 'hour' : `${minutes / 60} hours`}`}</option>)}</select></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => exportFile('csv')} className="btn"><Download className="h-4 w-4" />Download CSV</button>
          <button type="button" onClick={() => exportFile('json')} className="btn"><Download className="h-4 w-4" />Download JSON</button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}
        <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-ok">{status}</p>
      </div>
    </section>
  )
}
