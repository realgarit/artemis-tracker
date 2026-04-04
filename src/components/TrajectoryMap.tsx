import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { TrajectoryData, MissionData } from '../lib/types'

interface TrajectoryMapProps {
  trajectory?: TrajectoryData
  mission?: MissionData
}

// Free-return trajectory control points (viewBox: 0 0 1000 500)
const EARTH_CENTER = { x: 140, y: 250 }
const EARTH_RADIUS = 40
const MOON_CENTER = { x: 820, y: 210 }
const MOON_RADIUS = 14

// Outbound path: Earth → Moon approach
const OUTBOUND_PATH = `M ${EARTH_CENTER.x + EARTH_RADIUS + 5} ${EARTH_CENTER.y}
  C 350 235, 580 210, ${MOON_CENTER.x - 30} ${MOON_CENTER.y - 15}`

// Flyby arc around Moon
const FLYBY_PATH = `C ${MOON_CENTER.x + 40} ${MOON_CENTER.y - 30}, ${MOON_CENTER.x + 50} ${MOON_CENTER.y + 30}, ${MOON_CENTER.x - 20} ${MOON_CENTER.y + 35}`

// Return path: Moon → Earth
const RETURN_PATH = `C 600 310, 370 330, ${EARTH_CENTER.x + EARTH_RADIUS + 5} ${EARTH_CENTER.y + 15}`

// Full combined path for positioning
const FULL_PATH = `${OUTBOUND_PATH} ${FLYBY_PATH} ${RETURN_PATH}`

