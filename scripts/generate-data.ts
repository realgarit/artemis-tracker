import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'
import { MISSIONS } from '../src/data/missionData.ts'
import { assertValidMissionCatalog } from '../src/data/validateMissionCatalog.ts'
import { createMissionCalendar } from '../src/lib/calendar.ts'
import { NOAA_ENDPOINTS, parseSpaceWeatherFeeds } from '../src/lib/spaceWeather.ts'
import { fetchDSN } from '../src/lib/dsn.ts'
import { createProvenance, SOURCE_URLS } from '../src/lib/provenance.ts'
import { EMPTY_DSN } from '../src/data/fallbackData.ts'
import type { DSNData, SpaceWeatherData, TrajectoryData } from '../src/lib/types.ts'

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDirectory = join(repositoryRoot, 'public', 'data')
const calendarDirectory = join(repositoryRoot, 'public', 'calendar')
const SNAPSHOT_SCHEMA_VERSION = 1

interface SnapshotEnvelope<T> { schemaVersion: number; generatedAt: string; data: T }
export type FailureCategory = 'no-observation' | 'timeout' | 'http' | 'network' | 'parse' | 'invalid-data' | 'invalid-previous-data' | 'other'
interface FeedStatus { id: string; source: string; status: 'fresh' | 'preserved' | 'unavailable' | 'not-applicable'; observationAt: string | null; ageSeconds: number | null; failureCategory: FailureCategory | null; message: string }

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function isFiniteValue(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) }
function validInstant(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }

export function validateSnapshot(id: string, value: unknown): boolean {
  if (id === 'trajectory-artemis-ii.json') {
    if (value === null) return true
    if (!isRecord(value)) return false
    return validInstant(value.timestamp)
      && isFiniteValue(value.distanceFromEarth)
      && (value.distanceFromMoon === null || isFiniteValue(value.distanceFromMoon))
      && isFiniteValue(value.velocity) && isFiniteValue(value.acceleration)
      && (value.altitude === null || isFiniteValue(value.altitude))
      && (value.commsDelay === null || isFiniteValue(value.commsDelay))
      && (value.latitude === null || isFiniteValue(value.latitude))
      && (value.longitude === null || isFiniteValue(value.longitude))
      && typeof value.phase === 'string'
  }
  if (id === 'spaceweather.json') {
    if (!isRecord(value) || typeof value.kpCategory !== 'string' || typeof value.source !== 'string') return false
    if (!(validInstant(value.timestamp) || value.timestamp === '')) return false
    return ['kpIndex', 'solarWindSpeed', 'solarWindDensity', 'imfBz', 'imfBt'].every((key) => value[key] === null || isFiniteValue(value[key]))
  }
  if (id === 'dsn.json') {
    if (!isRecord(value) || !Array.isArray(value.dishes) || typeof value.source !== 'string' || !(validInstant(value.timestamp) || value.timestamp === '')) return false
    return value.dishes.every((dish) => isRecord(dish) && typeof dish.name === 'string' && typeof dish.site === 'string'
      && isFiniteValue(dish.azimuth) && isFiniteValue(dish.elevation) && Array.isArray(dish.targets)
      && dish.targets.every((target) => isRecord(target) && typeof target.name === 'string' && isFiniteValue(target.upSignal) && isFiniteValue(target.downSignal)))
  }
  return false
}

export function classifyRefreshFailure(error: unknown): FailureCategory {
  const message = error instanceof Error ? error.message : String(error)
  if (/\bHTTP \d{3}\b/i.test(message)) return 'http'
  if (/AbortError|TimeoutError|timed? ?out/i.test(`${message} ${error instanceof Error ? error.name : ''}`)) return 'timeout'
  if (/supported schema|valid (observation|previous snapshot)|schema/i.test(message)) return 'invalid-data'
  if (error instanceof SyntaxError) return 'parse'
  if (error instanceof TypeError) return 'network'
  return 'other'
}

