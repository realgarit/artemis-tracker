// Shared, NASA flight-ephemeris + JPL lunar-ephemeris replay layer.
// The same epoch-based samples drive maps, metrics, charts, exports, and comparison.

import { getMission, MISSIONS } from './missionData'
import { createProvenance, SOURCE_URLS } from '../lib/provenance'
import type { DataProvenance } from '../lib/provenance'

export interface Vector3Like { x: number; y: number; z: number }
export interface TimedVector { time: number; vector: Vector3Like }
const vector = (x: number, y: number, z: number): Vector3Like => ({ x, y, z })
const subtract = (a: Vector3Like, b: Vector3Like): Vector3Like => vector(a.x - b.x, a.y - b.y, a.z - b.z)
const cross = (a: Vector3Like, b: Vector3Like): Vector3Like => vector(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x)
const magnitude = (a: Vector3Like): number => Math.hypot(a.x, a.y, a.z)
const normalize = (a: Vector3Like): Vector3Like => { const size = magnitude(a) || 1; return vector(a.x / size, a.y / size, a.z / size) }
const DAY_MS = 86_400_000
const MAX_INTERPOLATION_GAP_MS = 30 * 60_000
const SPEED_OF_LIGHT_KM_S = 299_792.458

export const EARTH_RADIUS_KM = 6371
export const MOON_RADIUS_KM = 1737.4
export const EARTH_MOON_DIST_KM = 384400
export const SCALE = 1 / 4000
export const eR = EARTH_RADIUS_KM * SCALE
export const mR = MOON_RADIUS_KM * SCALE

type CompactState = [number, number, number, number, number, number, number, number | null, number | null, number | null]
interface GeneratedMission {
  schemaVersion: number
  missionId: string
  launchTime: number
  source: Record<string, string | number>
  samples: CompactState[]
}
interface GeneratedBundle { schemaVersion: number; missions: GeneratedMission[] }

export interface MissionTrajConfig {
  id: string
  name: string
  status: 'completed'
  launchTime: number
  missionDays: number
  trajStartDay: number
  trajEndDay: number
  trajStepDays: number
  trajectory: number[][]
  moon: number[][]
  samples: CompactState[]
  getPhase: (day: number) => string
  provenance: DataProvenance
}

let MISSION_MAP: Record<string, MissionTrajConfig | null> = {}
let active: MissionTrajConfig | null = null

export function installMissionEphemerides(value: unknown, requiredMissionId?: string): void {
  if (!value || typeof value !== 'object' || (value as Partial<GeneratedBundle>).schemaVersion !== 1 || !Array.isArray((value as Partial<GeneratedBundle>).missions)) {
    throw new Error('The downloaded mission ephemeris bundle has an unsupported schema.')
  }
  const bundle = value as GeneratedBundle
  const records = new Map(bundle.missions.map((record) => [record.missionId, record]))
  const catalogsToLoad = requiredMissionId ? [getMission(requiredMissionId)].filter((item) => item !== null) : Object.values(MISSIONS)
  const next = Object.fromEntries(catalogsToLoad
    .filter((mission) => mission.trajectoryDatasetId)
    .map((mission) => [mission.id, makeMissionConfig(mission.id, records.get(mission.trajectoryDatasetId!))])) as Record<string, MissionTrajConfig | null>
  for (const mission of catalogsToLoad.filter((item) => item.trajectoryDatasetId)) {
    if (!next[mission.id]) throw new Error(`No valid flight-ephemeris dataset was provided for ${mission.name}.`)
  }
  MISSION_MAP = { ...MISSION_MAP, ...next }
  active = MISSION_MAP['artemis-ii'] || Object.values(MISSION_MAP).find((mission): mission is MissionTrajConfig => mission !== null) || null
  if (!active) throw new Error('No compatible completed-mission ephemeris is available.')
  LAUNCH_TIME = active.launchTime
  MISSION_DAYS = active.missionDays
  TRAJ_START_DAY = active.trajStartDay
  fullTrajPts = buildTrajectoryCurve()
  moonArcPts = buildMoonArc()
  lunarOrbitPts = buildLunarOrbitCircle()
}

