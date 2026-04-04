import { motion } from 'framer-motion'
import { Zap, Radio } from 'lucide-react'
import type { TrajectoryData } from '../lib/types'

interface StatsGridProps {
  trajectory?: TrajectoryData
}

function StatCard({
  label, value, unit, color = 'cyan', icon, large = false,
}: {
  label: string; value: number | string; unit: string
  color?: 'cyan' | 'amber'; icon?: React.ReactNode; large?: boolean
}) {
  const tc = color === 'cyan' ? 'text-cyan-glow' : 'text-amber-glow'
  const bc = color === 'cyan' ? 'border-glow' : 'border-glow-amber'
  const gc = color === 'cyan' ? 'glow-cyan' : 'glow-amber'

  return (
    <div className={`glass-panel ${bc} ${large ? 'p-5' : 'p-4'} text-center flex flex-col justify-center`}>
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="text-[9px] text-slate-400 uppercase tracking-[.15em]">{label}</span>
        {icon}
      </div>
      <div className={`font-mono ${large ? 'text-3xl xl:text-4xl' : 'text-2xl'} font-bold ${tc} ${gc}`}>
        {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
        <span className={`${large ? 'text-base' : 'text-sm'} text-slate-500 font-normal ml-1`}>{unit}</span>
      </div>
    </div>
  )
}

export function StatsGrid({ trajectory }: StatsGridProps) {
  if (!trajectory) {
    return (
      <div className="grid grid-cols-2 gap-3 h-full content-center">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-panel p-5 animate-pulse">
            <div className="h-3 bg-slate-700/50 rounded w-16 mx-auto mb-2" />
            <div className="h-8 bg-slate-700/50 rounded w-28 mx-auto" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 h-full content-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <StatCard
        label="Distance · Earth"
        value={Math.round(trajectory.distanceFromEarth)}
        unit="km"
        large
      />
      <StatCard
        label="Speed"
        value={trajectory.velocity}
        unit="km/s"
        icon={<Zap className="h-3 w-3 text-cyan-glow" />}
        large
      />
      <StatCard
        label="Distance · Moon"
        value={Math.round(trajectory.distanceFromMoon)}
        unit="km"
      />
      <StatCard
        label="Comms Delay"
        value={trajectory.commsDelay}
        unit="sec"
        color="amber"
        icon={<Radio className="h-3 w-3 text-amber-glow" />}
      />
    </motion.div>
  )
}
