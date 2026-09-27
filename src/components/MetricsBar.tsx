import type { TrajectoryData, MissionData } from '../lib/types'

interface MetricsBarProps {
  mission?: MissionData
  trajectory?: TrajectoryData
  selectedTime?: string
}

function formatMET(launchDate: string, selectedTime: string): string {
  const elapsed = new Date(selectedTime).getTime() - new Date(launchDate).getTime()
  if (elapsed < 0) return 'T-0'
  const s = Math.floor(elapsed / 1000)
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60), sec = s % 60
  return `T+${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function formatCountdown(eta: string, selectedTime: string): string {
  const diff = new Date(eta).getTime() - new Date(selectedTime).getTime()
  if (diff <= 0) return '—'
  const s = Math.floor(diff / 1000)
  return `${Math.floor(s / 86400)}d ${String(Math.floor((s % 86400) / 3600)).padStart(2,'0')}:${String(Math.floor((s % 3600) / 60)).padStart(2,'0')}`
}

function formatUTC(selectedTime: string): string {
  const n = new Date(selectedTime)
  return `${String(n.getUTCHours()).padStart(2,'0')}:${String(n.getUTCMinutes()).padStart(2,'0')}:${String(n.getUTCSeconds()).padStart(2,'0')}`
}

function formatLocal(selectedTime: string): string {
  return new Date(selectedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-1.5">
      <span className="text-[8px] text-slate-600 uppercase tracking-[.15em] font-medium">{label}</span>
      <span className={`font-mono text-[13px] font-semibold tracking-wide ${accent || 'text-slate-300'}`}>{value}</span>
    </div>
  )
}

export function MetricsBar({ mission, trajectory, selectedTime = mission?.launchDate || new Date().toISOString() }: MetricsBarProps) {

  if (!mission) return null

  return (
    <div className="glass-panel-solid border-b border-cyan-mid/6 sticky top-[49px] z-30">
      <div role="region" aria-label="Current mission metrics" tabIndex={0} className="mx-auto max-w-[1600px] px-2 flex items-center justify-between overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">
        <div className="flex items-center gap-1 px-3 py-1.5 border-r border-slate-800/60">
          <span className="text-[8px] text-slate-600 uppercase tracking-wider mr-1.5">Phase</span>
          <span className="font-mono text-[11px] font-bold text-cyan-glow uppercase tracking-wider">
            {mission.currentPhase}
          </span>
        </div>

        <div className="flex items-center divide-x divide-slate-800/40">
          <Cell label="MET" value={formatMET(mission.launchDate, selectedTime)} accent="text-green-glow" />
          <Cell label="Day" value={`${(Math.round(((Date.parse(selectedTime) - Date.parse(mission.launchDate)) / 86400000) * 10) / 10).toFixed(1)} / ${mission.totalDays.toFixed(1)}`} />
          <Cell label="Speed" value={trajectory?.velocity === null || trajectory?.velocity === undefined ? '—' : `${trajectory.velocity.toFixed(3)} km/s`} accent="text-cyan-glow" />
          <Cell label="Next" value={`${mission.nextMilestone.name} ${formatCountdown(mission.nextMilestone.eta, selectedTime)}`} accent="text-amber-glow" />
          <Cell label="UTC · selected" value={formatUTC(selectedTime)} />
          <Cell label="Local · selected" value={formatLocal(selectedTime)} />
        </div>
      </div>
    </div>
  )
}
