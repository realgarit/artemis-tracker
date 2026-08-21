import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchCurrentTrajectory, toTrajectoryData } from '../src/lib/horizons.ts'
import { NOAA_ENDPOINTS, parseSpaceWeatherFeeds } from '../src/lib/spaceWeather.ts'
import { fetchDSN } from '../src/lib/dsn.ts'
import { ARTEMIS_I_WEATHER, EMPTY_DSN } from '../src/data/fallbackData.ts'
import type { DSNData, SpaceWeatherData, TrajectoryData } from '../src/lib/types.ts'

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDirectory = join(repositoryRoot, 'public', 'data')

const trajectorySeed: TrajectoryData | null = null
const snapshotWeatherSeed: SpaceWeatherData = { ...ARTEMIS_I_WEATHER, source: 'NOAA SWPC' }

async function fetchWithTimeout(url: string, timeoutMs = 15_000): Promise<Response> {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`Upstream request failed: ${response.status}`)
    return response
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

async function fetchJson(url: string): Promise<unknown> {
  return (await fetchWithTimeout(url)).json()
}

async function readSnapshot<T>(filename: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(join(dataDirectory, filename), 'utf8')) as T
  } catch {
    return undefined
  }
}

async function writeSnapshot(filename: string, value: unknown): Promise<void> {
  await writeFile(join(dataDirectory, filename), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function refreshSnapshot<T>(filename: string, seed: T, producer: () => Promise<T | null>): Promise<void> {
  const previous = await readSnapshot<T>(filename)
  try {
    const fresh = await producer()
    const value = fresh === null ? (previous ?? seed) : fresh
    await writeSnapshot(filename, value)
    console.log(`Snapshot refreshed: ${filename}`)
  } catch (error) {
    const value = previous ?? seed
    await writeSnapshot(filename, value)
    console.warn(`Snapshot preserved for ${filename}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function fetchSpaceWeatherSnapshot(): Promise<SpaceWeatherData> {
  const responses = await Promise.allSettled(Object.values(NOAA_ENDPOINTS).map(fetchJson))
  if (!responses.some((response) => response.status === 'fulfilled')) {
    throw new Error('No NOAA feed was reachable')
  }
  const [kp, speed, wind, mag] = responses.map((response) => response.status === 'fulfilled' ? response.value : [])
  return parseSpaceWeatherFeeds({ kp, speed, wind, mag }, snapshotWeatherSeed)
}

async function main(): Promise<void> {
  await mkdir(dataDirectory, { recursive: true })

  await refreshSnapshot<SpaceWeatherData>('spaceweather.json', snapshotWeatherSeed, fetchSpaceWeatherSnapshot)
  await refreshSnapshot<DSNData>('dsn.json', EMPTY_DSN, fetchDSN)
  await refreshSnapshot<TrajectoryData | null>('trajectory-artemis-ii.json', trajectorySeed, async () => {
    const point = await fetchCurrentTrajectory('-1024')
    return point ? toTrajectoryData(point, 'JPL Horizons (scheduled snapshot)') : null
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
