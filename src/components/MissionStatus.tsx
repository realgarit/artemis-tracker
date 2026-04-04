import { Timer, Globe, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import type { MissionData } from '../lib/types'

interface MissionStatusProps {
  mission?: MissionData
}

export function MissionStatus({ mission }: MissionStatusProps) {
  if (!mission) {
    return (
      <div className="glass-panel border-glow p-6 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded w-64 mb-2" />
        <div className="h-4 bg-slate-700/50 rounded w-96" />
      </div>
    )
  }

  const etaDate = new Date(mission.nextMilestone.eta)
  const now = new Date()
  const etaHours = Math.max(0, (etaDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  const etaDays = Math.floor(etaHours / 24)
  const etaRemainingHours = Math.floor(etaHours % 24)

  return (
    <motion.div
      className="glass-panel border-glow p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left: Mission info */}
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-wide">
            {mission.name}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Crew of {mission.crew.length} — {mission.crew.map((c) => c.name).join(', ')}
          </p>
        </div>

        {/* Right: Stats row */}
        <div className="flex flex-wrap gap-6">
          {/* Day count */}
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-cyan-glow" />
            <div>
              <div className="font-mono text-xl font-bold text-white">
                Day {mission.missionDay}
                <span className="text-sm text-slate-400 font-normal"> / {mission.totalDays}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Mission Day</div>
            </div>
          </div>

          {/* Current phase */}
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-glow" />
            <div>
              <div className="font-mono text-base font-semibold text-cyan-glow">
                {mission.currentPhase}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Current Phase</div>
            </div>
          </div>

          {/* Next milestone */}
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-glow" />
            <div>
              <div className="font-mono text-base font-semibold text-amber-glow">
                {mission.nextMilestone.name}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                ETA: {etaDays > 0 ? `${etaDays}d ` : ''}{etaRemainingHours}h
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>MISSION PROGRESS</span>
          <span className="font-mono">{mission.progress.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-cyan-dim"
            initial={{ width: 0 }}
            animate={{ width: `${mission.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
