import type { TrajectoryData } from './types'

export const HORIZONS_API = 'https://ssd.jpl.nasa.gov/api/horizons.api'
export const SPEED_OF_LIGHT_KM_S = 299792.458

export interface StateVector {
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

const CACHE_TTL_MS = 60_000
let trajectoryCache: { horizonsId: string; data: TrajectoryPoint[]; fetchedAt: number } | null = null

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function parseHorizonsDate(dateStr: string): string | null {
  const match = dateStr.replace(/['"]+/g, '').match(
    /(\d{4})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2})\s+(\d{2}:\d{2}:\d{2})/i,
  )
  if (!match) return null

  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  }
  const timestamp = Date.UTC(
    Number(match[1]),
    months[match[2].toLowerCase()],
    Number(match[3]),
    Number(match[4].slice(0, 2)),
    Number(match[4].slice(3, 5)),
    Number(match[4].slice(6, 8)),
  )
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

export function parseHorizonsVectors(result: string): StateVector[] {
  const start = result.indexOf('$$SOE')
  const end = result.indexOf('$$EOE')
  if (start === -1 || end === -1 || end <= start) return []

  const vectors: StateVector[] = []
  const lines = result.slice(start + '$$SOE'.length, end).split(/\r?\n/)
  for (const line of lines) {
    const fields = line.split(',').map((field) => field.trim())
    if (fields.length < 8) continue

    const timestamp = parseHorizonsDate(fields[1])
    const values = fields.slice(2, 8).map((field) => Number.parseFloat(field.replace(/['"]+/g, '')))
    if (!timestamp || values.some((value) => !Number.isFinite(value))) continue

    const [x, y, z, vx, vy, vz] = values
    vectors.push({ timestamp, x, y, z, vx, vy, vz })
  }
  return vectors
}

export function computeTrajectoryPoints(scVectors: StateVector[], moonVectors: StateVector[]): TrajectoryPoint[] {
  return scVectors.map((state, index) => {
    const distanceFromEarth = Math.hypot(state.x, state.y, state.z)
    const velocity = Math.hypot(state.vx, state.vy, state.vz)
    const moon = moonVectors[index] || moonVectors[moonVectors.length - 1]
    const distanceFromMoon = moon
      ? Math.hypot(state.x - moon.x, state.y - moon.y, state.z - moon.z)
      : 384400

    let acceleration = 0
    if (index > 0) {
      const previous = scVectors[index - 1]
      const previousVelocity = Math.hypot(previous.vx, previous.vy, previous.vz)
      const seconds = (new Date(state.timestamp).getTime() - new Date(previous.timestamp).getTime()) / 1000
      if (seconds > 0) acceleration = (velocity - previousVelocity) / seconds
    }

    return {
      timestamp: state.timestamp,
      distanceFromEarth: round(distanceFromEarth, 2),
      distanceFromMoon: round(distanceFromMoon, 2),
      velocity: round(velocity, 3),
      acceleration: round(acceleration, 4),
      commsDelay: round(distanceFromEarth / SPEED_OF_LIGHT_KM_S, 2),
      latitude: round(Math.atan2(state.z, Math.hypot(state.x, state.y)) * (180 / Math.PI), 2),
      longitude: round(Math.atan2(state.y, state.x) * (180 / Math.PI), 2),
    }
  })
}

function interpolatePoint(points: TrajectoryPoint[], targetTime: Date): TrajectoryPoint | null {
  if (points.length === 0) return null
  if (points.length === 1) return { ...points[0], timestamp: targetTime.toISOString() }

  const target = targetTime.getTime()
  for (let index = 0; index < points.length - 1; index++) {
    const first = points[index]
    const second = points[index + 1]
    const firstTime = new Date(first.timestamp).getTime()
    const secondTime = new Date(second.timestamp).getTime()
    if (target < firstTime || target > secondTime) continue

    const fraction = secondTime === firstTime ? 0 : (target - firstTime) / (secondTime - firstTime)
    const interpolate = (a: number, b: number) => round(a + (b - a) * fraction, 3)
    return {
      timestamp: targetTime.toISOString(),
      distanceFromEarth: interpolate(first.distanceFromEarth, second.distanceFromEarth),
      distanceFromMoon: interpolate(first.distanceFromMoon, second.distanceFromMoon),
      velocity: interpolate(first.velocity, second.velocity),
      acceleration: interpolate(first.acceleration, second.acceleration),
      commsDelay: interpolate(first.commsDelay, second.commsDelay),
      latitude: interpolate(first.latitude, second.latitude),
      longitude: interpolate(first.longitude, second.longitude),
    }
  }

  const firstTime = new Date(points[0].timestamp).getTime()
  const point = target < firstTime ? points[0] : points[points.length - 1]
  return { ...point, timestamp: targetTime.toISOString() }
}

function formatForHorizons(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${date.getUTCFullYear()}-${months[date.getUTCMonth()]}-${String(date.getUTCDate()).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 15_000): Promise<Response> {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

async function queryHorizons(command: string, startTime: string, stopTime: string, stepSize: string): Promise<StateVector[]> {
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
  const response = await fetchWithTimeout(`${HORIZONS_API}?${params.toString()}`)
  if (!response.ok) throw new Error(`Horizons API error: ${response.status}`)
  const payload = await response.json() as { result?: string }
  return typeof payload.result === 'string' ? parseHorizonsVectors(payload.result) : []
}

export async function fetchCurrentTrajectory(horizonsId: string, now = new Date()): Promise<TrajectoryPoint | null> {
  if (trajectoryCache?.horizonsId === horizonsId && Date.now() - trajectoryCache.fetchedAt < CACHE_TTL_MS) {
    return interpolatePoint(trajectoryCache.data, now)
  }

  const start = new Date(now.getTime() - 60 * 60 * 1000)
  const end = new Date(now.getTime() + 60 * 60 * 1000)
  const spacecraft = await queryHorizons(horizonsId, formatForHorizons(start), formatForHorizons(end), '1 min')
  if (spacecraft.length === 0) return null

  let moon: StateVector[] = []
  try {
    moon = await queryHorizons('301', formatForHorizons(start), formatForHorizons(end), '1 min')
  } catch {
    // The spacecraft vector is still useful when the moon query is unavailable.
  }

  const points = computeTrajectoryPoints(spacecraft, moon)
  trajectoryCache = { horizonsId, data: points, fetchedAt: Date.now() }
  return interpolatePoint(points, now)
}

export function toTrajectoryData(point: TrajectoryPoint, source: string, phase = 'In flight'): TrajectoryData {
  return { ...point, altitude: point.distanceFromEarth, phase, source }
}
