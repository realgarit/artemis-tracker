import { useMission, useTrajectory, useSpaceWeather, useVelocityHistory, useDistanceHistory } from './lib/api'
import { Header } from './components/Header'
import { MetricsBar } from './components/MetricsBar'
import { MissionTimeline } from './components/MissionTimeline'
import { TrajectoryMap } from './components/TrajectoryMap'
import { StatsGrid } from './components/StatsGrid'
import { VelocityChart } from './components/VelocityChart'
import { DistanceChart } from './components/DistanceChart'
import { SpaceWeather } from './components/SpaceWeather'
import { ActivityLog } from './components/ActivityLog'
import { Footer } from './components/Footer'

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

        <main className="mx-auto max-w-[1600px] px-4 pt-4 pb-6 space-y-4">
          {/* Mission Timeline */}
          <MissionTimeline mission={mission.data} />

          {/* Trajectory Map + Stats side-by-side */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <div className="xl:col-span-3">
              <TrajectoryMap trajectory={trajectory.data} mission={mission.data} />
            </div>
            <div className="xl:col-span-2">
              <StatsGrid trajectory={trajectory.data} />
            </div>
          </div>

          {/* Charts + Flight Log — 3 columns like original */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <VelocityChart data={velocityHistory.data} />
            <DistanceChart data={distanceHistory.data} />
            <ActivityLog phase={mission.data?.currentPhase} />
          </div>

          {/* Space Weather — full width */}
          <SpaceWeather data={weather.data} />
        </main>

        <Footer trajectory={trajectory.data} />
      </div>
    </>
  )
}
