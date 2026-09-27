import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { Route, Switch, Redirect, useParams } from 'wouter'
import { useDSN, useFlightEphemeris, useSpaceWeather } from './lib/api'
import { getMission, getMissionStatus, type MissionConfig } from './data/missionData'
import { setActiveMission, getActiveMission, getMissionTrajectory, buildMissionProfiles } from './data/trajectoryData'
import { getTrajectoryFallback } from './lib/trajectoryFallback'
import { Header } from './components/Header'
import { MetricsBar } from './components/MetricsBar'
import { MissionTimeline } from './components/MissionTimeline'
import { SpaceWeather } from './components/SpaceWeather'
import { DSNPanel } from './components/DSNPanel'
import { CrewPanel } from './components/CrewPanel'
import { LiveFeeds } from './components/LiveFeeds'
import { Footer } from './components/Footer'
import { MissionBriefingPage } from './pages/MissionBriefingPage'
import { MissionStoryGuide } from './components/MissionStoryGuide'
import { LightweightMissionView } from './components/LightweightMissionView'
import { ShareExportPanel } from './components/ShareExportPanel'
import { MISSION_EVENTS } from './data/missionEvents'
import type { CameraMode } from './components/TrajectoryMap'
import { MissionContextPanel } from './components/MissionContextPanel'
import { OfflinePackPanel } from './components/OfflinePackPanel'
import { getOfflinePack, type OfflinePackManifest } from './lib/offline'
import type { HistoryData } from './lib/types'
import { createReplayHistorySnapshot, startHistoryRecording, stopHistoryRecording } from './lib/history'

const TrajectoryMap = lazy(() =>
  import('./components/TrajectoryMap').then((m) => ({ default: m.TrajectoryMap }))
)
const MissionCharts = lazy(() => import('./components/MissionCharts').then((m) => ({ default: m.MissionCharts })))
const CrewPage = lazy(() => import('./pages/CrewPage').then((m) => ({ default: m.CrewPage })))
const MissionComparisonPage = lazy(() => import('./pages/MissionComparisonPage').then((m) => ({ default: m.MissionComparisonPage })))

let webglCapability: boolean | undefined

function supportsWebGL(): boolean {
  if (webglCapability !== undefined) return webglCapability
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
  webglCapability = Boolean(context)
  context?.getExtension('WEBGL_lose_context')?.loseContext()
  return webglCapability
}

function TrajectoryFallback() {
  return (
    <div className="glass-panel border-glow p-3 min-h-[450px] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-6 w-6 border-2 border-cyan-glow/30 border-t-cyan-glow rounded-full animate-spin mb-3" />
        <div className="text-[10px] text-slate-500 tracking-widest uppercase">Loading 3D Visualization</div>
      </div>
    </div>
  )
}

function DeferredMissionCharts({ velocity, distance, selectedTime, onSeek }: {
  velocity: HistoryData
  distance: HistoryData
  selectedTime: string
  onSeek: (time: string) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const element = container.current
    if (!element) return
    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true)
      return
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShouldLoad(true)
        observer.disconnect()
      }
    }, { rootMargin: '600px 0px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={container} aria-label="Source-linked mission charts">
      {shouldLoad
        ? <Suspense fallback={<div className="glass-panel min-h-48 p-4 text-sm text-slate-300" aria-live="polite">Loading source-linked mission charts…</div>}><MissionCharts velocity={velocity} distance={distance} selectedTime={selectedTime} onSeek={onSeek}/></Suspense>
        : <div className="glass-panel min-h-48 p-4 text-sm text-slate-300">Mission charts load as you scroll to this section.</div>}
    </section>
  )
}

function MissionRoute() {
  const { missionId = '' } = useParams<{ missionId: string }>()
  const mission = getMission(missionId)
  if (!mission) return <UnknownMissionPage missionId={missionId} />
  if (mission.status !== 'completed' || !mission.trajectoryDatasetId) return <MissionBriefingPage mission={mission} />
  return <Dashboard key={mission.id} missionId={mission.id} />
}

