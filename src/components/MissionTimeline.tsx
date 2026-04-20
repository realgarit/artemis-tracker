import { motion } from 'framer-motion'
import type { MissionData, MissionPhase } from '../lib/types'

interface MissionTimelineProps {
  mission?: MissionData
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

export function MissionTimeline({ mission }: MissionTimelineProps) {
  if (!mission) return null

  const launchMs = new Date(mission.launchDate).getTime()
  const totalH = mission.totalDays * 24
  const allComplete = mission.phases.every(p => p.status === 'completed')
  const elapsedH = allComplete ? totalH : Math.max(0, Math.floor((Date.now() - launchMs) / 3_600_000))
  const n = mission.phases.length
  // Fill from last completed node toward active node based on phase progress
  const activeIdx = mission.phases.findIndex(p => p.status === 'active')
  const nodeCenter = (i: number) => ((2 * i + 1) / (2 * n)) * 100
  let fillPct = 100
  if (activeIdx >= 0) {
    const phase = mission.phases[activeIdx]
    const ps = new Date(phase.startTime).getTime()
    const pe = new Date(phase.endTime).getTime()
    const intra = pe > ps ? Math.max(0, Math.min(1, (Date.now() - ps) / (pe - ps))) : 0
    const prevCenter = activeIdx > 0 ? nodeCenter(activeIdx - 1) : 0
    const activeCenter = nodeCenter(activeIdx)
    fillPct = prevCenter + intra * (activeCenter - prevCenter)
  }

  return (
    <div className="glass-panel border-glow px-5 py-4">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] text-slate-400 uppercase tracking-[.25em] font-semibold">
          Mission Timeline
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          Day {mission.missionDay}/{mission.totalDays}{' '}
          <span className="text-cyan-glow font-semibold">{mission.progress.toFixed(0)}%</span>
        </span>
      </div>

      {/* Track + nodes */}
      <div className="relative px-6 mb-5">
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
            <PhaseNode key={phase.name} phase={phase} index={i} total={n} />
          ))}
        </div>
      </div>

      {/* Time bar */}
      <div className="flex justify-between items-center text-[7.5px] text-slate-600 font-mono px-1 mb-3">
        <span className="uppercase tracking-wider">Launch · T-0</span>
        <span className="text-slate-500">T+{elapsedH}h elapsed of {totalH}h</span>
        <span className="uppercase tracking-wider">Splashdown · T+{totalH}h</span>
      </div>

      {/* Phase description */}
      <div className="flex items-center justify-between text-xs border-t border-slate-700/30 pt-3 px-1">
        {allComplete ? (
          <>
            <span className="flex items-center gap-2">
              <span className="text-green-glow font-bold uppercase tracking-wide text-[11px]">
                Mission Complete
              </span>
              <span className="text-slate-500">
                All phases nominal — crew recovered safely
              </span>
            </span>
            <span className="text-green-glow text-[11px] font-mono shrink-0 ml-4">
              SUCCESS
            </span>
          </>
        ) : (
          <>
            <span>
              <span className="text-slate-600 mr-1">&gt;</span>
              <span className="text-cyan-glow font-bold uppercase tracking-wide text-[11px]">
                {mission.currentPhase}
              </span>
              <span className="text-slate-500 ml-2">
                {PHASE_DESC[mission.currentPhase] || ''}
              </span>
            </span>
            <span className="text-amber-glow text-[11px] font-mono shrink-0 ml-4">
              Next: {mission.nextMilestone.name}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function PhaseNode({ phase, index, total }: { phase: MissionPhase; index: number; total: number }) {
  const isCompleted = phase.status === 'completed'
  const isActive = phase.status === 'active'

  return (
    <motion.div
      className="flex flex-col items-center"
      style={{ width: `${100 / total}%` }}
      initial={{ opacity: 0, y: 8 }}
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
            ? 'text-green-glow/60'
            : isActive
              ? 'text-cyan-glow font-semibold'
              : 'text-slate-600'
        }`}
      >
        {phase.name}
      </span>
    </motion.div>
  )
}
