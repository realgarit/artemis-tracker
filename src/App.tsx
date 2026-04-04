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

        <main className="mx-auto max-w-[1600px] px-4 py-6 space-y-6">
          {/* Mission Timeline */}
          <MissionTimeline mission={mission.data} />

          {/* Trajectory Map - full width */}
          <TrajectoryMap trajectory={trajectory.data} mission={mission.data} />

          {/* Stats Grid */}
          <StatsGrid trajectory={trajectory.data} />

          {/* Charts + Space Weather */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <VelocityChart data={velocityHistory.data} />
            <DistanceChart data={distanceHistory.data} />
            <SpaceWeather data={weather.data} />
          </div>

          {/* Activity Log */}
          <ActivityLog phase={mission.data?.currentPhase} />
        </main>

        <Footer trajectory={trajectory.data} />
      </div>
    </>
  )
}
