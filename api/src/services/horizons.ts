// JPL Horizons API client for spacecraft trajectory data
// Docs: https://ssd-api.jpl.nasa.gov/doc/horizons.html

const HORIZONS_API = 'https://ssd.jpl.nasa.gov/api/horizons.api'
const SPEED_OF_LIGHT = 299792.458 // km/s

interface StateVector {
  timestamp: string
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

export interface TrajectoryPoint {
  timestamp: string
  distanceFromEarth: number
  distanceFromMoon: number
  velocity: number
  acceleration: number
  commsDelay: number
  latitude: number
  longitude: number
}

// In-memory cache (persists within a warm function instance)
let trajectoryCache: { data: TrajectoryPoint[]; fetchedAt: number } | null = null
let moonPositionCache: { data: StateVector[]; fetchedAt: number } | null = null
let historyCache: { data: TrajectoryPoint[]; fetchedAt: number } | null = null
const CACHE_TTL = 60_000
const HISTORY_CACHE_TTL = 5 * 60_000

async function queryHorizons(
  command: string,
  startTime: string,
  stopTime: string,
  stepSize: string
): Promise<StateVector[]> {
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: `'${command}'`,
    EPHEM_TYPE: "'VECTORS'",
    CENTER: "'500@399'",
    START_TIME: `'${startTime}'`,
    STOP_TIME: `'${stopTime}'`,
    STEP_SIZE: `'${stepSize}'`,
    OUT_UNITS: "'KM-S'",
    VEC_TABLE: "'2'",
    REF_PLANE: "'ECLIPTIC'",
    REF_SYSTEM: "'J2000'",
    CSV_FORMAT: "'YES'",
  })

  const res = await fetch(`${HORIZONS_API}?${params.toString()}`)
  if (!res.ok) throw new Error(`Horizons API error: ${res.status}`)

  const json = await res.json() as { result: string }
  return parseHorizonsVectors(json.result)
}

function parseHorizonsVectors(result: string): StateVector[] {
  const vectors: StateVector[] = []
  const soeIndex = result.indexOf('$$SOE')
  const eoeIndex = result.indexOf('$$EOE')
  if (soeIndex === -1 || eoeIndex === -1) return vectors

  const lines = result.substring(soeIndex + 5, eoeIndex).trim().split('\n').filter(l => l.trim())

  for (const line of lines) {
    const f = line.split(',').map(s => s.trim())
    if (f.length < 8) continue
    const calendarDate = f[1]?.replace(/A\.D\.\s*/, '').trim()
    if (!calendarDate) continue

    const timestamp = parseHorizonsDate(calendarDate)
    const x = parseFloat(f[2]), y = parseFloat(f[3]), z = parseFloat(f[4])
    const vx = parseFloat(f[5]), vy = parseFloat(f[6]), vz = parseFloat(f[7])
    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      vectors.push({ timestamp, x, y, z, vx, vy, vz })
    }
  }
  return vectors
}

function parseHorizonsDate(dateStr: string): string {
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  }
  const match = dateStr.match(/(\d{4})-(\w{3})-(\d{2})\s+(\d{2}:\d{2}:\d{2})/)
  if (!match) return new Date().toISOString()
  const [, year, mon, day, time] = match
  return `${year}-${months[mon] || '01'}-${day}T${time}Z`
}

async function getMoonVectors(startTime: string, stopTime: string, stepSize: string): Promise<StateVector[]> {
  if (moonPositionCache && Date.now() - moonPositionCache.fetchedAt < CACHE_TTL * 5) {
    return moonPositionCache.data
  }
  const vectors = await queryHorizons('301', startTime, stopTime, stepSize)
  moonPositionCache = { data: vectors, fetchedAt: Date.now() }
  return vectors
}

