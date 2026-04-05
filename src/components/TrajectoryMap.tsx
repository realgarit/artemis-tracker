import { useRef, useMemo, useState, useCallback, useEffect, Component, type ReactNode } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Line, Points, PointMaterial } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Globe, Moon as MoonIcon, Rocket, Maximize2, Minimize2, RotateCcw, FastForward } from 'lucide-react'
import {
  eR, mR, SCALE, EARTH_RADIUS_KM, MOON_RADIUS_KM,
  getCurrentMissionDay, getTrajectoryPos, getMoonPos, getVelocity,
  getMissionPhase, getActiveMission, setActiveMission,
  fullTrajPts, moonArcPts, lunarOrbitPts,
} from '../data/trajectoryData'
import type { MissionData } from '../lib/types'

interface TrajectoryMapProps { mission?: MissionData; missionId?: string }

type CameraMode = 'overview' | 'earth' | 'moon' | 'orion'
let cameraMode: CameraMode = 'overview'
let simOverride: number | null = null
let simSpeed = 0
let lastCameraMode: CameraMode = 'overview'
let transitionFrames = 0

function getSimDay(): number {
  return simOverride !== null ? simOverride : getCurrentMissionDay()
}

// ——— Milky Way ———
function MilkyWayBand() {
  const positions = useMemo(() => {
    const a = new Float32Array(8000 * 3)
    for (let i = 0; i < 8000; i++) {
      const r = 1500 + Math.random() * 3000, th = Math.random() * Math.PI * 2
      const ph = Math.PI / 2 + (Math.random() - 0.5) * 0.3
      a[i*3] = r*Math.sin(ph)*Math.cos(th); a[i*3+1] = r*Math.cos(ph); a[i*3+2] = r*Math.sin(ph)*Math.sin(th)
    }
    return a
  }, [])
  return <Points positions={positions} stride={3}><PointMaterial size={0.4} color="#6666aa" transparent opacity={0.08} sizeAttenuation depthWrite={false} /></Points>
}

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

// ——— Orion — BIGGER beacon, separated labels ———
function Orion() {
  const ref = useRef<THREE.Group>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const OS = 5

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
      {/* Large beacon — visible from overview */}
      <mesh><sphereGeometry args={[1.2, 16, 16]} /><meshBasicMaterial color="#ff8844" transparent opacity={0.05} /></mesh>
      <mesh><sphereGeometry args={[0.4, 16, 16]} /><meshBasicMaterial color="#ff8844" transparent opacity={0.1} /></mesh>

      {/* Capsule */}
      <mesh rotation={[Math.PI, 0, 0]} scale={[OS, OS, OS]}>
        <coneGeometry args={[0.035, 0.09, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Service module */}
      <mesh position={[0, 0, -0.008 * OS]} scale={[OS, OS, OS]}>
        <cylinderGeometry args={[0.028, 0.032, 0.05, 8]} />
        <meshStandardMaterial color="#cccccc" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Solar panels */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0, -0.005 * OS]} rotation={[0, (i * Math.PI) / 2, 0]} scale={[OS, OS, OS]}>
          <planeGeometry args={[0.15, 0.02]} />
          <meshStandardMaterial color="#1a3a7a" emissive="#1133aa" emissiveIntensity={0.1} roughness={0.3} metalness={0.7} side={THREE.DoubleSide} />
        </mesh>
      ))}

      <pointLight color="#ff6b35" intensity={1.5} distance={12} />

      {/* ORION label — ABOVE */}
      <Html position={[0, 1.8, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 11, color: '#ff8844', fontWeight: 700, letterSpacing: 2, userSelect: 'none' }}>ORION</span>
      </Html>
      {/* Distance — BELOW */}
      <Html position={[0, -1.4, 0]} center style={{ pointerEvents: 'none' }}>
        <span ref={labelRef} style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#94a3b8', userSelect: 'none', whiteSpace: 'nowrap' }} />
      </Html>
    </group>
  )
}

