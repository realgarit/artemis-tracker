import { CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { MissionData, MissionPhase } from '../lib/types'

interface MissionTimelineProps {
  mission?: MissionData
}

const PHASE_DESCRIPTIONS: Record<string, string> = {
  'Pre-Launch': 'Final countdown and launch preparations',
  'Launch & Ascent': 'SLS launch and ascent to orbit',
  'Earth Orbit': 'Systems checkout in low Earth orbit',
  'Trans-Lunar Injection': 'ICPS burn to escape Earth orbit',
  'Outbound Coast': '~4 days coasting to the Moon',
  'Lunar Flyby': 'Powered flyby ~6,400 km above lunar surface',
  'Return Coast': '~4 days coasting home to Earth',
  'Re-entry & Splashdown': 'Atmospheric re-entry and Pacific splashdown',
}

function PhaseIcon({ phase }: { phase: MissionPhase }) {
  if (phase.status === 'completed') {
    return <CheckCircle className="h-5 w-5 text-cyan-glow" />
  }
  if (phase.status === 'active') {
    return (
      <div className="relative">
        <div className="h-5 w-5 rounded-full border-2 border-cyan-glow bg-cyan-glow/30" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-cyan-glow"
          animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    )
  }
  return <div className="h-5 w-5 rounded-full border-2 border-slate-600" />
}

export function MissionTimeline({ mission }: MissionTimelineProps) {
  if (!mission) return null

  const launchTime = new Date(mission.launchDate).getTime()
  const now = Date.now()
  const elapsedHours = Math.max(0, Math.floor((now - launchTime) / (1000 * 60 * 60)))
  const totalHours = mission.totalDays * 24

  return (
    <div className="glass-panel border-glow p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
          Mission Timeline
        </h3>
        <span className="font-mono text-xs text-slate-400">
          Day {mission.missionDay}/{mission.totalDays}{' '}
          <span className="text-cyan-glow">{mission.progress.toFixed(0)}%</span>
        </span>
      </div>

      {/* Phase dots row */}
      <div className="flex items-center gap-0 mb-4 overflow-x-auto">
        {mission.phases.map((phase, i) => (
          <div key={phase.name} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <PhaseIcon phase={phase} />
              <span
                className={`text-[9px] text-center leading-tight whitespace-nowrap ${
                  phase.status === 'completed' || phase.status === 'active'
                    ? 'text-cyan-glow'
                    : 'text-slate-500'
                }`}
              >
                {phase.name}
              </span>
            </div>
            {i < mission.phases.length - 1 && (
              <div className="flex-1 mx-2 min-w-[16px]">
                <div
                  className={`h-px ${
                    phase.status === 'completed' ? 'bg-cyan-glow/50' : 'bg-slate-700'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="relative mb-3">
        <div className="flex justify-between text-[9px] text-slate-600 mb-1">
          <span>LAUNCH</span>
          <span className="text-slate-500">
            T+{elapsedHours}h elapsed of {totalHours}h
          </span>
          <span>SPLASHDOWN</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-cyan-dim"
            initial={{ width: 0 }}
            animate={{ width: `${mission.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
          <span>T-0</span>
          <span>T+{totalHours}h</span>
        </div>
      </div>

      {/* Current phase description */}
      <div className="flex items-center justify-between text-sm border-t border-slate-700/50 pt-3">
        <span>
          <span className="text-slate-500">&gt; </span>
          <span className="text-white font-semibold">{mission.currentPhase}</span>
          <span className="text-slate-400">
            {' '}— {PHASE_DESCRIPTIONS[mission.currentPhase] || ''}
          </span>
        </span>
        <span className="text-amber-glow text-xs font-mono shrink-0 ml-4">
          Next: {mission.nextMilestone.name}
        </span>
      </div>
    </div>
  )
}