function computeTrajectoryPoints(scVectors: StateVector[], moonVectors: StateVector[]): TrajectoryPoint[] {
  return scVectors.map((sv, i) => {
    const distFromEarth = Math.sqrt(sv.x ** 2 + sv.y ** 2 + sv.z ** 2)
    const velocity = Math.sqrt(sv.vx ** 2 + sv.vy ** 2 + sv.vz ** 2)

    const moonVec = moonVectors[i] || moonVectors[moonVectors.length - 1]
    let distFromMoon = 384400
    if (moonVec) {
      distFromMoon = Math.sqrt((sv.x - moonVec.x) ** 2 + (sv.y - moonVec.y) ** 2 + (sv.z - moonVec.z) ** 2)
    }

    let acceleration = 0
    if (i > 0) {
      const prev = scVectors[i - 1]
      const prevVel = Math.sqrt(prev.vx ** 2 + prev.vy ** 2 + prev.vz ** 2)
      const dt = (new Date(sv.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000
      if (dt > 0) acceleration = (velocity - prevVel) / dt
    }

    return {
      timestamp: sv.timestamp,
      distanceFromEarth: Math.round(distFromEarth * 100) / 100,
      distanceFromMoon: Math.round(distFromMoon * 100) / 100,
      velocity: Math.round(velocity * 1000) / 1000,
      acceleration: Math.round(acceleration * 10000) / 10000,
      commsDelay: Math.round((distFromEarth / SPEED_OF_LIGHT) * 100) / 100,
      latitude: Math.round(Math.atan2(sv.z, Math.sqrt(sv.x ** 2 + sv.y ** 2)) * (180 / Math.PI) * 100) / 100,
      longitude: Math.round(Math.atan2(sv.y, sv.x) * (180 / Math.PI) * 100) / 100,
    }
  })
}

function lerp(a: number, b: number, t: number): number {
  return Math.round((a + (b - a) * t) * 1000) / 1000
}

function interpolatePoint(points: TrajectoryPoint[], targetTime: Date): TrajectoryPoint | null {
  if (points.length === 0) return null
  if (points.length === 1) return points[0]

  const targetMs = targetTime.getTime()
  for (let i = 0; i < points.length - 1; i++) {
    const t0 = new Date(points[i].timestamp).getTime()
    const t1 = new Date(points[i + 1].timestamp).getTime()
    if (targetMs >= t0 && targetMs <= t1) {
      const frac = (targetMs - t0) / (t1 - t0)
      const p0 = points[i], p1 = points[i + 1]
      return {
        timestamp: targetTime.toISOString(),
        distanceFromEarth: lerp(p0.distanceFromEarth, p1.distanceFromEarth, frac),
        distanceFromMoon: lerp(p0.distanceFromMoon, p1.distanceFromMoon, frac),
        velocity: lerp(p0.velocity, p1.velocity, frac),
        acceleration: lerp(p0.acceleration, p1.acceleration, frac),
        commsDelay: lerp(p0.commsDelay, p1.commsDelay, frac),
        latitude: lerp(p0.latitude, p1.latitude, frac),
        longitude: lerp(p0.longitude, p1.longitude, frac),
      }
    }
  }

  const firstTime = new Date(points[0].timestamp).getTime()
  return targetMs < firstTime ? points[0] : points[points.length - 1]
}

function formatForHorizons(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${date.getUTCFullYear()}-${months[date.getUTCMonth()]}-${String(date.getUTCDate()).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`
}

export async function fetchCurrentTrajectory(horizonsId: string): Promise<TrajectoryPoint | null> {
  try {
    const now = new Date()
    if (trajectoryCache && Date.now() - trajectoryCache.fetchedAt < CACHE_TTL) {
      const interpolated = interpolatePoint(trajectoryCache.data, now)
      if (interpolated) return interpolated
    }

    const start = new Date(now.getTime() - 60 * 60 * 1000)
    const end = new Date(now.getTime() + 60 * 60 * 1000)

    const [scVectors, moonVectors] = await Promise.all([
      queryHorizons(horizonsId, formatForHorizons(start), formatForHorizons(end), '1 min'),
      getMoonVectors(formatForHorizons(start), formatForHorizons(end), '1 min'),
    ])

    if (scVectors.length === 0) return null

    const points = computeTrajectoryPoints(scVectors, moonVectors)
    trajectoryCache = { data: points, fetchedAt: Date.now() }
    return interpolatePoint(points, now)
  } catch (err) {
    console.error('Error fetching trajectory:', err)
    if (trajectoryCache) return interpolatePoint(trajectoryCache.data, new Date())
    return null
  }
}

export async function fetchTrajectoryHistory(
  horizonsId: string,
  hours: number = 24,
  stepMinutes: number = 30
): Promise<TrajectoryPoint[]> {
  try {
    if (historyCache && Date.now() - historyCache.fetchedAt < HISTORY_CACHE_TTL) {
      return historyCache.data
    }

    const now = new Date()
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000)

    const [scVectors, moonVectors] = await Promise.all([
      queryHorizons(horizonsId, formatForHorizons(start), formatForHorizons(now), `${stepMinutes} min`),
      getMoonVectors(formatForHorizons(start), formatForHorizons(now), `${stepMinutes} min`),
    ])

    const points = computeTrajectoryPoints(scVectors, moonVectors)
    historyCache = { data: points, fetchedAt: Date.now() }
    return points
  } catch (err) {
    console.error('Error fetching trajectory history:', err)
    if (historyCache) return historyCache.data
    return []
  }
}
