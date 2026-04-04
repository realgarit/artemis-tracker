import type { MissionPhase } from '../lib/types'
import { motion } from 'framer-motion'

interface MissionTimelineProps {
  phases?: MissionPhase[]
}

export function MissionTimeline({ phases }: MissionTimelineProps) {
  if (!phases) return null

  return (
    <div className="sticky top-[60px] z-30 glass-panel-solid border-b border-cyan-glow/10 overflow-x-auto">
      <div className="mx-auto max-w-[1600px] px-4 py-3">
        <div className="flex items-center gap-1 min-w-[700px]">
          {phases.map((phase, i) => {
            const isCompleted = phase.status === 'completed'
            const isActive = phase.status === 'active'

            return (
              <div key={phase.name} className="flex items-center flex-1">
                {/* Phase dot + label */}
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <div className="relative">
                    <div
                      className={`h-3 w-3 rounded-full border-2 transition-colors ${
                        isCompleted
                          ? 'bg-cyan-glow border-cyan-glow'
                          : isActive
                            ? 'bg-cyan-glow/50 border-cyan-glow animate-pulse'
                            : 'bg-transparent border-slate-600'
                      }`}
                    />
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-cyan-glow"
                        animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] font-medium text-center leading-tight whitespace-nowrap ${
                      isCompleted || isActive ? 'text-cyan-glow' : 'text-slate-500'
                    }`}
                  >
                    {phase.name}
                  </span>
                </div>

                {/* Connecting line */}
                {i < phases.length - 1 && (
                  <div className="flex-1 mx-1">
                    <div
                      className={`h-0.5 rounded transition-colors ${
                        isCompleted ? 'bg-cyan-glow/60' : 'bg-slate-700'
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
