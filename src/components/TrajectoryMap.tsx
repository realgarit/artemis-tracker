import { useRef, useMemo, useState, useCallback, useEffect, Component, type ReactNode } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Line, Points, PointMaterial, useGLTF } from '@react-three/drei'
import { useReducedMotion } from 'framer-motion'
// postprocessing removed — EffectComposer crashes on WebGL context loss
import * as THREE from 'three'
import { Globe, Moon as MoonIcon, Rocket, Maximize2, Minimize2, RotateCcw, FastForward, Play, Pause } from 'lucide-react'
import {
  eR, mR,
  getCurrentMissionDay, getTrajectoryPos, getMoonPos, getVelocity, getAcceleration,
  getMissionPhase, getActiveMission, setActiveMission,
  fullTrajPts, moonArcPts, lunarOrbitPts, horizonsToThree,
} from '../data/trajectoryData'
import type { Vector3Like } from '../data/trajectoryData'
import type { MissionData } from '../lib/types'
import type { DataProvenance } from '../lib/provenance'
import { advanceMissionDay } from '../lib/replayClock'
import { DataSourceBadge } from './DataSourceBadge'

interface TrajectoryMapProps { mission?: MissionData; missionId?: string; initialDay?: number; onReplayDayChange?: (day: number) => void; provenance?: DataProvenance; initialCamera?: CameraMode; onCameraModeChange?: (camera: CameraMode) => void }

export type CameraMode = 'overview' | 'earth' | 'moon' | 'orion'
let cameraMode: CameraMode = 'overview'
let simOverride: number | null = null
let simSpeed = 0
let lastCameraMode: CameraMode = 'overview'
let transitionFrames = 0

function getSimDay(): number {
  return simOverride !== null ? simOverride : getCurrentMissionDay()
}

function toThree(point: Vector3Like): THREE.Vector3 {
  // Mission samples are EME2000 kilometers; scene geometry uses scaled Y-up coordinates.
  const position = horizonsToThree([point.x, point.y, point.z])
  return new THREE.Vector3(position.x, position.y, position.z)
}

function pointDistance(a: Vector3Like, b: Vector3Like): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
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
      <mesh ref={ref}><sphereGeometry args={[eR, 128, 64]} /><meshStandardMaterial map={texture} roughness={0.8} metalness={0.05} /></mesh>
      <Html position={[0, -(eR + 1), 0]} center style={{ pointerEvents: 'none' }}>
        <span data-scene-label="earth" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#abc3ff', letterSpacing: 3, userSelect: 'none' }}>EARTH</span>
      </Html>
    </group>
  )
}

function MoonBody() {
  const ref = useRef<THREE.Group>(null)
  const texture = useLoader(THREE.TextureLoader, '/textures/moon.jpg')
  useFrame(() => {
    if (!ref.current) return
    const position = getMoonPos(getSimDay())
    ref.current.visible = position !== null
    if (position) ref.current.position.copy(toThree(position))
  })
  return (
    <group ref={ref}>
      <mesh><sphereGeometry args={[mR, 64, 32]} /><meshStandardMaterial map={texture} roughness={0.95} /></mesh>
      <Html position={[0, -(mR + 0.8), 0]} center style={{ pointerEvents: 'none' }}>
        <span data-scene-label="moon" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d3cec3', letterSpacing: 3, userSelect: 'none' }}>MOON</span>
      </Html>
    </group>
  )
}