function getProgressPosition(progress: number): { x: number; y: number } {
  // Map mission progress (0-100%) to approximate position along the trajectory
  // Using cubic bezier interpolation at key points
  const t = progress / 100

  // Simplified position calculation using the trajectory shape
  // Phase mapping: 0-45% outbound, 45-55% flyby, 55-100% return
  let x: number, y: number

  if (t < 0.45) {
    // Outbound: Earth to Moon
    const s = t / 0.45
    x = lerp(EARTH_CENTER.x + EARTH_RADIUS + 5, MOON_CENTER.x - 30, easeInOut(s))
    y = lerp(EARTH_CENTER.y, MOON_CENTER.y - 15, easeInOut(s) * 0.8)
  } else if (t < 0.55) {
    // Flyby: around Moon
    const s = (t - 0.45) / 0.1
    const angle = -Math.PI / 2 + s * Math.PI
    x = MOON_CENTER.x + Math.cos(angle) * 45
    y = MOON_CENTER.y + Math.sin(angle) * 35 + 10
  } else {
    // Return: Moon to Earth
    const s = (t - 0.55) / 0.45
    x = lerp(MOON_CENTER.x - 20, EARTH_CENTER.x + EARTH_RADIUS + 5, easeInOut(s))
    y = lerp(MOON_CENTER.y + 35, EARTH_CENTER.y + 15, easeInOut(s))
  }

  return { x, y }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export function TrajectoryMap({ trajectory, mission }: TrajectoryMapProps) {
  const progress = mission?.progress ?? 0
  const orionPos = useMemo(() => getProgressPosition(progress), [progress])

  const distanceLabel = trajectory
    ? `${Math.round(trajectory.distanceFromEarth).toLocaleString()} km`
    : '---'

  return (
    <div className="glass-panel border-glow p-4 relative overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-medium">
          Trajectory Visualization
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-cyan-glow/10 text-cyan-glow px-2 py-0.5 rounded-full border border-cyan-glow/20 font-mono">
            {trajectory?.source || 'AWAITING DATA'}
          </span>
        </div>
      </div>

      <svg viewBox="0 0 1000 500" className="w-full h-auto" style={{ minHeight: 280 }}>
        <defs>
          {/* Earth gradient */}
          <radialGradient id="earthGradient" cx="40%" cy="40%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="60%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a5f" />
          </radialGradient>

          {/* Earth glow */}
          <radialGradient id="earthGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>

          {/* Moon gradient */}
          <radialGradient id="moonGradient" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="60%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#6b7280" />
          </radialGradient>

          {/* Orion glow */}
          <radialGradient id="orionGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>

          {/* Trajectory gradient - outbound */}
          <linearGradient id="outboundGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
          </linearGradient>

          {/* Trajectory gradient - return */}
          <linearGradient id="returnGrad" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Starfield dots */}
        {Array.from({ length: 50 }, (_, i) => (
          <circle
            key={i}
            cx={((i * 137.5) % 1000)}
            cy={((i * 89.3) % 500)}
            r={i % 3 === 0 ? 1.2 : 0.7}
            fill="white"
            opacity={0.15 + (i % 4) * 0.1}
          />
        ))}

        {/* Lunar orbit indicator (dashed circle around Moon at flyby distance) */}
        <circle
          cx={MOON_CENTER.x}
          cy={MOON_CENTER.y}
          r={45}
          fill="none"
          stroke="rgba(156,163,175,0.15)"
          strokeWidth="0.5"
          strokeDasharray="3 3"
        />

        {/* Outbound trajectory path */}
        <path
          d={OUTBOUND_PATH}
          fill="none"
          stroke="url(#outboundGrad)"
          strokeWidth="2"
          strokeDasharray="8 4"
        />

        {/* Flyby + Return path */}
        <path
          d={`M ${MOON_CENTER.x - 30} ${MOON_CENTER.y - 15} ${FLYBY_PATH} ${RETURN_PATH}`}
          fill="none"
          stroke="url(#returnGrad)"
          strokeWidth="2"
          strokeDasharray="8 4"
        />

        {/* Earth glow */}
        <circle
          cx={EARTH_CENTER.x}
          cy={EARTH_CENTER.y}
          r={EARTH_RADIUS * 1.8}
          fill="url(#earthGlow)"
        />

        {/* Earth */}
        <circle
          cx={EARTH_CENTER.x}
          cy={EARTH_CENTER.y}
          r={EARTH_RADIUS}
          fill="url(#earthGradient)"
        />
        <text
          x={EARTH_CENTER.x}
          y={EARTH_CENTER.y + EARTH_RADIUS + 18}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
          fontFamily="Inter, sans-serif"
        >
          EARTH
        </text>

        {/* Moon */}
        <circle
          cx={MOON_CENTER.x}
          cy={MOON_CENTER.y}
          r={MOON_RADIUS}
          fill="url(#moonGradient)"
        />
        <text
          x={MOON_CENTER.x}
          y={MOON_CENTER.y + MOON_RADIUS + 16}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="10"
          fontFamily="Inter, sans-serif"
        >
          MOON
        </text>

        {/* Flyby distance label */}
        <text
          x={MOON_CENTER.x + 55}
          y={MOON_CENTER.y - 20}
          fill="#6b7280"
          fontSize="8"
          fontFamily="JetBrains Mono, monospace"
        >
          ~6,400 km flyby
        </text>

        {/* Orion spacecraft */}
        <motion.g
          animate={{ x: orionPos.x, y: orionPos.y }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        >
          {/* Glow */}
          <circle r="20" fill="url(#orionGlow)" />
          {/* Craft dot */}
          <circle r="5" fill="#22d3ee" />
          <circle r="3" fill="#fff" />

          {/* Label */}
          <text
            y="-14"
            textAnchor="middle"
            fill="#22d3ee"
            fontSize="9"
            fontWeight="bold"
            fontFamily="Orbitron, sans-serif"
          >
            ORION
          </text>

          {/* Distance readout */}
          <text
            y="24"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            {distanceLabel}
          </text>
        </motion.g>

        {/* Phase label */}
        <text
          x="500"
          y="470"
          textAnchor="middle"
          fill="#22d3ee"
          fontSize="12"
          fontFamily="Orbitron, sans-serif"
          opacity="0.6"
          letterSpacing="3"
        >
          {mission?.currentPhase?.toUpperCase() || ''}
        </text>
      </svg>

      {/* Progress bar at bottom */}
      <div className="mt-2">
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-amber-glow transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
