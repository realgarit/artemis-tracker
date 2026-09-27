import { MISSION_EVENTS } from './missionEvents'

export type MediaType = 'Gallery' | 'Mission updates' | 'Video archive'
export type MediaStatus = 'upcoming' | 'live-confirmed' | 'archive' | 'ended' | 'unavailable'
export type CaptionStatus = 'not-applicable' | 'provider-controls' | 'source-linked' | 'not-available'

export interface MediaEntry {
  id: string
  missionId: 'artemis-i' | 'artemis-ii'
  eventIds: string[]
  type: MediaType
  title: string
  published: string
  mediaDate: string
  url: string
  credit: string
  reuseStatus: string
  reuseGuidanceUrl: string
  captionStatus: CaptionStatus
  transcriptUrl?: string
  transcriptFormat?: 'SRT' | 'VTT'
  status: MediaStatus
  verifiedAt: string
  liveConfirmedAt?: string
  liveUntil?: string
}

const NASA_REUSE = 'NASA says its factual educational/informational content is generally not subject to U.S. copyright. Marked third-party material, identifiable-person rights, NASA identifiers, and promotional or commercial use can require separate clearance. This card links only and asserts no blanket license.'
const NASA_REUSE_GUIDANCE = 'https://www.nasa.gov/nasa-brand-center/images-and-media/'
const allEvents = (missionId: MediaEntry['missionId']) => MISSION_EVENTS.filter((event) => event.missionId === missionId).map((event) => event.id)

