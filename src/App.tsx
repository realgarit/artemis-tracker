import { lazy, Suspense } from 'react'
import { useMission, useTrajectory, useSpaceWeather, useVelocityHistory, useDistanceHistory } from './lib/api'
import { Header } from './components/Header'
import { MetricsBar } from './components/MetricsBar'
import { MissionTimeline } from './components/MissionTimeline'
import { StatsGrid } from './components/StatsGrid'
import { VelocityChart } from './components/VelocityChart'
import { DistanceChart } from './components/DistanceChart'
import { SpaceWeather } from './components/SpaceWeather'
import { ActivityLog } from './components/ActivityLog'
import { Footer } from './components/Footer'

// Code-split Three.js — loads asynchronously, keeps initial bundle small
const TrajectoryMap = lazy(() =>
  import('./components/TrajectoryMap').then((m) => ({ default: m.TrajectoryMap }))
)

function TrajectoryFallback() {
  return (
    <div className="glass-panel border-glow p-3 h-full min-h-[340px] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-6 w-6 border-2 border-cyan-glow/30 border-t-cyan-glow rounded-full animate-spin mb-3" />
        <div className="text-[10px] text-slate-500 tracking-widest uppercase">Loading 3D Visualization</div>
      </div>
    </div>
  )
}

export default function App() {
  const mission = useMission()
  const trajectory = useTrajectory()
  const weather = useSpaceWeather()
  const velocityHistory = useVelocityHistory()
  const distanceHistory = useDistanceHistory()

  return (
    <>
      <div className="space-bg" />
      <div className="scan-line" />

      <div className="relative z-10 min-h-screen">
        <Header missionName={mission.data?.name} />
        <MetricsBar mission={mission.data} trajectory={trajectory.data} />

        <main className="mx-auto max-w-[1600px] px-3 sm:px-4 pt-3 sm:pt-4 pb-6 space-y-3 sm:space-y-4">
          {/* Mission Timeline */}
          <MissionTimeline mission={mission.data} />

          {/* Trajectory Map + Stats */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-4">
            <div className="xl:col-span-3">
              <Suspense fallback={<TrajectoryFallback />}>
                <TrajectoryMap trajectory={trajectory.data} mission={mission.data} />
              </Suspense>
            </div>
            <div className="xl:col-span-2">
              <StatsGrid trajectory={trajectory.data} />
            </div>
          </div>

          {/* Charts + Flight Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <VelocityChart data={velocityHistory.data} />
            <DistanceChart data={distanceHistory.data} />
            <ActivityLog phase={mission.data?.currentPhase} />
          </div>

          {/* Space Weather */}
          <SpaceWeather data={weather.data} />
        </main>

        <Footer trajectory={trajectory.data} />
      </div>
    </>
  )
}