function makeMissionConfig(missionId: string, record: GeneratedMission | undefined): MissionTrajConfig | null {
  const mission = getMission(missionId)
  if (!record || record.schemaVersion !== 1 || !mission || mission.status !== 'completed' || !mission.launchDate || !mission.splashdownDate) return null
  if (record.missionId !== mission.trajectoryDatasetId || record.samples.length < 2 || !record.source || record.source.frame !== 'EME2000' || record.source.timeSystem !== 'UTC') return null
  const samples = record.samples.filter((sample) => sample.length === 10 && Number.isFinite(sample[0]) && sample.slice(1, 7).every(Number.isFinite))
  if (samples.length < 2) return null
  for (let index = 1; index < samples.length; index++) if (samples[index][0] <= samples[index - 1][0]) return null
  const launchTime = Date.parse(mission.launchDate)
  const trajectory = samples.map((sample) => [sample[1], sample[2], sample[3]])
  const moon = samples.filter((sample) => sample[7] !== null && sample[8] !== null && sample[9] !== null).map((sample) => [sample[7]!, sample[8]!, sample[9]!])
  const stepGaps = samples.slice(1).map((sample, index) => sample[0] - samples[index][0]).sort((a, b) => a - b)
  const typicalStep = stepGaps[Math.floor(stepGaps.length / 2)] || 240_000
  const source = record.source
  const nasaUrl = typeof source.url === 'string' ? source.url : SOURCE_URLS.nasaArtemis
  const retrievedAt = typeof source.retrievedAt === 'string' ? source.retrievedAt : mission.verifiedAt + 'T00:00:00Z'
  return {
    id: mission.id,
    name: mission.name,
    status: 'completed',
    launchTime,
    missionDays: mission.totalDays,
    trajStartDay: (samples[0][0] - launchTime) / DAY_MS,
    trajEndDay: (samples[samples.length - 1][0] - launchTime) / DAY_MS,
    trajStepDays: typicalStep / DAY_MS,
    trajectory,
    moon,
    samples,
    getPhase(day) {
      const epoch = launchTime + day * DAY_MS
      return mission.phases.find((phase) => epoch >= Date.parse(phase.startTime) && epoch < Date.parse(phase.endTime))?.name
        || (epoch < launchTime ? mission.phases[0]?.name : mission.phases[mission.phases.length - 1]?.name)
        || 'Mission timeline unavailable'
    },
    provenance: createProvenance('replay', 'NASA/JSC flight ephemeris + JPL Horizons Moon ephemeris', 'Archived position/velocity samples; Moon positions are separately sourced ephemerides', {
      url: nasaUrl,
      retrievedAt,
      generatedAt: typeof source.createdAt === 'string' ? source.createdAt : undefined,
      frame: typeof source.frame === 'string' ? source.frame : 'Unknown',
      timeScale: typeof source.timeSystem === 'string' ? source.timeSystem : 'Unknown',
      units: 'km, km/s',
      targetId: typeof source.targetId === 'string' ? source.targetId : undefined,
      target: typeof source.target === 'string' ? source.target : undefined,
      center: typeof source.center === 'string' ? source.center : undefined,
      checksum: typeof source.archiveSha256 === 'string' ? source.archiveSha256 : undefined,
      sampling: 'Source OEM timestamps are retained; adjacent samples are interpolated only across gaps of 30 minutes or less',
    }),
  }
}

export function getMissionTrajectory(missionId: string): MissionTrajConfig | null { return MISSION_MAP[missionId] || null }
export function getActiveMission(): MissionTrajConfig {
  if (!active) throw new Error('Mission flight data has not finished loading.')
  return active
}
export function getMissionConfigs(): MissionTrajConfig[] { return Object.values(MISSION_MAP).filter((item): item is MissionTrajConfig => item !== null) }

export function setActiveMission(id: string) {
  const config = getMissionTrajectory(id)
  if (!config || (active && config.id === active.id)) return
  active = config
  LAUNCH_TIME = active.launchTime
  MISSION_DAYS = active.missionDays
  TRAJ_START_DAY = active.trajStartDay
  fullTrajPts = buildTrajectoryCurve()
  moonArcPts = buildMoonArc()
  lunarOrbitPts = buildLunarOrbitCircle()
}

export let LAUNCH_TIME = 0
export let MISSION_DAYS = 0
export let TRAJ_START_DAY = 0

// EME2000 (Z-up right-handed) to Three.js (Y-up right-handed).
export function horizonsToThree(coordinates: number[]): Vector3Like {
  return vector(coordinates[0] * SCALE, coordinates[2] * SCALE, -coordinates[1] * SCALE)
}

function bracketSample(samples: CompactState[], epoch: number): { lower: CompactState; upper: CompactState; fraction: number } | null {
  if (!Number.isFinite(epoch) || samples.length < 2 || epoch < samples[0][0] || epoch > samples[samples.length - 1][0]) return null
  let low = 0, high = samples.length - 1
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (samples[middle][0] < epoch) low = middle + 1
    else high = middle
  }
  const upper = samples[low]
  const lower = samples[Math.max(0, low - 1)]
  const gap = upper[0] - lower[0]
  if (epoch === upper[0]) return { lower: upper, upper, fraction: 0 }
  if (gap <= 0 || gap > MAX_INTERPOLATION_GAP_MS) return null
  return { lower, upper, fraction: (epoch - lower[0]) / gap }
}