export const MEDIA_ARCHIVE: MediaEntry[] = [
  { id: 'a1-launch', missionId: 'artemis-i', eventIds: ['a1-launch'], type: 'Gallery', title: 'Artemis I Launch', published: 'Not stated by the gallery page', mediaDate: '16 November 2022', url: 'https://www.nasa.gov/gallery/artemis-i/', credit: 'Checked launch image: NASA/Joel Kowsky; each gallery item retains its own displayed credit.', reuseStatus: NASA_REUSE, reuseGuidanceUrl: NASA_REUSE_GUIDANCE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a1-flight', missionId: 'artemis-i', eventIds: ['a1-flyby', 'a1-dro', 'a1-dro-departure', 'a1-return-flyby'], type: 'Gallery', title: 'Artemis I In-Flight Gallery', published: 'Not stated by the gallery page', mediaDate: '21 November–10 December 2022', url: 'https://www.nasa.gov/gallery/artemis-i-in-flight/', credit: 'Checked flight-day 12 lunar image art001e001464; its NASA detail page gives the NASA/JSC producer context but no separate photographer credit.', reuseStatus: NASA_REUSE, reuseGuidanceUrl: NASA_REUSE_GUIDANCE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a1-timeline', missionId: 'artemis-i', eventIds: allEvents('artemis-i'), type: 'Mission updates', title: 'Artemis I Mission Timeline and Updates', published: 'Updated 3 September 2026', mediaDate: '16 November–11 December 2022', url: 'https://www.nasa.gov/reference/artemis-i-mission-timeline/', credit: 'NASA mission timeline and event descriptions; lead image credit: NASA/Joel Kowsky.', reuseStatus: 'NASA text is linked to its source; credit NASA and follow NASA citation guidance when quoting.', reuseGuidanceUrl: NASA_REUSE_GUIDANCE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a1-recovery', missionId: 'artemis-i', eventIds: ['a1-splashdown'], type: 'Gallery', title: 'Artemis I Splashdown', published: 'Not stated by the gallery page', mediaDate: '11 December 2022', url: 'https://www.nasa.gov/gallery/artemis-i-splashdown/', credit: 'Checked Orion splashdown image: NASA/Kim Shiflett; each gallery item retains its own displayed credit.', reuseStatus: NASA_REUSE, reuseGuidanceUrl: NASA_REUSE_GUIDANCE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a1-video', missionId: 'artemis-i', eventIds: allEvents('artemis-i'), type: 'Video archive', title: 'NASA’s Artemis I Moon Mission: Launch to Splashdown Highlights', published: '17 June 2025', mediaDate: '16 November–11 December 2022', url: 'https://science.nasa.gov/resource/nasas-artemis-i-moon-mission-launch-to-splashdown-highlights/', credit: 'NASA, as stated on the NASA Science video resource page.', reuseStatus: NASA_REUSE, reuseGuidanceUrl: NASA_REUSE_GUIDANCE, captionStatus: 'not-available', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a2-launch', missionId: 'artemis-ii', eventIds: ['a2-launch'], type: 'Mission updates', title: 'Artemis II Launch-Day Updates', published: '1 April 2026', mediaDate: '1 April 2026', url: 'https://www.nasa.gov/blogs/missions/2026/04/01/live-artemis-ii-launch-day-updates/', credit: 'NASA mission updates; lead launch image credit: NASA/Joel Kowsky.', reuseStatus: 'NASA text is linked to its source; credit NASA and follow each included asset notice and NASA citation guidance when quoting.', reuseGuidanceUrl: NASA_REUSE_GUIDANCE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a2-journey', missionId: 'artemis-ii', eventIds: ['a2-flyby-window'], type: 'Gallery', title: 'Artemis II Journey to the Moon', published: 'Not stated by the gallery page', mediaDate: '2–6 April 2026', url: 'https://www.nasa.gov/gallery/journey-to-the-moon/', credit: 'Checked image art002e023710: NASA; other gallery images retain their own displayed credit.', reuseStatus: NASA_REUSE, reuseGuidanceUrl: NASA_REUSE_GUIDANCE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a2-flyby', missionId: 'artemis-ii', eventIds: ['a2-earthset', 'a2-blackout', 'a2-closest', 'a2-distance-record', 'a2-earthrise'], type: 'Gallery', title: 'Artemis II Lunar Flyby', published: '7 April 2026', mediaDate: '6–8 April 2026', url: 'https://www.nasa.gov/gallery/lunar-flyby/', credit: 'Checked image art002e015231: NASA; other gallery images retain their own displayed credit.', reuseStatus: NASA_REUSE, reuseGuidanceUrl: NASA_REUSE_GUIDANCE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a2-return', missionId: 'artemis-ii', eventIds: ['a2-splashdown', 'a2-crew-recovery'], type: 'Gallery', title: 'Artemis II Splashdown and Recovery', published: 'Not stated by the gallery page', mediaDate: '10–11 April 2026', url: 'https://www.nasa.gov/gallery/artemis-ii-splashdown-and-recovery/', credit: 'Checked recovery image artemis-ii-recovery-131: NASA/Bill Ingalls; other gallery images retain their own displayed credit.', reuseStatus: NASA_REUSE, reuseGuidanceUrl: NASA_REUSE_GUIDANCE, captionStatus: 'not-applicable', status: 'archive', verifiedAt: '2026-09-27' },
  { id: 'a2-multimedia', missionId: 'artemis-ii', eventIds: ['a2-flyby-window'], type: 'Video archive', title: 'Artemis II Day 5 Wrapup', published: '6 May 2026', mediaDate: 'Artemis II flight day 5 (calendar date not stated on the source page)', url: 'https://svs.gsfc.nasa.gov/15012', credit: 'NASA’s Goddard Space Flight Center; video produced by Liz Wilk and Ryan Fitzgibbons; music “Timeless Icons” by Universal Production Music.', reuseStatus: 'The NASA page identifies third-party music but grants no separate music reuse right. This card links to NASA and its English SRT captions; do not redistribute the video or soundtrack.', reuseGuidanceUrl: NASA_REUSE_GUIDANCE, captionStatus: 'source-linked', transcriptUrl: 'https://svs.gsfc.nasa.gov/vis/a010000/a015000/a015012/Wrap_up_Day_5_Vertical_YouTube.en_US.srt', transcriptFormat: 'SRT', status: 'archive', verifiedAt: '2026-09-27' },
]

export function validateMediaArchive(entries: MediaEntry[] = MEDIA_ARCHIVE): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  const statuses: MediaStatus[] = ['upcoming', 'live-confirmed', 'archive', 'ended', 'unavailable']
  const types: MediaType[] = ['Gallery', 'Mission updates', 'Video archive']
  const captions: CaptionStatus[] = ['not-applicable', 'provider-controls', 'source-linked', 'not-available']
  const approvedHosts = new Set(['www.nasa.gov', 'science.nasa.gov', 'svs.gsfc.nasa.gov'])
  for (const item of entries) {
    if (ids.has(item.id)) issues.push(`${item.id}: duplicate stable media ID`)
    ids.add(item.id)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) issues.push(`${item.id}: invalid stable media ID`)
    try {
      if (new URL(item.url).protocol !== 'https:' || !approvedHosts.has(new URL(item.url).hostname)) issues.push(`${item.id}: media URL is outside the approved NASA host`)
    } catch { issues.push(`${item.id}: invalid media URL`) }
    if (!item.title.trim() || !item.published.trim() || !item.mediaDate.trim() || !item.credit.trim() || !item.reuseStatus.trim() || !item.reuseGuidanceUrl.trim() || !item.verifiedAt.trim()) issues.push(`${item.id}: required editorial metadata is missing`)
    try {
      const guidance = new URL(item.reuseGuidanceUrl)
      if (guidance.protocol !== 'https:' || guidance.hostname !== 'www.nasa.gov') issues.push(`${item.id}: reuse guidance must link to NASA`)
    } catch { issues.push(`${item.id}: invalid reuse-guidance URL`) }
    if (item.captionStatus === 'source-linked' && !item.transcriptUrl) issues.push(`${item.id}: source-linked captions need a transcript URL`)
    if (item.transcriptUrl) {
      try {
        const transcript = new URL(item.transcriptUrl)
        if (transcript.protocol !== 'https:' || transcript.hostname !== 'svs.gsfc.nasa.gov') issues.push(`${item.id}: transcript URL is outside the approved NASA SVS host`)
      } catch { issues.push(`${item.id}: invalid transcript URL`) }
      if (item.captionStatus !== 'source-linked' || !item.transcriptFormat) issues.push(`${item.id}: transcript URL needs source-linked status and a format`)
    }
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