function CrewRoute() {
  const { missionId = '' } = useParams<{ missionId: string }>()
  const mission = getMission(missionId)
  if (!mission) return <UnknownMissionPage missionId={missionId} />
  if (mission.status !== 'completed') return <MissionBriefingPage mission={mission} />
  if (!mission.trajectoryDatasetId) return <MissionCrewDirectoryPage mission={mission} />
  if (mission.id === 'artemis-ii') return <Suspense fallback={<main className="p-8 text-center text-slate-300">Loading crew profiles…</main>}><CrewPage /></Suspense>
  return <MissionCrewDirectoryPage mission={mission} />
}

function MissionCrewDirectoryPage({ mission }: { mission: MissionConfig }) {
  return <><Header missionName={mission.name} activeMissionId={mission.id}/><main className="mx-auto max-w-3xl space-y-4 px-4 py-8"><h1 className="font-display text-2xl font-bold text-cyan-glow">{mission.name} crew</h1>{mission.crew.length
    ? <><p className="text-sm text-slate-300">NASA’s published prime crew.</p><ul className="grid gap-3 sm:grid-cols-2">{mission.crew.map((member) => <li key={member.name} className="glass-panel p-4"><h2 className="font-semibold text-slate-100">{member.name}</h2><p className="mt-1 text-sm text-slate-300">{member.role} · {member.agency}</p></li>)}</ul><a className="inline-flex min-h-11 items-center text-sm text-cyan-glow underline underline-offset-4" href={mission.sourceUrl} target="_blank" rel="noopener noreferrer">Verify crew at NASA</a></>
    : <p className="glass-panel p-4 text-sm text-slate-300">{mission.name} was uncrewed. No flight crew was assigned.</p>}</main></>
}

function UnknownMissionPage({ missionId }: { missionId: string }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-xs uppercase tracking-[.22em] text-amber-glow">Mission not found</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-cyan-glow">{missionId || 'Unknown mission'}</h1>
      <p className="mt-4 text-slate-300">This mission is not in the verified mission catalog.</p>
      <a className="mt-6 inline-flex min-h-11 items-center rounded border border-cyan-mid/30 px-4 text-cyan-glow underline underline-offset-4" href="/artemis-ii">Open Artemis II replay</a>
    </main>
  )
}

function readTimeFromUrl(_missionId: string, launchTime: number, endTime: number): string {
  const requested = new URL(window.location.href).searchParams.get('t')
  const milliseconds = requested ? Date.parse(requested) : Number.NaN
  if (!Number.isFinite(milliseconds)) return new Date(launchTime).toISOString()
  const clamped = Math.min(endTime, Math.max(launchTime, milliseconds))
  return new Date(clamped).toISOString()
}

function readCameraFromUrl(): CameraMode {
  const camera = new URL(window.location.href).searchParams.get('cam')
  return camera === 'earth' || camera === 'moon' || camera === 'orion' ? camera : 'overview'
}

function readEventFromUrl(missionId: string): string | undefined {
  const id = new URL(window.location.href).searchParams.get('event')
  return MISSION_EVENTS.find((event) => event.id === id && event.missionId === missionId)?.id
}

function readViewFromUrl(): boolean | null {
  const view = new URL(window.location.href).searchParams.get('view')
  return view === '2d' ? true : view === '3d' ? false : null
}

function lightweightByDefault(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(pointer: coarse)').matches) return true
  return !supportsWebGL()
}

