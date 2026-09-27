import type { SpaceWeatherData } from './types'
import { createProvenance, hasValidProvenance, SOURCE_URLS } from './provenance'

export const NOAA_ENDPOINTS = {
  kp: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
  speed: 'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json',
  wind: 'https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json',
  mag: 'https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json',
} as const

export interface SpaceWeatherFeeds {
  kp: unknown
  speed: unknown
  wind: unknown
  mag: unknown
}

const ZERO_WEATHER: SpaceWeatherData = {
  kpIndex: null,
  kpCategory: 'Unavailable',
  solarWindSpeed: null,
  solarWindDensity: null,
  imfBz: null,
  imfBt: null,
  source: 'NOAA SWPC',
  timestamp: '',
}

function asRows(feed: unknown): unknown[] {
  return Array.isArray(feed) ? feed : []
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || value.trim() === '') return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function asTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null
  return Number.isNaN(new Date(value).getTime()) ? null : value
}

function objectValue(row: Record<string, unknown>, names: string[]): unknown {
  for (const name of names) {
    if (row[name] !== undefined) return row[name]
  }
  return undefined
}

function arrayRows(feed: unknown): unknown[][] {
  return asRows(feed).filter((row): row is unknown[] => Array.isArray(row))
}

function headerIndex(feed: unknown, names: string[]): number {
  const header = arrayRows(feed)[0]
  if (!header) return -1
  return header.findIndex((value) => typeof value === 'string' && names.includes(value.toLowerCase()))
}

function latestKp(feed: unknown): { value: number; timestamp: string } | null {
  const rows = asRows(feed)
  const kpIndex = headerIndex(feed, ['kp', 'kp_index', 'k-index'])
  const timeIndex = headerIndex(feed, ['time_tag', 'time'])
  for (let index = rows.length - 1; index >= 0; index--) {
    const row = rows[index]
    const value = Array.isArray(row)
      ? asNumber(row[kpIndex >= 0 ? kpIndex : 1])
      : typeof row === 'object' && row !== null
        ? asNumber(objectValue(row as Record<string, unknown>, ['Kp', 'kp', 'kp_index']))
        : null
    if (value === null) continue
    const timestamp = Array.isArray(row)
      ? asTimestamp(row[timeIndex >= 0 ? timeIndex : 0])
      : typeof row === 'object' && row !== null
        ? asTimestamp(objectValue(row as Record<string, unknown>, ['time_tag', 'time']))
        : null
    return { value, timestamp: timestamp || '' }
  }
  return null
}

function latestObjectRow(feed: unknown, valueNames: string[]): { value: number; timestamp: string } | null {
  const rows = asRows(feed)
  for (let index = rows.length - 1; index >= 0; index--) {
    const row = rows[index]
    if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
      const value = asNumber(objectValue(row as Record<string, unknown>, valueNames))
      if (value !== null) {
        const timestamp = asTimestamp(objectValue(row as Record<string, unknown>, ['time_tag', 'time', 'timestamp']))
        return { value, timestamp: timestamp || '' }
      }
    }
  }
  return null
}

function latestArrayRow(feed: unknown, valueNames: string[], fallbackIndex: number): { value: number; timestamp: string } | null {
  const rows = arrayRows(feed)
  const valueIndex = headerIndex(feed, valueNames)
  const timeIndex = headerIndex(feed, ['time_tag', 'time', 'timestamp'])
  for (let index = rows.length - 1; index >= 1; index--) {
    const row = rows[index]
    const value = asNumber(row[valueIndex >= 0 ? valueIndex : fallbackIndex])
    if (value !== null) {
      const timestamp = asTimestamp(row[timeIndex >= 0 ? timeIndex : 0])
      return { value, timestamp: timestamp || '' }
    }
  }
  return null
}

function latestValue(feed: unknown, objectNames: string[], arrayIndex: number): { value: number; timestamp: string } | null {
  return latestObjectRow(feed, objectNames) || latestArrayRow(feed, objectNames.map((name) => name.toLowerCase()), arrayIndex)
}