function TrajectoryLines() {
  const traveledRef = useRef<any>(null)
  const fullPts = useMemo(() => fullTrajPts.map(p => [p.x, p.y, p.z] as [number, number, number]), [])
  const moonPts = useMemo(() => moonArcPts.map(p => [p.x, p.y, p.z] as [number, number, number]), [])
  const orbitPts = useMemo(() => lunarOrbitPts.map(p => [p.x, p.y, p.z] as [number, number, number]), [])

  useFrame(() => {
    if (!traveledRef.current) return
    const orionPos = getTrajectoryPos(getSimDay())
    let closest = 0, best = Infinity
    for (let i = 0; i < fullTrajPts.length; i++) { const d = fullTrajPts[i].distanceTo(orionPos); if (d < best) { best = d; closest = i } }
    const traveled = fullTrajPts.slice(0, closest + 1).map(p => [p.x, p.y, p.z] as [number, number, number])
    if (traveled.length > 1) traveledRef.current.geometry.setPositions(traveled.flat())
  })

  return (
    <>
      <Line points={orbitPts} color="#ffffff" lineWidth={0.5} transparent opacity={0.12} />
      <Line points={orbitPts} color="#ffffff" lineWidth={1.5} transparent opacity={0.03} />
      <Line points={moonPts} color="#ffffff" lineWidth={1} transparent opacity={0.35} />
      <Line points={fullPts} color="#ff8855" lineWidth={1} transparent opacity={0.15} dashed dashSize={0.4} gapSize={0.3} />
      <Line points={fullPts} color="#ff6b35" lineWidth={2} transparent opacity={0.03} />
      <Line ref={traveledRef} points={fullPts.slice(0, 2)} color="#ff6b35" lineWidth={2} transparent opacity={0.85} />
    </>
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

function CameraController() {
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()
  useFrame(() => {
    if (!controlsRef.current) return
    const day = getSimDay(), op = getTrajectoryPos(day), mp = getMoonPos(day)
    let tp: THREE.Vector3, cd: number
    switch (cameraMode) {
      case 'earth': tp = new THREE.Vector3(0,0,0); cd = 8; break
      case 'moon': tp = mp.clone(); cd = 5; break
      case 'orion': tp = op.clone(); cd = 5; break
      default: tp = new THREE.Vector3(op.x*0.4, op.y*0.3, op.z*0.3); cd = 120
    }
    // Detect mode change → start transition animation
    if (cameraMode !== lastCameraMode) {
      transitionFrames = 90 // ~1.5s at 60fps
      lastCameraMode = cameraMode
    }
    if (transitionFrames > 0) transitionFrames--
    // Always track the orbit center (so user orbits around the focused object)
    controlsRef.current.target.lerp(tp, 0.03)
    // Only animate camera distance during initial transition — then let user freely zoom/rotate
    if (cameraMode !== 'overview' && transitionFrames > 0) {
      const dir = camera.position.clone().sub(controlsRef.current.target).normalize()
      camera.position.lerp(controlsRef.current.target.clone().add(dir.multiplyScalar(cd)), 0.03)
    }
    controlsRef.current.update()
  })
  return <OrbitControls ref={controlsRef} enableZoom enablePan={false} minDistance={0.5} maxDistance={500} autoRotate={cameraMode==='overview'} autoRotateSpeed={0.08} enableDamping dampingFactor={0.06} />
}

function SimUpdater() {
  useFrame((_, dt) => {
    if (simSpeed > 0 && simOverride !== null) {
      simOverride = Math.min(getActiveMission().missionDays, simOverride + dt * simSpeed / 86400 * 3600)
    }
  })
  return null
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.15} color="#1a1a3a" />
      <SunLight />
      <Stars radius={1500} depth={3000} count={15000} factor={3} saturation={0} fade speed={0.3} />
      <MilkyWayBand />
      <Earth />
      <MoonBody />
      <TrajectoryLines />
      <Orion />
      <ConnectionLine />
      <SimUpdater />
      <EffectComposer><Bloom intensity={0.5} luminanceThreshold={0.88} luminanceSmoothing={0.3} /></EffectComposer>
      <CameraController />
    </>
  )
}

class WebGLBoundary extends Component<{children:ReactNode},{err:boolean}> {
  state={err:false}; static getDerivedStateFromError(){return{err:true}}
  render(){return this.state.err?<div className="flex-1 flex items-center justify-center p-8"><div className="font-display text-lg text-cyan-glow">3D Unavailable — WebGL required</div></div>:this.props.children}
}

