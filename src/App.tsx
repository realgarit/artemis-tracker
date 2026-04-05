import { lazy, Suspense, useEffect } from 'react'
import { Route, Switch } from 'wouter'
import { useMission, useTrajectory, useSpaceWeather, useVelocityHistory, useDistanceHistory, useDSN } from './lib/api'
import { startHistoryRecording } from './lib/history'
import { getCurrentMissionDay, getTrajectoryPos, getMoonPos, getVelocity, getMissionPhase, SCALE, EARTH_RADIUS_KM, MOON_RADIUS_KM } from './data/trajectoryData'
import { Header } from './components/Header'
import { MetricsBar } from './components/MetricsBar'
import { MissionTimeline } from './components/MissionTimeline'
import { StatsGrid } from './components/StatsGrid'
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
    <div className="glass-panel border-glow p-3 h-full min-h-[380px] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-6 w-6 border-2 border-cyan-glow/30 border-t-cyan-glow rounded-full animate-spin mb-3" />
        <div className="text-[10px] text-slate-500 tracking-widest uppercase">Loading 3D Visualization</div>
      </div>
    </div>
  )
}

function Dashboard() {
  const mission = useMission()
  const trajectory = useTrajectory()
  const weather = useSpaceWeather()
  const velocityHistory = useVelocityHistory()
  const distanceHistory = useDistanceHistory()
  const dsn = useDSN()

  // Start persistent history recording
  useEffect(() => {
    startHistoryRecording(() => {
      const day = getCurrentMissionDay()
      if (day < 0 || day > 11) return null
      const pos = getTrajectoryPos(day)
      const moonPos = getMoonPos(day)
      return {
        timestamp: Date.now(),
        missionDay: day,
        distanceFromEarth: Math.max(0, pos.length() / SCALE - EARTH_RADIUS_KM),
        distanceFromMoon: Math.max(0, pos.clone().sub(moonPos).length() / SCALE - MOON_RADIUS_KM),
        velocity: getVelocity(day),
        phase: getMissionPhase(day),
        latitude: 0,
        longitude: 0,
      }
    })
  }, [])

  return (
    <>
      <Header missionName={mission.data?.name} />
      <MetricsBar mission={mission.data} trajectory={trajectory.data} />

      <main className="mx-auto max-w-[1600px] px-3 sm:px-4 pt-3 sm:pt-4 pb-6 space-y-3 sm:space-y-4">
        <MissionTimeline mission={mission.data} />

        {/* Trajectory Map + Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-4">
          <div className="xl:col-span-3">
            <Suspense fallback={<TrajectoryFallback />}>
              <TrajectoryMap mission={mission.data} />
            </Suspense>
          </div>
          <div className="xl:col-span-2">
            <StatsGrid trajectory={trajectory.data} />
          </div>
        </div>

        {/* Crew */}
        <CrewPanel crew={mission.data?.crew} />

        {/* Charts + Flight Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <VelocityChart data={velocityHistory.data} />
          <DistanceChart data={distanceHistory.data} />
          <ActivityLog phase={mission.data?.currentPhase} />
        </div>

        {/* NASA Live Feeds */}
        <LiveFeeds />

        {/* DSN + Space Weather */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          <DSNPanel data={dsn.data} />
          <SpaceWeather data={weather.data} />
        </div>
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