export function getKpCategory(kp: number): string {
  if (kp < 2) return 'Quiet'
  if (kp < 4) return 'Unsettled'
  if (kp < 5) return 'Active'
  if (kp < 6) return 'Minor Storm'
  if (kp < 7) return 'Moderate Storm'
  if (kp < 8) return 'Strong Storm'
  if (kp < 9) return 'Severe Storm'
  return 'Extreme Storm'
}

export function parseSpaceWeatherFeeds(feeds: SpaceWeatherFeeds, fallback: SpaceWeatherData = ZERO_WEATHER): SpaceWeatherData {
  const kp = latestKp(feeds.kp)
  const speed = latestValue(feeds.speed, ['proton_speed', 'speed'], 2)
  const windSpeed = latestValue(feeds.wind, ['proton_speed', 'speed'], 2)
  const density = latestValue(feeds.wind, ['proton_density', 'density'], 1)
  const bt = latestValue(feeds.mag, ['bt', 'imf_bt', 'total_field'], 6)
  const bz = latestValue(feeds.mag, ['bz_gsm', 'bz_gse', 'bz', 'imf_bz'], 3)
  const fieldTimestamps = {
    kpIndex: kp?.timestamp || null,
    solarWindSpeed: (windSpeed || speed)?.timestamp || null,
    solarWindDensity: density?.timestamp || null,
    imfBz: bz?.timestamp || null,
    imfBt: bt?.timestamp || null,
  }
  const timestamps = Object.values(fieldTimestamps)
    .filter((value): value is string => Boolean(value))
    .sort()
  const timestamp = timestamps[0] || fallback.timestamp

  const kpIndex = kp?.value ?? fallback.kpIndex
  const anyCurrentValue = Boolean(kp || speed || windSpeed || density || bt || bz)
  return {
    kpIndex: kpIndex === null ? null : Math.round(kpIndex * 100) / 100,
    kpCategory: kpIndex === null ? 'Unavailable' : getKpCategory(kpIndex),
    solarWindSpeed: (windSpeed?.value ?? speed?.value ?? fallback.solarWindSpeed) === null ? null : Math.round((windSpeed?.value ?? speed?.value ?? fallback.solarWindSpeed)! * 10) / 10,
    solarWindDensity: density?.value === null || density?.value === undefined ? fallback.solarWindDensity : Math.round(density.value * 10) / 10,
    imfBz: bz?.value === null || bz?.value === undefined ? fallback.imfBz : Math.round(bz.value * 10) / 10,
    imfBt: bt?.value === null || bt?.value === undefined ? fallback.imfBt : Math.round(bt.value * 10) / 10,
    source: fallback.source || 'NOAA SWPC',
    timestamp,
    fieldTimestamps,
    provenance: anyCurrentValue
      ? createProvenance('observed', 'NOAA SWPC', 'Current Earth space-weather feeds; not mission telemetry', {
        url: SOURCE_URLS.noaa,
        observedAt: timestamp || undefined,
        maxAgeSeconds: 4 * 60 * 60,
      })
      : hasValidProvenance(fallback.provenance)
        ? fallback.provenance
        : createProvenance('unavailable', 'NOAA SWPC', 'No valid observations are available', { url: SOURCE_URLS.noaa }),
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 15_000): Promise<Response> {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`NOAA API error: ${response.status}`)
    return response
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

async function fetchFeed(url: string): Promise<unknown> {
  return (await fetchWithTimeout(url)).json()
}

export async function fetchSpaceWeather(fallback?: SpaceWeatherData): Promise<SpaceWeatherData> {
  const entries = await Promise.allSettled(Object.values(NOAA_ENDPOINTS).map(fetchFeed))
  const [kp, speed, wind, mag] = entries.map((entry) => entry.status === 'fulfilled' ? entry.value : [])
  const result = parseSpaceWeatherFeeds({ kp, speed, wind, mag }, fallback)
  const hasFeedValue = [latestKp(kp), latestValue(speed, ['proton_speed', 'speed'], 2), latestValue(wind, ['proton_speed', 'speed'], 2), latestValue(wind, ['proton_density', 'density'], 1), latestValue(mag, ['bt', 'imf_bt', 'total_field'], 6), latestValue(mag, ['bz_gsm', 'bz_gse', 'bz', 'imf_bz'], 3)].some(Boolean)
  if (!hasFeedValue && !fallback) throw new Error('NOAA feeds did not contain usable data')
  return result
}
