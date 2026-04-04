import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import type { TrajectoryData, MissionData } from '../lib/types'

interface TrajectoryMapProps {
  trajectory?: TrajectoryData
  mission?: MissionData
}

// Scale: 1 unit ≈ Earth radius
const EARTH_R = 1
const MOON_R = 0.27
const EARTH_POS = new THREE.Vector3(0, 0, 0)
const MOON_POS = new THREE.Vector3(10, 0, 0.6)

// 3D trajectory bezier curves
const outboundCurve = new THREE.CubicBezierCurve3(
  new THREE.Vector3(1.15, 0, 0),
  new THREE.Vector3(3.5, 3.5, 0.6),
  new THREE.Vector3(7.5, 2.8, 1),
  new THREE.Vector3(10.8, 0, 0.6),
)
const returnCurve = new THREE.CubicBezierCurve3(
  new THREE.Vector3(10.8, 0, 0.6),
  new THREE.Vector3(7.5, -2.8, 0.2),
  new THREE.Vector3(3.5, -3.5, -0.4),
  new THREE.Vector3(1.15, 0, 0),
)

function getOrionPos(progress: number): THREE.Vector3 {
  const p = progress / 100
  if (p < 0.5) return outboundCurve.getPoint(p / 0.5)
  return returnCurve.getPoint((p - 0.5) / 0.5)
}

// ——— Scene objects ———

function Earth() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.0008 })

  return (
    <group position={EARTH_POS}>
      {/* Atmosphere glow — outer shell */}
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.18, 64, 64]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.08, 64, 64]} />
        <meshBasicMaterial color="#93c5fd" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
      {/* Planet body */}
      <mesh ref={ref}>
        <sphereGeometry args={[EARTH_R, 64, 64]} />
        <meshStandardMaterial
          color="#2563eb"
          roughness={0.7}
          metalness={0.05}
          emissive="#1e3a5f"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Subtle equatorial band */}
      <mesh ref={ref} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[EARTH_R * 1.001, 0.008, 8, 64]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.15} />
      </mesh>
      <Html position={[0, -1.6, 0]} center style={{ pointerEvents: 'none' }}>
        <span className="font-display text-[10px] text-slate-400/80 tracking-[4px] select-none">EARTH</span>
      </Html>
    </group>
  )
}

function Moon() {
  return (
    <group position={MOON_POS}>
      <mesh>
        <sphereGeometry args={[MOON_R, 32, 32]} />
        <meshStandardMaterial color="#b0b0b0" roughness={0.95} metalness={0} />
      </mesh>
      {/* Flyby orbit ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[MOON_R + 0.15, MOON_R + 0.17, 64]} />
        <meshBasicMaterial color="#475569" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[0.6, -0.6, 0]} center style={{ pointerEvents: 'none' }}>
        <span className="font-display text-[9px] text-slate-400/70 tracking-[3px] select-none">MOON</span>
      </Html>
    </group>
  )
}

function TrajectoryPath({ curve, color }: { curve: THREE.CubicBezierCurve3; color: string }) {
  const points = useMemo(() => curve.getPoints(120).map((p) => [p.x, p.y, p.z] as [number, number, number]), [curve])
  // Static dot markers
  const dots = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => curve.getPoint((i + 1) / 21))
  }, [curve])

  return (
    <>
      <Line points={points} color={color} lineWidth={1.5} transparent opacity={0.5} />
      {dots.map((d, i) => (
        <mesh key={i} position={d}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </mesh>
      ))}
    </>
  )
}

function FlowingParticles({ curve, color, count = 6 }: { curve: THREE.CubicBezierCurve3; color: string; count?: number }) {
  const refs = useRef<THREE.Mesh[]>([])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    refs.current.forEach((mesh, i) => {
      if (!mesh) return
      const offset = i / count
      const progress = ((t / 10) + offset) % 1
      const point = curve.getPoint(progress)
      mesh.position.copy(point)
      const fade = Math.sin(progress * Math.PI)
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.opacity = fade * 0.8
    })
  })

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el }}>
          <sphereGeometry args={[0.045, 8, 8]} />
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
    if (glowRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.15
      glowRef.current.scale.setScalar(s)
    }
  })

  return (
    <group position={pos}>
      {/* Outer glow — pulsing */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.1} />
      </mesh>
      {/* Inner body */}
      <mesh>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#fde68a" />
      </mesh>
      {/* Light */}
      <pointLight color="#f59e0b" intensity={0.6} distance={3} />

      <Html position={[0.35, 0.25, 0]} style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap select-none">
          <span className="font-display text-[10px] text-cyan-glow font-bold tracking-wider">ORION</span>
        </div>
      </Html>
      <Html position={[-0.35, 0, 0]} style={{ pointerEvents: 'none' }}>
        <span className="font-mono text-[9px] text-slate-300 select-none whitespace-nowrap">{distLabel}</span>
      </Html>
    </group>
  )
}

