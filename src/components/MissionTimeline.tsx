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
  if (phase.status === 'completed') return <CheckCircle className="h-4 w-4 text-cyan-glow" strokeWidth={2.5} />
  if (phase.status === 'active') {
    return (
      <div className="relative flex items-center justify-center">
        <div className="h-4 w-4 rounded-full border-2 border-cyan-glow bg-cyan-glow/30" />
        <motion.div className="absolute h-4 w-4 rounded-full border border-cyan-glow" animate={{scale:[1,1.6,1],opacity:[.8,0,.8]}} transition={{duration:2,repeat:Infinity}} />
      </div>
    )
  }
  return <div className="h-3.5 w-3.5 rounded-full border border-slate-600" />
}

export function MissionTimeline({ mission }: MissionTimelineProps) {
  if (!mission) return null

  const launchMs = new Date(mission.launchDate).getTime()
  const elapsedH = Math.max(0, Math.floor((Date.now() - launchMs) / 3_600_000))
  const totalH = mission.totalDays * 24

  return (
    <div className="glass-panel border-glow px-5 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Mission Timeline</span>
        <span className="font-mono text-[11px] text-slate-400">
          Day {mission.missionDay}/{mission.totalDays} <span className="text-cyan-glow">{mission.progress.toFixed(0)}%</span>
        </span>
      </div>

      {/* Phases as a single progress track */}
      <div className="relative mb-3">
        {/* Background track */}
        <div className="h-1 bg-slate-800 rounded-full" />
        {/* Filled track */}
        <motion.div
          className="absolute top-0 h-1 rounded-full bg-gradient-to-r from-cyan-glow to-cyan-dim"
          initial={{ width: 0 }}
          animate={{ width: `${mission.progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        {/* Phase markers on the track */}
        <div className="absolute inset-x-0 -top-2 flex justify-between">
          {mission.phases.map((phase) => (
            <div key={phase.name} className="flex flex-col items-center" style={{ width: `${100 / mission.phases.length}%` }}>
              <PhaseIcon phase={phase} />
            </div>
          ))}
        </div>
      </div>

      {/* Phase labels below track */}
      <div className="flex justify-between mb-2 mt-1">
        {mission.phases.map((phase) => (
          <div key={phase.name} className="flex-1 text-center px-0.5">
            <span className={`text-[7.5px] xl:text-[8px] leading-tight ${
              phase.status !== 'upcoming' ? 'text-cyan-glow/70' : 'text-slate-600'
            }`}>
              {phase.name}
            </span>
          </div>
        ))}
      </div>

      {/* Time markers */}
      <div className="flex justify-between text-[8px] text-slate-600 font-mono mb-2">
        <span>LAUNCH · T-0</span>
        <span className="text-slate-500">T+{elapsedH}h elapsed of {totalH}h</span>
        <span>SPLASHDOWN · T+{totalH}h</span>
      </div>

      {/* Description line */}
      <div className="flex items-center justify-between text-xs border-t border-slate-800 pt-2">
        <span>
          <span className="text-slate-600">&gt; </span>
          <span className="text-white font-semibold">{mission.currentPhase}</span>
          <span className="text-slate-500"> — {PHASE_DESC[mission.currentPhase] || ''}</span>
        </span>
        <span className="text-amber-glow text-[11px] font-mono shrink-0 ml-4">Next: {mission.nextMilestone.name}</span>
      </div>
    </div>
  )
}
