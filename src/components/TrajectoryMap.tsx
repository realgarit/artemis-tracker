import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { TrajectoryData, MissionData } from '../lib/types'

interface TrajectoryMapProps {
  trajectory?: TrajectoryData
  mission?: MissionData
}

// SVG layout — landscape aspect ratio for desktop
const VB = { w: 860, h: 400 }
const EARTH = { x: 120, y: 200, r: 38 }
const MOON = { x: 700, y: 185, r: 14 }

// Outbound arc (top curve, Earth → Moon)
const OB = {
  p0: { x: 158, y: 195 },
  p1: { x: 300, y: 75 },
  p2: { x: 520, y: 55 },
  p3: { x: 680, y: 170 },
}
// Return arc (bottom curve, Moon → Earth)
const RT = {
  p0: { x: 715, y: 215 },
  p1: { x: 530, y: 350 },
  p2: { x: 300, y: 335 },
  p3: { x: 158, y: 210 },
}

const OUTBOUND_D = `M${OB.p0.x},${OB.p0.y} C${OB.p1.x},${OB.p1.y} ${OB.p2.x},${OB.p2.y} ${OB.p3.x},${OB.p3.y}`
const FLYBY_D = `M${OB.p3.x},${OB.p3.y} C${MOON.x + 20},${MOON.y - 15} ${MOON.x + 30},${MOON.y + 20} ${RT.p0.x},${RT.p0.y}`
const RETURN_D = `M${RT.p0.x},${RT.p0.y} C${RT.p1.x},${RT.p1.y} ${RT.p2.x},${RT.p2.y} ${RT.p3.x},${RT.p3.y}`

function bez(p0: {x:number;y:number}, p1: {x:number;y:number}, p2: {x:number;y:number}, p3: {x:number;y:number}, t: number) {
  const u = 1 - t
  return {
    x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
    y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y,
  }
}

// Dots along a bezier at evenly-spaced intervals
function pathDots(p0: {x:number;y:number}, p1: {x:number;y:number}, p2: {x:number;y:number}, p3: {x:number;y:number}, n: number) {
  const dots = []
  for (let i = 1; i < n; i++) {
    dots.push(bez(p0, p1, p2, p3, i / n))
  }
  return dots
}

function getOrionPos(progress: number) {
  const p = progress / 100
  if (p < 0.45) return bez(OB.p0, OB.p1, OB.p2, OB.p3, p / 0.45)
  if (p < 0.55) {
    const t = (p - 0.45) / 0.1
    const a = -Math.PI * 0.4 + t * Math.PI * 0.9
    return { x: MOON.x + Math.cos(a) * 30, y: MOON.y + Math.sin(a) * 25 + 5 }
  }
  return bez(RT.p0, RT.p1, RT.p2, RT.p3, (p - 0.55) / 0.45)
}

const STARS = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 137.508) % VB.w, y: (i * 89.3 + 11) % VB.h,
  r: i % 5 === 0 ? 1.1 : 0.6, o: 0.1 + (i % 4) * 0.07,
}))

const obDots = pathDots(OB.p0, OB.p1, OB.p2, OB.p3, 14)
const rtDots = pathDots(RT.p0, RT.p1, RT.p2, RT.p3, 14)