function Scene({ trajectory, mission }: TrajectoryMapProps) {
  const progress = mission?.progress ?? 0
  const dist = trajectory ? `${Math.round(trajectory.distanceFromEarth).toLocaleString()} km` : '—'

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.1} />
      <directionalLight position={[20, 10, 15]} intensity={1.5} color="#fff8e7" />
      <pointLight position={[0, 0, 0]} intensity={0.2} color="#3b82f6" distance={4} />

      {/* Starfield */}
      <Stars radius={200} depth={80} count={3000} factor={3} saturation={0} fade speed={0.4} />

      {/* Bodies */}
      <Earth />
      <Moon />

      {/* Trajectories */}
      <TrajectoryPath curve={outboundCurve} color="#22d3ee" />
      <TrajectoryPath curve={returnCurve} color="#f59e0b" />

      {/* Animated particles */}
      <FlowingParticles curve={outboundCurve} color="#22d3ee" count={7} />
      <FlowingParticles curve={returnCurve} color="#f59e0b" count={7} />

      {/* Orion */}
      <OrionMarker progress={progress} distLabel={dist} />

      {/* Camera controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={6}
        maxDistance={28}
        autoRotate
        autoRotateSpeed={0.25}
        maxPolarAngle={Math.PI * 0.75}
        minPolarAngle={Math.PI * 0.15}
      />
    </>
  )
}

// ——— Main export ———

export function TrajectoryMap({ trajectory, mission }: TrajectoryMapProps) {
  const progress = mission?.progress ?? 0

  return (
    <div className="glass-panel border-glow p-3 h-full flex flex-col relative">
      {/* HTML overlays */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-space-900/70 backdrop-blur border border-cyan-glow/15 rounded px-2.5 py-1 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500 live-pulse" />
          <span className="font-mono text-[8px] text-slate-400">NASA JSC OEM · OFFICIAL</span>
        </div>
      </div>
      <div className="absolute top-3 right-3 z-10 text-right">
        <div className="text-[8px] text-slate-500 tracking-[1.5px]">CURRENT PHASE</div>
        <div className="font-display text-sm text-cyan-glow font-bold tracking-wider glow-cyan">
          {mission?.currentPhase?.toUpperCase() || ''}
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 min-h-[340px] rounded overflow-hidden">
        <Canvas
          camera={{ position: [2, 6, 16], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Scene trajectory={trajectory} mission={mission} />
        </Canvas>
      </div>

      {/* Crew strip + progress */}
      <div className="flex items-center justify-between mt-2 gap-4">
        {mission?.crew && (
          <div className="flex items-center gap-3">
            {mission.crew.map((member) => (
              <div key={member.name} className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full bg-slate-800 border border-cyan-glow/20 flex items-center justify-center text-[7px] font-bold text-cyan-glow/70 font-mono">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="hidden xl:block">
                  <div className="text-[8px] text-slate-300 leading-none">{member.name}</div>
                  <div className="text-[7px] text-slate-600 leading-none mt-0.5">{member.role} · {member.agency}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex-1 max-w-[200px]">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-amber-glow transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
