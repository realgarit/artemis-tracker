import { useEffect, useMemo, useState } from 'react'
import { Link } from 'wouter'
import { ExternalLink } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ARTEMIS_I, ARTEMIS_II } from '../data/missionData'
import { getMissionTrajectory, horizonsToThree, buildMissionProfiles, type MissionProfiles } from '../data/trajectoryData'
import { MISSION_EVENTS } from '../data/missionEvents'
import { Header } from '../components/Header'
import { DataSourceBadge } from '../components/DataSourceBadge'
import { useFlightEphemeris } from '../lib/api'
import { alignTimedValues, differenceWithinCoverage, mergeAlignedValues, nearestCoveredRow, type ComparisonRow } from '../lib/comparison'

type Alignment = 'elapsed' | 'utc' | 'event'
type Metric = 'distance' | 'velocity'
type Anchor = 'launch' | 'lunar-flyby' | 'splashdown'
type FlownMissionId = 'artemis-i' | 'artemis-ii'

const FLOWN_MISSION_IDS: FlownMissionId[] = ['artemis-i', 'artemis-ii']

function missionConfig(missionId: FlownMissionId) {
  return missionId === 'artemis-i' ? ARTEMIS_I : ARTEMIS_II
}

function initialChoice<T extends string>(name: string, choices: T[], fallback: T): T {
  const value = new URL(window.location.href).searchParams.get(name)
  return choices.find((choice) => choice === value) || fallback
}

function launchEpoch(missionId: FlownMissionId): number {
  return Date.parse(missionConfig(missionId).launchDate)
}

function eventEpoch(missionId: FlownMissionId, anchor: Anchor): number {
  if (anchor === 'launch') return launchEpoch(missionId)
  if (anchor === 'splashdown') return Date.parse(missionConfig(missionId).splashdownDate)
  const eventId = missionId === 'artemis-i' ? 'a1-flyby' : 'a2-closest'
  return Date.parse(MISSION_EVENTS.find((event) => event.id === eventId)!.occurredAt)
}

function eventAnchorLabel(anchor: Anchor): string {
  return anchor === 'launch' ? 'Launch' : anchor === 'lunar-flyby' ? 'Lunar closest approach' : 'Splashdown'
}

