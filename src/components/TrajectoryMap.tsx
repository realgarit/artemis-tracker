import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { TrajectoryData, MissionData } from '../lib/types'

interface TrajectoryMapProps {
  trajectory?: TrajectoryData
  mission?: MissionData
}

const VB = { w: 860, h: 420 }
const EARTH = { x: 115, y: 210, r: 36 }
const MOON = { x: 710, y: 200, r: 14 }

// Two smooth curves sharing endpoints → one continuous elliptical loop
// No separate flyby segment = no kink
const DEPART = { x: 155, y: 205 }  // leave Earth
const ARRIVE = { x: 157, y: 212 }  // return to Earth
const FLYBY  = { x: 745, y: 205 }  // junction right of Moon

// Outbound (top arc): DEPART → sweeps above → FLYBY
const OB_C1 = { x: 290, y: 45 }
const OB_C2 = { x: 580, y: 20 }

// Return (bottom arc): FLYBY → sweeps below → ARRIVE
const RT_C1 = { x: 580, y: 390 }
const RT_C2 = { x: 290, y: 370 }

const OUTBOUND_D = `M${DEPART.x},${DEPART.y} C${OB_C1.x},${OB_C1.y} ${OB_C2.x},${OB_C2.y} ${FLYBY.x},${FLYBY.y}`
const RETURN_D = `M${FLYBY.x},${FLYBY.y} C${RT_C1.x},${RT_C1.y} ${RT_C2.x},${RT_C2.y} ${ARRIVE.x},${ARRIVE.y}`

function bez(p0: {x:number;y:number}, c1: {x:number;y:number}, c2: {x:number;y:number}, p1: {x:number;y:number}, t: number) {
  const u = 1 - t
  return {
    x: u*u*u*p0.x + 3*u*u*t*c1.x + 3*u*t*t*c2.x + t*t*t*p1.x,
    y: u*u*u*p0.y + 3*u*u*t*c1.y + 3*u*t*t*c2.y + t*t*t*p1.y,
  }
}

function pathDots(p0: {x:number;y:number}, c1: {x:number;y:number}, c2: {x:number;y:number}, p1: {x:number;y:number}, n: number) {
  return Array.from({ length: n }, (_, i) => bez(p0, c1, c2, p1, (i + 1) / (n + 1)))
}

function getOrionPos(progress: number) {
  const p = progress / 100
  if (p < 0.5) return bez(DEPART, OB_C1, OB_C2, FLYBY, p / 0.5)
  return bez(FLYBY, RT_C1, RT_C2, ARRIVE, (p - 0.5) / 0.5)
}

const STARS = Array.from({ length: 55 }, (_, i) => ({
  x: (i * 137.508) % VB.w, y: (i * 89.3 + 11) % VB.h,
  r: i % 5 === 0 ? 1 : 0.5, o: 0.08 + (i % 4) * 0.06,
}))

const obDots = pathDots(DEPART, OB_C1, OB_C2, FLYBY, 18)
const rtDots = pathDots(FLYBY, RT_C1, RT_C2, ARRIVE, 18)

