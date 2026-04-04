import { motion } from 'framer-motion'
import { Zap, Radio } from 'lucide-react'
import type { TrajectoryData } from '../lib/types'

interface StatsGridProps {
  trajectory?: TrajectoryData
}

function StatCard({
  label,
  value,
  unit,
  color = 'cyan',
  icon,
  delay = 0,
}: {
  label: string
  value: number | string
  unit: string
  color?: 'cyan' | 'amber'
  icon?: React.ReactNode
  delay?: number
}) {
  const colorClass = color === 'cyan' ? 'text-cyan-glow' : 'text-amber-glow'
  const borderClass = color === 'cyan' ? 'border-glow' : 'border-glow-amber'
  const glowClass = color === 'cyan' ? 'glow-cyan' : 'glow-amber'

  return (
    <motion.div
      className={`glass-panel ${borderClass} p-5`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
          {label}
        </span>
        {icon}
      </div>
      <div className={`font-mono text-2xl sm:text-3xl font-bold ${colorClass} ${glowClass}`}>
        {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
      </div>
      <div className="text-xs text-slate-500 mt-1 font-mono">{unit}</div>
    </motion.div>
  )
}

export function StatsGrid({ trajectory }: StatsGridProps) {
  if (!trajectory) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-panel p-5 animate-pulse">
            <div className="h-3 bg-slate-700/50 rounded w-20 mb-3" />
            <div className="h-8 bg-slate-700/50 rounded w-32" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 h-full content-start">
      <StatCard
        label="Distance from Earth"
        value={Math.round(trajectory.distanceFromEarth)}
        unit="km"
        color="cyan"
        delay={0}
      />
      <StatCard
        label="Velocity"
        value={trajectory.velocity}
        unit="km/s"
        color="cyan"
        icon={<Zap className="h-4 w-4 text-cyan-glow" />}
        delay={0.05}
      />
      <StatCard
        label="Distance from Moon"
        value={Math.round(trajectory.distanceFromMoon)}
        unit="km"
        delay={0.1}
      />
      <StatCard
        label="Comms Delay"
        value={trajectory.commsDelay}
        unit="sec (one-way)"
        color="amber"
        icon={<Radio className="h-4 w-4 text-amber-glow" />}
        delay={0.15}
      />
    </div>
  )
}
