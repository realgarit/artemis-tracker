import { useRef, useMemo, Component, type ReactNode } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Line } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import {
  eR, mR, SCALE, EARTH_RADIUS_KM, MOON_RADIUS_KM,
  getCurrentMissionDay, getTrajectoryPos, getMoonPos, getVelocity,
  buildTrajectoryCurve, buildMoonArc, getMissionPhase,
} from '../data/trajectoryData'
import type { MissionData } from '../lib/types'

interface TrajectoryMapProps {
  mission?: MissionData
}

// Pre-compute full trajectory curve (TLI → splashdown)
const fullTrajPts = buildTrajectoryCurve()
const moonArcPts = buildMoonArc()

// ——— Earth ———
function Earth() {
  const ref = useRef<THREE.Mesh>(null)
  const texture = useLoader(THREE.TextureLoader, '/textures/earth.jpg')
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.02 })

  return (
    <group>
      {/* Atmosphere inner glow */}
      <mesh>
        <sphereGeometry args={[eR * 1.06, 64, 64]} />
        <meshBasicMaterial color="#4499ff" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[eR * 2.5, 32, 32]} />
        <meshBasicMaterial color="#2266aa" transparent opacity={0.02} side={THREE.BackSide} />
      </mesh>
      {/* Planet */}
      <mesh ref={ref}>
        <sphereGeometry args={[eR, 128, 64]} />
        <meshStandardMaterial map={texture} roughness={0.8} metalness={0.05} />
      </mesh>
      <Html position={[0, -(eR + 1), 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#4499ff', letterSpacing: 4, userSelect: 'none', opacity: 0.7 }}>EARTH</span>
      </Html>
    </group>
  )
}

// ——— Moon (moves each frame) ———
function Moon() {
  const ref = useRef<THREE.Group>(null)
  const texture = useLoader(THREE.TextureLoader, '/textures/moon.jpg')

  useFrame(() => {
    if (!ref.current) return
    const day = getCurrentMissionDay()
    const pos = getMoonPos(day)
    ref.current.position.copy(pos)
  })

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[mR, 64, 32]} />
        <meshStandardMaterial map={texture} roughness={0.95} metalness={0} />
      </mesh>
      {/* Subtle glow */}
      <mesh>
        <sphereGeometry args={[mR * 2.5, 16, 16]} />
        <meshBasicMaterial color="#888899" transparent opacity={0.015} side={THREE.BackSide} />
      </mesh>
      <Html position={[0, -(mR + 0.8), 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: '#aaaacc', letterSpacing: 3, userSelect: 'none', opacity: 0.6 }}>MOON</span>
      </Html>
    </group>
  )
}

// ——— Trajectory lines ———
function TrajectoryLines() {
  const traveledRef = useRef<any>(null)

  // Full predicted path (dashed, dim)
  const fullPts = useMemo(() => fullTrajPts.map(p => [p.x, p.y, p.z] as [number, number, number]), [])

  // Moon orbit arc
  const moonPts = useMemo(() => moonArcPts.map(p => [p.x, p.y, p.z] as [number, number, number]), [])

  useFrame(() => {
    if (!traveledRef.current) return
    const day = getCurrentMissionDay()
    // Find how far along the trajectory we are
    const totalPts = fullTrajPts.length
    const orionPos = getTrajectoryPos(day)
    // Find closest point index
    let closestIdx = 0
    let closestDist = Infinity
    for (let i = 0; i < totalPts; i++) {
      const d = fullTrajPts[i].distanceTo(orionPos)
      if (d < closestDist) { closestDist = d; closestIdx = i }
    }
    // Update traveled line to show only up to current position
    const traveled = fullTrajPts.slice(0, closestIdx + 1).map(p => [p.x, p.y, p.z] as [number, number, number])
    if (traveled.length > 1) {
      traveledRef.current.geometry.setPositions(traveled.flat())
    }
  })

  return (
    <>
      {/* Full predicted trajectory — dim dashed */}
      <Line points={fullPts} color="#ff8855" lineWidth={1} transparent opacity={0.15} dashed dashSize={0.4} gapSize={0.3} />
      {/* Subtle glow line */}
      <Line points={fullPts} color="#ff6b35" lineWidth={2} transparent opacity={0.03} />

      {/* Traveled portion — bright */}
      <Line ref={traveledRef} points={fullPts.slice(0, 2)} color="#ff6b35" lineWidth={2} transparent opacity={0.85} />

      {/* Moon orbit arc */}
      <Line points={moonPts} color="#ffffff" lineWidth={1} transparent opacity={0.3} />
    </>
  )
}

