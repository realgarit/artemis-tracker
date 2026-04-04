import { useQuery } from '@tanstack/react-query'
import type { TrajectoryData, MissionData, SpaceWeatherData, HistoryData } from './types'

const BASE = '/api/artemis'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export function useTrajectory() {
  return useQuery<TrajectoryData>({
    queryKey: ['trajectory'],
    queryFn: () => fetchJSON(`${BASE}/trajectory`),
    refetchInterval: 5_000,
    staleTime: 4_000,
  })
}

export function useMission() {
  return useQuery<MissionData>({
    queryKey: ['mission'],
    queryFn: () => fetchJSON(`${BASE}/mission`),
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useSpaceWeather() {
  return useQuery<SpaceWeatherData>({
    queryKey: ['spaceweather'],
    queryFn: () => fetchJSON(`${BASE}/spaceweather`),
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}

export function useVelocityHistory() {
  return useQuery<HistoryData>({
    queryKey: ['velocityhistory'],
    queryFn: () => fetchJSON(`${BASE}/velocityhistory`),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useDistanceHistory() {
  return useQuery<HistoryData>({
    queryKey: ['distancehistory'],
    queryFn: () => fetchJSON(`${BASE}/distancehistory`),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