function initialSelectedX(): number | null {
  const raw = new URL(window.location.href).searchParams.get('at')
  if (raw === null || raw.trim() === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function SummaryCard({ label, profiles, kind }: { label: string; profiles: MissionProfiles; kind: 'artemis-i' | 'artemis-ii' }) {
  const provenance = getMissionTrajectory(kind)?.provenance
  const formatUtc = (epoch: number) => new Date(epoch).toISOString().replace('.000Z', 'Z')
  return <section className="sheet min-w-0 p-4" aria-label={`${label} sampled mission summary`}>
    <h3 className="font-semibold text-ink">{label}</h3>
    {provenance && <div className="mt-1"><DataSourceBadge provenance={provenance}/></div>}
    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
      <div><dt className="text-xs text-ink-3">NASA OEM coverage duration</dt><dd className="mt-1 font-mono text-ink">{(profiles.coverageDurationHours / 24).toFixed(2)} days</dd></div>
      <div><dt className="text-xs text-ink-3">Farthest sampled distance from Earth center</dt><dd className="mt-1 font-mono text-ink">{profiles.maximumEarthDistanceKm.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} km</dd><dd className="text-xs text-ink-3">{formatUtc(profiles.maximumEarthDistanceKm.timestamp)}</dd></div>
      <div><dt className="text-xs text-ink-3">Fastest sampled speed</dt><dd className="mt-1 font-mono text-ink">{profiles.maximumSpeedKmS.value.toFixed(3)} km/s</dd><dd className="text-xs text-ink-3">{formatUtc(profiles.maximumSpeedKmS.timestamp)}</dd></div>
      <div><dt className="text-xs text-ink-3">Closest sampled distance to Moon center</dt><dd className="mt-1 font-mono text-ink">{profiles.minimumMoonCenterDistanceKm ? `${Math.round(profiles.minimumMoonCenterDistanceKm.value).toLocaleString()} km` : 'Unavailable'}</dd><dd className="text-xs text-ink-3">{profiles.minimumMoonCenterDistanceKm ? formatUtc(profiles.minimumMoonCenterDistanceKm.timestamp) : 'No paired lunar coverage'}</dd></div>
    </dl>
    <p className="mt-3 text-xs leading-relaxed text-ink-3">Summaries use {profiles.sampleCount.toLocaleString()} NASA spacecraft epochs and JPL lunar samples, with a median spacecraft step of {profiles.medianSourceStepMinutes.toFixed(1)} minutes. Extrema are sampled values, not exact continuous-flight extrema.</p>
  </section>
}

function OrbitThumbnail({ missionId, label }: { missionId: string; label: string }) {
  const config = getMissionTrajectory(missionId)!
  const pathPoints = config.trajectory.map(horizonsToThree)
  const minX = Math.min(0, ...pathPoints.map((point) => point.x))
  const maxX = Math.max(0, ...pathPoints.map((point) => point.x))
  const minY = Math.min(0, ...pathPoints.map((point) => point.z))
  const maxY = Math.max(0, ...pathPoints.map((point) => point.z))
  const width = Math.max(1, maxX - minX), height = Math.max(1, maxY - minY)
  const scale = Math.min(720 / width, 220 / height)
  const project = (point: { x: number; z: number }) => ({ x: 40 + (point.x - minX) * scale, y: 30 + (maxY - point.z) * scale })
  const route = pathPoints.map((point, index) => { const p = project(point); return `${index ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}` }).join(' ')
  const earth = project({ x: 0, z: 0 })
  return <figure className="rounded-xs border border-rule bg-paper p-3"><figcaption className="mb-2 text-sm font-semibold text-ink">{label}</figcaption><svg viewBox="0 0 800 280" role="img" aria-label={`${label} NASA flight-ephemeris path in an Earth-centered EME2000 projection`} className="h-auto w-full"><path d={route} fill="none" stroke={missionId === 'artemis-i' ? 'var(--color-blue)' : 'var(--color-signal-hot)'} strokeWidth="2"/><circle cx={earth.x} cy={earth.y} r="9" fill="var(--color-blue)"/><text x={earth.x + 13} y={earth.y + 4} fill="var(--color-ink)" fontSize="13" fontWeight="700">Earth</text></svg><p className="text-xs text-ink-3">NASA/JSC position samples in an EME2000 projection. Earth and Moon sizes are not to scale.</p></figure>
}

export function MissionComparisonPage() {
  const ephemeris = useFlightEphemeris()
  if (ephemeris.isError) return <><Header missionName="Mission comparison" activeMissionId="artemis-ii"/><main className="mx-auto max-w-4xl p-5"><h1 className="font-display text-xl text-ink">Comparison data unavailable</h1><p className="mt-2 text-sm text-ink-2">The NASA/JPL flight ephemeris could not be loaded or validated. No fallback values are substituted.</p></main></>
  if (!ephemeris.data) return <><Header missionName="Mission comparison" activeMissionId="artemis-ii"/><main className="mx-auto max-w-4xl p-5"><p className="sheet p-5 text-sm text-ink-2" aria-live="polite">Loading verified flight ephemerides for both missions…</p></main></>
  return <MissionComparisonWorkspace />
}

function MissionComparisonWorkspace() {
  const [leftMissionId, setLeftMissionId] = useState<FlownMissionId>(() => initialChoice<FlownMissionId>('left', FLOWN_MISSION_IDS, 'artemis-i'))
  const [rightMissionId, setRightMissionId] = useState<FlownMissionId>(() => initialChoice<FlownMissionId>('right', FLOWN_MISSION_IDS, 'artemis-ii'))
  const [alignment, setAlignment] = useState<Alignment>(() => initialChoice('alignment', ['elapsed', 'utc', 'event'], 'elapsed'))
  const [metric, setMetric] = useState<Metric>(() => initialChoice('metric', ['distance', 'velocity'], 'distance'))
  const [anchor, setAnchor] = useState<Anchor>(() => initialChoice('event', ['launch', 'lunar-flyby', 'splashdown'], 'lunar-flyby'))
  const [selectedX, setSelectedX] = useState<number | null>(initialSelectedX)
  const [shareStatus, setShareStatus] = useState('')
  const leftMission = missionConfig(leftMissionId)
  const rightMission = missionConfig(rightMissionId)
  const leftProfiles = useMemo(() => buildMissionProfiles(leftMissionId), [leftMissionId])
  const rightProfiles = useMemo(() => buildMissionProfiles(rightMissionId), [rightMissionId])
  const leftPoints = metric === 'velocity' ? leftProfiles.velocity : leftProfiles.distance
  const rightPoints = metric === 'velocity' ? rightProfiles.velocity : rightProfiles.distance
  const originLeft = alignment === 'utc' ? null : alignment === 'elapsed' ? launchEpoch(leftMissionId) : eventEpoch(leftMissionId, anchor)
  const originRight = alignment === 'utc' ? null : alignment === 'elapsed' ? launchEpoch(rightMissionId) : eventEpoch(rightMissionId, anchor)
  const alignedA1 = useMemo(() => alignTimedValues(leftPoints, alignment, originLeft), [leftPoints, alignment, originLeft])
  const alignedA2 = useMemo(() => alignTimedValues(rightPoints, alignment, originRight), [rightPoints, alignment, originRight])
  const chartData = useMemo(() => mergeAlignedValues(alignedA1, alignedA2), [alignedA1, alignedA2])
  const leftName = leftMission.name
  const rightName = rightMission.name
  const leftColor = leftMissionId === 'artemis-i' ? '#0b3d91' : '#ad3608'
  const rightColor = rightMissionId === 'artemis-i' ? '#0b3d91' : '#ad3608'

  const updateUrl = (next: { alignment: Alignment; metric: Metric; anchor: Anchor; left?: FlownMissionId; right?: FlownMissionId }, selected: number | null | undefined = undefined, push = false) => {
    const url = new URL(window.location.href)
    url.searchParams.set('left', next.left || leftMissionId)
    url.searchParams.set('right', next.right || rightMissionId)
    url.searchParams.set('alignment', next.alignment)
    url.searchParams.set('metric', next.metric)
    url.searchParams.set('event', next.anchor)
    if (selected !== undefined) {
      if (selected === null) url.searchParams.delete('at')
      else url.searchParams.set('at', String(selected))
    }
    const method = push ? 'pushState' : 'replaceState'
    window.history[method](window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }

  useEffect(() => {
    const restore = () => {
      setLeftMissionId(initialChoice<FlownMissionId>('left', FLOWN_MISSION_IDS, 'artemis-i'))
      setRightMissionId(initialChoice<FlownMissionId>('right', FLOWN_MISSION_IDS, 'artemis-ii'))
      setAlignment(initialChoice<Alignment>('alignment', ['elapsed', 'utc', 'event'], 'elapsed'))
      setMetric(initialChoice<Metric>('metric', ['distance', 'velocity'], 'distance'))
      setAnchor(initialChoice<Anchor>('event', ['launch', 'lunar-flyby', 'splashdown'], 'lunar-flyby'))
      setSelectedX(initialSelectedX())
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])

  const selectAlignedValue = (value: number | undefined, push = false) => {
    if (value === undefined || !Number.isFinite(value)) return
    const row = nearestCoveredRow(chartData, value)
    if (!row) return
    setSelectedX(row.x)
    if (push) updateUrl({ alignment, metric, anchor }, row.x, true)
  }

  const handleChartSelect = (payload: any) => selectAlignedValue(payload?.activePayload?.[0]?.payload?.x ?? (payload?.activeLabel === undefined ? undefined : Number(payload.activeLabel)), true)
  const selectedRow: ComparisonRow | null = selectedX === null || !chartData.length || selectedX < chartData[0].x || selectedX > chartData[chartData.length - 1].x ? null : nearestCoveredRow(chartData, selectedX)

  const copyComparisonLink = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('left', leftMissionId)
    url.searchParams.set('right', rightMissionId)
    const link = url.toString()
    try { await navigator.clipboard.writeText(link); setShareStatus('Comparison link copied.') }
    catch { window.prompt('Copy this comparison link:', link); setShareStatus('The comparison link is ready to copy.') }
  }

  const tick = (value: number) => alignment === 'utc'
    ? new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    : alignment === 'elapsed'
      ? `${value.toFixed(0)} h`
      : `${value.toFixed(0)} h from ${eventAnchorLabel(anchor).toLowerCase()}`
  const unit = metric === 'distance' ? 'km from Earth center' : 'km/s'
  const eventFor = (row: typeof chartData[number], mission: 'artemisI' | 'artemisII') => {
    const timestamp = mission === 'artemisI' ? row.timeI : row.timeII
    return timestamp ? new Date(timestamp).toISOString() : 'Outside this mission’s available replay coverage'
  }

  return (
    <>
      <Header missionName="Mission comparison" activeMissionId="artemis-ii" />
      <main className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:py-9">
        <header><p className="eyebrow">Investigate mission profiles</p><h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">Compare mission profiles</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-2">Compare NASA flight-derived position and velocity vectors with an explicit UTC, time-since-launch, or shared-event alignment. Distances from Earth use its center; source gaps remain blank.</p><div className="mt-3"><button type="button" onClick={() => void copyComparisonLink()} className="btn">Copy comparison link</button><span role="status" aria-live="polite" className="ml-3 text-sm text-ink-2">{shareStatus}</span></div></header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm text-ink-2">Left mission<select value={leftMissionId} onChange={(event) => { const next = event.target.value as FlownMissionId; setLeftMissionId(next); setSelectedX(null); updateUrl({ alignment, metric, anchor, left: next }, null) }} className="mt-1 field w-full ">{FLOWN_MISSION_IDS.map((id) => <option key={id} value={id}>{missionConfig(id).name}</option>)}</select></label>
          <label className="text-sm text-ink-2">Right mission<select value={rightMissionId} onChange={(event) => { const next = event.target.value as FlownMissionId; setRightMissionId(next); setSelectedX(null); updateUrl({ alignment, metric, anchor, right: next }, null) }} className="mt-1 field w-full ">{FLOWN_MISSION_IDS.map((id) => <option key={id} value={id}>{missionConfig(id).name}</option>)}</select></label>
          <label className="text-sm text-ink-2">Profile<select value={metric} onChange={(event) => { const next = event.target.value as Metric; setMetric(next); updateUrl({ alignment, metric: next, anchor }) }} className="mt-1 field w-full "><option value="distance">Distance from Earth center</option><option value="velocity">Velocity</option></select></label>
          <label className="text-sm text-ink-2">Time alignment<select value={alignment} onChange={(event) => { const next = event.target.value as Alignment; setAlignment(next); setSelectedX(null); updateUrl({ alignment: next, metric, anchor }, null) }} className="mt-1 field w-full "><option value="elapsed">Elapsed time since launch</option><option value="utc">UTC date and time</option><option value="event">Align to a shared event</option></select></label>
          {alignment === 'event' && <label className="text-sm text-ink-2">Shared event<select value={anchor} onChange={(event) => { const next = event.target.value as Anchor; setAnchor(next); setSelectedX(null); updateUrl({ alignment, metric, anchor: next }, null) }} className="mt-1 field w-full "><option value="launch">Launch</option><option value="lunar-flyby">Lunar closest approach</option><option value="splashdown">Splashdown</option></select></label>}
        </div>

        <section aria-labelledby="sampled-summary-title"><h2 id="sampled-summary-title" className="mb-3 font-display text-lg font-semibold text-ink">Sampled mission summaries</h2><div className="grid min-w-0 gap-3 lg:grid-cols-2"><SummaryCard label={leftName} profiles={leftProfiles} kind={leftMissionId}/><SummaryCard label={rightName} profiles={rightProfiles} kind={rightMissionId}/></div></section>

        <div className="grid gap-3 lg:grid-cols-2"><OrbitThumbnail missionId={leftMissionId} label={leftName}/><OrbitThumbnail missionId={rightMissionId} label={rightName}/></div>
        <section className="sheet min-w-0 p-4 sm:p-6" aria-labelledby="comparison-profile-title">
          <h2 id="comparison-profile-title" className="font-display text-lg font-semibold text-ink">{metric === 'distance' ? 'Distance profile' : 'Velocity profile'}</h2>
          <p className="mt-1 text-xs text-ink-3">Values: {unit}. Alignment: {alignment === 'event' ? eventAnchorLabel(anchor) : alignment === 'elapsed' ? 'launch elapsed time' : 'absolute UTC'}. Hover a point or choose a table row to select the same alignment offset for both missions.</p>
          <div className="mt-4 h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart margin={{ top: 12, right: 12, bottom: 8, left: 8 }} onMouseMove={(event: any) => selectAlignedValue(event?.activePayload?.[0]?.payload?.x ?? (event?.activeLabel === undefined ? undefined : Number(event.activeLabel)))} onClick={handleChartSelect}><CartesianGrid vertical={false} stroke="var(--color-rule)"/><XAxis dataKey="x" type="number" scale="linear" domain={['dataMin','dataMax']} allowDuplicatedCategory={false} tickFormatter={tick} tick={{ fill: 'var(--color-ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }}/><YAxis tick={{ fill: 'var(--color-ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }} tickFormatter={(value) => Number(value).toLocaleString()}/><Tooltip content={() => null} cursor={{ stroke: 'var(--color-ink-3)' }}/><Legend/>{selectedRow && <ReferenceLine x={selectedRow.x} stroke="var(--color-ink)" strokeDasharray="4 4" label={{ value: 'Selected aligned time', fill: 'var(--color-ink)', fontSize: 11, position: 'insideTopRight' }}/>}<Area type="linear" data={alignedA1} dataKey="value" name={leftName} stroke={leftColor} strokeWidth={1.75} fill={leftColor} fillOpacity={0.08} connectNulls={false} isAnimationActive={false}/><Area type="linear" data={alignedA2} dataKey="value" name={rightName} stroke={rightColor} strokeWidth={1.75} strokeDasharray="6 3" fill={rightColor} fillOpacity={0.08} connectNulls={false} isAnimationActive={false}/></AreaChart></ResponsiveContainer></div>
        </section>

        <section className="sheet p-4 sm:p-6" aria-labelledby="selected-comparison-title"><h2 id="selected-comparison-title" className="font-display text-lg font-semibold text-ink">Selected aligned moment</h2>{selectedRow ? <><p className="mt-1 text-sm text-ink-2">{tick(selectedRow.x)} · values are shown at recorded epochs; missing coverage stays unavailable.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xs border border-rule p-3"><h3 className="font-semibold" style={{ color: leftColor }}>{leftName}</h3><p className="mt-1 font-mono text-sm text-ink">{selectedRow.artemisI === null ? 'No coverage' : `${selectedRow.artemisI.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit}`}</p><p className="mt-1 text-xs text-ink-3">Source epoch: {eventFor(selectedRow, 'artemisI')}</p></div><div className="rounded-xs border border-rule p-3"><h3 className="font-semibold" style={{ color: rightColor }}>{rightName}</h3><p className="mt-1 font-mono text-sm text-ink">{selectedRow.artemisII === null ? 'No coverage' : `${selectedRow.artemisII.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit}`}</p><p className="mt-1 text-xs text-ink-3">Source epoch: {eventFor(selectedRow, 'artemisII')}</p></div></div><p className="mt-3 text-xs text-ink-3">Right minus left at this aligned epoch: {differenceWithinCoverage(selectedRow) === null ? 'Unavailable because one mission has no sample.' : `${differenceWithinCoverage(selectedRow)!.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit}`}</p><button type="button" onClick={() => setSelectedX(null)} className="mt-3 min-h-11 rounded-xs px-2 text-sm text-ink-2 underline underline-offset-4">Clear selected moment</button></> : <p className="mt-1 text-sm text-ink-3">Choose a chart point or keyboard-select a sample below. Initial times outside the available profiles remain unselected.</p>}</section>

        <section className="sheet p-4 sm:p-6" aria-labelledby="comparison-data-title">
          <h2 id="comparison-data-title" className="font-display text-lg font-semibold text-ink">Coverage and definitions</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div><h3 className="font-semibold text-ink">{leftName}</h3><p className="mt-1 text-sm text-ink-3">Replay coverage: mission day {leftProfiles.coverageStartDay.toFixed(2)} to {leftProfiles.coverageEndDay.toFixed(2)}. Earth-center distance comes from NASA/JSC vectors; speed comes from the source velocity vectors.</p><a href={leftMission.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm text-blue underline underline-offset-4">NASA mission record <ExternalLink className="h-3.5 w-3.5"/></a></div>
            <div><h3 className="font-semibold text-ink">{rightName}</h3><p className="mt-1 text-sm text-ink-3">Replay coverage: mission day {rightProfiles.coverageStartDay.toFixed(2)} to {rightProfiles.coverageEndDay.toFixed(2)}. Earth-center distance comes from NASA/JSC vectors; speed comes from the source velocity vectors.</p><a href={rightMission.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm text-blue underline underline-offset-4">NASA mission record <ExternalLink className="h-3.5 w-3.5"/></a></div>
          </div>
          <details className="mt-4"><summary className="min-h-11 cursor-pointer py-2 text-sm text-ink-2 underline underline-offset-4">Read aligned comparison samples</summary><div className="max-h-64 overflow-auto"><table className="w-full text-left text-xs"><caption className="sr-only">NASA flight-ephemeris samples at the selected alignment</caption><thead><tr><th scope="col" className="p-2">Select</th><th scope="col" className="p-2">Aligned time</th><th scope="col" className="p-2">{leftName} ({unit})</th><th scope="col" className="p-2">{rightName} ({unit})</th><th scope="col" className="p-2">Source epochs (UTC)</th></tr></thead><tbody>{chartData.filter((_, index) => index % 6 === 0).map((row) => <tr key={row.x}><td className="p-1"><button type="button" aria-pressed={selectedRow?.x === row.x} aria-label={`Select ${tick(row.x)} comparison point`} onClick={() => selectAlignedValue(row.x, true)} className="min-h-11 rounded-xs px-2 text-blue underline underline-offset-4">Select</button></td><td className="p-2 font-mono">{tick(row.x)}</td><td className="p-2 font-mono">{row.artemisI?.toLocaleString() ?? '—'}</td><td className="p-2 font-mono">{row.artemisII?.toLocaleString() ?? '—'}</td><td className="p-2 text-ink-3">Left: {eventFor(row, 'artemisI')} · Right: {eventFor(row, 'artemisII')}</td></tr>)}</tbody></table></div></details>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">Where a mission has no sample at an aligned instant, the cell is blank. No interpolation across coverage gaps or exact-extremum claim is made. The axis is in hours except in UTC mode.</p>
        </section>

        <Link href="/artemis-ii" className="inline-flex min-h-11 items-center text-sm text-blue underline underline-offset-4">Return to the Artemis II mission view</Link>
      </main>
    </>
  )
}
