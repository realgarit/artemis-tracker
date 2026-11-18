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
    <section className="sheet p-4 sm:p-6" aria-labelledby="story-title">
      <div>
        <p className="eyebrow">Mission field guide</p>
        <h2 id="story-title" className="mt-1 font-display text-2xl font-semibold text-ink">Explore the key moments</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-2">Each time is a reported event from the linked NASA record. The map uses NASA flight ephemeris and epoch-aligned JPL lunar positions; uncovered times are left blank.</p>
      </div>
      {onSeek && <div className="plate mt-4 p-4" aria-label="Guided mission tour">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-semibold text-ink">{tourVisible && tourIndex !== null ? `Guided tour · stop ${tourIndex + 1} of ${tourEvents.length}` : 'Guided mission tour'}</h3><p className="mt-1 text-xs text-ink-3">About {tourEvents.length} minutes, one sourced event per minute. The tour seeks the shared UTC clock; camera motion is never automatic.</p></div>
          {!tourVisible || tourIndex === null
            ? <button type="button" onClick={startOrResumeTour} className="btn btn-solid"><Play className="h-4 w-4"/>{tourIndex === null ? `Start guided tour · ${tourEvents.length} min` : 'Resume guided tour'}</button>
            : <div className="flex flex-wrap gap-2">
              <button type="button" disabled={tourIndex === 0} onClick={previousTourStop} aria-label="Previous tour stop" className="btn"><ChevronLeft className="h-4 w-4"/>Previous</button>
              <button type="button" onClick={() => { if (!tourPlaying && tourIndex === tourEvents.length - 1) setTourIndex(0); setTourPlaying((playing) => !playing) }} className="btn">{tourPlaying ? <><Pause className="h-4 w-4"/>Pause</> : <><Play className="h-4 w-4"/>{tourIndex === tourEvents.length - 1 ? 'Start again' : 'Resume tour'}</>}</button>
              <button type="button" disabled={tourIndex >= tourEvents.length - 1} onClick={nextTourStop} aria-label="Next tour stop" className="btn">Next<ChevronRight className="h-4 w-4"/></button>
              <button type="button" onClick={() => { setTourPlaying(false); setTourVisible(false) }} className="btn"><X className="h-4 w-4"/>Exit tour</button>
            </div>}
        </div>
        {tourVisible && tourIndex !== null && <p role="status" aria-live="polite" className="mt-2 font-mono text-sm text-signal">{tourPlaying ? 'Playing' : tourIndex === tourEvents.length - 1 ? 'Tour complete' : 'Paused'}: {tourEvents[tourIndex]?.name}</p>}
      </div>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[minmax(220px,1fr)_auto_auto]">
        <label className="block text-sm text-ink-2">
          <span className="mb-1 block">Search event names and explanations</span>
          <span className="field flex items-center gap-2 focus-within:outline focus-within:outline-2 focus-within:outline-blue">
            <Search className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm text-ink outline-none" placeholder="Launch, flyby, recovery…" />
          </span>
        </label>
        <label className="block text-sm text-ink-2">
          <span className="mb-1 block">Filter by event type</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="field w-full  capitalize text-ink sm:w-auto">
            {CATEGORIES.map((item) => <option key={item} value={item}>{item === 'all' ? 'All event types' : item}</option>)}
          </select>
        </label>
        <label className="block text-sm text-ink-2"><span className="mb-1 block">Filter by mission phase</span><select value={phase} onChange={(event) => setPhase(event.target.value)} className="field w-full  sm:w-auto"><option value="all">All mission phases</option>{phases.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <p className="mt-3 text-xs text-ink-3" aria-live="polite">{events.length} {events.length === 1 ? 'event' : 'events'} shown</p>
      {events.length ? <ol className="mt-3 grid gap-3 lg:grid-cols-2">
        {events.map((event) => <EventCard key={event.id} event={event} selected={event.id === selectedEventId} onSeek={onSeek} />)}
      </ol> : <p className="mt-4 rounded-xs border border-rule p-4 text-sm text-ink-3">No events match those filters.</p>}
      <details className="mt-5 rounded-xs border border-rule p-3">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">Mission glossary</summary>
        <dl className="mt-2 grid gap-3 sm:grid-cols-2">
          {GLOSSARY.map((item) => <div key={item.term}><dt className="font-semibold text-blue">{item.term}</dt><dd className="mt-1 text-sm leading-relaxed text-ink-2">{item.explanation}{item.sourceUrl && <> <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center px-1 text-blue underline underline-offset-2">Official reference<span className="sr-only"> for {item.term} (opens in a new tab)</span></a>.</>}</dd></div>)}
        </dl>
      </details>
    </section>
  )
}

function EventCard({ event, selected, onSeek }: { event: MissionEvent; selected: boolean; onSeek?: (time: string, eventId: string) => void }) {
  return (
    <li id={event.id} aria-current={selected ? 'location' : undefined} className={`min-w-0 border bg-paper p-4 ${selected ? 'border-signal-hot shadow-[inset_4px_0_0_var(--color-signal-hot)]' : 'border-rule'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow">{event.phase} · {event.category}</p>
          <h3 className="mt-1 text-base font-semibold text-ink">{event.name}{selected && <span className="ml-2 font-mono text-xs font-normal uppercase tracking-wider text-signal">Selected moment</span>}</h3>
        </div>
        <time className="max-w-full break-words font-mono text-xs text-ink-3 sm:shrink-0" dateTime={event.occurredAt}>
          {new Date(event.occurredAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC
        </time>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">{event.explanation}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-2"><strong className="text-ink-2">Why it matters:</strong> {event.whyItMatters}</p>
      {event.correctionHistory?.map((correction, index) => <p key={`${correction.correctedAt}-${index}`} className="mt-2 rounded-xs border border-signal px-3 py-2 text-xs leading-relaxed text-ink-3">Editorial correction {new Date(correction.correctedAt).toLocaleDateString('en-GB', { dateStyle: 'medium', timeZone: 'UTC' })}: {correction.field} changed from “{correction.previousValue}” to “{correction.correctedValue}”. {correction.reason} <a href={correction.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center px-1 text-blue underline underline-offset-2">Correction source</a></p>)}
      <div className="mt-3 flex flex-wrap gap-2">
        {onSeek && <button type="button" onClick={() => onSeek(event.occurredAt, event.id)} className="btn">
          <Clock3 className="h-4 w-4" /> Replay this moment
        </button>}
        <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 px-2 text-sm text-ink-2 underline underline-offset-4 hover:text-blue">
          NASA source <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </li>
  )
}