function interpolateCoordinate(lower: number | null, upper: number | null, fraction: number): number | null {
  if (lower === null || upper === null) return null
  return lower + (upper - lower) * fraction
}

function getVectorAtTime(config: MissionTrajConfig, epoch: number, offsets: [number, number, number]): Vector3Like | null {
  const bracket = bracketSample(config.samples, epoch)
  if (!bracket) return null
  const [x, y, z] = offsets
  const values = [
    interpolateCoordinate(bracket.lower[x], bracket.upper[x], bracket.fraction),
    interpolateCoordinate(bracket.lower[y], bracket.upper[y], bracket.fraction),
    interpolateCoordinate(bracket.lower[z], bracket.upper[z], bracket.fraction),
  ]
  if (values.some((value) => value === null)) return null
  return vector(values[0]!, values[1]!, values[2]!)
}

export interface MissionEphemerisSample {
  timestamp: string
  position: Vector3Like
  moonPosition: Vector3Like | null
  velocity: number
  distanceFromEarth: number
  distanceFromMoon: number | null
  altitude: number | null
  commsDelay: number
  phase: string
  stateQuality: 'source epoch' | 'interpolated state vectors'
  lunarQuality: 'source epoch' | 'interpolated JPL ephemeris' | 'unavailable'
  provenance: DataProvenance
}

export function getMissionEphemerisAtTime(missionId: string, epoch: number): MissionEphemerisSample | null {
  const config = getMissionTrajectory(missionId)
  if (!config) return null
  const stateBracket = bracketSample(config.samples, epoch)
  if (!stateBracket) return null
  const position = getVectorAtTime(config, epoch, [1, 2, 3])
  const velocityVector = getVectorAtTime(config, epoch, [4, 5, 6])
  if (!position || !velocityVector) return null
  const moonPosition = getVectorAtTime(config, epoch, [7, 8, 9])
  const distanceFromEarth = magnitude(position)
  return {
    timestamp: new Date(epoch).toISOString(),
    position,
    moonPosition,
    velocity: magnitude(velocityVector),
    distanceFromEarth,
    distanceFromMoon: moonPosition ? magnitude(subtract(position, moonPosition)) : null,
    altitude: distanceFromEarth >= EARTH_RADIUS_KM ? distanceFromEarth - EARTH_RADIUS_KM : null,
    commsDelay: distanceFromEarth / SPEED_OF_LIGHT_KM_S,
    phase: config.getPhase((epoch - config.launchTime) / DAY_MS),
    stateQuality: stateBracket.lower === stateBracket.upper ? 'source epoch' : 'interpolated state vectors',
    lunarQuality: !moonPosition ? 'unavailable' : stateBracket.lower === stateBracket.upper ? 'source epoch' : 'interpolated JPL ephemeris',
    provenance: { ...config.provenance, observedAt: new Date(epoch).toISOString() },
  }
}

export function getTrajectoryPos(day: number): Vector3Like | null {
  const mission = getActiveMission()
  return getVectorAtTime(mission, mission.launchTime + day * DAY_MS, [1, 2, 3])
}

export function getMoonPos(day: number): Vector3Like | null {
  const mission = getActiveMission()
  return getVectorAtTime(mission, mission.launchTime + day * DAY_MS, [7, 8, 9])
}

export function getCurrentMissionDay(): number { return (Date.now() - getActiveMission().launchTime) / DAY_MS }
export function getMissionPhase(day: number): string { return getActiveMission().getPhase(day) }

export function catmullRom(p0: Vector3Like, p1: Vector3Like, p2: Vector3Like, p3: Vector3Like, t: number): Vector3Like {
  const t2 = t * t, t3 = t2 * t
  return vector(
    0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    0.5 * (2 * p1.z + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3),
  )
}

export function buildTrajectoryCurve(): Vector3Like[] {
  if (!active) return []
  return active.samples.map((sample) => horizonsToThree([sample[1], sample[2], sample[3]]))
}

export function buildMoonArc(): Vector3Like[] {
  if (!active) return []
  return active.samples.filter((sample) => sample[7] !== null && sample[8] !== null && sample[9] !== null).map((sample) => horizonsToThree([sample[7]!, sample[8]!, sample[9]!]))
}

