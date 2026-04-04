import { motion } from 'framer-motion'
import type { MissionData, MissionPhase } from '../lib/types'

interface MissionTimelineProps {
  mission?: MissionData
}

const PHASE_DESC: Record<string, string> = {
  'Pre-Launch': 'Final countdown and launch preparations',
  'Launch & Ascent': 'SLS launch and powered ascent to orbit',
  'Earth Orbit': 'Systems checkout in low Earth orbit',
  'Trans-Lunar Injection': 'ICPS burn to escape Earth orbit',
  'Outbound Coast': '~4 days coasting to the Moon',
  'Lunar Flyby': 'Powered flyby ~6,400 km above lunar surface',
  'Return Coast': '~4 days coasting home to Earth',
  'Re-entry & Splashdown': 'Atmospheric re-entry and Pacific splashdown',
}

function CompletedIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="rgba(34,211,238,0.12)" stroke="#22d3ee" strokeWidth="1.5" />
      <path d="M9 14.5L12.5 18L19 11" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function ActiveIcon() {
  return (
    <div className="relative">
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="rgba(34,211,238,0.15)" stroke="#22d3ee" strokeWidth="2" />
        <circle cx="16" cy="16" r="5" fill="#22d3ee" />
      </svg>
      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#22d3ee" strokeWidth="1" />
        </svg>
      </motion.div>
    </div>
  )
}

function UpcomingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="none" stroke="#334155" strokeWidth="1" />
    </svg>
  )
}

function PhaseNode({ phase }: { phase: MissionPhase }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      <div className="flex items-center justify-center h-8">
        {phase.status === 'completed' && <CompletedIcon />}
        {phase.status === 'active' && <ActiveIcon />}
        {phase.status === 'upcoming' && <UpcomingIcon />}
      </div>
      <span
        className={`text-[8px] xl:text-[9px] text-center leading-tight px-0.5 ${
          phase.status === 'completed'
            ? 'text-cyan-glow/70'
            : phase.status === 'active'
              ? 'text-cyan-glow font-semibold'
              : 'text-slate-600'
        }`}
      >
        {phase.name}
      </span>
    </div>
  )
}

export function MissionTimeline({ mission }: MissionTimelineProps) {
  if (!mission) return null

  const launchMs = new Date(mission.launchDate).getTime()
  const elapsedH = Math.max(0, Math.floor((Date.now() - launchMs) / 3_600_000))
  const totalH = mission.totalDays * 24

  return (
    <div className="glass-panel border-glow px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
          Mission Timeline
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          Day {mission.missionDay}/{mission.totalDays}{' '}
          <span className="text-cyan-glow font-semibold">{mission.progress.toFixed(0)}%</span>
        </span>
      </div>

      {/* Phase icons — evenly spaced */}
      <div className="flex justify-between items-start mb-3">
        {mission.phases.map((phase) => (
          <PhaseNode key={phase.name} phase={phase} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-2 px-1">
        <div className="flex justify-between text-[7px] text-slate-600 uppercase tracking-wider mb-1">
          <span>Launch</span>
          <span className="text-slate-500 normal-case font-mono tracking-normal">
            Lunar Flyby
          </span>
          <span>Splashdown</span>
        </div>
        <div className="h-[5px] bg-slate-800/80 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-glow via-cyan-glow to-cyan-dim"
            initial={{ width: 0 }}
            animate={{ width: `${mission.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[7px] text-slate-700 mt-0.5 font-mono">
          <span>T-0</span>
          <span className="text-slate-500">T+{elapsedH}h elapsed of {totalH}h</span>
          <span>T+{totalH}h</span>
        </div>
      </div>

      {/* Phase description */}
      <div className="flex items-center justify-between text-xs border-t border-slate-800/50 pt-2.5 mt-1 px-1">
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
      </div>
    </div>
  )
}