function HUDOverlay() {
  const ref = useRef<HTMLDivElement>(null)
  const update = useCallback(() => {
    if (!ref.current) { requestAnimationFrame(update); return }
    const day = getSimDay(); const pos = getTrajectoryPos(day); const mp = getMoonPos(day)
    const de = Math.max(0, Math.round(pos.length()/SCALE - EARTH_RADIUS_KM))
    const dm = Math.max(0, Math.round(pos.clone().sub(mp).length()/SCALE - MOON_RADIUS_KM))
    ref.current.querySelector('[data-de]')!.textContent = de.toLocaleString()+' km'
    ref.current.querySelector('[data-dm]')!.textContent = dm.toLocaleString()+' km'
    ref.current.querySelector('[data-v]')!.textContent = getVelocity(day).toFixed(3)+' km/s'
    ref.current.querySelector('[data-p]')!.textContent = getMissionPhase(day).toUpperCase()
    requestAnimationFrame(update)
  }, [])
  useMemo(() => { requestAnimationFrame(update) }, [update])
  return (
    <div ref={ref} className="absolute bottom-12 left-2 z-10">
      <div className="bg-space-950/85 backdrop-blur-sm border border-cyan-mid/10 rounded px-2.5 py-2 space-y-0.5 text-[10px]">
        <div className="flex gap-2"><span className="text-slate-600 w-10">Earth</span><span data-de className="font-mono text-cyan-glow font-semibold">—</span></div>
        <div className="flex gap-2"><span className="text-slate-600 w-10">Moon</span><span data-dm className="font-mono text-slate-300 font-semibold">—</span></div>
        <div className="flex gap-2"><span className="text-slate-600 w-10">Speed</span><span data-v className="font-mono text-amber-glow font-semibold">—</span></div>
        <div className="flex gap-2"><span className="text-slate-600 w-10">Phase</span><span data-p className="font-mono text-cyan-glow/70 text-[8px]">—</span></div>
      </div>
    </div>
  )
}