export function TrajectoryMap({ trajectory, mission }: TrajectoryMapProps) {
  const progress = mission?.progress ?? 0
  const orion = useMemo(() => getOrionPos(progress), [progress])
  const dist = trajectory ? `${Math.round(trajectory.distanceFromEarth).toLocaleString()} km` : '—'

  return (
    <div className="glass-panel border-glow p-3 h-full flex flex-col">
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="w-full flex-1" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="eg" cx="40%" cy="40%"><stop offset="0%" stopColor="#60a5fa"/><stop offset="55%" stopColor="#2563eb"/><stop offset="100%" stopColor="#1e3a5f"/></radialGradient>
          <radialGradient id="eGlow" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="#3b82f6" stopOpacity=".2"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></radialGradient>
          <radialGradient id="mg" cx="40%" cy="35%"><stop offset="0%" stopColor="#d1d5db"/><stop offset="55%" stopColor="#9ca3af"/><stop offset="100%" stopColor="#6b7280"/></radialGradient>
          <radialGradient id="orionGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#f59e0b" stopOpacity=".7"/><stop offset="40%" stopColor="#f59e0b" stopOpacity=".15"/><stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/></radialGradient>
        </defs>

        {/* Stars */}
        {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o}/>)}

        {/* Source badge */}
        <rect x="8" y="8" rx="4" width="160" height="20" fill="rgba(34,211,238,.07)" stroke="rgba(34,211,238,.2)" strokeWidth=".6"/>
        <circle cx="18" cy="18" r="3" fill="#22c55e"/>
        <text x="26" y="22" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono,monospace">NASA JSC OEM · OFFICIAL</text>

        {/* Phase label top-right */}
        <text x={VB.w - 12} y="20" textAnchor="end" fill="#475569" fontSize="8.5" fontFamily="Inter,sans-serif" letterSpacing="1.5">CURRENT PHASE</text>
        <text x={VB.w - 12} y="42" textAnchor="end" fill="#22d3ee" fontSize="16" fontWeight="800" fontFamily="Orbitron,sans-serif" letterSpacing="2">{mission?.currentPhase?.toUpperCase() || ''}</text>

        {/* Arc labels */}
        <text x="380" y="48" textAnchor="middle" fill="#22d3ee" fontSize="8" fontFamily="Orbitron,sans-serif" opacity=".35" letterSpacing="4">OUTBOUND COAST</text>
        <text x="380" y={VB.h - 16} textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="Orbitron,sans-serif" opacity=".3" letterSpacing="4">RETURN COAST</text>

        {/* Lunar orbit ring */}
        <circle cx={MOON.x} cy={MOON.y} r="38" fill="none" stroke="rgba(148,163,184,.08)" strokeWidth=".5" strokeDasharray="2 3"/>
        <text x={MOON.x - 50} y={MOON.y - 25} fill="#4b5563" fontSize="6.5" fontFamily="JetBrains Mono,monospace" textAnchor="middle">6,400 km</text>

        {/* Outbound path (solid) + dots */}
        <path d={OUTBOUND_D} fill="none" stroke="rgba(34,211,238,.45)" strokeWidth="1.2"/>
        {obDots.map((d, i) => <circle key={`o${i}`} cx={d.x} cy={d.y} r="2" fill="rgba(34,211,238,.2)"/>)}

        {/* Return path (solid) + dots */}
        <path d={RETURN_D} fill="none" stroke="rgba(245,158,11,.35)" strokeWidth="1.2"/>
        {rtDots.map((d, i) => <circle key={`r${i}`} cx={d.x} cy={d.y} r="2" fill="rgba(245,158,11,.18)"/>)}

        {/* Earth orbit ring */}
        <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r + 8} fill="none" stroke="rgba(96,165,250,.06)" strokeWidth=".5"/>

        {/* Earth */}
        <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r * 1.6} fill="url(#eGlow)"/>
        <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} fill="url(#eg)"/>
        <text x={EARTH.x} y={EARTH.y + EARTH.r + 18} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="Orbitron,sans-serif" letterSpacing="3">EARTH</text>

        {/* Moon */}
        <circle cx={MOON.x} cy={MOON.y} r={MOON.r} fill="url(#mg)"/>
        <text x={MOON.x + MOON.r + 10} y={MOON.y + 5} fill="#94a3b8" fontSize="8.5" fontFamily="Orbitron,sans-serif" letterSpacing="2">MOON</text>

        {/* Orion */}
        <motion.g initial={{x:orion.x,y:orion.y}} animate={{x:orion.x,y:orion.y}} transition={{duration:1.5,ease:'easeInOut'}}>
          <circle r="24" fill="url(#orionGlow)"/>
          <circle r="6" fill="#f59e0b"/>
          <circle r="3.5" fill="#fbbf24" opacity=".9"/>
          <text x="-16" y="3" textAnchor="end" fill="#cbd5e1" fontSize="9" fontWeight="600" fontFamily="JetBrains Mono,monospace">{dist}</text>
          <text x="14" y="-2" textAnchor="start" fill="#22d3ee" fontSize="9.5" fontWeight="700" fontFamily="Orbitron,sans-serif" letterSpacing="1">ORION</text>
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
