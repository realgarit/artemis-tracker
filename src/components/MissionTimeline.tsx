import type { MissionData, MissionPhase } from '../lib/types'

interface MissionTimelineProps {
  mission?: MissionData
  crewed?: boolean
  selectedTime?: string
  onSeek?: (time: string) => void
}

const PHASE_DESC: Record<string, string> = {
  // Artemis II — official NASA phases
  'Pre-Launch': 'Final countdown and launch preparations',
  'LEO': 'Low Earth orbit — systems checkout',
  'High Earth Orbit': 'Orbital maneuvers before TLI burn',
  'Trans-Lunar': 'Outbound transit to the Moon',
  'Trans-Earth': 'Return transit to Earth',
  'EDL': 'Entry, descent, and landing',
  'Recovery': 'Crew recovery in the Pacific',
  // Artemis I — historical phases
  'Launch & Ascent': 'SLS launch and powered ascent',
  'Trans-Lunar Injection': 'ICPS burn to escape Earth orbit',
  'Outbound Coast': 'Coasting to the Moon',
  'Lunar Flyby': 'Powered flyby above lunar surface',
  'DRO Insertion': 'Burn to enter distant retrograde orbit',
  'Distant Retrograde Orbit': 'Orbiting Moon at ~70,000 km distance',
  'DRO Departure': 'Burn to leave lunar orbit and return home',
  'Return Coast': 'Coasting home to Earth',
  'Re-entry & Splashdown': 'Atmospheric re-entry and Pacific splashdown',
}

function elapsedLabel(launchMs: number, time: string): string {
  const hours = (Date.parse(time) - launchMs) / 3_600_000
  if (hours < 0) return `T−${Math.abs(hours).toFixed(1)} h`
  if (hours < 48) return `T+${hours.toFixed(1)} h`
  return `T+${(hours / 24).toFixed(1)} d`
}

export function MissionTimeline({ mission, crewed = false, selectedTime, onSeek }: MissionTimelineProps) {
  if (!mission) return null

  const launchMs = new Date(mission.launchDate).getTime()
  const totalH = mission.totalDays * 24
  const allComplete = mission.phases.every(p => p.status === 'completed')
  const selectedMs = selectedTime ? Date.parse(selectedTime) : Date.now()
  const elapsedH = Math.max(0, Math.min(totalH, Math.floor((selectedMs - launchMs) / 3_600_000)))

  return (
    <section className="sheet min-w-0 p-3 sm:p-5" aria-labelledby="mission-timeline-title">
      <div className="mb-3 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="mission-timeline-title" className="font-display text-lg font-semibold text-ink">Mission Timeline</h2>
          <p className="font-mono text-xs text-ink-3">
            Day {mission.missionDay.toFixed(1)}/{mission.totalDays.toFixed(1)} · <span className="font-bold text-ink">{mission.progress.toFixed(0)}%</span> · T+{elapsedH}h elapsed of {totalH}h
          </p>
        </div>
        <a href={mission.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 min-w-0 max-w-full items-center break-words text-xs text-blue underline underline-offset-4 hover:text-signal">NASA mission source · checked {mission.verifiedAt}</a>
      </div>

      {/* One ruled cell per phase, in flight order. Each cell is a seek command. */}
      <ol aria-label="Mission phases" className="grid grid-cols-2 border-l border-t border-ink sm:grid-cols-4 lg:[grid-template-columns:repeat(var(--phases),minmax(0,1fr))]" style={{ '--phases': mission.phases.length } as React.CSSProperties}>
        {mission.phases.map((phase, index) => (
          <li key={phase.name} className="flex border-b border-r border-ink">
            <PhaseCell phase={phase} index={index} launchMs={launchMs} selectedMs={selectedMs} onSeek={onSeek} />
          </li>
        ))}
      </ol>

      <div className="mt-3 flex min-w-0 flex-col items-start justify-between gap-1 text-sm sm:flex-row sm:items-baseline">
        {allComplete ? (
          <>
            <span className="min-w-0 break-words text-ink-2">
              <strong className="mr-2 font-mono text-xs uppercase tracking-wider text-ok">Mission Complete</strong>
              {crewed ? 'Crew recovery is recorded in the linked NASA mission record.' : 'Recovery is recorded in the linked NASA mission record.'}
            </span>
            <span className="font-mono text-xs font-bold tracking-wider text-ok sm:shrink-0">SUCCESS</span>
          </>
        ) : (
          <>
            <span className="min-w-0 break-words text-ink-2">
              <strong className="mr-2 font-mono text-xs uppercase tracking-wider text-signal">{mission.currentPhase}</strong>
              {PHASE_DESC[mission.currentPhase] || ''}
            </span>
            <span className="max-w-full break-words font-mono text-xs text-ink-3 sm:shrink-0">Next: {mission.nextMilestone.name}</span>
          </>
        )}
      </div>
    </section>
  )
}

function PhaseCell({ phase, index, launchMs, selectedMs, onSeek }: { phase: MissionPhase; index: number; launchMs: number; selectedMs: number; onSeek?: (time: string) => void }) {
  const isCompleted = phase.status === 'completed'
  const isActive = phase.status === 'active'
  const start = Date.parse(phase.startTime)
  const end = Date.parse(phase.endTime)
  const within = isCompleted ? 1 : isActive && end > start ? Math.max(0, Math.min(1, (selectedMs - start) / (end - start))) : 0

  // This command seeks to a phase; aria-current and its active label mark it without presenting a toggle.
  return (
    <button
      type="button"
      onClick={() => onSeek?.(phase.startTime)}
      aria-label={`Replay ${phase.name}, beginning ${new Date(phase.startTime).toISOString()}${isActive ? ', current phase' : ''}`}
      aria-current={isActive ? 'step' : undefined}
      className={`group relative flex min-h-[4.5rem] w-full flex-col justify-between gap-1 px-2.5 pb-2.5 pt-2 text-left hover:bg-paper-2 ${isActive ? 'bg-card' : isCompleted ? 'bg-paper' : 'bg-card'}`}
    >
      {/* Index and status are drawn as generated content so the button's visible text is just the phase name its label starts from. */}
      <span
        aria-hidden="true"
        data-index={String(index + 1).padStart(2, '0')}
        data-state={isCompleted ? 'done' : isActive ? 'now' : elapsedLabel(launchMs, phase.startTime)}
        className="flex items-baseline justify-between gap-2 font-mono text-[11px] text-ink-3 before:content-[attr(data-index)] after:content-[attr(data-state)]"
      />
      <span className={`font-display text-sm leading-tight ${isActive ? 'font-bold text-ink' : isCompleted ? 'font-medium text-ink' : 'font-medium text-ink-3'}`}>{phase.name}</span>
      {/* Progress rule along the bottom edge of the cell. */}
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-transparent">
        <span className={`block h-full ${isActive ? 'bg-signal-hot' : 'bg-ink'}`} style={{ width: `${within * 100}%` }} />
      </span>
    </button>
  )
}
