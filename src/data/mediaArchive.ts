import { MISSION_EVENTS } from './missionEvents'

export type MediaType = 'Gallery' | 'Mission updates' | 'Video archive'
export type MediaStatus = 'upcoming' | 'live-confirmed' | 'archive' | 'ended' | 'unavailable'
export type CaptionStatus = 'not-applicable' | 'provider-controls' | 'not-available'

export interface MediaEntry {
  id: string
  missionId: 'artemis-i' | 'artemis-ii'
  eventIds: string[]
  type: MediaType
  title: string
  published: string
  url: string
  credit: string
  reuseStatus: string
  captionStatus: CaptionStatus
  status: MediaStatus
  verifiedAt: string
  liveConfirmedAt?: string
  liveUntil?: string
}

const NASA_REUSE = 'Review the individual NASA asset notice and credit before reuse; no blanket media license is asserted here.'
const allEvents = (missionId: MediaEntry['missionId']) => MISSION_EVENTS.filter((event) => event.missionId === missionId).map((event) => event.id)

export const MEDIA_ARCHIVE: MediaEntry[] = [
  { id: 'a1-launch', missionId: 'artemis-i', eventIds: ['a1-launch'], type: 'Gallery', title: 'Artemis I Launch', published: '16 November 2022', url: 'https://www.nasa.gov/gallery/artemis-i/', credit: 'NASA imagery; each image retains its item-level credit.', reuseStatus: NASA_REUSE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a1-flight', missionId: 'artemis-i', eventIds: ['a1-flyby', 'a1-dro', 'a1-dro-departure', 'a1-return-flyby'], type: 'Gallery', title: 'Artemis I In-Flight Gallery', published: 'November–December 2022', url: 'https://www.nasa.gov/gallery/artemis-i-in-flight/', credit: 'NASA imagery; each image retains its item-level credit.', reuseStatus: NASA_REUSE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a1-timeline', missionId: 'artemis-i', eventIds: allEvents('artemis-i'), type: 'Mission updates', title: 'Artemis I Mission Timeline and Updates', published: '2022', url: 'https://www.nasa.gov/reference/artemis-i-mission-timeline/', credit: 'NASA mission updates and event descriptions.', reuseStatus: 'Text is linked to NASA; use NASA citation guidance when quoting.', captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a1-recovery', missionId: 'artemis-i', eventIds: ['a1-splashdown'], type: 'Gallery', title: 'Artemis I Splashdown', published: '11 December 2022', url: 'https://www.nasa.gov/gallery/artemis-i-splashdown/', credit: 'NASA imagery; each image retains its item-level credit.', reuseStatus: NASA_REUSE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a1-video', missionId: 'artemis-i', eventIds: allEvents('artemis-i'), type: 'Video archive', title: 'Artemis I Launch-to-Splashdown Highlights', published: '2022', url: 'https://www.nasa.gov/general/artemis-i-media-resources/', credit: 'NASA media resource page; credits are provided at the original source.', reuseStatus: NASA_REUSE, captionStatus: 'provider-controls', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a2-launch', missionId: 'artemis-ii', eventIds: ['a2-launch'], type: 'Mission updates', title: 'Artemis II Launch-Day Updates', published: '1 April 2026', url: 'https://www.nasa.gov/blogs/missions/2026/04/01/live-artemis-ii-launch-day-updates/', credit: 'NASA mission updates and item-level media credits.', reuseStatus: 'Text is linked to NASA; follow each included asset notice and citation guidance.', captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a2-journey', missionId: 'artemis-ii', eventIds: ['a2-flyby-window'], type: 'Gallery', title: 'Artemis II Journey to the Moon', published: 'April 2026', url: 'https://www.nasa.gov/gallery/journey-to-the-moon/', credit: 'NASA imagery; each image retains its item-level credit.', reuseStatus: NASA_REUSE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a2-flyby', missionId: 'artemis-ii', eventIds: ['a2-earthset', 'a2-blackout', 'a2-closest', 'a2-distance-record', 'a2-earthrise'], type: 'Gallery', title: 'Artemis II Lunar Flyby', published: '6 April 2026', url: 'https://www.nasa.gov/gallery/lunar-flyby/', credit: 'NASA imagery; each image retains its item-level credit.', reuseStatus: NASA_REUSE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a2-return', missionId: 'artemis-ii', eventIds: ['a2-splashdown', 'a2-crew-recovery'], type: 'Gallery', title: 'Artemis II Splashdown and Recovery', published: '10 April 2026', url: 'https://www.nasa.gov/gallery/artemis-ii-splashdown-and-recovery/', credit: 'NASA imagery; each image retains its item-level credit.', reuseStatus: NASA_REUSE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a2-multimedia', missionId: 'artemis-ii', eventIds: allEvents('artemis-ii'), type: 'Video archive', title: 'Artemis II Multimedia Archive', published: '2026', url: 'https://www.nasa.gov/artemis-ii-multimedia/', credit: 'NASA collection; credits remain with each original media item.', reuseStatus: NASA_REUSE, captionStatus: 'provider-controls', status: 'archive', verifiedAt: '2026-09-27' },
]

export function validateMediaArchive(entries: MediaEntry[] = MEDIA_ARCHIVE): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  const statuses: MediaStatus[] = ['upcoming', 'live-confirmed', 'archive', 'ended', 'unavailable']
  const types: MediaType[] = ['Gallery', 'Mission updates', 'Video archive']
  const captions: CaptionStatus[] = ['not-applicable', 'provider-controls', 'not-available']
  for (const item of entries) {
    if (ids.has(item.id)) issues.push(`${item.id}: duplicate stable media ID`)
    ids.add(item.id)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) issues.push(`${item.id}: invalid stable media ID`)
    if (!/^https:\/\/www\.nasa\.gov\//.test(item.url)) issues.push(`${item.id}: media URL is outside the approved NASA host`)
    if (!item.title.trim() || !item.published.trim() || !item.credit.trim() || !item.reuseStatus.trim() || !item.verifiedAt.trim()) issues.push(`${item.id}: required editorial metadata is missing`)
    if (!statuses.includes(item.status) || !types.includes(item.type) || !captions.includes(item.captionStatus)) issues.push(`${item.id}: unknown media status, type, or caption status`)
    if (!Number.isFinite(Date.parse(item.verifiedAt))) issues.push(`${item.id}: invalid editorial verification date`)
    if (item.status === 'live-confirmed' && (!item.liveConfirmedAt || !item.liveUntil || !Number.isFinite(Date.parse(item.liveConfirmedAt)) || !Number.isFinite(Date.parse(item.liveUntil)) || Date.parse(item.liveUntil) <= Date.parse(item.liveConfirmedAt))) issues.push(`${item.id}: a live confirmation needs a time-bounded source verification`)
    if (!item.eventIds.length) issues.push(`${item.id}: at least one event association is required`)
    for (const eventId of item.eventIds) if (!MISSION_EVENTS.some((event) => event.id === eventId && event.missionId === item.missionId)) issues.push(`${item.id}: unknown or cross-mission event ${eventId}`)
  }
  for (const missionId of ['artemis-i', 'artemis-ii'] as const) if (entries.filter((item) => item.missionId === missionId).length < 4) issues.push(`${missionId}: at least four media records are required`)
  return issues
}

export function effectiveMediaStatus(item: MediaEntry, now = Date.now()): MediaStatus {
  if (item.status !== 'live-confirmed') return item.status
  const verifiedAt = Date.parse(item.liveConfirmedAt || '')
  const liveUntil = Date.parse(item.liveUntil || '')
  return Number.isFinite(verifiedAt) && Number.isFinite(liveUntil) && verifiedAt <= now && now <= liveUntil && now - verifiedAt <= 15 * 60_000
    ? 'live-confirmed'
    : now > liveUntil ? 'ended' : 'unavailable'
}
