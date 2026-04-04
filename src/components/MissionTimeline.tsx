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
  return <div className="h-4 w-4 rounded-full border border-slate-600" />
}

export function MissionTimeline({ mission }: MissionTimelineProps) {
  if (!mission) return null

  const launchMs = new Date(mission.launchDate).getTime()
  const elapsedH = Math.max(0, Math.floor((Date.now() - launchMs) / 3_600_000))
  const totalH = mission.totalDays * 24

  return (
    <div className="glass-panel border-glow px-4 py-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Mission Timeline</span>
        <span className="font-mono text-[11px] text-slate-400">
          Day {mission.missionDay}/{mission.totalDays} <span className="text-cyan-glow">{mission.progress.toFixed(0)}%</span>
        </span>
      </div>

      {/* Phase row */}
      <div className="flex items-center mb-2.5 overflow-x-auto">
        {mission.phases.map((phase, i) => (
          <div key={phase.name} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <PhaseIcon phase={phase} />
              <span className={`text-[8px] leading-tight text-center whitespace-nowrap ${phase.status !== 'upcoming' ? 'text-cyan-glow/80' : 'text-slate-600'}`}>
                {phase.name}
              </span>
            </div>
            {i < mission.phases.length - 1 && (
              <div className="flex-1 mx-1.5 min-w-[10px]">
                <div className={`h-px ${phase.status === 'completed' ? 'bg-cyan-glow/40' : 'bg-slate-800'}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="relative mb-2">
        <div className="flex justify-between text-[8px] text-slate-600 mb-0.5">
          <span>LAUNCH</span>
          <span className="text-slate-500 font-mono">T+{elapsedH}h elapsed of {totalH}h</span>
          <span>SPLASHDOWN</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-cyan-dim" initial={{width:0}} animate={{width:`${mission.progress}%`}} transition={{duration:1,ease:'easeOut'}} />
        </div>
        <div className="flex justify-between text-[8px] text-slate-700 mt-0.5 font-mono">
          <span>T-0</span><span>T+{totalH}h</span>
        </div>
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
