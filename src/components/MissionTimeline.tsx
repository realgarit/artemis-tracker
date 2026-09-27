import { motion } from 'framer-motion'
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

// Fixed height for all nodes so they align perfectly on the track
const NODE_H = 30

export function MissionTimeline({ mission, crewed = false, selectedTime, onSeek }: MissionTimelineProps) {
  if (!mission) return null

  const launchMs = new Date(mission.launchDate).getTime()
  const totalH = mission.totalDays * 24
  const allComplete = mission.phases.every(p => p.status === 'completed')
  const selectedMs = selectedTime ? Date.parse(selectedTime) : Date.now()
  const elapsedH = Math.max(0, Math.min(totalH, Math.floor((selectedMs - launchMs) / 3_600_000)))
  const n = mission.phases.length
  // Fill from last completed node toward active node based on phase progress
  const activeIdx = mission.phases.findIndex(p => p.status === 'active')
  const nodeCenter = (i: number) => ((2 * i + 1) / (2 * n)) * 100
  let fillPct = 100
  if (activeIdx >= 0) {
    const phase = mission.phases[activeIdx]
    const ps = new Date(phase.startTime).getTime()
    const pe = new Date(phase.endTime).getTime()
    const intra = pe > ps ? Math.max(0, Math.min(1, (selectedMs - ps) / (pe - ps))) : 0
    const prevCenter = activeIdx > 0 ? nodeCenter(activeIdx - 1) : 0
    const activeCenter = nodeCenter(activeIdx)
    fillPct = prevCenter + intra * (activeCenter - prevCenter)
  }

  return (
    <div className="glass-panel min-w-0 border-glow px-3 py-4 sm:px-5">
      <div className="mb-4 flex min-w-0 flex-col gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[10px] text-slate-400 uppercase tracking-[.25em] font-semibold">
          Mission Timeline
        </span>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:justify-end sm:gap-3">
          <a href={mission.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 min-w-0 max-w-full items-center break-words text-[11px] text-slate-300 underline underline-offset-4 hover:text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow sm:text-xs">NASA mission source · checked {mission.verifiedAt}</a>
          <span className="max-w-full break-words font-mono text-[10px] text-slate-300 sm:text-[11px]">
            Day {mission.missionDay.toFixed(1)}/{mission.totalDays.toFixed(1)}{' '}
            <span className="text-cyan-glow font-semibold">{mission.progress.toFixed(0)}%</span>
          </span>
        </div>
      </div>

      {/* Track + nodes */}
      <div role="region" aria-label="Mission phases. Scroll horizontally to see every phase on small screens." tabIndex={0} className="overflow-x-auto px-1 pb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">
      <div className="relative mb-5 min-w-[680px] px-6">
        {/* Background track — vertically centered in NODE_H */}
        <div className="absolute left-6 right-6 h-[2px] bg-slate-800" style={{ top: NODE_H / 2 - 1 }} />
        {/* Filled track — inside left-6 right-6 so % aligns with node positions */}
        <div className="absolute left-6 right-6 h-[2px] overflow-hidden" style={{ top: NODE_H / 2 - 1 }}>
          <motion.div
            className="h-full bg-gradient-to-r from-green-glow to-cyan-glow"
            initial={{ width: 0 }}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>

        <div className="relative flex justify-between">
          {mission.phases.map((phase, i) => (
            <PhaseNode key={phase.name} phase={phase} index={i} total={n} onSeek={onSeek} />
          ))}
        </div>
      </div>
      </div>

      {/* Time bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1 font-mono text-[7.5px] text-slate-600">
        <span className="uppercase tracking-wider">Launch · T-0</span>
        <span className="text-slate-500">T+{elapsedH}h elapsed of {totalH}h</span>
        <span className="uppercase tracking-wider">Splashdown · T+{totalH}h</span>
      </div>

      {/* Phase description */}
      <div className="flex min-w-0 flex-col items-start justify-between gap-2 border-t border-slate-700/30 px-1 pt-3 text-xs sm:flex-row sm:items-center">
        {allComplete ? (
          <>
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="text-green-glow font-bold uppercase tracking-wide text-[11px]">
                Mission Complete
              </span>
              <span className="min-w-0 break-words text-slate-500">
                {crewed ? 'Crew recovery is recorded in the linked NASA mission record.' : 'Recovery is recorded in the linked NASA mission record.'}
              </span>
            </span>
            <span className="max-w-full break-words font-mono text-[11px] text-green-glow sm:ml-4 sm:shrink-0">
              SUCCESS
            </span>
          </>
        ) : (
          <>
            <span className="min-w-0 break-words">
              <span className="text-slate-600 mr-1">&gt;</span>
              <span className="text-cyan-glow font-bold uppercase tracking-wide text-[11px]">
                {mission.currentPhase}
              </span>
              <span className="ml-2 break-words text-slate-500">
                {PHASE_DESC[mission.currentPhase] || ''}
              </span>
            </span>
            <span className="max-w-full break-words font-mono text-[11px] text-amber-glow sm:ml-4 sm:shrink-0">
              Next: {mission.nextMilestone.name}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function PhaseNode({ phase, index, total, onSeek }: { phase: MissionPhase; index: number; total: number; onSeek?: (time: string) => void }) {
  const isCompleted = phase.status === 'completed'
  const isActive = phase.status === 'active'

  // This command seeks to a phase; aria-current marks it without presenting the button as a toggle.
  return (
    <motion.button
      type="button"
      onClick={() => onSeek?.(phase.startTime)}
      aria-label={`Replay ${phase.name}, beginning ${new Date(phase.startTime).toISOString()}`}
      aria-current={isActive ? 'step' : undefined}
      className="flex min-h-11 flex-col items-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"
      style={{ width: `${100 / total}%` }}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      {/* Fixed-height container — every circle vertically centered at the same position */}
      <div className="flex items-center justify-center mb-2" style={{ height: NODE_H }}>
        {isCompleted && (
          <div className="h-[28px] w-[28px] rounded-full bg-[#071210] border-[1.5px] border-green-glow flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M3 7.5L5.5 10L11 4" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {isActive && (
          <div className="relative flex items-center justify-center">
            <div className="h-[30px] w-[30px] rounded-full bg-[#060d14] border-2 border-cyan-glow flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-cyan-glow" />
            </div>
            <motion.div
              className="absolute h-[30px] w-[30px] rounded-full border border-cyan-glow/50"
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute h-[30px] w-[30px] rounded-full border border-cyan-glow/30"
              animate={{ scale: [1, 2], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        )}
        {!isCompleted && !isActive && (
          <div className="h-[22px] w-[22px] rounded-full border border-slate-700/50 bg-space-900/60" />
        )}
      </div>

      <span
        className={`text-[8px] xl:text-[9px] text-center leading-tight max-w-[80px] ${
          isCompleted
            ? 'text-green-glow'
            : isActive
              ? 'text-cyan-glow font-semibold'
              : 'text-slate-600'
        }`}
      >
        {phase.name}
      </span>
    </motion.button>
  )
}