export async function writeAtomic(filename: string, value: unknown, directory = dataDirectory): Promise<void> {
  const path = join(directory, filename)
  const temporary = `${path}.${randomUUID()}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporary, path)
}

export async function readPrevious<T>(filename: string, directory = dataDirectory): Promise<{ value: T; generatedAt: string | null } | null> {
  try {
    const parsed = JSON.parse(await readFile(join(directory, filename), 'utf8')) as unknown
    if (isRecord(parsed) && 'schemaVersion' in parsed) {
      if (parsed.schemaVersion !== SNAPSHOT_SCHEMA_VERSION || !('data' in parsed)) return null
      return { value: parsed.data as T, generatedAt: validInstant(parsed.generatedAt) ? parsed.generatedAt : null }
    }
    // Version 0 top-level snapshots are accepted as stale compatibility seeds.
    return { value: parsed as T, generatedAt: null }
  } catch { return null }
}

function observationsAt(value: unknown): string | null {
  if (isRecord(value)) {
    if (isRecord(value.provenance) && validInstant(value.provenance.observedAt)) return value.provenance.observedAt
    if (validInstant(value.timestamp)) return value.timestamp
  }
  return null
}

export async function refreshSnapshot<T>(
  filename: string,
  producer: () => Promise<T | null>,
  fallback: T,
  directory = dataDirectory,
): Promise<FeedStatus> {
  const previous = await readPrevious<T>(filename, directory)
  const now = new Date()
  try {
    const fresh = await producer()
    if (fresh !== null && validateSnapshot(filename, fresh)) {
      if (isRecord(fresh) && isRecord(fresh.provenance)) fresh.provenance.generatedAt = now.toISOString()
      const envelope: SnapshotEnvelope<T> = { schemaVersion: SNAPSHOT_SCHEMA_VERSION, generatedAt: now.toISOString(), data: fresh }
      await writeAtomic(filename, envelope, directory)
      return { id: filename, source: filename, status: 'fresh', observationAt: observationsAt(fresh), ageSeconds: 0, failureCategory: null, message: 'Validated feed data refreshed.' }
    }
    if (fresh !== null) throw new Error('Feed returned data that did not match the supported schema.')
    const preserved = previous?.value ?? fallback
    if (!validateSnapshot(filename, preserved)) throw new Error('No validated previous snapshot or usable fallback is available.')
    const envelope: SnapshotEnvelope<T> = { schemaVersion: SNAPSHOT_SCHEMA_VERSION, generatedAt: previous?.generatedAt || now.toISOString(), data: preserved }
    await writeAtomic(filename, envelope, directory)
    const observationAt = observationsAt(preserved)
    return { id: filename, source: filename, status: previous ? 'preserved' : 'unavailable', observationAt, ageSeconds: observationAt ? Math.max(0, Math.floor((now.getTime() - Date.parse(observationAt)) / 1000)) : null, failureCategory: 'no-observation', message: previous ? 'Feed was empty; the last valid observation was retained with its original timestamp.' : 'No valid observation exists; the bundled fallback is shown as unavailable.' }
  } catch (error) {
    const preserved = previous?.value ?? fallback
    if (!validateSnapshot(filename, preserved)) {
      return { id: filename, source: filename, status: 'unavailable', observationAt: observationsAt(fallback), ageSeconds: null, failureCategory: 'invalid-previous-data', message: 'Refresh failed and no validated snapshot is available.' }
    }
    const envelope: SnapshotEnvelope<T> = { schemaVersion: SNAPSHOT_SCHEMA_VERSION, generatedAt: previous?.generatedAt || now.toISOString(), data: preserved }
    await writeAtomic(filename, envelope, directory)
    const observationAt = observationsAt(preserved)
    const failureCategory = classifyRefreshFailure(error)
    return { id: filename, source: filename, status: previous ? 'preserved' : 'unavailable', observationAt, ageSeconds: observationAt ? Math.max(0, Math.floor((now.getTime() - Date.parse(observationAt)) / 1000)) : null, failureCategory, message: previous ? `Refresh failed; last valid observation retained (${error instanceof Error ? error.name : 'provider error'}).` : `Refresh failed; no valid observation exists (${error instanceof Error ? error.name : 'provider error'}).` }
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json() as unknown
  } finally { clearTimeout(timeout) }
}

async function fetchSpaceWeather(): Promise<SpaceWeatherData> {
  const replies = await Promise.allSettled(Object.values(NOAA_ENDPOINTS).map(fetchJson))
  const [kp, speed, wind, mag] = replies.map((reply) => reply.status === 'fulfilled' ? reply.value : [])
  const weather = parseSpaceWeatherFeeds({ kp, speed, wind, mag })
  if (![weather.kpIndex, weather.solarWindSpeed, weather.solarWindDensity, weather.imfBz, weather.imfBt].some((value) => value !== null)) {
    throw new Error('NOAA feeds contained no valid observation fields.')
  }
  return weather
}

async function writeCalendarFiles(): Promise<void> {
  await mkdir(calendarDirectory, { recursive: true })
  for (const missionId of ['artemis-iii', 'artemis-iv']) {
    const mission = MISSIONS[missionId]
    const temporary = join(calendarDirectory, `${missionId}.${randomUUID()}.tmp`)
    await writeFile(temporary, createMissionCalendar(mission), 'utf8')
    await rename(temporary, join(calendarDirectory, `${missionId}.ics`))
  }
}

async function main(): Promise<void> {
  assertValidMissionCatalog()
  await mkdir(dataDirectory, { recursive: true })
  const unavailableWeather: SpaceWeatherData = { kpIndex: null, kpCategory: 'Unavailable', solarWindSpeed: null, solarWindDensity: null, imfBz: null, imfBt: null, source: 'NOAA SWPC', timestamp: '', provenance: createProvenance('unavailable', 'NOAA SWPC', 'No valid observation is available', { url: SOURCE_URLS.noaa }) }
  const unavailableDsn: DSNData = { ...EMPTY_DSN, timestamp: '', provenance: createProvenance('unavailable', 'NASA DSN Now', 'No valid observation is available', { url: SOURCE_URLS.dsn }) }

  const results: FeedStatus[] = []
  results.push(await refreshSnapshot<SpaceWeatherData>('spaceweather.json', fetchSpaceWeather, unavailableWeather))
  results.push(await refreshSnapshot<DSNData>('dsn.json', fetchDSN, unavailableDsn))
  // This app has no active, verified mission telemetry target. Do not label an
  // old Horizons prediction as a current measurement; keep replay on its local path.
  results.push({ id: 'trajectory-artemis-ii.json', source: 'bundled trajectory replay', status: 'not-applicable', observationAt: null, ageSeconds: null, failureCategory: null, message: 'No live trajectory feed is configured for the completed mission.' })
  const manifest = { schemaVersion: SNAPSHOT_SCHEMA_VERSION, generatedAt: new Date().toISOString(), feeds: results }
  await writeAtomic('status.json', manifest)
  await writeCalendarFiles()
  if (process.env.GITHUB_STEP_SUMMARY) {
    await writeFile(process.env.GITHUB_STEP_SUMMARY, `# Data snapshot refresh\n\nGenerated: ${manifest.generatedAt}\n\n| Feed | Status | Observed at | Age (seconds) | Failure category | Status detail |\n|---|---|---|---:|---|---|\n${results.map((item) => `| ${basename(item.id)} | ${item.status} | ${item.observationAt || '—'} | ${item.ageSeconds ?? '—'} | ${item.failureCategory || '—'} | ${item.message} |`).join('\n')}\n`, 'utf8')
  }
  for (const result of results) console.log(`${result.status.toUpperCase()}: ${result.id} · ${result.message}`)
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url
if (isMain) main().catch((error) => { console.error(error instanceof Error ? error.message : 'Snapshot generation failed.'); process.exitCode = 1 })
