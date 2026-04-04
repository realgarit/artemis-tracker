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

interface TrajectoryPoint {
  timestamp: string
  distanceFromEarth: number
  distanceFromMoon: number
  velocity: number
  acceleration: number
  commsDelay: number
  latitude: number
  longitude: number
}

// In-memory cache
let trajectoryCache: { data: TrajectoryPoint[]; fetchedAt: number } | null = null
let moonPositionCache: { data: StateVector[]; fetchedAt: number } | null = null
const CACHE_TTL = 60_000 // 1 minute

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
    CENTER: "'500@399'", // Geocentric (Earth center)
    START_TIME: `'${startTime}'`,
    STOP_TIME: `'${stopTime}'`,
    STEP_SIZE: `'${stepSize}'`,
    OUT_UNITS: "'KM-S'",
    VEC_TABLE: "'2'", // Position + velocity
    REF_PLANE: "'ECLIPTIC'",
    REF_SYSTEM: "'J2000'",
    CSV_FORMAT: "'YES'",
  })

  const url = `${HORIZONS_API}?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Horizons API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  const result: string = json.result

  return parseHorizonsVectors(result)
}

function parseHorizonsVectors(result: string): StateVector[] {
  const vectors: StateVector[] = []

  // Find data between $$SOE and $$EOE markers
  const soeIndex = result.indexOf('$$SOE')
  const eoeIndex = result.indexOf('$$EOE')
  if (soeIndex === -1 || eoeIndex === -1) {
    console.error('Could not find SOE/EOE markers in Horizons response')
    return vectors
  }

  const dataSection = result.substring(soeIndex + 5, eoeIndex).trim()
  const lines = dataSection.split('\n').filter((l) => l.trim().length > 0)

  // CSV format: each record is a single line
  // JDTDB, Calendar Date, X, Y, Z, VX, VY, VZ,
  for (const line of lines) {
    const fields = line.split(',').map((s) => s.trim())
    if (fields.length < 8) continue

    const calendarDate = fields[1]?.replace(/A\.D\.\s*/, '').trim()
    if (!calendarDate) continue

    const dateStr = parseHorizonsDate(calendarDate)

    const x = parseFloat(fields[2])
    const y = parseFloat(fields[3])
    const z = parseFloat(fields[4])
    const vx = parseFloat(fields[5])
    const vy = parseFloat(fields[6])
    const vz = parseFloat(fields[7])

    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      vectors.push({ timestamp: dateStr, x, y, z, vx, vy, vz })
    }
  }

  return vectors
}

function parseHorizonsDate(dateStr: string): string {
  // Convert "2026-Apr-04 20:00:00.0000" to ISO 8601
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04',
    May: '05', Jun: '06', Jul: '07', Aug: '08',
    Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  }

  const match = dateStr.match(/(\d{4})-(\w{3})-(\d{2})\s+(\d{2}:\d{2}:\d{2})/)
  if (!match) return new Date().toISOString()

  const [, year, mon, day, time] = match
  const month = months[mon] || '01'
  return `${year}-${month}-${day}T${time}Z`
}

async function getMoonVectors(startTime: string, stopTime: string, stepSize: string): Promise<StateVector[]> {
  const now = Date.now()
  if (moonPositionCache && now - moonPositionCache.fetchedAt < CACHE_TTL * 5) {
    return moonPositionCache.data
  }

  const vectors = await queryHorizons('301', startTime, stopTime, stepSize)
  moonPositionCache = { data: vectors, fetchedAt: now }
  return vectors
}

function computeTrajectoryPoints(
  spacecraftVectors: StateVector[],
  moonVectors: StateVector[]
): TrajectoryPoint[] {
  return spacecraftVectors.map((sv, i) => {
    const distFromEarth = Math.sqrt(sv.x ** 2 + sv.y ** 2 + sv.z ** 2)
    const velocity = Math.sqrt(sv.vx ** 2 + sv.vy ** 2 + sv.vz ** 2)

    // Find corresponding moon vector (match by index or closest time)
    const moonVec = moonVectors[i] || moonVectors[moonVectors.length - 1]
    let distFromMoon = 384400 // Default Earth-Moon distance
    if (moonVec) {
      const dx = sv.x - moonVec.x
      const dy = sv.y - moonVec.y
      const dz = sv.z - moonVec.z
      distFromMoon = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2)
    }

    // Compute acceleration from consecutive velocity samples
    let acceleration = 0
    if (i > 0) {
      const prev = spacecraftVectors[i - 1]
      const prevVel = Math.sqrt(prev.vx ** 2 + prev.vy ** 2 + prev.vz ** 2)
      const dt =
        (new Date(sv.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000
      if (dt > 0) acceleration = (velocity - prevVel) / dt
    }

    // Communications delay (one-way light time)
    const commsDelay = distFromEarth / SPEED_OF_LIGHT

    // Approximate lat/lng (geocentric ecliptic to rough lat/lng)
    const latitude = Math.atan2(sv.z, Math.sqrt(sv.x ** 2 + sv.y ** 2)) * (180 / Math.PI)
    const longitude = Math.atan2(sv.y, sv.x) * (180 / Math.PI)

    return {
      timestamp: sv.timestamp,
      distanceFromEarth: Math.round(distFromEarth * 100) / 100,
      distanceFromMoon: Math.round(distFromMoon * 100) / 100,
      velocity: Math.round(velocity * 1000) / 1000,
      acceleration: Math.round(acceleration * 10000) / 10000,
      commsDelay: Math.round(commsDelay * 100) / 100,
      latitude: Math.round(latitude * 100) / 100,
      longitude: Math.round(longitude * 100) / 100,
    }
  })
}

function interpolatePoint(points: TrajectoryPoint[], targetTime: Date): TrajectoryPoint | null {
  if (points.length === 0) return null
  if (points.length === 1) return points[0]

  const targetMs = targetTime.getTime()

  // Find bracketing points
  for (let i = 0; i < points.length - 1; i++) {
    const t0 = new Date(points[i].timestamp).getTime()
    const t1 = new Date(points[i + 1].timestamp).getTime()

    if (targetMs >= t0 && targetMs <= t1) {
      const frac = (targetMs - t0) / (t1 - t0)
      const p0 = points[i]
      const p1 = points[i + 1]

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

  // If target is outside range, return closest endpoint
  const firstTime = new Date(points[0].timestamp).getTime()
  if (targetMs < firstTime) return points[0]
  return points[points.length - 1]
}

function lerp(a: number, b: number, t: number): number {
  return Math.round((a + (b - a) * t) * 1000) / 1000
}

export async function fetchCurrentTrajectory(horizonsId: string): Promise<TrajectoryPoint | null> {
  try {
    const now = new Date()
    const cacheValid = trajectoryCache && Date.now() - trajectoryCache.fetchedAt < CACHE_TTL

    if (cacheValid && trajectoryCache) {
      const interpolated = interpolatePoint(trajectoryCache.data, now)
      if (interpolated) return interpolated
    }

    // Query a 2-hour window around now with 1-minute steps
    const start = new Date(now.getTime() - 60 * 60 * 1000)
    const end = new Date(now.getTime() + 60 * 60 * 1000)
    const startStr = formatForHorizons(start)
    const endStr = formatForHorizons(end)

    const [scVectors, moonVectors] = await Promise.all([
      queryHorizons(horizonsId, startStr, endStr, '1 min'),
      getMoonVectors(startStr, endStr, '1 min'),
    ])

    if (scVectors.length === 0) {
      console.warn('No trajectory data returned from Horizons')
      return null
    }

    const points = computeTrajectoryPoints(scVectors, moonVectors)
    trajectoryCache = { data: points, fetchedAt: Date.now() }

    return interpolatePoint(points, now)
  } catch (err) {
    console.error('Error fetching trajectory:', err)
    // Return cached data if available
    if (trajectoryCache) {
      return interpolatePoint(trajectoryCache.data, new Date())
    }
    return null
  }
}

export async function fetchTrajectoryHistory(
  horizonsId: string,
  hours: number = 24,
  stepMinutes: number = 30
): Promise<TrajectoryPoint[]> {
  try {
    const now = new Date()
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000)
    const startStr = formatForHorizons(start)
    const endStr = formatForHorizons(now)
    const stepStr = `${stepMinutes} min`

    const [scVectors, moonVectors] = await Promise.all([
      queryHorizons(horizonsId, startStr, endStr, stepStr),
      getMoonVectors(startStr, endStr, stepStr),
    ])

    return computeTrajectoryPoints(scVectors, moonVectors)
  } catch (err) {
    console.error('Error fetching trajectory history:', err)
    return []
  }
}

function formatForHorizons(date: Date): string {
  // Format: "2026-Apr-04 20:00"
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const y = date.getUTCFullYear()
  const m = months[date.getUTCMonth()]
  const d = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}
