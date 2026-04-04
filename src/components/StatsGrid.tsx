import { motion } from 'framer-motion'
import type { TrajectoryData } from '../lib/types'

interface StatsGridProps {
  trajectory?: TrajectoryData
}

function LargeStatCard({
  label,
  value,
  unit,
  color = 'cyan',
  delay = 0,
}: {
  label: string
  value: number | string
  unit: string
  color?: 'cyan' | 'amber'
  delay?: number
}) {
  const textColor = color === 'cyan' ? 'text-cyan-glow' : 'text-amber-glow'
  const borderClass = color === 'cyan' ? 'border-glow' : 'border-glow-amber'
  const glowClass = color === 'cyan' ? 'glow-cyan' : 'glow-amber'

  return (
    <motion.div
      className={`glass-panel ${borderClass} p-6 text-center`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-medium">
        {label}
      </span>
      <div className={`font-mono text-4xl sm:text-5xl font-bold mt-2 ${textColor} ${glowClass}`}>
        {typeof value === 'number'
          ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : value}
        <span className="text-lg sm:text-xl text-slate-400 font-normal ml-1">{unit}</span>
      </div>
    </motion.div>
  )
}

function SmallStatCard({
  label,
  value,
  unit,
  color = 'cyan',
}: {
  label: string
  value: number | string
  unit: string
  color?: 'cyan' | 'amber'
}) {
  const textColor = color === 'cyan' ? 'text-cyan-glow' : 'text-amber-glow'
  const borderClass = color === 'cyan' ? 'border-glow' : 'border-glow-amber'

  return (
    <div className={`glass-panel ${borderClass} p-4 text-center`}>
      <span className="text-[9px] text-slate-400 uppercase tracking-widest">{label}</span>
      <div className={`font-mono text-2xl font-bold mt-1 ${textColor}`}>
        {typeof value === 'number'
          ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : value}
        <span className="text-xs text-slate-400 font-normal ml-1">{unit}</span>
      </div>
    </div>
  )
}

export function StatsGrid({ trajectory }: StatsGridProps) {
  if (!trajectory) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-panel p-6 animate-pulse">
            <div className="h-3 bg-slate-700/50 rounded w-20 mx-auto mb-3" />
            <div className="h-10 bg-slate-700/50 rounded w-40 mx-auto" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Primary stats - large */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LargeStatCard
          label="Distance · Earth"
          value={Math.round(trajectory.distanceFromEarth)}
          unit="km"
          color="cyan"
        />
        <LargeStatCard
          label="Speed"
          value={trajectory.velocity}
          unit="km/s"
          color="cyan"
          delay={0.05}
        />
      </div>
      {/* Secondary stats - smaller */}
      <div className="grid grid-cols-2 gap-4">
        <SmallStatCard
          label="Distance · Moon"
          value={Math.round(trajectory.distanceFromMoon)}
          unit="km"
        />
        <SmallStatCard
          label="Comms Delay"
          value={trajectory.commsDelay}
          unit="sec"
          color="amber"
        />
      </div>
    </div>
  )
}
