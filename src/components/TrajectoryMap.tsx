import { useRef, useMemo, Component, type ReactNode } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import type { TrajectoryData, MissionData } from '../lib/types'

interface TrajectoryMapProps {
  trajectory?: TrajectoryData
  mission?: MissionData
}

const EARTH_R = 1
const MOON_R = 0.27
const EARTH_POS = new THREE.Vector3(0, 0, 0)
const MOON_POS = new THREE.Vector3(7, 5, 0.3)

const outboundCurve = new THREE.CubicBezierCurve3(
  new THREE.Vector3(1.15, 0, 0),
  new THREE.Vector3(3, 3, 0.5),
  new THREE.Vector3(6, 5.5, 0.8),
  new THREE.Vector3(8.2, 5.8, 0.3),
)
const returnCurve = new THREE.CubicBezierCurve3(
  new THREE.Vector3(8.2, 5.8, 0.3),
  new THREE.Vector3(6, 3, -0.5),
  new THREE.Vector3(3, -1.5, -0.4),
  new THREE.Vector3(1.15, 0, 0),
)

function getOrionPos(progress: number): THREE.Vector3 {
  const p = progress / 100
  if (p < 0.5) return outboundCurve.getPoint(p / 0.5)
  return returnCurve.getPoint((p - 0.5) / 0.5)
}

// --- Textured Earth ---
function Earth() {
  const ref = useRef<THREE.Mesh>(null)
  const texture = useLoader(THREE.TextureLoader, '/textures/earth.jpg')
  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.0006 })

  return (
    <group position={EARTH_POS}>
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.2, 64, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.08, 64, 64]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>
      <mesh ref={ref}>
        <sphereGeometry args={[EARTH_R, 64, 64]} />
        <meshStandardMaterial map={texture} roughness={0.8} metalness={0.05} emissive="#0c1a3a" emissiveIntensity={0.3} />
      </mesh>
      <Html position={[0, -1.6, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(148,163,184,0.7)', letterSpacing: 4, userSelect: 'none' }}>EARTH</span>
      </Html>
    </group>
  )
}

// --- Textured Moon ---
function Moon() {
  const texture = useLoader(THREE.TextureLoader, '/textures/moon.jpg')

  return (
    <group position={MOON_POS}>
      <mesh>
        <sphereGeometry args={[MOON_R, 32, 32]} />
        <meshStandardMaterial map={texture} roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[MOON_R + 0.18, MOON_R + 0.2, 64]} />
        <meshBasicMaterial color="#475569" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[0, -0.7, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(148,163,184,0.6)', letterSpacing: 3, userSelect: 'none' }}>MOON</span>
      </Html>
    </group>
  )
}

function TrajectoryPath({ curve, color }: { curve: THREE.CubicBezierCurve3; color: string }) {
  const points = useMemo(() => curve.getPoints(120).map((p) => [p.x, p.y, p.z] as [number, number, number]), [curve])
  const dots = useMemo(() => Array.from({ length: 22 }, (_, i) => curve.getPoint((i + 1) / 23)), [curve])
  return (
    <>
      <Line points={points} color={color} lineWidth={1.5} transparent opacity={0.45} />
      {dots.map((d, i) => (
        <mesh key={i} position={d}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.18} />
        </mesh>
      ))}
    </>
  )
}

function FlowingParticles({ curve, color, count = 7 }: { curve: THREE.CubicBezierCurve3; color: string; count?: number }) {
  const refs = useRef<THREE.Mesh[]>([])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    refs.current.forEach((mesh, i) => {
      if (!mesh) return
      const progress = ((t / 10) + i / count) % 1
      mesh.position.copy(curve.getPoint(progress))
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(progress * Math.PI) * 0.75
    })
  })
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el }}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0} />
        </mesh>
      ))}
    </>
  )
}