export function buildLunarOrbitCircle(): Vector3Like[] {
  if (!active) return []
  const moonData = buildMoonArc()
  if (moonData.length < 4) return []
  const p0 = moonData[0]
  const pMid = moonData[Math.floor(moonData.length / 2)]
  const v1 = subtract(pMid, p0)
  const v2 = subtract(moonData[Math.floor(moonData.length / 4)], p0)
  const normal = normalize(cross(v1, v2))
  const avgR = moonData.reduce((sum, item) => sum + magnitude(item), 0) / moonData.length
  const u = normalize(cross(normal, Math.abs(normal.x) < 0.9 ? vector(1, 0, 0) : vector(0, 1, 0)))
  const v = normalize(cross(normal, u))
  return Array.from({ length: 361 }, (_, index) => {
    const angle = (index * Math.PI) / 180
    return vector(avgR * (Math.cos(angle) * u.x + Math.sin(angle) * v.x), avgR * (Math.cos(angle) * u.y + Math.sin(angle) * v.y), avgR * (Math.cos(angle) * u.z + Math.sin(angle) * v.z))
  })
}

export function getVelocity(day: number): number | null {
  const mission = getActiveMission()
  const velocity = getVectorAtTime(mission, mission.launchTime + day * DAY_MS, [4, 5, 6])
  return velocity ? magnitude(velocity) : null
}

export interface MissionHistoryPoint { timestamp: number; value: number }
export interface MissionProfiles {
  velocity: MissionHistoryPoint[]
  distance: MissionHistoryPoint[]
  lunarDistance: MissionHistoryPoint[]
  coverageStartDay: number
  coverageEndDay: number
  coverageDurationHours: number
  medianSourceStepMinutes: number
  sampleCount: number
  maximumEarthDistanceKm: { value: number; timestamp: number }
  maximumSpeedKmS: { value: number; timestamp: number }
  minimumMoonCenterDistanceKm: { value: number; timestamp: number } | null
}

export function buildMissionProfiles(missionId: string): MissionProfiles {
  const config = getMissionTrajectory(missionId)
  if (!config) throw new Error(`No source ephemeris is available for mission ${missionId}`)
  const count = Math.min(200, config.samples.length)
  const velocity: MissionHistoryPoint[] = []
  const distance: MissionHistoryPoint[] = []
  const lunarDistance: MissionHistoryPoint[] = []
  for (let index = 0; index < count; index++) {
    const sampleIndex = Math.round((index / Math.max(1, count - 1)) * (config.samples.length - 1))
    const sample = config.samples[sampleIndex]
    const state = getMissionEphemerisAtTime(missionId, sample[0])
    if (!state) continue
    velocity.push({ timestamp: sample[0], value: state.velocity })
    distance.push({ timestamp: sample[0], value: state.distanceFromEarth })
    if (state.distanceFromMoon !== null) lunarDistance.push({ timestamp: sample[0], value: state.distanceFromMoon })
  }
  const maximumEarthDistance = config.samples.reduce((best, sample) => {
    const value = Math.hypot(sample[1], sample[2], sample[3])
    return value > best.value ? { value, timestamp: sample[0] } : best
  }, { value: -Infinity, timestamp: config.samples[0][0] })
  const maximumSpeed = config.samples.reduce((best, sample) => {
    const value = Math.hypot(sample[4], sample[5], sample[6])
    return value > best.value ? { value, timestamp: sample[0] } : best
  }, { value: -Infinity, timestamp: config.samples[0][0] })
  let minimumMoonCenterDistance: { value: number; timestamp: number } | null = null
  for (const sample of config.samples) {
    const state = getMissionEphemerisAtTime(missionId, sample[0])
    if (state?.distanceFromMoon !== null && state?.distanceFromMoon !== undefined && (!minimumMoonCenterDistance || state.distanceFromMoon < minimumMoonCenterDistance.value)) {
      minimumMoonCenterDistance = { value: state.distanceFromMoon, timestamp: sample[0] }
    }
  }
  const gaps = config.samples.slice(1).map((sample, index) => sample[0] - config.samples[index][0]).sort((a, b) => a - b)
  const medianSourceStepMinutes = gaps.length ? gaps[Math.floor(gaps.length / 2)] / 60_000 : 0
  return {
    velocity, distance, lunarDistance,
    coverageStartDay: config.trajStartDay,
    coverageEndDay: config.trajEndDay,
    coverageDurationHours: (config.samples[config.samples.length - 1][0] - config.samples[0][0]) / 3_600_000,
    medianSourceStepMinutes,
    sampleCount: config.samples.length,
    maximumEarthDistanceKm: maximumEarthDistance,
    maximumSpeedKmS: maximumSpeed,
    minimumMoonCenterDistanceKm: minimumMoonCenterDistance,
  }
}

export function buildVelocityProfile(): MissionHistoryPoint[] { return buildMissionProfiles(getActiveMission().id).velocity }
export function buildDistanceProfile(): MissionHistoryPoint[] { return buildMissionProfiles(getActiveMission().id).distance }

export let fullTrajPts = buildTrajectoryCurve()
export let moonArcPts = buildMoonArc()
export let lunarOrbitPts = buildLunarOrbitCircle()
