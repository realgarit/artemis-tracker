import { useEffect, useMemo, useRef, useState } from 'react'
import { FastForward, Pause, Play } from 'lucide-react'
import type { MissionData, TrajectoryData } from '../lib/types'
import { getMoonPos, getTrajectoryPos, getActiveMission, fullTrajPts, moonArcPts, SCALE, EARTH_RADIUS_KM } from '../data/trajectoryData'
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
const HEIGHT = 360

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
    const scale = Math.min((WIDTH - 100) / spanX, (HEIGHT - 80) / spanY)
    const project = (point: { x: number; z: number }) => ({ x: 50 + (point.x - minX) * scale, y: 40 + (maxY - point.z) * scale })
    return {
      project,
      path: fullTrajPts.map((point, index) => { const p = project(point); return `${index ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' '),
      moonPath: moonArcPts.map((point, index) => { const p = project(point); return `${index ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' '),
      earth: project({ x: 0, z: 0 }),
      spacecraft: spacecraft ? project(spacecraft) : null,
      moon: moon ? project(moon) : null,
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
    <section className="glass-panel border-glow min-w-0 p-3 sm:p-5" aria-labelledby="lightweight-map-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[.2em] text-amber-glow">Lightweight mission view</p>
          <h2 id="lightweight-map-title" className="mt-1 font-display text-lg font-semibold text-slate-100">2D trajectory and mission replay</h2>
          <DataSourceBadge provenance={trajectory.provenance} />
        </div>
        <button type="button" disabled={!canLoad3D} onClick={onShow3D} title={!canLoad3D ? 'This offline pack does not contain the optional 3D files.' : undefined} className="min-h-11 rounded border border-cyan-mid/30 px-3 text-sm text-cyan-glow hover:bg-cyan-glow/10 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">Load 3D view and spacecraft model</button>
      </div>
      {!canLoad3D && <p className="mt-2 text-xs text-slate-400">This offline pack contains the lightweight replay. The optional 3D model and textures were not downloaded.</p>}
      <figure className="mt-4 min-w-0" aria-labelledby="map-caption">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby="map-title map-description" className="h-auto max-h-[360px] w-full rounded border border-slate-800 bg-[#03060b]">
          <title id="map-title">Earth, Moon, and NASA Orion mission replay path</title>
          <desc id="map-description">An equal-scale projection of the NASA flight ephemeris. The highlighted marker appears only where the source ephemeris covers the selected replay epoch.</desc>
          <path d={geometry.moonPath} fill="none" stroke="#94a3b8" strokeOpacity=".38" strokeWidth="1.5" />
          <path d={geometry.path} fill="none" stroke="#fb8b54" strokeWidth="2.5" strokeDasharray="5 4" />
          <circle cx={geometry.earth.x} cy={geometry.earth.y} r="13" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="2" />
          <text x={geometry.earth.x + 18} y={geometry.earth.y + 4} fill="#bfdbfe" fontSize="12">Earth</text>
          {geometry.moon && <><circle cx={geometry.moon.x} cy={geometry.moon.y} r="7" fill="#cbd5e1" stroke="#f1f5f9" strokeWidth="1.5" /><text x={geometry.moon.x + 12} y={geometry.moon.y + 4} fill="#e2e8f0" fontSize="12">Moon</text></>}
          {geometry.spacecraft && <><circle cx={geometry.spacecraft.x} cy={geometry.spacecraft.y} r="7" fill="#fb923c" stroke="#fff7ed" strokeWidth="2" /><text x={geometry.spacecraft.x + 12} y={geometry.spacecraft.y - 9} fill="#fed7aa" fontSize="12">Orion · selected time</text></>}
        </svg>
        <figcaption id="map-caption" className="mt-2 text-xs leading-relaxed text-slate-400">NASA flight ephemeris and a separately sourced JPL lunar ephemeris, projected into two dimensions. Earth and Moon sizes are enlarged for legibility. The marker is hidden where no state-vector sample covers the selected time.</figcaption>
      </figure>

      <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 rounded border border-slate-800/80 p-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Selected replay measurements">
        <div><p className="text-xs text-slate-500">Mission phase</p><p className="mt-1 text-sm font-semibold text-cyan-glow">{sample.phase}</p></div>
        <div><p className="text-xs text-slate-500">Distance from Earth center</p><p className="mt-1 font-mono text-sm text-slate-100">{sample.distanceFromEarth === null ? 'Unavailable' : `${sample.distanceFromEarth.toLocaleString()} km`}</p></div>
        <div><p className="text-xs text-slate-500">Distance from Moon center</p><p className="mt-1 font-mono text-sm text-slate-100">{sample.distanceFromMoon === null ? 'Unavailable' : `${sample.distanceFromMoon.toLocaleString()} km`}</p></div>
        <div><p className="text-xs text-slate-500">Speed</p><p className="mt-1 font-mono text-sm text-slate-100">{sample.velocity === null ? 'Unavailable' : `${sample.velocity.toFixed(3)} km/s`}</p></div>
        <div><p className="text-xs text-slate-500">Acceleration · sampled</p><p className="mt-1 font-mono text-sm text-slate-100">{sample.acceleration === null ? 'Unavailable' : `${sample.acceleration.toExponential(3)} km/s²`}</p></div>
        <div><p className="text-xs text-slate-500">Replay time · UTC</p><time dateTime={missionTime} className="mt-1 block font-mono text-xs text-slate-100">{formatUTC(missionTime)}</time></div>
      </div>
      <p className="mt-2 text-xs text-slate-500">Acceleration is the finite-difference magnitude of the NASA velocity vector over adjacent covered OEM epochs. It is not spacecraft-propulsion acceleration.</p>
      <p className="mt-2 text-xs text-slate-500">Geographic latitude and longitude are unavailable because EME2000 is an inertial frame, not an Earth-fixed coordinate system.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-[auto_minmax(120px,1fr)_auto] md:items-end">
        <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause mission replay' : 'Play mission replay'} className="min-h-11 min-w-11 rounded border border-slate-600 px-3 text-sm text-slate-100 hover:border-cyan-glow/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">{playing ? <><Pause className="mr-2 inline h-4 w-4" />Pause</> : <><Play className="mr-2 inline h-4 w-4" />Play</>}</button>
        <label className="block text-sm text-slate-300">Mission elapsed time
          <input type="range" min={0} max={mission.totalDays} step={0.001} value={day} aria-valuetext={`Mission day ${day.toFixed(3)}`} onChange={(event) => setDay(Number(event.target.value))} className="mt-1 h-11 w-full accent-cyan-glow" />
          <span className="block font-mono text-xs text-slate-400">Day {day.toFixed(2)} of {mission.totalDays.toFixed(2)}</span>
        </label>
        <label className="block text-sm text-slate-300">Replay speed
          <span className="flex min-h-11 items-center gap-2"><FastForward className="h-4 w-4" /><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="min-h-11 rounded border border-slate-600 bg-space-900 px-3 text-sm text-slate-100"><option value={1}>1×</option><option value={60}>60×</option><option value={600}>600×</option></select></span>
        </label>
      </div>
      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); applyExactTime() }}>
        <label className="min-w-0 flex-1 text-sm text-slate-300">Jump to UTC time
          <input type="text" value={typedTime} onChange={(event) => setTypedTime(event.target.value)} placeholder="2026-04-06T23:00:00Z" className="mt-1 min-h-11 w-full rounded border border-slate-600 bg-space-900 px-3 font-mono text-sm text-slate-100" aria-describedby={timeError ? 'replay-time-error' : 'replay-time-help'} />
        </label>
        <button type="submit" className="min-h-11 rounded border border-slate-600 px-4 text-sm text-slate-100 hover:border-cyan-glow/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">Set time</button>
      </form>
      <p id={timeError ? 'replay-time-error' : 'replay-time-help'} role={timeError ? 'alert' : undefined} className={`mt-1 text-xs ${timeError ? 'text-red-300' : 'text-slate-500'}`}>{timeError || 'Use an ISO 8601 timestamp with an explicit UTC offset. Times outside the mission are clamped to the mission boundaries.'}</p>
      {(day < missionModel.trajStartDay || day > missionModel.trajEndDay) && <p className="mt-2 text-xs text-amber-glow">The NASA ephemeris does not cover this UTC time. Position and velocity are left unavailable; the path is not extrapolated.</p>}
    </section>
  )
}
