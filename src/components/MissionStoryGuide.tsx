import { useEffect, useMemo, useState } from 'react'
import { Clock3, ExternalLink, Search, ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react'
import { GLOSSARY, MISSION_EVENTS, type MissionEvent } from '../data/missionEvents'

const CATEGORIES = ['all', ...new Set(MISSION_EVENTS.map((event) => event.category))]

export function MissionStoryGuide({ missionId, selectedEventId, onSeek }: { missionId: string; selectedEventId?: string; onSeek?: (time: string, eventId: string) => void }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [phase, setPhase] = useState('all')
  const [tourIndex, setTourIndex] = useState<number | null>(null)
  const [tourVisible, setTourVisible] = useState(false)
  const [tourPlaying, setTourPlaying] = useState(false)
  const tourEvents = useMemo(() => MISSION_EVENTS.filter((event) => event.missionId === missionId).sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt)), [missionId])
  const phases = useMemo(() => [...new Set(tourEvents.map((event) => event.phase))], [tourEvents])
  const events = useMemo(() => MISSION_EVENTS.filter((event) => event.missionId === missionId
    && (category === 'all' || event.category === category)
    && (phase === 'all' || event.phase === phase)
    && `${event.name} ${event.phase} ${event.explanation} ${event.whyItMatters}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())), [missionId, category, phase, search])

  useEffect(() => {
    if (tourVisible && tourIndex !== null) {
      const event = tourEvents[tourIndex]
      if (event) onSeek?.(event.occurredAt, event.id)
    }
  }, [onSeek, tourEvents, tourIndex, tourVisible])

  useEffect(() => {
    if (!tourVisible || !tourPlaying || tourIndex === null || tourIndex >= tourEvents.length - 1) return
    const timer = window.setInterval(() => setTourIndex((index) => index === null ? null : Math.min(index + 1, tourEvents.length - 1)), 60_000)
    return () => window.clearInterval(timer)
  }, [tourEvents.length, tourIndex, tourPlaying, tourVisible])

  useEffect(() => {
    if (tourPlaying && tourIndex === tourEvents.length - 1) setTourPlaying(false)
  }, [tourEvents.length, tourIndex, tourPlaying])

  const startOrResumeTour = () => {
    setTourIndex((index) => index === null || index >= tourEvents.length - 1 ? 0 : index)
    setTourVisible(true)
    setTourPlaying(true)
  }
  const previousTourStop = () => setTourIndex((index) => Math.max(0, (index ?? 0) - 1))
  const nextTourStop = () => setTourIndex((index) => Math.min(tourEvents.length - 1, (index ?? -1) + 1))

  return (
    <section className="glass-panel border-glow p-4 sm:p-6" aria-labelledby="story-title">
      <div>
        <p className="text-xs uppercase tracking-[.2em] text-amber-glow">Mission field guide</p>
        <h2 id="story-title" className="mt-1 font-display text-xl font-semibold text-slate-100">Explore the key moments</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">Each time is a reported event from the linked NASA record. The map uses NASA flight ephemeris and epoch-aligned JPL lunar positions; uncovered times are left blank.</p>
      </div>
      {onSeek && <div className="mt-4 rounded border border-cyan-mid/25 bg-space-900/70 p-3" aria-label="Guided mission tour">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-semibold text-slate-100">{tourVisible && tourIndex !== null ? `Guided tour · stop ${tourIndex + 1} of ${tourEvents.length}` : 'Guided mission tour'}</h3><p className="mt-1 text-xs text-slate-400">About {tourEvents.length} minutes, one sourced event per minute. The tour seeks the shared UTC clock; camera motion is never automatic.</p></div>
          {!tourVisible || tourIndex === null
            ? <button type="button" onClick={startOrResumeTour} className="inline-flex min-h-11 items-center gap-2 rounded border border-cyan-mid/30 px-3 text-sm text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"><Play className="h-4 w-4"/>{tourIndex === null ? `Start guided tour · ${tourEvents.length} min` : 'Resume guided tour'}</button>
            : <div className="flex flex-wrap gap-2">
              <button type="button" disabled={tourIndex === 0} onClick={previousTourStop} aria-label="Previous tour stop" className="inline-flex min-h-11 items-center gap-1 rounded border border-slate-600 px-3 text-sm text-slate-200 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"><ChevronLeft className="h-4 w-4"/>Previous</button>
              <button type="button" onClick={() => { if (!tourPlaying && tourIndex === tourEvents.length - 1) setTourIndex(0); setTourPlaying((playing) => !playing) }} className="inline-flex min-h-11 items-center gap-1 rounded border border-slate-600 px-3 text-sm text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">{tourPlaying ? <><Pause className="h-4 w-4"/>Pause</> : <><Play className="h-4 w-4"/>{tourIndex === tourEvents.length - 1 ? 'Start again' : 'Resume tour'}</>}</button>
              <button type="button" disabled={tourIndex >= tourEvents.length - 1} onClick={nextTourStop} aria-label="Next tour stop" className="inline-flex min-h-11 items-center gap-1 rounded border border-slate-600 px-3 text-sm text-slate-200 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">Next<ChevronRight className="h-4 w-4"/></button>
              <button type="button" onClick={() => { setTourPlaying(false); setTourVisible(false) }} className="inline-flex min-h-11 items-center gap-1 rounded border border-slate-600 px-3 text-sm text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"><X className="h-4 w-4"/>Exit tour</button>
            </div>}
        </div>
        {tourVisible && tourIndex !== null && <p role="status" aria-live="polite" className="mt-2 text-sm text-cyan-glow">{tourPlaying ? 'Playing' : tourIndex === tourEvents.length - 1 ? 'Tour complete' : 'Paused'}: {tourEvents[tourIndex]?.name}</p>}
      </div>}
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(180px,1fr)_auto] sm:items-end">
        <label className="block text-sm text-slate-300">
          <span className="mb-1 block">Search event names and explanations</span>
          <span className="flex min-h-11 items-center gap-2 rounded border border-slate-700/70 px-3 focus-within:border-cyan-glow/60">
            <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm text-slate-100 outline-none" placeholder="Launch, flyby, recovery…" />
          </span>
        </label>
        <label className="block text-sm text-slate-300">
          <span className="mb-1 block">Filter by event type</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full rounded border border-slate-700/70 bg-space-900 px-3 text-sm capitalize text-slate-100 sm:w-auto">
            {CATEGORIES.map((item) => <option key={item} value={item}>{item === 'all' ? 'All event types' : item}</option>)}
          </select>
        </label>
        <label className="block text-sm text-slate-300"><span className="mb-1 block">Filter by mission phase</span><select value={phase} onChange={(event) => setPhase(event.target.value)} className="min-h-11 w-full rounded border border-slate-700/70 bg-space-900 px-3 text-sm text-slate-100 sm:w-auto"><option value="all">All mission phases</option>{phases.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <p className="mt-3 text-xs text-slate-500" aria-live="polite">{events.length} {events.length === 1 ? 'event' : 'events'} shown</p>
      {events.length ? <ol className="mt-3 grid gap-3 lg:grid-cols-2">
        {events.map((event) => <EventCard key={event.id} event={event} selected={event.id === selectedEventId} onSeek={onSeek} />)}
      </ol> : <p className="mt-4 rounded border border-slate-700/60 p-4 text-sm text-slate-400">No events match those filters.</p>}
      <details className="mt-5 rounded border border-slate-700/60 p-3">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">Mission glossary</summary>
        <dl className="mt-2 grid gap-3 sm:grid-cols-2">
          {GLOSSARY.map((item) => <div key={item.term}><dt className="font-semibold text-cyan-glow">{item.term}</dt><dd className="mt-1 text-sm leading-relaxed text-slate-400">{item.explanation}{item.sourceUrl && <> <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-glow underline underline-offset-2">Official reference<span className="sr-only"> for {item.term} (opens in a new tab)</span></a>.</>}</dd></div>)}
        </dl>
      </details>
    </section>
  )
}

function EventCard({ event, selected, onSeek }: { event: MissionEvent; selected: boolean; onSeek?: (time: string, eventId: string) => void }) {
  return (
    <li aria-current={selected ? 'location' : undefined} className={`min-w-0 rounded border bg-space-900/70 p-4 ${selected ? 'border-cyan-glow/80 ring-1 ring-cyan-glow/40' : 'border-slate-700/60'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-cyan-glow">{event.phase} · {event.category}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-100">{event.name}{selected && <span className="ml-2 text-xs font-normal text-cyan-glow">Selected moment</span>}</h3>
        </div>
        <time className="max-w-full break-words font-mono text-xs text-slate-400 sm:shrink-0" dateTime={event.occurredAt}>
          {new Date(event.occurredAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC
        </time>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{event.explanation}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-400"><strong className="text-slate-300">Why it matters:</strong> {event.whyItMatters}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {onSeek && <button type="button" onClick={() => onSeek(event.occurredAt, event.id)} className="inline-flex min-h-11 items-center gap-2 rounded bg-cyan-glow/10 px-3 text-sm font-semibold text-cyan-glow hover:bg-cyan-glow/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">
          <Clock3 className="h-4 w-4" /> Replay this moment
        </button>}
        <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 px-2 text-sm text-slate-300 underline underline-offset-4 hover:text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">
          NASA source <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </li>
  )
}
