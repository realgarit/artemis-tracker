import { useEffect, useState } from 'react'
import type { TrajectoryData, MissionData } from '../lib/types'

interface MetricsBarProps {
  mission?: MissionData
  trajectory?: TrajectoryData
}

function formatMET(launchDate: string): string {
  const elapsed = Date.now() - new Date(launchDate).getTime()
  if (elapsed < 0) return 'T-0'
  const s = Math.floor(elapsed / 1000)
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60), sec = s % 60
  return `T+${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function formatCountdown(eta: string): string {
  const diff = new Date(eta).getTime() - Date.now()
  if (diff <= 0) return '—'
  const s = Math.floor(diff / 1000)
  return `${Math.floor(s / 86400)}d ${String(Math.floor((s % 86400) / 3600)).padStart(2,'0')}:${String(Math.floor((s % 3600) / 60)).padStart(2,'0')}`
}

function formatUTC(): string {
  const n = new Date()
  return `${String(n.getUTCHours()).padStart(2,'0')}:${String(n.getUTCMinutes()).padStart(2,'0')}:${String(n.getUTCSeconds()).padStart(2,'0')}`
}

function formatLocal(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-1.5">
      <span className="text-[8px] text-slate-600 uppercase tracking-[.15em] font-medium">{label}</span>
      <span className={`font-mono text-[13px] font-semibold tracking-wide ${accent || 'text-slate-300'}`}>{value}</span>
    </div>
  )
}

export function MetricsBar({ mission, trajectory }: MetricsBarProps) {
  const [, setTick] = useState(0)
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(i) }, [])

  if (!mission) return null

  return (
    <div className="glass-panel-solid border-b border-cyan-mid/6">
      <div className="mx-auto max-w-[1600px] px-2 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-1 px-3 py-1.5 border-r border-slate-800/60">
          <span className="text-[8px] text-slate-600 uppercase tracking-wider mr-1.5">Phase</span>
          <span className="font-mono text-[11px] font-bold text-cyan-glow uppercase tracking-wider">
            {mission.currentPhase}
          </span>
        </div>

        <div className="flex items-center divide-x divide-slate-800/40">
          <Cell label="MET" value={formatMET(mission.launchDate)} accent="text-green-glow" />
          <Cell label="Day" value={`${mission.missionDay} / ${mission.totalDays}`} />
          <Cell label="Speed" value={trajectory ? `${trajectory.velocity} km/s` : '—'} accent="text-cyan-glow" />
          <Cell label="Next" value={`${mission.nextMilestone.name} ${formatCountdown(mission.nextMilestone.eta)}`} accent="text-amber-glow" />
          <Cell label="UTC" value={formatUTC()} />
          <Cell label="Local" value={formatLocal()} />
        </div>
      </div>
    </div>
  )
}