function OrionMarker({ progress, distLabel }: { progress: number; distLabel: string }) {
  const pos = useMemo(() => getOrionPos(progress), [progress])
  const glowRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (glowRef.current) glowRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 2.5) * 0.2)
  })
  return (
    <group position={pos}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.06} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <pointLight color="#67e8f9" intensity={0.6} distance={3} />
      <Html position={[0.35, 0.22, 0]} style={{ pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#22d3ee', fontWeight: 700, letterSpacing: 1.5, userSelect: 'none' }}>ORION</span>
      </Html>
      <Html position={[-0.3, -0.05, 0]} style={{ pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#94a3b8', userSelect: 'none', whiteSpace: 'nowrap' }}>{distLabel}</span>
      </Html>
    </group>
  )
}

function CameraController({ progress }: { progress: number }) {
  const controlsRef = useRef<any>(null)
  const orionPos = useMemo(() => getOrionPos(progress), [progress])
  useFrame(() => {
    if (!controlsRef.current) return
    const cam = controlsRef.current.object as THREE.PerspectiveCamera
    const dist = cam.position.distanceTo(controlsRef.current.target)
    const blend = THREE.MathUtils.clamp(1 - (dist - 6) / 16, 0, 0.8)
    const mid = new THREE.Vector3(3.5, 2, 0)
    controlsRef.current.target.lerp(mid.clone().lerp(orionPos, blend), 0.02)
    controlsRef.current.update()
  })
  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom enablePan={false}
      minDistance={4} maxDistance={28}
      autoRotate autoRotateSpeed={0.2}
      maxPolarAngle={Math.PI * 0.72}
      minPolarAngle={Math.PI * 0.18}
    />
  )
}

function Scene({ trajectory, mission }: TrajectoryMapProps) {
  const progress = mission?.progress ?? 0
  const dist = trajectory ? `${Math.round(trajectory.distanceFromEarth).toLocaleString()} km` : '—'
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={[20, 10, 15]} intensity={1.6} color="#fffbeb" />
      <pointLight position={[0, 0, 0]} intensity={0.15} color="#3b82f6" distance={4} />
      <Stars radius={200} depth={80} count={3500} factor={3} saturation={0} fade speed={0.3} />
      <Earth />
      <Moon />
      <TrajectoryPath curve={outboundCurve} color="#22d3ee" />
      <TrajectoryPath curve={returnCurve} color="#f59e0b" />
      <FlowingParticles curve={outboundCurve} color="#22d3ee" count={7} />
      <FlowingParticles curve={returnCurve} color="#f59e0b" count={7} />
      <OrionMarker progress={progress} distLabel={dist} />
      <CameraController progress={progress} />
    </>
  )
}

// --- Error boundary: falls back gracefully if WebGL fails ---
class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() { return this.state.hasError ? this.props.fallback : this.props.children }
}

function FallbackView({ trajectory, mission }: TrajectoryMapProps) {
  const dist = trajectory ? `${Math.round(trajectory.distanceFromEarth).toLocaleString()} km` : '—'
  return (
    <div className="flex-1 min-h-[240px] flex items-center justify-center text-center">
      <div>
        <div className="font-display text-lg text-cyan-glow glow-cyan mb-1">ORION</div>
        <div className="font-mono text-2xl text-slate-200">{dist}</div>
        <div className="text-[10px] text-slate-500 mt-2">3D visualization unavailable — WebGL required</div>
      </div>
    </div>
  )
}

// --- Main export ---
export function TrajectoryMap({ trajectory, mission }: TrajectoryMapProps) {
  const progress = mission?.progress ?? 0

  return (
    <div className="glass-panel border-glow p-3 h-full flex flex-col relative">
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-space-950/80 backdrop-blur-sm border border-cyan-mid/12 rounded px-2.5 py-1 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-green-glow live-pulse" />
          <span className="font-mono text-[7.5px] text-slate-500 tracking-wide">NASA JSC OEM · OFFICIAL</span>
        </div>
      </div>
      <div className="absolute top-3 right-3 z-10 text-right">
        <div className="text-[7.5px] text-slate-600 tracking-[2px] uppercase">Current Phase</div>
        <div className="font-display text-[13px] text-cyan-glow font-bold tracking-wider glow-cyan mt-0.5">
          {mission?.currentPhase?.toUpperCase() || ''}
        </div>
      </div>

      <WebGLErrorBoundary fallback={<FallbackView trajectory={trajectory} mission={mission} />}>
        <div className="flex-1 min-h-[280px] sm:min-h-[340px] rounded overflow-hidden">
          <Canvas
            camera={{ position: [2, 5.5, 15], fov: 42 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
          >
            <Scene trajectory={trajectory} mission={mission} />
          </Canvas>
        </div>
      </WebGLErrorBoundary>

      {/* Crew + progress */}
      <div className="flex items-center justify-between mt-2 gap-3">
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
        <div className="flex-1 max-w-[180px]">
          <div className="h-[3px] bg-space-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-mid to-amber-glow transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