// ——— Orion spacecraft ———
function Orion() {
  const ref = useRef<THREE.Group>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  useFrame(() => {
    if (!ref.current) return
    const day = getCurrentMissionDay()
    const pos = getTrajectoryPos(day)
    ref.current.position.copy(pos)

    // Orient along velocity vector
    const step = 0.002
    const nextPos = getTrajectoryPos(day + step)
    if (nextPos.distanceTo(pos) > 0.001) {
      ref.current.lookAt(nextPos)
    }

    // Update distance label
    if (labelRef.current) {
      const distEarth = Math.max(0, pos.length() / SCALE - EARTH_RADIUS_KM)
      const moonPos = getMoonPos(day)
      const distMoon = Math.max(0, pos.clone().sub(moonPos).length() / SCALE - MOON_RADIUS_KM)
      const vel = getVelocity(day)
      labelRef.current.innerHTML = `
        <div style="font-family:Space Mono,monospace;font-size:9px;color:#ccc;white-space:nowrap">
          ${Math.round(distEarth).toLocaleString()} km
        </div>
      `
    }
  })

  return (
    <group ref={ref}>
      {/* Beacon glow — visible from far away */}
      <mesh>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#ff8844" transparent opacity={0.04} />
      </mesh>
      {/* Craft body */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Beacon light */}
      <pointLight color="#ff8844" intensity={1} distance={10} />

      <Html position={[1.2, 0.5, 0]} style={{ pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#ff8844', fontWeight: 700, letterSpacing: 1.5, userSelect: 'none' }}>ORION</span>
      </Html>
      <Html position={[-1.2, -0.3, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={labelRef} />
      </Html>
    </group>
  )
}

// ——— Earth-Moon connection line ———
function ConnectionLine() {
  const ref = useRef<any>(null)

  useFrame(() => {
    if (!ref.current) return
    const moonPos = getMoonPos(getCurrentMissionDay())
    ref.current.geometry.setPositions([0, 0, 0, moonPos.x, moonPos.y, moonPos.z])
  })

  return <Line ref={ref} points={[[0,0,0],[1,0,0]]} color="#ffffff" lineWidth={0.5} transparent opacity={0.06} />
}

// ——— Sun light that slowly orbits ———
function SunLight() {
  const ref = useRef<THREE.DirectionalLight>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * 0.01
    ref.current.position.set(300 * Math.cos(t), 80, -150 * Math.sin(t))
  })
  return <directionalLight ref={ref} position={[300, 80, -150]} intensity={2.5} color="#ffffff" />
}

// ——— HUD overlay (updates every frame via RAF, not polling) ———
function HUDOverlay() {
  const ref = useRef<HTMLDivElement>(null)

  // Update HUD every animation frame for true realtime
  const updateHUD = () => {
    if (!ref.current) return
    const day = getCurrentMissionDay()
    const pos = getTrajectoryPos(day)
    const moonPos = getMoonPos(day)
    const distEarth = Math.max(0, Math.round(pos.length() / SCALE - EARTH_RADIUS_KM))
    const distMoon = Math.max(0, Math.round(pos.clone().sub(moonPos).length() / SCALE - MOON_RADIUS_KM))
    const vel = getVelocity(day).toFixed(3)
    const phase = getMissionPhase(day)

    ref.current.querySelector('[data-dist-earth]')!.textContent = distEarth.toLocaleString() + ' km'
    ref.current.querySelector('[data-dist-moon]')!.textContent = distMoon.toLocaleString() + ' km'
    ref.current.querySelector('[data-velocity]')!.textContent = vel + ' km/s'
    ref.current.querySelector('[data-phase]')!.textContent = phase.toUpperCase()

    requestAnimationFrame(updateHUD)
  }

  // Start RAF loop on mount
  useMemo(() => { requestAnimationFrame(updateHUD) }, [])

  return (
    <div ref={ref} className="absolute bottom-12 left-3 z-10 space-y-1">
      <div className="bg-space-950/80 backdrop-blur-sm border border-cyan-mid/10 rounded px-2.5 py-1.5 space-y-0.5">
        <div className="flex items-center gap-3">
          <span className="text-[7px] text-slate-600 uppercase tracking-wider w-12">Earth</span>
          <span data-dist-earth className="font-mono text-[11px] text-cyan-glow font-semibold">— km</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[7px] text-slate-600 uppercase tracking-wider w-12">Moon</span>
          <span data-dist-moon className="font-mono text-[11px] text-slate-300 font-semibold">— km</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[7px] text-slate-600 uppercase tracking-wider w-12">Speed</span>
          <span data-velocity className="font-mono text-[11px] text-amber-glow font-semibold">— km/s</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[7px] text-slate-600 uppercase tracking-wider w-12">Phase</span>
          <span data-phase className="font-mono text-[9px] text-cyan-glow/70">—</span>
        </div>
      </div>
    </div>
  )
}

// ——— Main scene ———
function Scene() {
  return (
    <>
      <ambientLight intensity={0.15} color="#1a1a3a" />
      <SunLight />

      <Stars radius={1500} depth={3000} count={15000} factor={3} saturation={0} fade speed={0.3} />

      <Earth />
      <Moon />
      <TrajectoryLines />
      <Orion />
      <ConnectionLine />

      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.88} luminanceSmoothing={0.3} />
      </EffectComposer>

      <OrbitControls
        enableZoom enablePan={false}
        minDistance={2} maxDistance={300}
        autoRotate autoRotateSpeed={0.08}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.1}
        enableDamping dampingFactor={0.06}
      />
    </>
  )
}

