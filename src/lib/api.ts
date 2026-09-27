import { useQuery } from '@tanstack/react-query'
import { getMission, getMissionStatus } from '../data/missionData'
import { EMPTY_DSN } from '../data/fallbackData'
import { getTrajectoryFallback } from './trajectoryFallback'
import { fetchCurrentTrajectory, toTrajectoryData } from './horizons'
import { fetchSpaceWeather } from './spaceWeather'
import { fetchDSN } from './dsn'
import { createProvenance, isFiniteNumber, SOURCE_URLS } from './provenance'
import { installMissionEphemerides } from '../data/trajectoryData'
import type { DSNData, MissionData, SpaceWeatherData, TrajectoryData } from './types'

async function fetchJSON<T>(url: string, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`)
    return await response.json() as T
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function useFlightEphemeris(missionIds: string[] = ['artemis-i', 'artemis-ii']) {
  const ids = [...new Set(missionIds)].sort()
  return useQuery({
    queryKey: ['flight-ephemerides', 1, ...ids],
    queryFn: async () => {
      for (const missionId of ids) {
        const bundle = await fetchFlightBundle(missionId)
        installMissionEphemerides(bundle, missionId)
      }
      return true
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export async function decodeFlightBundleResponse(response: Response): Promise<unknown> {
  if (response.headers.get('content-encoding')?.toLowerCase().includes('gzip')) return await response.json() as unknown
  if (typeof DecompressionStream === 'undefined' || !response.body) return await response.json() as unknown
  const decoded = response.body.pipeThrough(new DecompressionStream('gzip'))
  return JSON.parse(await new Response(decoded).text()) as unknown
}

async function fetchFlightBundle(missionId: string): Promise<unknown> {
  try {
    const compressed = await fetch(`/data/missionEphemerides-${missionId}.json.gz`)
    if (compressed.ok && compressed.body) return await decodeFlightBundleResponse(compressed)
  } catch {
    // Use the uncompressed copy for hosts that mishandle .gz content types or
    // browsers without a gzip decompression stream.
  }
  return fetchJSON<unknown>(`/data/missionEphemerides-${missionId}.json`)
}

function validInstant(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value)
}

function snapshotData(value: unknown): unknown | null {
  if (!isRecord(value) || !('schemaVersion' in value)) return value
  if (value.schemaVersion !== 1 || !('data' in value) || !validInstant(value.generatedAt)) return null
  return value.data
}

export function readTrajectorySnapshot(value: unknown, missionId: string): TrajectoryData | null {
  value = snapshotData(value)
  if (value === null) return null
  if (!isRecord(value)
    || !validInstant(value.timestamp)
    || !isFiniteNumber(value.distanceFromEarth)
    || !isNullableNumber(value.distanceFromMoon)
    || !isFiniteNumber(value.velocity)
    || !isFiniteNumber(value.acceleration)
    || !isNullableNumber(value.altitude)
    || !isNullableNumber(value.commsDelay)
    || !isNullableNumber(value.latitude)
    || !isNullableNumber(value.longitude)
    || typeof value.phase !== 'string'
    || (typeof value.missionId === 'string' && value.missionId !== missionId)) return null
  return {
    ...value as unknown as TrajectoryData,
    missionId,
    provenance: createProvenance('snapshot', 'JPL Horizons snapshot', 'Last published ephemeris sample; observation time is preserved', {
      url: SOURCE_URLS.horizons,
      observedAt: value.timestamp,
      generatedAt: isRecord(value.provenance) && validInstant(value.provenance.generatedAt) ? value.provenance.generatedAt : undefined,
      frame: 'Earth-centered J2000 inertial',
      timeScale: 'UT',
      units: 'km, km/s',
    }),
  }
}

export function readWeatherSnapshot(value: unknown): SpaceWeatherData | null {
  value = snapshotData(value)
  if (value === null) return null
  if (!isRecord(value) || !validInstant(value.timestamp) || typeof value.source !== 'string') return null
  const keys = ['kpIndex', 'solarWindSpeed', 'solarWindDensity', 'imfBz', 'imfBt'] as const
  if (keys.some((key) => !isNullableNumber(value[key])) || typeof value.kpCategory !== 'string') return null
  const snapshotTime = value.timestamp
  if (value.fieldTimestamps !== undefined) {
    if (!isRecord(value.fieldTimestamps) || Object.values(value.fieldTimestamps).some((time) => time !== null && !validInstant(time))) return null
  }
  return {
    ...value as unknown as SpaceWeatherData,
    fieldTimestamps: (value.fieldTimestamps as SpaceWeatherData['fieldTimestamps']) || Object.fromEntries(keys.map((key) => [key, snapshotTime])),
    provenance: createProvenance('snapshot', 'NOAA SWPC snapshot', 'Last published Earth observation; not mission telemetry', {
      url: SOURCE_URLS.noaa,
      observedAt: snapshotTime,
      maxAgeSeconds: 4 * 60 * 60,
      generatedAt: isRecord(value.provenance) && validInstant(value.provenance.generatedAt) ? value.provenance.generatedAt : undefined,
    }),
  }
}

export function readDsnSnapshot(value: unknown): DSNData | null {
  const envelopeGeneratedAt = isRecord(value) && validInstant(value.generatedAt) ? value.generatedAt : undefined
  value = snapshotData(value)
  if (value === null) return null
  if (!isRecord(value) || !Array.isArray(value.dishes) || !validInstant(value.timestamp) || typeof value.source !== 'string') return null
  const validDishes = value.dishes.every((dish) => isRecord(dish)
    && typeof dish.name === 'string'
    && typeof dish.site === 'string'
    && isFiniteNumber(dish.azimuth)
    && isFiniteNumber(dish.elevation)
    && Array.isArray(dish.targets)
    && dish.targets.every((target) => isRecord(target)
      && typeof target.name === 'string'
      && isFiniteNumber(target.upSignal)
      && isFiniteNumber(target.downSignal)))
  if (!validDishes) return null
  const oldProvenance = isRecord(value.provenance) ? value.provenance : null
  const retrievedAt = oldProvenance && validInstant(oldProvenance.retrievedAt)
    ? oldProvenance.retrievedAt
    : envelopeGeneratedAt || value.timestamp
  return {
    ...value as unknown as DSNData,
    provenance: createProvenance('snapshot', 'NASA DSN Now snapshot', 'Last published Earth network response; per-dish observation times are absent, so age reflects the saved response time', {
      url: SOURCE_URLS.dsn,
      retrievedAt,
      generatedAt: envelopeGeneratedAt || (oldProvenance && validInstant(oldProvenance.generatedAt) ? oldProvenance.generatedAt : undefined),
      maxAgeSeconds: 15 * 60,
    }),
  }
}

async function fetchTrajectoryData(missionId: string): Promise<TrajectoryData> {
  const config = getMission(missionId)
  if (!config || !config.splashdownDate || config.status !== 'completed') throw new Error(`Unknown flown mission: ${missionId}`)
  const fallback = getTrajectoryFallback(config.id)

  // Horizons has no current ephemeris after splashdown. Avoid a predictable
  // failed request for completed missions and use the optional Pages snapshot.
  if (Date.now() < Date.parse(config.splashdownDate) && config.horizonsId) {
    try {
      const point = await fetchCurrentTrajectory(config.horizonsId)
      if (point) return toTrajectoryData(point, `JPL Horizons (SPKID ${config.horizonsId} - ${config.spacecraft})`)
    } catch {
      // Snapshot and deterministic replay are the normal offline paths.
    }
  }

  try {
    const snapshot = readTrajectorySnapshot(await fetchJSON<unknown>(`/data/trajectory-${config.id}.json`), config.id)
    if (snapshot) return snapshot
  } catch {
    // The app must remain useful when Pages has no fresh snapshot.
  }

  return fallback
}

async function fetchSpaceWeatherData(): Promise<SpaceWeatherData> {
  try {
    return await fetchSpaceWeather()
  } catch {
    try {
      const snapshot = readWeatherSnapshot(await fetchJSON<unknown>('/data/spaceweather.json'))
      if (snapshot) return snapshot
    } catch {
      // Fall through to a structured unavailable state.
    }
    return { kpIndex: null, kpCategory: 'Unavailable', solarWindSpeed: null, solarWindDensity: null, imfBz: null, imfBt: null, source: 'NOAA SWPC', timestamp: '', provenance: createProvenance('unavailable', 'NOAA SWPC', 'The live feed and published snapshot are unavailable', { url: SOURCE_URLS.noaa }) }
  }
}

async function fetchDSNData(): Promise<DSNData> {
  try {
    return await fetchDSN()
  } catch {
    try {
      const snapshot = readDsnSnapshot(await fetchJSON<unknown>('/data/dsn.json'))
      if (snapshot) return snapshot
    } catch {
      // Fall through to a structured unavailable state.
    }
    return { ...EMPTY_DSN, provenance: createProvenance('unavailable', 'NASA DSN Now', 'The live feed and published snapshot are unavailable', { url: SOURCE_URLS.dsn }) }
  }
}

export function useTrajectory(missionId: string) {
  return useQuery<TrajectoryData>({
    queryKey: ['trajectory', missionId],
    queryFn: () => fetchTrajectoryData(missionId),
    retry: false,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useMission(missionId: string) {
  const config = getMission(missionId)
  return useQuery<MissionData>({
    queryKey: ['mission', missionId],
    queryFn: () => {
      if (!config || config.status !== 'completed') throw new Error(`Mission timeline not yet available: ${missionId}`)
      return getMissionStatus(config)
    },
    enabled: Boolean(config && config.status === 'completed'),
    refetchInterval: 300_000,
    staleTime: 60_000,
  })
}

export function useSpaceWeather() {
  return useQuery<SpaceWeatherData>({
    queryKey: ['spaceweather'],
    queryFn: fetchSpaceWeatherData,
    retry: false,
    refetchInterval: 300_000,
    staleTime: 120_000,
  })
}

export function useDSN() {
  return useQuery<DSNData>({
    queryKey: ['dsn'],
    queryFn: fetchDSNData,
    retry: false,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
