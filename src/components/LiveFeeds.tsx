import { useMemo, useState } from 'react'
import { ExternalLink, Images } from 'lucide-react'
import { effectiveMediaStatus, MEDIA_ARCHIVE } from '../data/mediaArchive'
import { MISSION_EVENTS } from '../data/missionEvents'

export function LiveFeeds({ missionId, onSeek }: { missionId: string; onSeek?: (time: string, eventId: string) => void }) {
  const activeMissionLabel = missionId === 'artemis-i' ? 'Artemis I' : missionId === 'artemis-ii' ? 'Artemis II' : missionId
  const [selectedMission, setSelectedMission] = useState(missionId)
  const [eventId, setEventId] = useState('all')
  const [type, setType] = useState('all')
  const availableEvents = useMemo(() => MISSION_EVENTS.filter((item) => selectedMission === 'all' || item.missionId === selectedMission), [selectedMission])
  const entries = useMemo(() => MEDIA_ARCHIVE.filter((item) => (selectedMission === 'all' || item.missionId === selectedMission)
    && (eventId === 'all' || item.eventIds.includes(eventId))
    && (type === 'all' || item.type === type)), [selectedMission, eventId, type])

  return (
    <section className="sheet min-w-0 p-4 sm:p-6" aria-labelledby="media-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2"><Images className="h-5 w-5 text-blue" aria-hidden="true" /><div><p className="eyebrow">NASA source archive</p><h2 id="media-title" className="mt-1 font-display text-2xl font-semibold text-ink">{activeMissionLabel} mission media</h2></div></div>
        <span className="rounded-xs border border-rule px-2 py-1 text-xs text-ink-2">Historical and archived links</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">Every card opens its original NASA page after you choose it; nothing embeds, autoplays, or copies the media. The cards are historical archives, not live-stream claims. Each item’s reuse notice and credit remain on its NASA page.</p>
      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block min-w-0 text-sm text-ink-2"><span className="mb-1 block">Filter by mission</span><select value={selectedMission} onChange={(e) => { setSelectedMission(e.target.value); setEventId('all') }} className="field w-full min-w-0 max-w-full "><option value="all">Both missions</option><option value="artemis-i">Artemis I</option><option value="artemis-ii">Artemis II</option></select></label>
        <label className="block min-w-0 text-sm text-ink-2"><span className="mb-1 block">Filter by event</span><select value={eventId} onChange={(e) => setEventId(e.target.value)} className="field w-full min-w-0 max-w-full "><option value="all">All events</option>{availableEvents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block min-w-0 text-sm text-ink-2"><span className="mb-1 block">Filter by media type</span><select value={type} onChange={(e) => setType(e.target.value)} className="field w-full min-w-0 max-w-full "><option value="all">All types</option>{['Gallery', 'Mission updates', 'Video archive'].map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <p className="mt-2 text-xs text-ink-3" aria-live="polite">{entries.length} curated resources</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((item) => <li key={item.id} className="flex min-w-0 flex-col border border-rule bg-paper p-4">
          <p className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-signal"><span>{item.type} · {item.missionId.toUpperCase()}</span><span className="rounded-xs border border-rule px-2 py-1">{effectiveMediaStatus(item).replace('-', ' ')}</span></p>
          <h3 className="mt-2 flex-1 text-base font-semibold text-ink">{item.title}</h3>
          <p className="mt-2 text-xs text-ink-3">Source page: {item.published}</p>
          <p className="mt-1 text-xs text-ink-3">Media date: {item.mediaDate}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink-3">Credit: {item.credit}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-3">Reuse: {item.reuseStatus}</p>
          <a href={item.reuseGuidanceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center text-xs text-ink-3 underline underline-offset-4 hover:text-blue">NASA media-use guidance<span className="sr-only"> in a new tab</span></a>
          <p className="mt-1 text-xs leading-relaxed text-ink-3">{item.captionStatus === 'not-applicable' ? 'Captions: not applicable to this text or image collection.' : item.captionStatus === 'not-available' ? 'Captions or transcript were not listed at the last editorial check.' : item.captionStatus === 'source-linked' ? 'An English transcript is linked directly from the NASA source.' : 'Caption availability varies by NASA video. Check the linked provider; this archive does not assert captions are present or copy transcripts.'}</p>
          {item.transcriptUrl && <a href={item.transcriptUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center text-xs text-blue underline underline-offset-4 hover:text-signal">Open source transcript ({item.transcriptFormat})<span className="sr-only"> in a new tab</span></a>}
          <div className="mt-2 flex flex-wrap gap-2">{item.eventIds.map((id) => {
            const event = MISSION_EVENTS.find((candidate) => candidate.id === id)
            if (!event) return null
            const href = `/${event.missionId}?t=${encodeURIComponent(new Date(event.occurredAt).toISOString())}&view=2d&event=${encodeURIComponent(event.id)}`
            return event.missionId === missionId && onSeek
              ? <button key={id} type="button" onClick={() => onSeek(event.occurredAt, event.id)} className="min-h-11 self-start text-left text-sm text-ink-2 underline underline-offset-4 hover:text-blue">Replay: {event.name}</button>
              : <a key={id} href={href} className="inline-flex min-h-11 items-center text-sm text-ink-2 underline underline-offset-4 hover:text-blue">Replay: {event.name}</a>
          })}</div>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-blue underline underline-offset-4 hover:text-signal">Open NASA resource <ExternalLink className="h-4 w-4" /><span className="sr-only"> in a new tab</span></a>
        </li>)}
      </ul>
    </section>
  )
}