function formatCacheAge(installedAt: string): string {
  const milliseconds = Date.now() - Date.parse(installedAt)
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return 'installation time has clock skew'
  const minutes = Math.floor(milliseconds / 60_000)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

function Dashboard({ missionId }: { missionId: string }) {
  const flight = useFlightEphemeris([missionId])
  const config = getMission(missionId)!
  if (flight.isError) {
    const selectedTime = readTimeFromUrl(missionId, Date.parse(config.launchDate), Date.parse(config.splashdownDate!))
    const mission = getMissionStatus(config, new Date(selectedTime))
    return <><Header missionName={config.name} activeMissionId={missionId}/><main className="mx-auto max-w-4xl space-y-4 px-4 py-8"><section className="glass-panel border-glow p-5"><p className="text-xs uppercase tracking-[.2em] text-amber-glow">Source-data bundle unavailable</p><h1 className="mt-1 font-display text-2xl text-slate-100">The mission record is still available</h1><p className="mt-2 text-sm leading-relaxed text-slate-300">The NASA/JPL flight-data bundle failed schema or network validation. Event dates and source links remain available, and the app shows no substituted trajectory or chart measurements.</p><button type="button" onClick={() => void flight.refetch()} className="mt-3 min-h-11 rounded border border-amber-glow/50 px-3 text-sm text-amber-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">Retry source-data download</button><a href={config.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex min-h-11 items-center text-sm text-cyan-glow underline underline-offset-4">Open NASA source</a></section><MissionTimeline mission={mission} crewed={config.crew.length > 0} selectedTime={selectedTime}/><MissionStoryGuide missionId={missionId}/></main></>
  }
  if (!flight.data) return <><Header missionName={config.name} activeMissionId={missionId}/><main className="mx-auto max-w-3xl px-4 py-16"><div className="glass-panel border-glow p-6" aria-live="polite"><p className="text-xs uppercase tracking-[.2em] text-cyan-glow">Loading verified source data</p><h1 className="mt-2 font-display text-2xl font-semibold text-slate-100">Preparing the mission replay</h1><p className="mt-3 text-sm leading-relaxed text-slate-300">NASA flight-state vectors and their matching JPL Moon ephemeris are loaded before map or chart measurements are shown.</p></div></main></>
  return <DashboardWorkspace key={missionId} missionId={missionId}/>
}

function EphemerisUnavailablePage({ missionId, retry }: { missionId: string; retry: () => void }) {
  const config = getMission(missionId)!
  const time = readTimeFromUrl(missionId, Date.parse(config.launchDate), Date.parse(config.splashdownDate!))
  const mission = getMissionStatus(config, new Date(time))
  return <><Header missionName={config.name} activeMissionId={missionId}/><main className="mx-auto max-w-4xl space-y-4 px-4 py-8"><div className="rounded border border-amber-glow/30 bg-space-900 p-4"><h1 className="font-display text-xl text-amber-glow">Trajectory data unavailable</h1><p className="mt-2 text-sm leading-relaxed text-slate-300">The source ephemeris bundle could not be loaded or validated. Mission dates and cited event notes remain available; no current or modelled position is substituted.</p><button type="button" onClick={retry} className="mt-3 min-h-11 rounded border border-amber-glow/40 px-3 text-sm text-amber-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">Retry loading flight data</button></div><MissionTimeline mission={mission} crewed={config.crew.length > 0} selectedTime={time}/><MissionStoryGuide missionId={missionId} selectedEventId={readEventFromUrl(missionId)} onSeek={() => undefined}/></main></>
}

function DashboardWorkspace({ missionId }: { missionId: string }) {
  const config = getMission(missionId)!
  const launchTime = Date.parse(config.launchDate)
  const endTime = Date.parse(config.splashdownDate!)
  const [webglAvailable] = useState(supportsWebGL)
  const [missionTime, setMissionTime] = useState(() => readTimeFromUrl(missionId, launchTime, endTime))
  const [lightweightView, setLightweightView] = useState(() => !webglAvailable || (readViewFromUrl() ?? lightweightByDefault()))
  const [cameraPreset, setCameraPreset] = useState<CameraMode>(readCameraFromUrl)
  const [selectedEvent, setSelectedEvent] = useState<string | undefined>(() => readEventFromUrl(missionId))
  const [offlinePack, setOfflinePack] = useState<OfflinePackManifest | null>(null)
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine)
  const missionTimeRef = useRef(missionTime)

  useEffect(() => { missionTimeRef.current = missionTime }, [missionTime])
  useEffect(() => {
    startHistoryRecording(missionId, () => createReplayHistorySnapshot(missionId, Date.parse(missionTimeRef.current)))
    return stopHistoryRecording
  }, [missionId])

  // The single route-selected mission owns the legacy 3D curve cache.
  setActiveMission(missionId)
  const activeMission = getActiveMission()
  const mission = useMemo(() => getMissionStatus(config, new Date(missionTime)), [config, missionTime])
  const trajectory = useMemo(() => getTrajectoryFallback(missionId, new Date(missionTime)), [missionId, missionTime])
  const isCrewed = config.crew.length > 0

  const weather = useSpaceWeather()
  const dsn = useDSN()

  // Pre-computed profiles from trajectory data
  const profiles = useMemo(() => buildMissionProfiles(missionId), [missionId])
  const profileProvenance = useMemo(() => getMissionTrajectory(missionId)!.provenance, [missionId])
  const velocityProfile = useMemo(() => ({ data: profiles.velocity.map((point) => ({ timestamp: new Date(point.timestamp).toISOString(), value: point.value })), source: 'NASA/JSC flight ephemeris', provenance: profileProvenance }), [profiles, profileProvenance])
  const distanceProfile = useMemo(() => ({ data: profiles.distance.map((point) => ({ timestamp: new Date(point.timestamp).toISOString(), value: point.value })), source: 'NASA/JSC flight ephemeris', provenance: profileProvenance }), [profiles, profileProvenance])

  const dayFromTime = useCallback((value: string) => (Date.parse(value) - launchTime) / 86400000, [launchTime])
  const updateMissionTime = useCallback((epoch: string, push = false, eventId?: string) => {
    const parsed = Date.parse(epoch)
    if (!Number.isFinite(parsed)) return
    const safeEpoch = new Date(Math.min(endTime, Math.max(launchTime, parsed))).toISOString()
    const validEventId = eventId && MISSION_EVENTS.some((event) => event.id === eventId && event.missionId === missionId) ? eventId : undefined
    setMissionTime(safeEpoch)
    const url = new URL(window.location.href)
    url.searchParams.set('t', safeEpoch)
    if (validEventId) url.searchParams.set('event', validEventId)
    else url.searchParams.delete('event')
    const method = push ? 'pushState' : 'replaceState'
    window.history[method]({ missionTime: safeEpoch }, '', `${url.pathname}${url.search}${url.hash}`)
    setSelectedEvent(validEventId)
  }, [endTime, launchTime, missionId])

  useEffect(() => {
    const restore = () => {
      setMissionTime(readTimeFromUrl(missionId, launchTime, endTime))
      setSelectedEvent(readEventFromUrl(missionId))
      setCameraPreset(readCameraFromUrl())
      const restoredView = readViewFromUrl()
      setLightweightView(restoredView ?? lightweightByDefault())
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [missionId, launchTime, endTime])

  useEffect(() => {
    let active = true
    const updateNetwork = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateNetwork)
    window.addEventListener('offline', updateNetwork)
    void getOfflinePack(missionId).then((pack) => { if (active) setOfflinePack(pack) }).catch(() => { if (active) setOfflinePack(null) })
    return () => { active = false; window.removeEventListener('online', updateNetwork); window.removeEventListener('offline', updateNetwork) }
  }, [missionId])

  const seek = useCallback((epoch: string) => updateMissionTime(epoch, true), [updateMissionTime])
  const seekEvent = useCallback((epoch: string, eventId: string) => updateMissionTime(epoch, true, eventId), [updateMissionTime])
  const notifyReplayDay = useCallback((day: number) => updateMissionTime(new Date(launchTime + day * 86400000).toISOString()), [launchTime, updateMissionTime])

  const updateView = useCallback((useLightweight: boolean) => {
    if (!useLightweight && !webglAvailable) return
    setLightweightView(useLightweight)
    const url = new URL(window.location.href)
    url.searchParams.set('view', useLightweight ? '2d' : '3d')
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }, [webglAvailable])

  const updateCamera = useCallback((camera: CameraMode) => {
    setCameraPreset(camera)
    const url = new URL(window.location.href)
    url.searchParams.set('cam', camera)
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  const restoreBookmark = useCallback((epoch: string, savedView: '2d' | '3d', camera: CameraMode, eventId?: string) => {
    updateView(savedView === '2d')
    updateCamera(camera)
    updateMissionTime(epoch, true, eventId)
  }, [updateCamera, updateMissionTime, updateView])

  return (
    <>
      <Header missionName={activeMission.name} activeMissionId={missionId} />
      <MetricsBar mission={mission} trajectory={trajectory} selectedTime={missionTime} />
      {!webglAvailable && <div role="status" className="mx-auto mt-2 max-w-[1600px] px-3 text-sm text-slate-300 sm:px-4">WebGL is unavailable in this browser. The 2D and text replay is active; spacecraft position remains tied to covered NASA source epochs.</div>}
      {!isOnline && <div role="status" className="mx-auto mt-2 max-w-[1600px] px-3 text-sm text-amber-glow sm:px-4">Offline mode · {offlinePack ? `verified mission pack v${offlinePack.appVersion}, installed ${formatCacheAge(offlinePack.installedAt)}` : 'no verified mission pack is installed'}. Live weather and DSN are unavailable or cached with their original observation times.</div>}

      <main className="mx-auto max-w-[1600px] px-3 sm:px-4 pt-3 sm:pt-4 pb-6 space-y-3 sm:space-y-4">
        <MissionTimeline mission={mission} crewed={isCrewed} selectedTime={missionTime} onSeek={seek} />

        {/* 3D Trajectory — FULL WIDTH */}
        <Suspense fallback={<TrajectoryFallback />}>
          {!lightweightView && <TrajectoryMap mission={mission} missionId={missionId} initialDay={dayFromTime(missionTime)} onReplayDayChange={notifyReplayDay} provenance={trajectory.provenance} initialCamera={cameraPreset} onCameraModeChange={updateCamera} />}
        </Suspense>
        {lightweightView && <LightweightMissionView mission={mission} missionId={missionId} missionTime={missionTime} trajectory={trajectory} onSeek={updateMissionTime} onShow3D={() => updateView(false)} canLoad3D={webglAvailable && (isOnline || Boolean(offlinePack?.optional3D))} />}
        {!lightweightView && <button type="button" onClick={() => updateView(true)} className="min-h-11 self-start rounded border border-slate-700/70 px-3 text-sm text-slate-300 hover:border-cyan-glow/50 hover:text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">Use the lightweight 2D and text view</button>}

        {/* Crew — only for crewed missions */}
        {isCrewed && <CrewPanel crew={mission.crew} missionId={missionId} />}

        {/* Charts */}
        <DeferredMissionCharts velocity={velocityProfile} distance={distanceProfile} selectedTime={missionTime} onSeek={seek} />

        {/* DSN + Space Weather */}
        <MissionContextPanel trajectory={trajectory} dsn={dsn.data} missionTime={missionTime} />
        <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
          <DSNPanel data={dsn.data} />
          <SpaceWeather data={weather.data} />
        </div>

        <MissionStoryGuide missionId={missionId} selectedEventId={selectedEvent} onSeek={seekEvent} />
        <ShareExportPanel mission={config} missionTime={missionTime} view={lightweightView ? '2d' : '3d'} camera={cameraPreset} onSeek={seek} onRestoreBookmark={restoreBookmark} eventId={selectedEvent} />
        <OfflinePackPanel mission={config} onPackChange={setOfflinePack} />
        <LiveFeeds missionId={missionId} onSeek={seekEvent} />
      </main>

      <Footer trajectory={trajectory} />
    </>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <>
        <div className="space-bg" />
        <div className="scan-line" />
        <div className="relative z-10 min-h-screen">
          <Switch>
            <Route path="/compare"><Suspense fallback={<main className="p-8 text-center text-slate-300">Loading comparison tools…</main>}><MissionComparisonPage /></Suspense></Route>
            <Route path="/:missionId/crew" component={CrewRoute} />
            <Route path="/:missionId" component={MissionRoute} />
            <Route path="/">
              <Redirect to="/artemis-ii" />
            </Route>
          </Switch>
        </div>
      </>
    </MotionConfig>
  )
}