// ——— Orion — BIGGER beacon, separated labels ———
function Orion() {
  const ref = useRef<THREE.Group>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const { scene } = useGLTF('/models/orion.glb')
  const orionModel = useMemo(() => scene.clone(), [scene])

  useFrame(() => {
    if (!ref.current) return
    const day = getSimDay()
    const pos = getTrajectoryPos(day)
    ref.current.visible = pos !== null
    if (!pos) {
      if (labelRef.current) labelRef.current.textContent = 'No sample at this time'
      return
    }
    ref.current.position.copy(toThree(pos))
    const next = getTrajectoryPos(day + 0.002)
    if (next && pointDistance(next, pos) > 0.001) ref.current.lookAt(toThree(next))
    if (labelRef.current) {
      const centerDistance = Math.round(Math.hypot(pos.x, pos.y, pos.z))
      labelRef.current.textContent = `${centerDistance.toLocaleString()} km from Earth center`
    }
  })

  return (
    <group ref={ref}>
      {/* Orion spacecraft model — by Mikius538, GPL-3.0 */}
      <primitive object={orionModel} scale={0.8} rotation={[0, 0, Math.PI / 2]} />

      <pointLight color="#ff6b35" intensity={1} distance={8} />

      {/* ORION label — ABOVE */}
      <Html position={[0, 1.8, 0]} center style={{ pointerEvents: 'none' }}>
        <span data-scene-label="orion" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ff8a57', fontWeight: 700, letterSpacing: 3, userSelect: 'none' }}>ORION</span>
      </Html>
      {/* Distance — BELOW */}
      <Html position={[0, -1.4, 0]} center style={{ pointerEvents: 'none' }}>
        <span ref={labelRef} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d3cec3', userSelect: 'none', whiteSpace: 'nowrap' }} />
      </Html>
    </group>
  )
}

function TrajectoryLines() {
  const traveledRef = useRef<any>(null)
  const fullPts = useMemo(() => fullTrajPts.map(p => [p.x, p.y, p.z] as [number, number, number]), [])
  const moonPts = useMemo(() => moonArcPts.map(p => [p.x, p.y, p.z] as [number, number, number]), [])

  useFrame(() => {
    if (!traveledRef.current) return
    const orionPos = getTrajectoryPos(getSimDay())
    if (!orionPos) {
      traveledRef.current.visible = false
      return
    }
    traveledRef.current.visible = true
    const scenePosition = toThree(orionPos)
    let closest = 0, best = Infinity
    for (let i = 0; i < fullTrajPts.length; i++) { const d = pointDistance(fullTrajPts[i], scenePosition); if (d < best) { best = d; closest = i } }
    const traveled = fullTrajPts.slice(0, closest + 1).map(p => [p.x, p.y, p.z] as [number, number, number])
    if (traveled.length > 1) traveledRef.current.geometry.setPositions(traveled.flat())
  })

  return (
    <>
      <Line points={moonPts} color="#ffffff" lineWidth={1} transparent opacity={0.25} />
      <Line points={fullPts} color="#ff8855" lineWidth={1} transparent opacity={0.35} dashed dashSize={0.4} gapSize={0.3} />
      <Line points={fullPts} color="#ff6b35" lineWidth={2} transparent opacity={0.03} />
      <Line ref={traveledRef} points={fullPts.slice(0, 2)} color="#ff6b35" lineWidth={2} transparent opacity={0.85} />
    </>
  )
}

function ConnectionLine() {
  const ref = useRef<any>(null)
  useFrame(() => {
    if (!ref.current) return
    const moonPosition = getMoonPos(getSimDay())
    ref.current.visible = moonPosition !== null
    if (moonPosition) {
      const position = toThree(moonPosition)
      ref.current.geometry.setPositions([0, 0, 0, position.x, position.y, position.z])
    }
  })
  return <Line ref={ref} points={[[0,0,0],[1,0,0]]} color="#ffffff" lineWidth={0.5} transparent opacity={0.06} />
}

