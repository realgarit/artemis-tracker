import { useRef, useMemo, useState, useCallback, Component, type ReactNode } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Line } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Globe, Moon as MoonIcon, Rocket, Maximize2, Minimize2, Play, Pause, RotateCcw } from 'lucide-react'
import {
  eR, mR, SCALE, EARTH_RADIUS_KM, MOON_RADIUS_KM,
  getCurrentMissionDay, getTrajectoryPos, getMoonPos, getVelocity,
  buildTrajectoryCurve, buildMoonArc, getMissionPhase, MISSION_DAYS, TRAJ_START_DAY,
} from '../data/trajectoryData'
import type { MissionData } from '../lib/types'

interface TrajectoryMapProps {
  mission?: MissionData
}

// Shared state for camera target and simulation
type CameraMode = 'overview' | 'earth' | 'moon' | 'orion'
let cameraMode: CameraMode = 'overview'
let simOverride: number | null = null // null = realtime, number = overridden day

function getSimDay(): number {
  return simOverride !== null ? simOverride : getCurrentMissionDay()
}

const fullTrajPts = buildTrajectoryCurve()
const moonArcPts = buildMoonArc()

// ——— Earth ———
function Earth() {
  const ref = useRef<THREE.Mesh>(null)
  const texture = useLoader(THREE.TextureLoader, '/textures/earth.jpg')
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.02 })
  return (
    <group>
      <mesh><sphereGeometry args={[eR * 1.06, 64, 64]} /><meshBasicMaterial color="#4499ff" transparent opacity={0.06} side={THREE.BackSide} /></mesh>
      <mesh><sphereGeometry args={[eR * 2.5, 32, 32]} /><meshBasicMaterial color="#2266aa" transparent opacity={0.02} side={THREE.BackSide} /></mesh>
      <mesh ref={ref}><sphereGeometry args={[eR, 128, 64]} /><meshStandardMaterial map={texture} roughness={0.8} metalness={0.05} /></mesh>
      <Html position={[0, -(eR + 1), 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#4499ff', letterSpacing: 4, userSelect: 'none', opacity: 0.7 }}>EARTH</span>
      </Html>
    </group>
  )
}

// ——— Moon ———
function MoonBody() {
  const ref = useRef<THREE.Group>(null)
  const texture = useLoader(THREE.TextureLoader, '/textures/moon.jpg')
  useFrame(() => { if (ref.current) ref.current.position.copy(getMoonPos(getSimDay())) })
  return (
    <group ref={ref}>
      <mesh><sphereGeometry args={[mR, 64, 32]} /><meshStandardMaterial map={texture} roughness={0.95} /></mesh>
      <mesh><sphereGeometry args={[mR * 2.5, 16, 16]} /><meshBasicMaterial color="#888899" transparent opacity={0.015} side={THREE.BackSide} /></mesh>
      <Html position={[0, -(mR + 0.8), 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: '#aaaacc', letterSpacing: 3, userSelect: 'none', opacity: 0.6 }}>MOON</span>
      </Html>
    </group>
  )
}

// ——— Trajectory lines ———
function TrajectoryLines() {
  const traveledRef = useRef<any>(null)
  const fullPts = useMemo(() => fullTrajPts.map(p => [p.x, p.y, p.z] as [number, number, number]), [])
  const moonPts = useMemo(() => moonArcPts.map(p => [p.x, p.y, p.z] as [number, number, number]), [])

  useFrame(() => {
    if (!traveledRef.current) return
    const orionPos = getTrajectoryPos(getSimDay())
    let closest = 0, best = Infinity
    for (let i = 0; i < fullTrajPts.length; i++) {
      const d = fullTrajPts[i].distanceTo(orionPos)
      if (d < best) { best = d; closest = i }
    }
    const traveled = fullTrajPts.slice(0, closest + 1).map(p => [p.x, p.y, p.z] as [number, number, number])
    if (traveled.length > 1) traveledRef.current.geometry.setPositions(traveled.flat())
  })

  return (
    <>
      <Line points={fullPts} color="#ff8855" lineWidth={1} transparent opacity={0.15} dashed dashSize={0.4} gapSize={0.3} />
      <Line points={fullPts} color="#ff6b35" lineWidth={2} transparent opacity={0.03} />
      <Line ref={traveledRef} points={fullPts.slice(0, 2)} color="#ff6b35" lineWidth={2} transparent opacity={0.85} />
      <Line points={moonPts} color="#ffffff" lineWidth={1} transparent opacity={0.25} />
    </>
  )
}

// ——— Orion ———
function Orion() {
  const ref = useRef<THREE.Group>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  useFrame(() => {
    if (!ref.current) return
    const day = getSimDay()
    const pos = getTrajectoryPos(day)
    ref.current.position.copy(pos)
    const next = getTrajectoryPos(day + 0.002)
    if (next.distanceTo(pos) > 0.001) ref.current.lookAt(next)
    if (labelRef.current) {
      const de = Math.max(0, Math.round(pos.length() / SCALE - EARTH_RADIUS_KM))
      labelRef.current.textContent = de.toLocaleString() + ' km'
    }
  })
  return (
    <group ref={ref}>
      <mesh><sphereGeometry args={[0.8, 16, 16]} /><meshBasicMaterial color="#ff8844" transparent opacity={0.04} /></mesh>
      <mesh><sphereGeometry args={[0.12, 16, 16]} /><meshBasicMaterial color="#e0f2fe" /></mesh>
      <mesh><sphereGeometry args={[0.07, 12, 12]} /><meshBasicMaterial color="#ffffff" /></mesh>
      <pointLight color="#ff8844" intensity={1} distance={10} />
      <Html position={[1.2, 0.5, 0]} style={{ pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#ff8844', fontWeight: 700, letterSpacing: 1.5, userSelect: 'none' }}>ORION</span>
      </Html>
      <Html position={[-1.2, -0.3, 0]} style={{ pointerEvents: 'none' }}>
        <span ref={labelRef} style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#94a3b8', userSelect: 'none', whiteSpace: 'nowrap' }} />
      </Html>
    </group>
  )
}

function ConnectionLine() {
  const ref = useRef<any>(null)
  useFrame(() => { if (ref.current) { const m = getMoonPos(getSimDay()); ref.current.geometry.setPositions([0,0,0,m.x,m.y,m.z]) } })
  return <Line ref={ref} points={[[0,0,0],[1,0,0]]} color="#ffffff" lineWidth={0.5} transparent opacity={0.06} />
}

function SunLight() {
  const ref = useRef<THREE.DirectionalLight>(null)
  useFrame(({ clock }) => { if (ref.current) { const t = clock.getElapsedTime() * 0.01; ref.current.position.set(300*Math.cos(t), 80, -150*Math.sin(t)) } })
  return <directionalLight ref={ref} position={[300, 80, -150]} intensity={2.5} />
}

// ——— Camera controller with modes ———
function CameraController() {
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()

  useFrame(() => {
    if (!controlsRef.current) return
    const day = getSimDay()
    const orionPos = getTrajectoryPos(day)
    const moonPos = getMoonPos(day)

    let targetPos: THREE.Vector3
    let camDist: number

    switch (cameraMode) {
      case 'earth':
        targetPos = new THREE.Vector3(0, 0, 0)
        camDist = 8
        break
      case 'moon':
        targetPos = moonPos.clone()
        camDist = 4
        break
      case 'orion':
        targetPos = orionPos.clone()
        camDist = 4
        break
      default: // overview
        targetPos = new THREE.Vector3(orionPos.x * 0.4, orionPos.y * 0.3, orionPos.z * 0.3)
        camDist = 120
    }

    controlsRef.current.target.lerp(targetPos, 0.03)
    if (cameraMode !== 'overview') {
      const dir = camera.position.clone().sub(controlsRef.current.target).normalize()
      const desired = controlsRef.current.target.clone().add(dir.multiplyScalar(camDist))
      camera.position.lerp(desired, 0.02)
    }
    controlsRef.current.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom enablePan={false}
      minDistance={1} maxDistance={400}
      autoRotate={cameraMode === 'overview'}
      autoRotateSpeed={0.08}
      enableDamping dampingFactor={0.06}
    />
  )
}

// ——— Scene ———
function Scene() {
  return (
    <>
      <ambientLight intensity={0.15} color="#1a1a3a" />
      <SunLight />
      <Stars radius={1500} depth={3000} count={15000} factor={3} saturation={0} fade speed={0.3} />
      <Earth />
      <MoonBody />
      <TrajectoryLines />
      <Orion />
      <ConnectionLine />
      <EffectComposer><Bloom intensity={0.5} luminanceThreshold={0.88} luminanceSmoothing={0.3} /></EffectComposer>
      <CameraController />
    </>
  )
}

// ——— Error boundary ———
class WebGLBoundary extends Component<{ children: ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  render() {
    if (this.state.err) return <div className="flex-1 flex items-center justify-center text-center p-8"><div><div className="font-display text-lg text-cyan-glow mb-2">3D Unavailable</div><div className="text-[10px] text-slate-500">WebGL required</div></div></div>
    return this.props.children
  }
}

// ——— HUD (pure DOM, updates via RAF) ———
function HUDOverlay() {
  const ref = useRef<HTMLDivElement>(null)
  const raf = useRef<number>(0)

  const update = useCallback(() => {
    if (!ref.current) { raf.current = requestAnimationFrame(update); return }
    const day = getSimDay()
    const pos = getTrajectoryPos(day)
    const moonPos = getMoonPos(day)
    const de = Math.max(0, Math.round(pos.length() / SCALE - EARTH_RADIUS_KM))
    const dm = Math.max(0, Math.round(pos.clone().sub(moonPos).length() / SCALE - MOON_RADIUS_KM))

    ref.current.querySelector('[data-de]')!.textContent = de.toLocaleString() + ' km'
    ref.current.querySelector('[data-dm]')!.textContent = dm.toLocaleString() + ' km'
    ref.current.querySelector('[data-v]')!.textContent = getVelocity(day).toFixed(3) + ' km/s'
    ref.current.querySelector('[data-p]')!.textContent = getMissionPhase(day).toUpperCase()
    raf.current = requestAnimationFrame(update)
  }, [])

  useMemo(() => { raf.current = requestAnimationFrame(update) }, [update])

  return (
    <div ref={ref} className="absolute bottom-14 left-2 z-10">
      <div className="bg-space-950/85 backdrop-blur-sm border border-cyan-mid/10 rounded px-2 py-1.5 space-y-0.5 text-[10px]">
        <div className="flex gap-2"><span className="text-slate-600 w-10">Earth</span><span data-de className="font-mono text-cyan-glow font-semibold">—</span></div>
        <div className="flex gap-2"><span className="text-slate-600 w-10">Moon</span><span data-dm className="font-mono text-slate-300 font-semibold">—</span></div>
        <div className="flex gap-2"><span className="text-slate-600 w-10">Speed</span><span data-v className="font-mono text-amber-glow font-semibold">—</span></div>
        <div className="flex gap-2"><span className="text-slate-600 w-10">Phase</span><span data-p className="font-mono text-cyan-glow/70 text-[8px]">—</span></div>
      </div>
    </div>
  )
}

// ——— Main export ———
export function TrajectoryMap({ mission }: TrajectoryMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeCam, setActiveCam] = useState<CameraMode>('overview')
  const [simDay, setSimDay] = useState<number | null>(null) // null = live
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const setCam = useCallback((mode: CameraMode) => {
    cameraMode = mode
    setActiveCam(mode)
  }, [])

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    simOverride = v
    setSimDay(v)
  }, [])

  const resetToLive = useCallback(() => {
    simOverride = null
    setSimDay(null)
  }, [])

  const currentDay = simDay !== null ? simDay : getCurrentMissionDay()

  return (
    <div
      ref={containerRef}
      className={`glass-panel border-glow h-full flex flex-col relative overflow-hidden ${isFullscreen ? 'p-0 rounded-none' : 'p-2'}`}
    >
      {/* Source badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-space-950/85 backdrop-blur-sm border border-cyan-mid/12 rounded px-2.5 py-1 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-green-glow live-pulse" />
          <span className="font-mono text-[7.5px] text-slate-500 tracking-wide">
            {simDay !== null ? 'SIMULATION' : 'JPL HORIZONS · REALTIME'}
          </span>
        </div>
      </div>

      {/* Phase label */}
      <div className="absolute top-3 right-14 z-10 text-right">
        <div className="text-[7.5px] text-slate-600 tracking-[2px] uppercase">Current Phase</div>
        <div className="font-display text-[13px] text-cyan-glow font-bold tracking-wider glow-cyan mt-0.5">
          {getMissionPhase(currentDay).toUpperCase()}
        </div>
      </div>

      {/* Camera buttons — right side */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button onClick={toggleFullscreen} className="h-7 w-7 rounded bg-space-950/80 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-cyan-glow hover:border-cyan-glow/30 transition-colors" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="absolute top-14 right-3 z-10 flex flex-col gap-1">
        {([['overview', 'Overview', null], ['earth', 'Earth', Globe], ['moon', 'Moon', MoonIcon], ['orion', 'Orion', Rocket]] as const).map(([mode, label, Icon]) => (
          <button
            key={mode}
            onClick={() => setCam(mode as CameraMode)}
            className={`h-7 px-2 rounded text-[8px] font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-all ${
              activeCam === mode
                ? 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/25'
                : 'bg-space-950/80 text-slate-500 border border-slate-700/40 hover:text-slate-300'
            }`}
            title={`Focus on ${label}`}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {label}
          </button>
        ))}
      </div>

      {/* HUD */}
      <HUDOverlay />

      {/* 3D Canvas */}
      <WebGLBoundary>
        <div className={`flex-1 ${isFullscreen ? 'min-h-screen' : 'min-h-[380px] sm:min-h-[420px]'} rounded overflow-hidden`}>
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

      {/* Bottom bar: scrubber + crew */}
      <div className={`flex items-center gap-3 mt-1.5 px-1 ${isFullscreen ? 'px-4 pb-4' : ''}`}>
        {/* Time scrubber */}
        <div className="flex items-center gap-2 shrink-0">
          {simDay !== null ? (
            <button onClick={resetToLive} className="h-6 px-2 rounded bg-red-glow/10 border border-red-glow/25 text-[8px] font-bold text-red-glow tracking-wider flex items-center gap-1" title="Return to live">
              <RotateCcw className="h-3 w-3" /> LIVE
            </button>
          ) : (
            <span className="text-[8px] text-green-glow font-mono font-semibold tracking-wider">● LIVE</span>
          )}
          <input
            type="range"
            min={TRAJ_START_DAY}
            max={MISSION_DAYS}
            step={0.01}
            value={currentDay}
            onChange={handleScrub}
            className="w-24 sm:w-36 h-1 accent-cyan-glow cursor-pointer"
            title={`Day ${currentDay.toFixed(1)}`}
          />
          <span className="font-mono text-[9px] text-slate-500 w-14">
            Day {currentDay.toFixed(1)}
          </span>
        </div>

        {/* Crew (hidden in fullscreen) */}
        {!isFullscreen && mission?.crew && (
          <div className="flex items-center gap-2 overflow-x-auto ml-auto">
            {mission.crew.map((member) => (
              <div key={member.name} className="flex items-center gap-1.5 shrink-0">
                <div className="h-[18px] w-[18px] rounded-full bg-space-800 border border-cyan-mid/15 flex items-center justify-center text-[6.5px] font-bold text-cyan-glow/60 font-mono">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <span className="hidden sm:block text-[8px] text-slate-400 font-medium">{member.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