export function TrajectoryMap({ trajectory, mission }: TrajectoryMapProps) {
  const progress = mission?.progress ?? 0
  const orion = useMemo(() => getOrionPos(progress), [progress])
  const dist = trajectory ? `${Math.round(trajectory.distanceFromEarth).toLocaleString()} km` : '—'

  return (
    <div className="glass-panel border-glow p-3 h-full flex flex-col">
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="w-full flex-1" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="eg" cx="40%" cy="40%"><stop offset="0%" stopColor="#60a5fa"/><stop offset="60%" stopColor="#2563eb"/><stop offset="100%" stopColor="#1e3a5f"/></radialGradient>
          <radialGradient id="eGlow" cx="50%" cy="50%" r="65%"><stop offset="0%" stopColor="#3b82f6" stopOpacity=".25"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></radialGradient>
          <radialGradient id="mg" cx="40%" cy="35%"><stop offset="0%" stopColor="#d1d5db"/><stop offset="60%" stopColor="#9ca3af"/><stop offset="100%" stopColor="#6b7280"/></radialGradient>
          <radialGradient id="og" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#22d3ee" stopOpacity=".8"/><stop offset="50%" stopColor="#22d3ee" stopOpacity=".2"/><stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/></radialGradient>
        </defs>

        {/* Stars */}
        {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o}/>)}

        {/* Source badge */}
        <rect x="6" y="6" rx="3" width="150" height="18" fill="rgba(34,211,238,.06)" stroke="rgba(34,211,238,.15)" strokeWidth=".5"/>
        <circle cx="15" cy="15" r="2.5" fill="#22c55e"/>
        <text x="22" y="18" fill="#94a3b8" fontSize="7.5" fontFamily="JetBrains Mono,monospace">NASA JSC OEM · OFFICIAL</text>

        {/* Phase label top-right */}
        <text x={VB.w - 8} y="18" textAnchor="end" fill="#475569" fontSize="8" fontFamily="Inter,sans-serif" letterSpacing="1">CURRENT PHASE</text>
        <text x={VB.w - 8} y="36" textAnchor="end" fill="#22d3ee" fontSize="15" fontWeight="800" fontFamily="Orbitron,sans-serif" letterSpacing="2">{mission?.currentPhase?.toUpperCase() || ''}</text>

        {/* Arc labels */}
        <text x="380" y="55" textAnchor="middle" fill="#22d3ee" fontSize="8" fontFamily="Orbitron,sans-serif" opacity=".4" letterSpacing="3">OUTBOUND COAST</text>
        <text x="380" y={VB.h - 15} textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="Orbitron,sans-serif" opacity=".35" letterSpacing="3">RETURN COAST</text>

        {/* Lunar orbit ring */}
        <circle cx={MOON.x} cy={MOON.y} r="35" fill="none" stroke="rgba(148,163,184,.1)" strokeWidth=".5" strokeDasharray="2 3"/>
        <text x={MOON.x - 40} y={MOON.y - 25} fill="#4b5563" fontSize="7" fontFamily="JetBrains Mono,monospace" textAnchor="middle">6,400 km</text>

        {/* Outbound path + dots */}
        <path d={OUTBOUND_D} fill="none" stroke="rgba(34,211,238,.5)" strokeWidth="1.2" strokeDasharray="5 3"/>
        {obDots.map((d, i) => <circle key={`o${i}`} cx={d.x} cy={d.y} r="1.8" fill="rgba(34,211,238,.25)"/>)}

        {/* Flyby arc */}
        <path d={FLYBY_D} fill="none" stroke="rgba(34,211,238,.3)" strokeWidth="1.2" strokeDasharray="5 3"/>

        {/* Return path + dots */}
        <path d={RETURN_D} fill="none" stroke="rgba(245,158,11,.45)" strokeWidth="1.2" strokeDasharray="5 3"/>
        {rtDots.map((d, i) => <circle key={`r${i}`} cx={d.x} cy={d.y} r="1.8" fill="rgba(245,158,11,.2)"/>)}

        {/* Earth */}
        <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r * 1.6} fill="url(#eGlow)"/>
        <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} fill="url(#eg)"/>
        <text x={EARTH.x} y={EARTH.y + EARTH.r + 16} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="Orbitron,sans-serif" letterSpacing="2">EARTH</text>

        {/* Moon */}
        <circle cx={MOON.x} cy={MOON.y} r={MOON.r} fill="url(#mg)"/>
        <text x={MOON.x + MOON.r + 8} y={MOON.y + 4} fill="#94a3b8" fontSize="8" fontFamily="Orbitron,sans-serif" letterSpacing="1">MOON</text>

        {/* Orion */}
        <motion.g initial={{x:orion.x,y:orion.y}} animate={{x:orion.x,y:orion.y}} transition={{duration:1.5,ease:'easeInOut'}}>
          <circle r="22" fill="url(#og)"/>
          <circle r="5.5" fill="#22d3ee"/>
          <circle r="3" fill="#fff" opacity=".85"/>
          <text y="-13" textAnchor="middle" fill="#22d3ee" fontSize="9" fontWeight="700" fontFamily="Orbitron,sans-serif" letterSpacing="1">ORION</text>
          <text y="22" textAnchor="middle" fill="#cbd5e1" fontSize="8.5" fontWeight="600" fontFamily="JetBrains Mono,monospace">{dist}</text>
        </motion.g>
      </svg>

      {/* Progress bar */}
      <div className="mt-1">
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-amber-glow transition-all duration-1000" style={{width:`${progress}%`}}/>
        </div>
      </div>
    </div>
  )
}