function SunLight({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.DirectionalLight>(null)
  useFrame(({ clock }) => { if (ref.current && !reducedMotion) { const t = clock.getElapsedTime() * 0.01; ref.current.position.set(300*Math.cos(t), 80, -150*Math.sin(t)) } })
  return <directionalLight ref={ref} position={[300, 80, -150]} intensity={2.5} />
}

function CameraController() {
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()
  const reducedMotion = useReducedMotion()
  useFrame(() => {
    if (!controlsRef.current) return
    const day = getSimDay(), op = getTrajectoryPos(day), mp = getMoonPos(day)
    let tp: THREE.Vector3, cd: number
    switch (cameraMode) {
      case 'earth': tp = new THREE.Vector3(0,0,0); cd = 8; break
      case 'moon': tp = mp ? toThree(mp) : new THREE.Vector3(0, 0, 0); cd = 5; break
      case 'orion': tp = op ? toThree(op) : new THREE.Vector3(0, 0, 0); cd = 5; break
      default: tp = op ? toThree(op).multiply(new THREE.Vector3(0.4, 0.3, 0.3)) : new THREE.Vector3(0, 0, 0); cd = 120
    }
    // Detect mode change → start transition animation
    if (cameraMode !== lastCameraMode) {
      transitionFrames = reducedMotion ? 0 : 90 // ~1.5s at 60fps
      lastCameraMode = cameraMode
      if (reducedMotion) {
        const direction = camera.position.clone().sub(tp)
        if (direction.lengthSq() === 0) direction.set(1, 1, 1)
        direction.normalize()
        controlsRef.current.target.copy(tp)
        camera.position.copy(tp.clone().add(direction.multiplyScalar(cd)))
        controlsRef.current.update()
        return
      }
    }
    if (transitionFrames > 0) transitionFrames--
    // Always track the orbit center (so user orbits around the focused object)
    controlsRef.current.target.lerp(tp, 0.03)
    // Only animate camera distance during initial transition — then let user freely zoom/rotate
    if (transitionFrames > 0) {
      const dir = camera.position.clone().sub(controlsRef.current.target).normalize()
      camera.position.lerp(controlsRef.current.target.clone().add(dir.multiplyScalar(cd)), 0.03)
    }
    controlsRef.current.update()
  })
  return <OrbitControls ref={controlsRef} enableZoom enablePan={false} minDistance={0.5} maxDistance={500} autoRotate={!reducedMotion && cameraMode==='overview'} autoRotateSpeed={0.08} enableDamping dampingFactor={0.06} />
}

function SimUpdater() {
  useFrame((_, dt) => {
    if (simSpeed > 0 && simOverride !== null) {
      simOverride = advanceMissionDay(simOverride, dt, simSpeed, getActiveMission().missionDays)
    }
  })
  return null
}

function Scene() {
  const reducedMotion = useReducedMotion()
  return (
    <>
      <ambientLight intensity={0.15} color="#1a1a3a" />
      <SunLight reducedMotion={Boolean(reducedMotion)} />
      <Stars radius={1500} depth={3000} count={15000} factor={3} saturation={0} fade speed={reducedMotion ? 0 : 0.3} />
      <MilkyWayBand />
      <Earth />
      <MoonBody />
      <TrajectoryLines />
      <Orion />
      <ConnectionLine />
      <SimUpdater />
      <CameraController />
    </>
  )
}

class WebGLBoundary extends Component<{children:ReactNode},{err:boolean}> {
  state={err:false}; static getDerivedStateFromError(){return{err:true}}
  render(){return this.state.err?<div className="flex-1 flex items-center justify-center p-8"><div className="font-display text-lg text-ink">3D Unavailable — WebGL required</div></div>:this.props.children}
}

function HUDOverlay() {
  const ref = useRef<HTMLDivElement>(null)
  const update = useCallback(() => {
    if (!ref.current) { requestAnimationFrame(update); return }
    const day = getSimDay(); const pos = getTrajectoryPos(day); const mp = getMoonPos(day); const velocity = getVelocity(day); const acceleration = getAcceleration(day)
    const de = pos ? Math.round(Math.hypot(pos.x, pos.y, pos.z)) : null
    const dm = pos && mp ? Math.round(pointDistance(pos, mp)) : null
    ref.current.querySelector('[data-de]')!.textContent = de === null ? 'Unavailable' : de.toLocaleString()+' km'
    ref.current.querySelector('[data-dm]')!.textContent = dm === null ? 'Unavailable' : dm.toLocaleString()+' km'
    ref.current.querySelector('[data-v]')!.textContent = velocity === null ? 'Unavailable' : velocity.toFixed(3)+' km/s'
    ref.current.querySelector('[data-a]')!.textContent = acceleration === null ? 'Unavailable' : acceleration.toExponential(3)+' km/s²'
    ref.current.querySelector('[data-p]')!.textContent = getMissionPhase(day).toUpperCase()
    requestAnimationFrame(update)
  }, [])
  useMemo(() => { requestAnimationFrame(update) }, [update])
  return (
    <div ref={ref} className="absolute bottom-12 left-2 z-10">
      <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 border border-rule bg-paper/90 px-3 py-2 font-mono text-[11px]">
        <dt className="text-ink-3">Earth center</dt><dd data-de className="text-right font-bold text-ink">—</dd>
        <dt className="text-ink-3">Moon center</dt><dd data-dm className="text-right font-bold text-ink">—</dd>
        <dt className="text-ink-3">Speed</dt><dd data-v className="text-right font-bold text-ink">—</dd>
        <dt className="text-ink-3">Accel.</dt><dd data-a className="text-right font-bold text-ink">—</dd>
        <dt className="text-ink-3">Phase</dt><dd data-p className="text-right font-bold text-signal">—</dd>
      </dl>
    </div>
  )
}

// ——— Export ———
export function TrajectoryMap({ mission, missionId = 'artemis-ii', initialDay = 0, onReplayDayChange, provenance, initialCamera = 'overview', onCameraModeChange }: TrajectoryMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeCam, setActiveCam] = useState<CameraMode>(initialCamera)
  const [simDay, setSimDay] = useState<number | null>(initialDay)
  const [speed, setSpeed] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Ensure active mission data is in sync (may already be set by App.tsx)
  if (getActiveMission().id !== missionId) setActiveMission(missionId)
  const activeMission = getActiveMission()
  const isCompleted = activeMission.status === 'completed'

  useEffect(() => {
    if (simOverride === null || Math.abs(initialDay - simOverride) > 0.002) {
      const nextDay = Math.max(0, Math.min(activeMission.missionDays, initialDay))
      simOverride = nextDay
      simSpeed = 0
      setSimDay(nextDay)
      setSpeed(0)
    }
  }, [initialDay, activeMission.missionDays])

  // Reset sim state on mission switch
  useEffect(() => {
    cameraMode = initialCamera
    lastCameraMode = 'overview'
    transitionFrames = 0
    setActiveCam(initialCamera)
    setSpeed(0)
    simSpeed = 0
    if (getActiveMission().status === 'completed') {
      const nextDay = Math.max(0, Math.min(activeMission.missionDays, initialDay))
      simOverride = nextDay
      setSimDay(nextDay)
    } else {
      simOverride = null
      setSimDay(null)
    }
  }, [missionId])

  const lastNotifiedDayRef = useRef(initialDay)
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (simOverride === null || simSpeed === 0) return
      const day = Math.max(0, Math.min(activeMission.missionDays, simOverride))
      setSimDay(day)
      if (Math.abs(day - lastNotifiedDayRef.current) > 0.0005) {
        lastNotifiedDayRef.current = day
        onReplayDayChange?.(day)
      }
      if (day >= activeMission.missionDays) {
        simSpeed = 0
        setSpeed(0)
      }
    }, 125)
    return () => window.clearInterval(timer)
  }, [missionId, activeMission.missionDays, onReplayDayChange])

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

  const lastSpeedRef = useRef(60) // remember last playback speed for resume
  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.visibilityState === 'hidden' && speed > 0) {
        lastSpeedRef.current = speed
        simSpeed = 0
        setSpeed(0)
      }
    }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden)
  }, [speed])
  const setCam = useCallback((m: CameraMode) => { cameraMode = m; setActiveCam(m); onCameraModeChange?.(m) }, [onCameraModeChange])
  useEffect(() => { cameraMode = initialCamera; setActiveCam(initialCamera) }, [initialCamera])
  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    simOverride = v; simSpeed = 0; setSimDay(v); setSpeed(0)
    lastNotifiedDayRef.current = v
    onReplayDayChange?.(v)
  }, [onReplayDayChange])
  const resetToLive = useCallback(() => {
    if (isCompleted) {
      const firstCoveredDay = activeMission.trajStartDay
      simOverride = firstCoveredDay; simSpeed = 0; setSimDay(firstCoveredDay); setSpeed(0)
      onReplayDayChange?.(firstCoveredDay)
    } else {
      simOverride = null; simSpeed = 0; setSimDay(null); setSpeed(0)
    }
  }, [activeMission.trajStartDay, isCompleted, onReplayDayChange])
  const togglePlay = useCallback(() => {
    if (speed > 0) {
      // Pause — remember current speed for resume
      lastSpeedRef.current = speed
      simSpeed = 0; setSpeed(0)
    } else {
      // Resume at last speed (or default 60x)
      const resumeSpeed = lastSpeedRef.current || 60
      simSpeed = resumeSpeed
      if (simOverride === null) {
        const startDay = isCompleted ? 0 : getCurrentMissionDay()
        simOverride = startDay
        setSimDay(startDay)
      }
      setSpeed(resumeSpeed)
    }
  }, [speed, isCompleted])
  const cycleSpeed = useCallback(() => {
    const speeds = [1, 60, 600, 3600, 36000]
    const idx = speeds.indexOf(speed)
    const next = speeds[(idx + 1) % speeds.length]
    simSpeed = next; lastSpeedRef.current = next
    if (simOverride === null) {
      const startDay = isCompleted ? 0 : getCurrentMissionDay()
      simOverride = startDay
      setSimDay(startDay)
    }
    setSpeed(next)
  }, [speed, isCompleted])

  const fmtSpeed = (s: number) => s >= 3600 ? `${s/3600}h/s` : s >= 60 ? `${s/60}m/s` : `${s}×`
  const md = getActiveMission().missionDays
  const tsd = getActiveMission().trajStartDay
  const currentDay = simDay !== null ? simDay : (isCompleted ? 0 : getCurrentMissionDay())
  const orionPositionAvailable = getTrajectoryPos(currentDay) !== null
  const moonPositionAvailable = getMoonPos(currentDay) !== null
  const unavailableCamera = (mode: CameraMode) => (mode === 'moon' && !moonPositionAvailable) || (mode === 'orion' && !orionPositionAvailable)

  useEffect(() => {
    if (unavailableCamera(activeCam)) {
      setCam('overview')
    }
  }, [activeCam, moonPositionAvailable, orionPositionAvailable, setCam])

  return (
    <div ref={containerRef} className={`plate relative flex h-full flex-col overflow-hidden border-t-2 border-signal-hot ${isFullscreen ? 'p-0' : 'p-2'}`}>
      {/* Source badge */}
      <div className="absolute top-3 left-3 z-10 max-w-[min(70%,440px)] space-y-1">
        <div className="flex w-fit items-center gap-1.5 border border-rule bg-paper/90 px-2.5 py-1">
          <div className={`h-2 w-2 rounded-full ${isCompleted ? 'bg-signal-hot' : simDay !== null ? 'bg-signal-hot' : 'bg-ok'}`} />
          <span className="font-mono text-[11px] font-bold tracking-wider text-signal">
            {isCompleted ? (speed > 0 ? `REPLAY ${fmtSpeed(speed)}` : 'REPLAY') : simDay !== null ? (speed > 0 ? `SIM ${fmtSpeed(speed)}` : 'SIMULATION') : 'REALTIME'}
          </span>
        </div>
        <div className="border border-rule bg-paper/90 px-2"><DataSourceBadge provenance={provenance} /></div>
      </div>

      {/* Phase + fullscreen */}
      <div className="absolute right-[4.25rem] top-3 z-10 text-right">
        <div className="eyebrow">Phase</div>
        <div className="font-display text-base font-bold uppercase tracking-tight text-ink">{getMissionPhase(currentDay).toUpperCase()}</div>
      </div>

      {/* Right controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button type="button" aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'} onClick={toggleFullscreen} className="btn min-w-11 bg-paper/90 px-0">
          {isFullscreen?<Minimize2 className="h-3.5 w-3.5"/>:<Maximize2 className="h-3.5 w-3.5"/>}
        </button>
      </div>
      <div className="absolute top-14 right-3 z-10 flex flex-col gap-1">
        {([['overview','Overview',null],['earth','Earth',Globe],['moon','Moon',MoonIcon],['orion','Orion',Rocket]] as const).map(([mode,label,Icon])=>{
          const unavailable = unavailableCamera(mode)
          return (
            <button
              type="button"
              aria-pressed={activeCam===mode}
              aria-disabled={unavailable || undefined}
              aria-label={unavailable ? `${label}; position unavailable at the selected mission time` : undefined}
              title={unavailable ? `${label} position is unavailable at the selected mission time` : undefined}
              key={mode}
              onClick={()=>{ if (!unavailable) setCam(mode) }}
              className={`btn justify-start font-mono text-[11px] uppercase tracking-wider ${activeCam===mode?'btn-solid':'bg-paper/90'}`}
            >
              {Icon&&<Icon className="h-3 w-3"/>}{label}
            </button>
          )
        })}
      </div>

      <HUDOverlay />

      <WebGLBoundary>
        <div className={`flex-1 ${isFullscreen?'min-h-screen':'min-h-[450px] sm:min-h-[560px]'} relative overflow-hidden bg-black`}>
          <div className="absolute inset-0">
            <Canvas key={missionId} camera={{position:[44,100,60],fov:45,near:0.01,far:8000}} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}} dpr={[1,2]}>
              <Scene />
            </Canvas>
          </div>
        </div>
      </WebGLBoundary>

      {/* Bottom bar — scrubber + play controls */}
      <div className={`flex flex-wrap items-center gap-2 mt-1 px-1 ${isFullscreen?'px-4 pb-3':''}`}>
        <div className="flex items-center gap-2 flex-1">
          {isCompleted ? (
            <button type="button" onClick={resetToLive} aria-label="Jump to first covered source epoch" className="btn shrink-0 font-mono text-[11px] uppercase tracking-wider" title="Jump to the first covered NASA source epoch">
              <RotateCcw className="h-3 w-3"/> FIRST DATA
            </button>
          ) : simDay !== null ? (
            <button type="button" onClick={resetToLive} className="btn shrink-0 font-mono text-[11px] uppercase tracking-wider">
              <RotateCcw className="h-3 w-3"/> LIVE
            </button>
          ) : (
            <span className="text-[11px] text-ok font-mono font-semibold tracking-wider shrink-0 w-[52px]">● LIVE</span>
          )}
          <button type="button" onClick={togglePlay} aria-label={speed > 0 ? 'Pause mission replay' : 'Play mission replay'} className="btn btn-solid min-w-11 shrink-0 px-0">
            {speed > 0 ? <Pause className="h-3 w-3"/> : <Play className="h-3 w-3"/>}
          </button>
          <input type="range" min={0} max={md} step={0.001} value={currentDay} onChange={handleScrub} aria-label="Mission elapsed time" aria-valuetext={`${currentDay.toFixed(3)} days after launch`}
            className="h-11 min-w-24 flex-1 cursor-pointer" />
          <span className="w-28 shrink-0 font-mono text-xs text-ink-2" aria-live="off">
            Day {currentDay.toFixed(2)}/{md.toFixed(2)}
          </span>
          <button type="button" onClick={cycleSpeed} aria-label={`Playback speed ${speed > 0 ? fmtSpeed(speed) : 'paused'}; choose next speed`} className="btn shrink-0 font-mono text-[11px]">
            <FastForward className="h-3 w-3"/> {speed > 0 ? fmtSpeed(speed) : fmtSpeed(lastSpeedRef.current)}
          </button>
        </div>
      </div>
    </div>
  )
}
