import { lazy, Suspense, useEffect, useCallback, useState, useMemo } from 'react'
import { Route, Switch } from 'wouter'
import { useMission, useTrajectory, useSpaceWeather, useVelocityHistory, useDistanceHistory, useDSN } from './lib/api'
import { startHistoryRecording } from './lib/history'
import { getCurrentMissionDay, getTrajectoryPos, getMoonPos, getVelocity, getMissionPhase, SCALE, EARTH_RADIUS_KM, MOON_RADIUS_KM, getActiveMission, setActiveMission, buildVelocityProfile, buildDistanceProfile } from './data/trajectoryData'
import type { SpaceWeatherData } from './lib/types'

// Representative space weather during Artemis I (Nov-Dec 2022, solar cycle 25 rising phase)
const ARTEMIS_I_WEATHER: SpaceWeatherData = {
  kpIndex: 2, kpCategory: 'Quiet', solarWindSpeed: 410, solarWindDensity: 4.2,
  imfBz: -1.1, imfBt: 5.3, source: 'NOAA SWPC (historical archive)', timestamp: '2022-11-21T12:00:00Z',
}
import { Header } from './components/Header'
import { MetricsBar } from './components/MetricsBar'
import { MissionTimeline } from './components/MissionTimeline'
import { VelocityChart } from './components/VelocityChart'
import { DistanceChart } from './components/DistanceChart'
import { SpaceWeather } from './components/SpaceWeather'
import { ActivityLog } from './components/ActivityLog'
import { DSNPanel } from './components/DSNPanel'
import { CrewPanel } from './components/CrewPanel'
import { LiveFeeds } from './components/LiveFeeds'
import { Footer } from './components/Footer'
import { CrewPage } from './pages/CrewPage'

const TrajectoryMap = lazy(() =>
  import('./components/TrajectoryMap').then((m) => ({ default: m.TrajectoryMap }))
)

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

function Dashboard() {
  const [activeMissionId, setActiveMissionId] = useState('artemis-ii')
  const activeMission = getActiveMission()
  const isCompleted = activeMission.status === 'completed'

  // Live API data — only fetch for active missions
  const mission = useMission()
  const trajectory = useTrajectory()
  const weather = useSpaceWeather()
  const velocityHistory = useVelocityHistory()
  const distanceHistory = useDistanceHistory()
  const dsn = useDSN()

  // Pre-computed profiles from trajectory data (for completed missions or as fallback)
  const velocityProfile = useMemo(() => {
    const pts = buildVelocityProfile()
    return { data: pts.map(p => ({ timestamp: new Date(p.timestamp).toISOString(), value: p.value })), source: 'JPL Horizons (ephemeris replay)' }
  }, [activeMissionId])
  const distanceProfile = useMemo(() => {
    const pts = buildDistanceProfile()
    return { data: pts.map(p => ({ timestamp: new Date(p.timestamp).toISOString(), value: p.value })), source: 'JPL Horizons (ephemeris replay)' }
  }, [activeMissionId])

  useEffect(() => {
    if (isCompleted) return
    startHistoryRecording(() => {
      const day = getCurrentMissionDay()
      if (day < 0 || day > activeMission.missionDays + 1) return null
      const pos = getTrajectoryPos(day)
      const moonPos = getMoonPos(day)
      return {
        timestamp: Date.now(), missionDay: day,
        distanceFromEarth: Math.max(0, pos.length() / SCALE - EARTH_RADIUS_KM),
        distanceFromMoon: Math.max(0, pos.clone().sub(moonPos).length() / SCALE - MOON_RADIUS_KM),
        velocity: getVelocity(day), phase: getMissionPhase(day), latitude: 0, longitude: 0,
      }
    })
  }, [activeMissionId, isCompleted])

  const handleMissionChange = useCallback((id: string) => {
    setActiveMission(id)
    setActiveMissionId(id)
  }, [])

  return (
    <>
      <Header missionName={activeMission.name} activeMissionId={activeMissionId} onMissionChange={handleMissionChange} />
      {!isCompleted && <MetricsBar mission={mission.data} trajectory={trajectory.data} />}

      <main className="mx-auto max-w-[1600px] px-3 sm:px-4 pt-3 sm:pt-4 pb-6 space-y-3 sm:space-y-4">
        {!isCompleted && <MissionTimeline mission={mission.data} />}

        {/* 3D Trajectory — FULL WIDTH */}
        <Suspense fallback={<TrajectoryFallback />}>
          <TrajectoryMap mission={mission.data} missionId={activeMissionId} />
        </Suspense>

        {/* Crew — only for crewed missions */}
        {!isCompleted && <CrewPanel crew={mission.data?.crew} />}

        {/* Charts + Flight Log */}
        <div className={`grid grid-cols-1 ${isCompleted ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-3 sm:gap-4`}>
          <VelocityChart data={velocityProfile} />
          <DistanceChart data={distanceProfile} />
          {!isCompleted && <ActivityLog phase={mission.data?.currentPhase} />}
        </div>

        {/* DSN + Space Weather */}
        {isCompleted ? (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <SpaceWeather data={ARTEMIS_I_WEATHER} />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            <DSNPanel data={dsn.data} />
            <SpaceWeather data={weather.data} />
          </div>
        )}

        {/* NASA Live — only for active missions */}
        {!isCompleted && <LiveFeeds />}
      </main>

      <Footer trajectory={trajectory.data} />
    </>
  )
}

export default function App() {
  return (
    <>
      <div className="space-bg" />
      <div className="scan-line" />
      <div className="relative z-10 min-h-screen">
        <Switch>
          <Route path="/crew" component={CrewPage} />
          <Route path="/" component={Dashboard} />
        </Switch>
      </div>
    </>
  )
}
