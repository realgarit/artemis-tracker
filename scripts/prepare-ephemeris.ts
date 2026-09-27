import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseHorizonsVectors, computeTrajectoryPoints, vectorAtSortedTime } from '../src/lib/horizons.ts'
import { validateMissionCatalog } from '../src/data/validateMissionCatalog.ts'
import { MISSIONS } from '../src/data/missionData.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const directory = join(root, 'data', 'sources')
const destination = join(root, 'data', 'generated', 'missionEphemerides.generated.json')
const configs = {
  'artemis-i': { archive: 'nasa-artemis-i-ephemeris.zip', page: 'https://www.nasa.gov/missions/artemis/orion/track-nasas-artemis-i-mission-in-real-time/', oemEntry: 'Post_TLI_Orion_AsFlown_20221213_EPH_OEM.asc', moonFile: 'artemis-i-moon-horizons.json', product: 'NASA/JSC Orion EM-1 post-flight as-flown OEM' },
  'artemis-ii': { archive: 'nasa-artemis-ii-ephemerides.zip', page: 'https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/', oemEntry: 'Artemis_II_OEM_2026_04_10_Post-ICPS-Sep-to-EI.zip/Artemis_II_OEM_2026_04_10_Post-ICPS-Sep-to-EI.asc', moonFile: 'artemis-ii-moon-horizons.json', product: 'NASA/JSC Orion EM-2 flight ephemeris archive, latest pre-entry OEM' },
}

function sha256(data: string | Uint8Array): string { return createHash('sha256').update(data).digest('hex') }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }

function parseOem(source: string) {
  const metadata: Record<string, string> = {}
  const states: { timestamp: string; x: number; y: number; z: number; vx: number; vy: number; vz: number }[] = []
  for (const line of source.split(/\r?\n/)) {
    if (line.trim() === 'META_STOP') continue
    const header = line.match(/^([A-Z_]+)\s*=\s*(.*?)\s*$/)
    if (header) { metadata[header[1]] = header[2]; continue }
    const row = line.trim().match(/^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?)\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)/)
    if (!row) continue
    const [x, y, z, vx, vy, vz] = row.slice(2).map(Number)
    if ([x, y, z, vx, vy, vz].some((value) => !Number.isFinite(value))) throw new Error(`Invalid numeric OEM row for ${row[1]}.`)
    states.push({ timestamp: new Date(`${row[1]}Z`).toISOString(), x, y, z, vx, vy, vz })
  }
  if (metadata.CENTER_NAME !== 'EARTH' || metadata.REF_FRAME !== 'EME2000' || metadata.TIME_SYSTEM !== 'UTC') throw new Error('OEM coordinates do not match the documented Earth-centered EME2000/UTC contract.')
  if (!metadata.OBJECT_NAME || !metadata.OBJECT_ID || states.length < 100) throw new Error('The NASA OEM header or state-vector table is incomplete.')
  for (let index = 1; index < states.length; index++) if (Date.parse(states[index].timestamp) <= Date.parse(states[index - 1].timestamp)) throw new Error('NASA OEM epochs are duplicated or out of order.')
  return { metadata, states }
}

async function sourceText(missionId: keyof typeof configs, entryName: string): Promise<string> {
  const index = JSON.parse(await readFile(join(directory, 'ephemeris-manifest.json'), 'utf8')) as { records?: { missionId: string; NASA: { entry: string; archiveSha256: string; entrySha256: string; header: Record<string, string> }; JPLHorizonsMoon: { retrievedAt: string; rawResponse: string; rawResponseSha256: string; request: Record<string, string> } }[] }
  const record = index.records?.find((candidate) => candidate.missionId === missionId)
  if (!record || record.NASA.entry !== entryName) throw new Error(`Source manifest does not match the ${missionId} NASA OEM entry.`)
  const archive = await readFile(join(directory, configs[missionId].archive))
  if (sha256(archive) !== record.NASA.archiveSha256.toLowerCase()) throw new Error(`NASA source archive checksum changed for ${missionId}.`)
  // The OEM entry itself is separately hashed when it is first extracted by the fetch script.
  const oemText = await readOemEntryFromZip(missionId, entryName)
  if (sha256(oemText) !== record.NASA.entrySha256.toLowerCase()) throw new Error(`NASA OEM entry checksum changed for ${missionId}.`)
  return oemText
}

async function readOemEntryFromZip(missionId: keyof typeof configs, entryName: string): Promise<string> {
  const { unzipSync, strFromU8 } = await import('fflate')
  const archive = unzipSync(new Uint8Array(await readFile(join(directory, configs[missionId].archive))))
  if (!entryName.includes('.zip/')) {
    const item = archive[entryName]
    if (!item) throw new Error(`Missing NASA source archive entry: ${entryName}`)
    return strFromU8(item)
  }
  const [nestedName, innerName] = entryName.split(/\/(.*)/s, 2)
  const nestedFile = archive[nestedName]
  if (!nestedFile || !innerName) throw new Error(`Missing nested NASA OEM archive: ${nestedName}`)
  const nested = unzipSync(nestedFile)
  const item = nested[innerName]
  if (!item) throw new Error(`Missing NASA source archive entry: ${innerName}`)
  return strFromU8(item)
}