// ——— Error boundary ———
class WebGLBoundary extends Component<{ children: ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  render() {
    if (this.state.err) return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <div className="font-display text-lg text-cyan-glow mb-2">3D Visualization Unavailable</div>
          <div className="text-[10px] text-slate-500">WebGL required — try a different browser</div>
        </div>
      </div>
    )
    return this.props.children
  }
}

// ——— Export ———
export function TrajectoryMap({ mission }: TrajectoryMapProps) {
  return (
    <div className="glass-panel border-glow p-2 h-full flex flex-col relative overflow-hidden">
      {/* Source badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-space-950/80 backdrop-blur-sm border border-cyan-mid/12 rounded px-2.5 py-1 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-green-glow live-pulse" />
          <span className="font-mono text-[7.5px] text-slate-500 tracking-wide">JPL HORIZONS · REALTIME</span>
        </div>
      </div>

      {/* Phase label */}
      <div className="absolute top-3 right-3 z-10 text-right">
        <div className="text-[7.5px] text-slate-600 tracking-[2px] uppercase">Current Phase</div>
        <div className="font-display text-[13px] text-cyan-glow font-bold tracking-wider glow-cyan mt-0.5">
          {mission?.currentPhase?.toUpperCase() || ''}
        </div>
      </div>

      {/* Realtime HUD */}
      <HUDOverlay />

      {/* 3D Canvas */}
      <WebGLBoundary>
        <div className="flex-1 min-h-[380px] sm:min-h-[420px]">
          <Canvas
            camera={{ position: [44, 100, 60], fov: 45, near: 0.01, far: 8000 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            style={{ background: 'transparent' }}
            dpr={[1, 2]}
          >
            <Scene />
          </Canvas>
        </div>
      </WebGLBoundary>

      {/* Crew strip */}
      <div className="flex items-center justify-between mt-1.5 gap-3 px-1">
        {mission?.crew && (
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
            {mission.crew.map((member) => (
              <div key={member.name} className="flex items-center gap-1.5 shrink-0">
                <div className="h-[18px] w-[18px] rounded-full bg-space-800 border border-cyan-mid/15 flex items-center justify-center text-[6.5px] font-bold text-cyan-glow/60 font-mono">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="hidden sm:block">
                  <div className="text-[8px] text-slate-400 leading-none font-medium">{member.name}</div>
                  <div className="text-[6.5px] text-slate-600 leading-none mt-0.5">{member.role} · {member.agency}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
