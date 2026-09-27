import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strFromU8, unzipSync } from 'fflate'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDirectory = join(root, 'data', 'sources')
const NASA_ARCHIVES = [
  {
    missionId: 'artemis-i',
    file: 'nasa-artemis-i-ephemeris.zip',
    page: 'https://www.nasa.gov/missions/artemis/orion/track-nasas-artemis-i-mission-in-real-time/',
    innerName: 'Post_TLI_Orion_AsFlown_20221213_EPH_OEM.asc',
    output: 'artemis-i-moon-horizons.json',
  },
  {
    missionId: 'artemis-ii',
    file: 'nasa-artemis-ii-ephemerides.zip',
    page: 'https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/',
    innerName: 'Artemis_II_OEM_2026_04_10_Post-ICPS-Sep-to-EI.zip/Artemis_II_OEM_2026_04_10_Post-ICPS-Sep-to-EI.asc',
    output: 'artemis-ii-moon-horizons.json',
  },
]

function sha256(data: Uint8Array): string { return createHash('sha256').update(data).digest('hex') }

function sourceOem(archive: Uint8Array, entryPath: string): string {
  const outer = unzipSync(archive)
  if (entryPath.includes('.zip/')) {
    const [nestedName, innerPath] = entryPath.split(/\/(.*)/s, 2)
    const nestedZip = outer[nestedName]
    if (!nestedZip || !innerPath) throw new Error(`The expected nested NASA OEM archive was not found: ${nestedName}`)
    const nested = unzipSync(nestedZip)
    const content = nested[innerPath]
    if (!content) throw new Error(`The expected OEM source was not found: ${innerPath}`)
    return strFromU8(content)
  }
  const content = outer[entryPath]
  if (!content) throw new Error(`The expected NASA OEM source was not found: ${entryPath}`)
  return strFromU8(content)
}

function oemMetadata(source: string): Record<string, string> {
  const metadata: Record<string, string> = {}
  for (const line of source.split(/\r?\n/)) {
    if (line.trim() === 'META_STOP') break
    const match = line.match(/^([A-Z_]+)\s*=\s*(.*?)\s*$/)
    if (match) metadata[match[1]] = match[2]
  }
  for (const field of ['CREATION_DATE', 'OBJECT_NAME', 'OBJECT_ID', 'CENTER_NAME', 'REF_FRAME', 'TIME_SYSTEM', 'USEABLE_START_TIME', 'USEABLE_STOP_TIME']) {
    if (!metadata[field]) throw new Error(`NASA OEM is missing required header field ${field}.`)
  }
  if (metadata.CENTER_NAME !== 'EARTH' || metadata.REF_FRAME !== 'EME2000' || metadata.TIME_SYSTEM !== 'UTC') {
    throw new Error('NASA OEM center, frame, or time system differs from the parser contract.')
  }
  return metadata
}

async function fetchMoonVectors(missionId: string, startTime: string, stopTime: string): Promise<{ retrievedAt: string; response: unknown; request: Record<string, string> }> {
  const request = {
    format: 'json', COMMAND: "'301'", EPHEM_TYPE: "'VECTORS'", CENTER: "'500@399'",
    START_TIME: `'${startTime}'`, STOP_TIME: `'${stopTime}'`, STEP_SIZE: "'4 min'",
    OUT_UNITS: "'KM-S'", VEC_TABLE: "'2'", REF_PLANE: "'FRAME'", REF_SYSTEM: "'J2000'",
    TIME_TYPE: "'UT'", CSV_FORMAT: "'YES'",
  }
  const query = new URLSearchParams(request)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 90_000)
  try {
    const result = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${query}`, { signal: controller.signal })
    if (!result.ok) throw new Error(`JPL Horizons returned HTTP ${result.status} for ${missionId} lunar vectors.`)
    const response = await result.json() as unknown
    if (!response || typeof response !== 'object' || typeof (response as { result?: unknown }).result !== 'string') throw new Error(`JPL Horizons returned an unrecognized response for ${missionId}.`)
    return { retrievedAt: new Date().toISOString(), response, request }
  } finally { clearTimeout(timer) }
}

async function main(): Promise<void> {
  const records = []
  for (const source of NASA_ARCHIVES) {
    const archive = new Uint8Array(await readFile(join(sourceDirectory, source.file)))
    const sourceText = sourceOem(archive, source.innerName)
    const metadata = oemMetadata(sourceText)
    const moon = await fetchMoonVectors(source.missionId, metadata.USEABLE_START_TIME, metadata.USEABLE_STOP_TIME)
    const moonRaw = new TextEncoder().encode(JSON.stringify(moon.response, null, 2) + '\n')
    await writeFile(join(sourceDirectory, source.output), moonRaw)
    records.push({
      missionId: source.missionId,
      NASA: { page: source.page, archive: source.file, archiveSha256: sha256(archive), entry: source.innerName, entrySha256: sha256(new TextEncoder().encode(sourceText)), header: metadata },
      JPLHorizonsMoon: { url: 'https://ssd-api.jpl.nasa.gov/doc/horizons.html', retrievedAt: moon.retrievedAt, rawResponse: source.output, rawResponseSha256: sha256(moonRaw), request: moon.request },
    })
    console.log(`Fetched and recorded the JPL lunar vectors for ${source.missionId}.`)
  }
  await mkdir(sourceDirectory, { recursive: true })
  await writeFile(join(sourceDirectory, 'ephemeris-manifest.json'), `${JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), records }, null, 2)}\n`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Ephemeris source retrieval failed.')
  process.exitCode = 1
})