// ——— Export ———
export function TrajectoryMap({ mission, missionId = 'artemis-ii' }: TrajectoryMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeCam, setActiveCam] = useState<CameraMode>('overview')
  const [simDay, setSimDay] = useState<number | null>(null)
  const [speed, setSpeed] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Ensure active mission data is in sync (may already be set by App.tsx)
  if (getActiveMission().id !== missionId) setActiveMission(missionId)
  const activeMission = getActiveMission()
  const isCompleted = activeMission.status === 'completed'

  // Reset sim state on mission switch
  useEffect(() => {
    cameraMode = 'overview'
    lastCameraMode = 'overview'
    transitionFrames = 0
    setActiveCam('overview')
    setSpeed(0)
    simSpeed = 0
    if (getActiveMission().status === 'completed') {
      simOverride = 0
      setSimDay(0)
    } else {
      simOverride = null
      setSimDay(null)
    }
  }, [missionId])

  // Listen for fullscreen exit (Escape key etc.)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) containerRef.current.requestFullscreen()
    else document.exitFullscreen()
  }, [])

  const setCam = useCallback((m: CameraMode) => { cameraMode = m; setActiveCam(m) }, [])
  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const v = parseFloat(e.target.value); simOverride = v; simSpeed = 0; setSimDay(v); setSpeed(0) }, [])
  const resetToLive = useCallback(() => {
    if (isCompleted) {
      simOverride = 0; simSpeed = 0; setSimDay(0); setSpeed(0)
    } else {
      simOverride = null; simSpeed = 0; setSimDay(null); setSpeed(0)
    }
  }, [isCompleted])
  const cycleSpeed = useCallback(() => {
    const speeds = [0, 10, 100, 1000]
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length]
    simSpeed = next
    if (next > 0 && simOverride === null) simOverride = isCompleted ? 0 : getCurrentMissionDay()
    setSpeed(next)
  }, [speed, isCompleted])

  const md = getActiveMission().missionDays
  const tsd = getActiveMission().trajStartDay
  const currentDay = simDay !== null ? simDay : (isCompleted ? 0 : getCurrentMissionDay())

  return (
    <div ref={containerRef} className={`glass-panel border-glow h-full flex flex-col relative overflow-hidden ${isFullscreen ? 'p-0 rounded-none bg-space-950' : 'p-2'}`}>
      {/* Source badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-space-950/85 backdrop-blur-sm border border-cyan-mid/12 rounded px-2.5 py-1 flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${isCompleted ? 'bg-amber-glow' : simDay !== null ? 'bg-amber-glow' : 'bg-green-glow'} live-pulse`} />
          <span className="font-mono text-[7.5px] text-slate-500 tracking-wide">
            {isCompleted ? (speed > 0 ? `REPLAY ${speed}×` : 'REPLAY') : simDay !== null ? (speed > 0 ? `SIM ${speed}×` : 'SIMULATION') : 'REALTIME'}
          </span>
        </div>
      </div>

      {/* Phase + fullscreen */}
      <div className="absolute top-3 right-14 z-10 text-right">
        <div className="text-[7.5px] text-slate-600 tracking-[2px] uppercase">Phase</div>
        <div className="font-display text-[13px] text-cyan-glow font-bold tracking-wider glow-cyan mt-0.5">{getMissionPhase(currentDay).toUpperCase()}</div>
      </div>

      {/* Right controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button onClick={toggleFullscreen} className="h-7 w-7 rounded bg-space-950/80 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-cyan-glow hover:border-cyan-glow/30 transition-colors">
          {isFullscreen?<Minimize2 className="h-3.5 w-3.5"/>:<Maximize2 className="h-3.5 w-3.5"/>}
        </button>
      </div>
      <div className="absolute top-14 right-3 z-10 flex flex-col gap-1">
        {([['overview','Overview',null],['earth','Earth',Globe],['moon','Moon',MoonIcon],['orion','Orion',Rocket]] as const).map(([mode,label,Icon])=>(
          <button key={mode} onClick={()=>setCam(mode as CameraMode)} className={`h-7 px-2 rounded text-[8px] font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-all ${activeCam===mode?'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/25':'bg-space-950/80 text-slate-500 border border-slate-700/40 hover:text-slate-300'}`}>
            {Icon&&<Icon className="h-3 w-3"/>}{label}
          </button>
        ))}
      </div>

      <HUDOverlay />

      <WebGLBoundary>
        <div className={`flex-1 ${isFullscreen?'min-h-screen':'min-h-[450px] sm:min-h-[500px]'} rounded overflow-hidden bg-black relative`}>
          <div className="absolute inset-0">
            <Canvas key={missionId} camera={{position:[44,100,60],fov:45,near:0.01,far:8000}} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}} dpr={[1,2]}>
              <Scene />
            </Canvas>
          </div>
        </div>
      </WebGLBoundary>

      {/* Bottom bar — scrubber */}
      <div className={`flex items-center gap-3 mt-1 px-1 ${isFullscreen?'px-4 pb-3':''}`}>
        <div className="flex items-center gap-2 flex-1">
          {isCompleted ? (
            <button onClick={resetToLive} className="h-6 px-2 rounded bg-amber-glow/10 border border-amber-glow/25 text-[8px] font-bold text-amber-glow tracking-wider flex items-center gap-1 shrink-0">
              <RotateCcw className="h-3 w-3"/> RESET
            </button>
          ) : simDay !== null ? (
            <button onClick={resetToLive} className="h-6 px-2 rounded bg-red-glow/10 border border-red-glow/25 text-[8px] font-bold text-red-glow tracking-wider flex items-center gap-1 shrink-0">
              <RotateCcw className="h-3 w-3"/> LIVE
            </button>
          ) : (
            <span className="text-[8px] text-green-glow font-mono font-semibold tracking-wider shrink-0">● LIVE</span>
          )}
          <input type="range" min={tsd} max={md} step={0.01} value={currentDay} onChange={handleScrub}
            className="flex-1 max-w-xs h-1 accent-cyan-glow cursor-pointer" />
          <span className="font-mono text-[9px] text-slate-500 w-16 shrink-0">
            Day {currentDay.toFixed(1)}/{md}
          </span>
          <button onClick={cycleSpeed} className={`h-6 px-2 rounded text-[8px] font-semibold tracking-wider flex items-center gap-1 shrink-0 transition-all ${speed>0?'bg-amber-glow/10 text-amber-glow border border-amber-glow/25':'bg-space-950/80 text-slate-500 border border-slate-700/40 hover:text-slate-300'}`}>
            <FastForward className="h-3 w-3"/> {speed > 0 ? `${speed}×` : '1×'}
          </button>
        </div>
      </div>
    </div>
  )
}
