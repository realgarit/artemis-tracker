import { useEffect, useMemo, useRef, useState } from 'react'
import { FastForward, Pause, Play } from 'lucide-react'
import type { MissionData, TrajectoryData } from '../lib/types'
import { getMoonPos, getTrajectoryPos, getActiveMission, fullTrajPts, moonArcPts, horizonsToThree, SCALE } from '../data/trajectoryData'
import { getTrajectoryFallback } from '../lib/trajectoryFallback'
import { advanceMissionEpoch } from '../lib/replayClock'
import { DataSourceBadge } from './DataSourceBadge'

interface Props {
  mission: MissionData
  missionId: string
  missionTime: string
  trajectory: TrajectoryData
  onSeek: (time: string) => void
  onShow3D: () => void
  canLoad3D: boolean
}

const WIDTH = 820
const HEIGHT = 400
const RING_STEP_KM = 100_000

function formatUTC(value: string): string {
  return new Date(value).toISOString().replace('.000Z', ' UTC')
}

export function LightweightMissionView({ mission, missionId, missionTime, trajectory, onSeek, onShow3D, canLoad3D }: Props) {
  const missionModel = getActiveMission()
  const launch = Date.parse(mission.launchDate)
  const stop = launch + mission.totalDays * 86400000
  const day = Math.max(0, Math.min(mission.totalDays, (Date.parse(missionTime) - launch) / 86400000))
  const spacecraft = getTrajectoryPos(day)
  const moon = getMoonPos(day)
  const sample = useMemo(() => getTrajectoryFallback(missionId, new Date(missionTime)), [missionId, missionTime])
  const geometry = useMemo(() => {
    const all = [...fullTrajPts, ...moonArcPts]
    const minX = Math.min(0, ...all.map((point) => point.x))
    const maxX = Math.max(0, ...all.map((point) => point.x))
    const minY = Math.min(0, ...all.map((point) => point.z))
    const maxY = Math.max(0, ...all.map((point) => point.z))
    const spanX = Math.max(1, maxX - minX)
    const spanY = Math.max(1, maxY - minY)
    const scale = Math.min((WIDTH - 120) / spanX, (HEIGHT - 80) / spanY)
    const project = (point: { x: number; z: number }) => ({ x: (WIDTH - spanX * scale) / 2 + (point.x - minX) * scale, y: (HEIGHT - spanY * scale) / 2 + (maxY - point.z) * scale })
    return {
      project,
      path: fullTrajPts.map((point, index) => { const p = project(point); return `${index ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' '),
      moonPath: moonArcPts.map((point, index) => { const p = project(point); return `${index ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' '),
      earth: project({ x: 0, z: 0 }),
      // Mission getters return EME2000 kilometres; the path is in scaled scene coordinates.
      spacecraft: spacecraft ? project(horizonsToThree([spacecraft.x, spacecraft.y, spacecraft.z])) : null,
      moon: moon ? project(horizonsToThree([moon.x, moon.y, moon.z])) : null,
      rings: Array.from({ length: 5 }, (_, index) => ({ km: (index + 1) * RING_STEP_KM, r: (index + 1) * RING_STEP_KM * SCALE * scale })),
    }
  }, [day, moon?.x, moon?.y, moon?.z, spacecraft?.x, spacecraft?.y, spacecraft?.z])

  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(60)
  const timeRef = useRef(missionTime)
  const [typedTime, setTypedTime] = useState(missionTime)
  const [timeError, setTimeError] = useState('')
  useEffect(() => { timeRef.current = missionTime; setTypedTime(missionTime) }, [missionTime])
  useEffect(() => {
    const pauseWhenHidden = () => { if (document.visibilityState === 'hidden') setPlaying(false) }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden)
  }, [])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      const current = Date.parse(timeRef.current)
      const next = advanceMissionEpoch(current, 250, speed, launch, stop)
      const epoch = new Date(next).toISOString()
      timeRef.current = epoch
      onSeek(epoch)
      if (next >= stop) setPlaying(false)
    }, 250)
    return () => window.clearInterval(timer)
  }, [playing, speed, launch, stop, onSeek])

  const setDay = (value: number) => {
    setPlaying(false)
    onSeek(new Date(launch + value * 86400000).toISOString())
  }
  const applyExactTime = () => {
    const timestamp = Date.parse(typedTime)
    if (!Number.isFinite(timestamp)) {
      setTimeError('Enter a valid ISO 8601 timestamp, including its UTC offset, for example 2026-04-06T23:00:00Z.')
      return
    }
    setTimeError('')
    setDay(Math.max(0, Math.min(mission.totalDays, (timestamp - launch) / 86400000)))
  }

  return (
    <section className="sheet min-w-0 p-3 sm:p-5" aria-labelledby="lightweight-map-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Lightweight mission view</p>
          <h2 id="lightweight-map-title" className="mt-1 font-display text-lg font-semibold text-ink">2D trajectory and mission replay</h2>
          <DataSourceBadge provenance={trajectory.provenance} />
        </div>
        <button type="button" disabled={!canLoad3D} onClick={onShow3D} title={!canLoad3D ? 'This offline pack does not contain the optional 3D files.' : undefined} className="btn btn-solid">Load 3D view and spacecraft model</button>
      </div>
      {!canLoad3D && <p className="mt-2 text-xs text-ink-3">This offline pack contains the lightweight replay. The optional 3D model and textures were not downloaded.</p>}
      <figure className="mt-4 min-w-0" aria-labelledby="map-caption">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby="map-title map-description" className="h-auto max-h-[440px] w-full border border-ink bg-paper">
          <title id="map-title">Earth, Moon, and NASA Orion mission replay path</title>
          <desc id="map-description">An equal-scale projection of the NASA flight ephemeris. The highlighted marker appears only where the source ephemeris covers the selected replay epoch.</desc>
          <defs><clipPath id="map-clip"><rect width={WIDTH} height={HEIGHT} /></clipPath></defs>
          <g clipPath="url(#map-clip)">
            {geometry.rings.map((ring) => <g key={ring.km}>
              <circle cx={geometry.earth.x} cy={geometry.earth.y} r={ring.r} fill="none" stroke="var(--color-rule)" strokeWidth="1" />
              <text x={geometry.earth.x + 4} y={geometry.earth.y - ring.r - 4} fill="var(--color-ink-3)" fontSize="11" fontFamily="var(--font-mono)">{ring.km / 1000}k km</text>
            </g>)}
            <path d={geometry.moonPath} fill="none" stroke="var(--color-ink-3)" strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" />
            <path d={geometry.path} fill="none" stroke="var(--color-signal-hot)" strokeWidth="2" />
            <circle cx={geometry.earth.x} cy={geometry.earth.y} r="9" fill="var(--color-blue)" />
            <text x={geometry.earth.x + 14} y={geometry.earth.y + 16} fill="var(--color-ink)" fontSize="13" fontWeight="700">Earth</text>
            {geometry.moon && <><circle cx={geometry.moon.x} cy={geometry.moon.y} r="6" fill="var(--color-card)" stroke="var(--color-ink)" strokeWidth="2" /><text x={geometry.moon.x - 11} y={geometry.moon.y + 18} textAnchor="end" fill="var(--color-ink)" fontSize="13" fontWeight="700" stroke="var(--color-paper)" strokeWidth="4" paintOrder="stroke">Moon</text></>}
            {geometry.spacecraft && <>
              <circle cx={geometry.spacecraft.x} cy={geometry.spacecraft.y} r="11" fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />
              <circle cx={geometry.spacecraft.x} cy={geometry.spacecraft.y} r="5" fill="var(--color-signal-hot)" stroke="var(--color-ink)" strokeWidth="1.5" />
              <text x={geometry.spacecraft.x > WIDTH - 190 ? geometry.spacecraft.x - 16 : geometry.spacecraft.x + 16} y={geometry.spacecraft.y - 10} textAnchor={geometry.spacecraft.x > WIDTH - 190 ? 'end' : 'start'} fill="var(--color-ink)" fontSize="13" fontWeight="700" stroke="var(--color-paper)" strokeWidth="4" paintOrder="stroke">Orion · selected time</text>
            </>}
          </g>
        </svg>
        <figcaption id="map-caption" className="mt-2 text-xs leading-relaxed text-ink-3">NASA flight ephemeris and a separately sourced JPL lunar ephemeris, projected into two dimensions. Rings mark distance from Earth center within the plot plane. Earth and Moon sizes are enlarged for legibility. The marker is hidden where no state-vector sample covers the selected time.</figcaption>
      </figure>

      <div className="mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 border-y border-ink py-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Selected replay measurements">
        <div><p className="eyebrow">Mission phase</p><p className="mt-1 text-sm font-bold uppercase text-signal">{sample.phase}</p></div>
        <div><p className="eyebrow">Distance from Earth center</p><p className="mt-1 font-mono text-sm text-ink">{sample.distanceFromEarth === null ? 'Unavailable' : `${sample.distanceFromEarth.toLocaleString()} km`}</p></div>
        <div><p className="eyebrow">Distance from Moon center</p><p className="mt-1 font-mono text-sm text-ink">{sample.distanceFromMoon === null ? 'Unavailable' : `${sample.distanceFromMoon.toLocaleString()} km`}</p></div>
        <div><p className="eyebrow">Speed</p><p className="mt-1 font-mono text-sm text-ink">{sample.velocity === null ? 'Unavailable' : `${sample.velocity.toFixed(3)} km/s`}</p></div>
        <div><p className="eyebrow">Acceleration · sampled</p><p className="mt-1 font-mono text-sm text-ink">{sample.acceleration === null ? 'Unavailable' : `${sample.acceleration.toExponential(3)} km/s²`}</p></div>
        <div><p className="eyebrow">Replay time · UTC</p><time dateTime={missionTime} className="mt-1 block font-mono text-xs text-ink">{formatUTC(missionTime)}</time></div>
      </div>
      <p className="mt-2 text-xs text-ink-3">Acceleration is the finite-difference magnitude of the NASA velocity vector over adjacent covered OEM epochs. It is not spacecraft-propulsion acceleration.</p>
      <p className="mt-2 text-xs text-ink-3">Geographic latitude and longitude are unavailable because EME2000 is an inertial frame, not an Earth-fixed coordinate system.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-[auto_minmax(120px,1fr)_auto] md:items-end">
        <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause mission replay' : 'Play mission replay'} className="btn btn-solid min-w-28">{playing ? <><Pause className="h-4 w-4" />Pause</> : <><Play className="h-4 w-4" />Play</>}</button>
        <label className="block text-sm text-ink-2">Mission elapsed time
          <input type="range" min={0} max={mission.totalDays} step={0.001} value={day} aria-valuetext={`Mission day ${day.toFixed(3)}`} onChange={(event) => setDay(Number(event.target.value))} className="mt-1 h-11 w-full accent-signal-hot" />
          <span className="block font-mono text-xs text-ink-3">Day {day.toFixed(2)} of {mission.totalDays.toFixed(2)}</span>
        </label>
        <label className="block text-sm text-ink-2">Replay speed
          <span className="flex min-h-11 items-center gap-2"><FastForward className="h-4 w-4" /><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="field"><option value={1}>1×</option><option value={60}>60×</option><option value={600}>600×</option></select></span>
        </label>
      </div>
      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); applyExactTime() }}>
        <label className="min-w-0 flex-1 text-sm text-ink-2">Jump to UTC time
          <input type="text" value={typedTime} onChange={(event) => setTypedTime(event.target.value)} placeholder="2026-04-06T23:00:00Z" className="field mt-1 w-full font-mono" aria-describedby={timeError ? 'replay-time-error' : 'replay-time-help'} />
        </label>
        <button type="submit" className="btn self-end">Set time</button>
      </form>
      <p id={timeError ? 'replay-time-error' : 'replay-time-help'} role={timeError ? 'alert' : undefined} className={`mt-1 text-xs ${timeError ? 'text-bad' : 'text-ink-3'}`}>{timeError || 'Use an ISO 8601 timestamp with an explicit UTC offset. Times outside the mission are clamped to the mission boundaries.'}</p>
      {(day < missionModel.trajStartDay || day > missionModel.trajEndDay) && <p className="mt-2 text-xs text-signal">The NASA ephemeris does not cover this UTC time. Position and velocity are left unavailable; the path is not extrapolated.</p>}
    </section>
  )
}