async function buildMission(missionId: keyof typeof configs) {
  const configuration = configs[missionId]
  const index = JSON.parse(await readFile(join(directory, 'ephemeris-manifest.json'), 'utf8'))
  const manifestRecord = index.records?.find((record: { missionId: string }) => record.missionId === missionId)
  if (!manifestRecord) throw new Error(`Missing source manifest record for ${missionId}.`)
  const oem = await sourceText(missionId, configuration.oemEntry)
  const { metadata, states } = parseOem(oem)
  const moonText = await readFile(join(directory, configuration.moonFile), 'utf8')
  if (sha256(`${moonText.trimEnd()}\n`) !== manifestRecord.JPLHorizonsMoon.rawResponseSha256.toLowerCase()) throw new Error(`JPL lunar-vector checksum changed for ${missionId}.`)
  const moonResponse = JSON.parse(moonText) as { result?: string; signature?: { source?: string; version?: string } }
  if (typeof moonResponse.result !== 'string' || !moonResponse.result.includes('$$SOE')) throw new Error(`The JPL moon-vector source is malformed for ${missionId}.`)
  const moonStates = parseHorizonsVectors(moonResponse.result)
  const moonStatesByTime = moonStates.sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp))
  const metrics = computeTrajectoryPoints(states, moonStates)
  const mission = MISSIONS[missionId]
  const launchTime = Date.parse(mission.launchDate)
  const rows = states.map((state) => {
    const moon = vectorAtSortedTime(moonStatesByTime, Date.parse(state.timestamp))
    return [Date.parse(state.timestamp), Number(state.x.toFixed(3)), Number(state.y.toFixed(3)), Number(state.z.toFixed(3)), Number(state.vx.toFixed(6)), Number(state.vy.toFixed(6)), Number(state.vz.toFixed(6)),
      moon ? Number(moon.x.toFixed(3)) : null, moon ? Number(moon.y.toFixed(3)) : null, moon ? Number(moon.z.toFixed(3)) : null]
  })
  return {
    schemaVersion: 1,
    missionId,
    source: {
      provider: 'NASA/JSC FOD/FDO', product: configuration.product, url: configuration.page,
      archive: configuration.archive, archiveSha256: manifestRecord.NASA.archiveSha256,
      entry: configuration.oemEntry, entrySha256: manifestRecord.NASA.entrySha256,
      retrievedAt: index.generatedAt, createdAt: metadata.CREATION_DATE,
      targetId: metadata.OBJECT_ID, target: metadata.OBJECT_NAME, center: metadata.CENTER_NAME,
      frame: metadata.REF_FRAME, timeSystem: metadata.TIME_SYSTEM, positionUnits: 'km', velocityUnits: 'km/s',
      coverageStart: metadata.USEABLE_START_TIME, coverageEnd: metadata.USEABLE_STOP_TIME,
      moonProvider: 'JPL Horizons', moonObjectId: '301', moonCenter: '500@399', moonFrame: 'J2000 FRAME', moonTimeSystem: 'UT',
      moonQuery: manifestRecord.JPLHorizonsMoon.request, moonRetrievedAt: manifestRecord.JPLHorizonsMoon.retrievedAt,
      moonResponseSha256: manifestRecord.JPLHorizonsMoon.rawResponseSha256,
      lunarDistanceMaximumInterpolationGapMinutes: 30,
    },
    // Milliseconds since the Unix epoch allow event alignment without the
    // original OEM text parser on page load. Coordinates remain full precision
    // enough for the published kilometer tolerance.
    // Each compact row is [epoch-ms, X, Y, Z, VX, VY, VZ, Moon-X, Moon-Y, Moon-Z].
    // Coordinates and velocity remain separate source measurements; derived
    // altitude, speed, distance, and light time are computed by one shared layer.
    samples: rows,
    launchTime,
  }
}

async function main() {
  const issues = validateMissionCatalog()
  if (issues.length) throw new Error(issues.map((issue) => `${issue.missionId}: ${issue.message}`).join('\n'))
  const missions = [await buildMission('artemis-i'), await buildMission('artemis-ii')]
  const outputDirectory = join(root, 'public', 'data')
  const validationDirectory = join(root, 'data', 'generated')
  await mkdir(validationDirectory, { recursive: true })
  for (const mission of missions) {
    const serialized = `${JSON.stringify({ schemaVersion: 1, missions: [mission] })}\n`
    await writeFile(join(outputDirectory, `missionEphemerides-${mission.missionId}.json`), serialized, 'utf8')
    await writeFile(join(outputDirectory, `missionEphemerides-${mission.missionId}.json.gz`), gzipSync(serialized))
  }
  await writeFile(destination, `${JSON.stringify({ schemaVersion: 1, missions }, null, 0)}\n`, 'utf8')
  console.log(`Prepared ${missions.map((mission) => `${mission.missionId} (${mission.samples.length} state vectors)`).join(', ')} from the pinned NASA/JPL source records.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : 'Ephemeris preparation failed.')
  process.exitCode = 1
})
