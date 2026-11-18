import type { TrajectoryData, MissionData } from '../lib/types'
import { DataSourceBadge } from './DataSourceBadge'

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

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex shrink-0 flex-col justify-center gap-0.5 border-l border-rule px-3 py-1.5 sm:px-4">
      <span className="eyebrow whitespace-nowrap">{label}</span>
      <span className={`whitespace-nowrap font-mono text-sm ${tone || 'text-ink'}`}>{value}</span>
    </div>
  )
}

export function MetricsBar({ mission, trajectory, selectedTime = mission?.launchDate || new Date().toISOString() }: MetricsBarProps) {

  if (!mission) return null

  return (
    <div className="plate sticky top-0 z-30 border-b border-rule">
      <div role="region" aria-label="Current mission metrics" tabIndex={0} className="relative mx-auto flex max-w-[1600px] items-stretch overflow-x-auto px-3 sm:px-4">
        <div className="flex shrink-0 flex-col justify-center gap-0.5 py-1.5 pr-4">
          <span className="eyebrow whitespace-nowrap">Mission elapsed time</span>
          <span className="whitespace-nowrap font-mono text-xl font-bold leading-none text-ink sm:text-2xl">{formatMET(mission.launchDate, selectedTime)}</span>
        </div>
        <Cell label="Phase" value={mission.currentPhase} tone="font-bold uppercase text-signal" />
        <Cell label="Day" value={`${(Math.round(((Date.parse(selectedTime) - Date.parse(mission.launchDate)) / 86400000) * 10) / 10).toFixed(1)} / ${mission.totalDays.toFixed(1)}`} />
        <Cell label="Speed" value={trajectory?.velocity === null || trajectory?.velocity === undefined ? '—' : `${trajectory.velocity.toFixed(3)} km/s`} />
        <Cell label="Next" value={`${mission.nextMilestone.name} ${formatCountdown(mission.nextMilestone.eta, selectedTime)}`} />
        <Cell label="UTC · selected" value={formatUTC(selectedTime)} />
        <Cell label="Local · selected" value={formatLocal(selectedTime)} />
        {trajectory?.provenance && <div className="ml-auto flex min-w-[14rem] flex-1 items-center justify-end border-l border-rule pl-3 sm:pl-4 [&_span]:truncate"><DataSourceBadge provenance={trajectory.provenance}/></div>}
      </div>
    </div>
  )
}
