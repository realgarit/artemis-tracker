import { useQuery } from '@tanstack/react-query'
import { getMission, getMissionStatus } from '../data/missionData'
import { ARTEMIS_I_WEATHER, EMPTY_DSN } from '../data/fallbackData'
import { getTrajectoryFallback } from './trajectoryFallback'
import { fetchCurrentTrajectory, toTrajectoryData } from './horizons'
import { fetchSpaceWeather } from './spaceWeather'
import { fetchDSN } from './dsn'
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

async function fetchTrajectoryData(missionId: string): Promise<TrajectoryData> {
  const config = getMission(missionId)
  const fallback = getTrajectoryFallback(config.id)

  // Horizons has no current ephemeris after splashdown. Avoid a predictable
  // failed request for completed missions and use the optional Pages snapshot.
  if (Date.now() < new Date(config.splashdownDate).getTime()) {
    try {
      const point = await fetchCurrentTrajectory(config.horizonsId)
      if (point) return toTrajectoryData(point, `JPL Horizons (SPKID ${config.horizonsId} - ${config.spacecraft})`)
    } catch {
      // Snapshot and deterministic replay are the normal offline paths.
    }
  }

  try {
    const snapshot = await fetchJSON<TrajectoryData>(`/data/trajectory-${config.id}.json`)
    if (snapshot && typeof snapshot === 'object' && typeof snapshot.timestamp === 'string') return snapshot
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
      return await fetchJSON<SpaceWeatherData>('/data/spaceweather.json')
    } catch {
      return ARTEMIS_I_WEATHER
    }
  }
}

async function fetchDSNData(): Promise<DSNData> {
  try {
    return await fetchDSN()
  } catch {
    try {
      return await fetchJSON<DSNData>('/data/dsn.json')
    } catch {
      return EMPTY_DSN
    }
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
  return useQuery<MissionData>({
    queryKey: ['mission', missionId],
    queryFn: () => getMissionStatus(getMission(missionId)),
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
