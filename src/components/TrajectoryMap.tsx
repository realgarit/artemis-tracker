import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { TrajectoryData, MissionData } from '../lib/types'

interface TrajectoryMapProps {
  trajectory?: TrajectoryData
  mission?: MissionData
}

// SVG layout constants
const EARTH = { x: 130, y: 235, r: 42 }
const MOON = { x: 720, y: 220, r: 16 }

// Cubic bezier control points for trajectory arcs
const OUTBOUND = {
  p0: { x: 175, y: 235 },
  p1: { x: 310, y: 90 },
  p2: { x: 550, y: 65 },
  p3: { x: 700, y: 200 },
}
const RETURN = {
  p0: { x: 735, y: 255 },
  p1: { x: 550, y: 400 },
  p2: { x: 310, y: 375 },
  p3: { x: 175, y: 245 },
}

const OUTBOUND_PATH = `M ${OUTBOUND.p0.x},${OUTBOUND.p0.y} C ${OUTBOUND.p1.x},${OUTBOUND.p1.y} ${OUTBOUND.p2.x},${OUTBOUND.p2.y} ${OUTBOUND.p3.x},${OUTBOUND.p3.y}`
const FLYBY_ARC = `C ${MOON.x + 25},${MOON.y - 15} ${MOON.x + 35},${MOON.y + 20} ${RETURN.p0.x},${RETURN.p0.y}`
const RETURN_PATH = `M ${RETURN.p0.x},${RETURN.p0.y} C ${RETURN.p1.x},${RETURN.p1.y} ${RETURN.p2.x},${RETURN.p2.y} ${RETURN.p3.x},${RETURN.p3.y}`

function cubicBezier(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
) {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  }
}

function getOrionPosition(progress: number): { x: number; y: number } {
  const p = progress / 100
  // Phase mapping: 0–45% outbound, 45–55% flyby, 55–100% return
  if (p < 0.45) {
    const t = p / 0.45
    return cubicBezier(OUTBOUND.p0, OUTBOUND.p1, OUTBOUND.p2, OUTBOUND.p3, t)
  } else if (p < 0.55) {
    const t = (p - 0.45) / 0.1
    const angle = -Math.PI * 0.4 + t * Math.PI * 0.9
    return {
      x: MOON.x + Math.cos(angle) * 35,
      y: MOON.y + Math.sin(angle) * 30 + 5,
    }
  } else {
    const t = (p - 0.55) / 0.45
    return cubicBezier(RETURN.p0, RETURN.p1, RETURN.p2, RETURN.p3, t)
  }
}

// Random but deterministic starfield
const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: ((i * 137.508) % 900),
  y: ((i * 89.3 + 17) % 470),
  r: i % 5 === 0 ? 1.3 : i % 3 === 0 ? 0.9 : 0.6,
  o: 0.12 + (i % 5) * 0.08,
}))

export function TrajectoryMap({ trajectory, mission }: TrajectoryMapProps) {
  const progress = mission?.progress ?? 0
  const orion = useMemo(() => getOrionPosition(progress), [progress])
  const distLabel = trajectory
    ? `${Math.round(trajectory.distanceFromEarth).toLocaleString()} km`
    : '—'

  return (
    <div className="glass-panel border-glow p-4 relative overflow-hidden">
      <svg viewBox="0 0 900 470" className="w-full" style={{ minHeight: 300 }}>
        <defs>
          <radialGradient id="eg" cx="40%" cy="40%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="60%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a5f" />
          </radialGradient>
          <radialGradient id="eGlow" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="mg" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="60%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#6b7280" />
          </radialGradient>
          <radialGradient id="og" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="outGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="retGrad" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Starfield */}
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o} />
        ))}

        {/* Source badge */}
        <g>
          <rect x="8" y="8" width="170" height="22" rx="4" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.2)" strokeWidth="0.5" />
          <circle cx="18" cy="19" r="3" fill="#22c55e" />
          <text x="26" y="23" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono, monospace">
            {trajectory?.source ? 'NASA JSC OEM · OFFICIAL' : 'AWAITING DATA'}
          </text>
        </g>

        {/* Current phase label (upper right) */}
        <text x="890" y="24" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="Inter, sans-serif" letterSpacing="1">
          CURRENT PHASE
        </text>
        <text x="890" y="46" textAnchor="end" fill="#22d3ee" fontSize="18" fontWeight="800" fontFamily="Orbitron, sans-serif" letterSpacing="2">
          {mission?.currentPhase?.toUpperCase() || ''}
        </text>

        {/* Outbound label */}
        <text x="400" y="70" textAnchor="middle" fill="#22d3ee" fontSize="9" fontFamily="Orbitron, sans-serif" opacity="0.5" letterSpacing="3">
          OUTBOUND COAST
        </text>

        {/* Lunar orbit indicator */}
        <circle cx={MOON.x} cy={MOON.y} r={40} fill="none" stroke="rgba(156,163,175,0.12)" strokeWidth="0.5" strokeDasharray="3 4" />

        {/* Flyby distance label */}
        <text x={MOON.x - 45} y={MOON.y - 30} fill="#6b7280" fontSize="8" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
          6,400 km
        </text>

        {/* Outbound trajectory */}
        <path d={OUTBOUND_PATH} fill="none" stroke="url(#outGrad)" strokeWidth="1.5" strokeDasharray="6 4" />

        {/* Flyby arc */}
        <path d={`M ${OUTBOUND.p3.x},${OUTBOUND.p3.y} ${FLYBY_ARC}`} fill="none" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" strokeDasharray="6 4" />

        {/* Return trajectory */}
        <path d={RETURN_PATH} fill="none" stroke="url(#retGrad)" strokeWidth="1.5" strokeDasharray="6 4" />

        {/* Return label */}
        <text x="400" y="415" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="Orbitron, sans-serif" opacity="0.4" letterSpacing="3">
          RETURN COAST
        </text>

        {/* Earth glow + body */}
        <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r * 1.7} fill="url(#eGlow)" />
        <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} fill="url(#eg)" />
        <text x={EARTH.x} y={EARTH.y + EARTH.r + 20} textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="Orbitron, sans-serif" letterSpacing="2">
          EARTH
        </text>

        {/* Moon */}
        <circle cx={MOON.x} cy={MOON.y} r={MOON.r} fill="url(#mg)" />
        <text x={MOON.x + MOON.r + 10} y={MOON.y + 5} fill="#94a3b8" fontSize="10" fontFamily="Orbitron, sans-serif" letterSpacing="1">
          MOON
        </text>

        {/* Orion spacecraft */}
        <motion.g
          initial={{ x: orion.x, y: orion.y }}
          animate={{ x: orion.x, y: orion.y }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        >
          {/* Outer glow */}
          <circle r="28" fill="url(#og)" />
          {/* Main dot */}
          <circle r="7" fill="#22d3ee" />
          <circle r="4" fill="#fff" opacity="0.9" />

          {/* ORION label */}
          <text y="-16" textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="700" fontFamily="Orbitron, sans-serif" letterSpacing="1">
            ORION
          </text>

          {/* Distance readout */}
          <text y="28" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="600" fontFamily="JetBrains Mono, monospace">
            {distLabel}
          </text>
        </motion.g>
      </svg>

      {/* Bottom progress bar */}
      <div className="mt-1">
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-amber-glow transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
