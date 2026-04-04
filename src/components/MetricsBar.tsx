import { useEffect, useState } from 'react'
import type { TrajectoryData, MissionData } from '../lib/types'

interface MetricsBarProps {
  mission?: MissionData
  trajectory?: TrajectoryData
}

function formatMET(launchDate: string): string {
  const now = Date.now()
  const launch = new Date(launchDate).getTime()
  const elapsed = now - launch
  if (elapsed < 0) return 'T-0'
  const totalSec = Math.floor(elapsed / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  return `T+${days}d ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatCountdown(eta: string): string {
  const diff = new Date(eta).getTime() - Date.now()
  if (diff <= 0) return '—'
  const totalSec = Math.floor(diff / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  return `${days}d ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function formatUTC(): string {
  const now = new Date()
  return `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`
}

function formatLocal(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function MetricCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-0">
      <span className="text-[9px] text-slate-500 uppercase tracking-wider whitespace-nowrap">{label}</span>
      <span className={`font-mono text-sm font-semibold whitespace-nowrap ${color || 'text-white'}`}>{value}</span>
    </div>
  )
}

export function MetricsBar({ mission, trajectory }: MetricsBarProps) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mission) return null

  return (
    <div className="glass-panel-solid border-b border-cyan-glow/10">
      <div className="mx-auto max-w-[1600px] px-2 flex items-center justify-between overflow-x-auto">
        {/* Phase badge */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-cyan-glow/10 border-r border-cyan-glow/10">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">Phase</span>
          <span className="font-mono text-xs font-bold text-cyan-glow uppercase tracking-wider">
            {mission.currentPhase}
          </span>
        </div>

        <div className="flex items-center divide-x divide-slate-700/50">
          <MetricCell label="MET" value={formatMET(mission.launchDate)} color="text-green-glow" />
          <MetricCell label="Day" value={`${mission.missionDay} / ${mission.totalDays}`} />
          <MetricCell
            label="Speed"
            value={trajectory ? `${trajectory.velocity} km/s` : '—'}
            color="text-cyan-glow"
          />
          <MetricCell
            label="Next"
            value={`${mission.nextMilestone.name} ${formatCountdown(mission.nextMilestone.eta)}`}
            color="text-amber-glow"
          />
          <MetricCell label="UTC" value={formatUTC()} />
          <MetricCell label="Local" value={formatLocal()} />
        </div>
      </div>
    </div>
  )
}
