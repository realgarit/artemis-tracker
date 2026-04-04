import { CheckCircle } from 'lucide-react'
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

function PhaseIcon({ phase }: { phase: MissionPhase }) {
  if (phase.status === 'completed') {
    return <CheckCircle className="h-6 w-6 text-cyan-glow" strokeWidth={2} />
  }
  if (phase.status === 'active') {
    return (
      <div className="relative flex items-center justify-center h-6 w-6">
        <div className="h-6 w-6 rounded-full border-2 border-cyan-glow bg-cyan-glow/20" />
        <motion.div
          className="absolute h-6 w-6 rounded-full border border-cyan-glow/60"
          animate={{ scale: [1, 1.5, 1], opacity: [.7, 0, .7] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    )
  }
  return <div className="h-5 w-5 rounded-full border border-slate-600/60" />
}

export function MissionTimeline({ mission }: MissionTimelineProps) {
  if (!mission) return null

  const launchMs = new Date(mission.launchDate).getTime()
  const elapsedH = Math.max(0, Math.floor((Date.now() - launchMs) / 3_600_000))
  const totalH = mission.totalDays * 24

  return (
    <div className="glass-panel border-glow px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
          Mission Timeline
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          Day {mission.missionDay}/{mission.totalDays}{' '}
          <span className="text-cyan-glow">{mission.progress.toFixed(0)}%</span>
        </span>
      </div>

      {/* Phase icons row — evenly spaced, no connecting lines */}
      <div className="flex justify-between items-start mb-4 px-2">
        {mission.phases.map((phase) => (
          <div key={phase.name} className="flex flex-col items-center gap-1.5 w-0 flex-1">
            <PhaseIcon phase={phase} />
            <span
              className={`text-[8px] xl:text-[9px] text-center leading-tight ${
                phase.status !== 'upcoming' ? 'text-cyan-glow/80' : 'text-slate-600'
              }`}
            >
              {phase.name}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar with markers */}
      <div className="relative px-2">
        {/* Marker labels above */}
        <div className="flex justify-between text-[7px] text-slate-600 uppercase tracking-wider mb-1">
          <span>Launch</span>
          <span>Lunar Flyby</span>
          <span>Splashdown</span>
        </div>

        {/* Bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-cyan-dim"
            initial={{ width: 0 }}
            animate={{ width: `${mission.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        {/* Time labels below */}
        <div className="flex justify-between text-[7px] text-slate-700 mt-1 font-mono">
          <span>T-0</span>
          <span className="text-slate-500">T+{elapsedH}h elapsed of {totalH}h</span>
          <span>T+{totalH}h</span>
        </div>
      </div>

      {/* Phase description */}
      <div className="flex items-center justify-between text-xs border-t border-slate-800/60 pt-3 mt-3 px-2">
        <span>
          <span className="text-slate-600">&gt; </span>
          <span className="text-cyan-glow font-semibold">{mission.currentPhase}</span>
          <span className="text-slate-500"> — {PHASE_DESC[mission.currentPhase] || ''}</span>
        </span>
        <span className="text-amber-glow text-[11px] font-mono shrink-0 ml-4">
          Next: {mission.nextMilestone.name}
        </span>
      </div>
    </div>
  )
}
