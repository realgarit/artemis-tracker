import { getMissionTrajectory, getMissionEphemerisAtTime } from '../data/trajectoryData'
import { SOURCE_URLS } from './provenance'

export const EXPORT_ROW_LIMIT = 2000
export const SAFE_EXPORT_INTERVAL_MINUTES = [0, 60, 360, 720, 1440]

export interface MissionExportRow {
  missionId: string
  timestamp: string
  timeScale: string
  units: { distance: 'km'; velocity: 'km/s'; acceleration: 'km/s²'; lightTime: 's' }
  distanceFromEarthCenterKm: number | null
  altitudeAboveEarthRadiusKm: number | null
  distanceFromMoonCenterKm: number | null
  velocityKmPerSecond: number | null
  accelerationKmPerSecondSquared: number | null
  oneWayLightTimeSeconds: number | null
  quality: 'source epoch' | 'interpolated state vectors' | 'outside coverage or data gap'
  lunarQuality: 'source epoch' | 'interpolated JPL ephemeris' | 'unavailable'
  stateVectorSource: string
  moonEphemerisSource: string
  targetObjectId: string
  earthCenter: string
  referenceFrame: string
  sourceChecksum: string
  datasetVersion: number
}

export function buildMissionExportRows(options: {
  missionId: string
  start: string
  end: string
  intervalMinutes: number
}): MissionExportRow[] {
  const start = Date.parse(options.start)
  const end = Date.parse(options.end)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) throw new Error('Choose a valid UTC start and end time in chronological order.')
  if (!SAFE_EXPORT_INTERVAL_MINUTES.includes(options.intervalMinutes)) throw new Error('Select a supported sampling interval.')
  const config = getMissionTrajectory(options.missionId)
  if (!config) throw new Error('This mission has no compatible flight ephemeris to export.')

  const times = options.intervalMinutes === 0
    ? config.samples.map((sample) => sample[0]).filter((timestamp) => timestamp >= start && timestamp <= end)
    : (() => {
      const selected: number[] = []
      const step = options.intervalMinutes * 60_000
      for (let timestamp = start; timestamp <= end; timestamp += step) selected.push(timestamp)
      if (selected[selected.length - 1] !== end) selected.push(end)
      return selected
    })()
  if (times.length > EXPORT_ROW_LIMIT) throw new Error(`This range contains ${times.length.toLocaleString()} sample times, above the ${EXPORT_ROW_LIMIT.toLocaleString()} row limit. Choose a larger sampling interval.`)

  const source = config.provenance
  const nasaObjectId = source.targetId || options.missionId
  const moonSource = 'JPL Horizons Moon ephemeris (object 301; 500@399)'
  return times.map((timestamp) => {
    const state = getMissionEphemerisAtTime(options.missionId, timestamp)
    return {
      missionId: options.missionId,
      timestamp: new Date(timestamp).toISOString(),
      timeScale: source.timeScale || 'UTC',
      units: { distance: 'km', velocity: 'km/s', acceleration: 'km/s²', lightTime: 's' },
      distanceFromEarthCenterKm: state?.distanceFromEarth ?? null,
      altitudeAboveEarthRadiusKm: state?.altitude ?? null,
      distanceFromMoonCenterKm: state?.distanceFromMoon ?? null,
      velocityKmPerSecond: state?.velocity ?? null,
      accelerationKmPerSecondSquared: state?.acceleration ?? null,
      oneWayLightTimeSeconds: state?.commsDelay ?? null,
      quality: state?.stateQuality || 'outside coverage or data gap',
      lunarQuality: state?.lunarQuality || 'unavailable',
      stateVectorSource: source.provider,
      moonEphemerisSource: moonSource,
      targetObjectId: nasaObjectId,
      earthCenter: source.center || 'Earth',
      referenceFrame: source.frame || 'Unknown',
      sourceChecksum: source.checksum || 'Unknown',
      datasetVersion: 1,
    }
  })
}

function csvCell(value: string | number | null): string {
  const raw = value === null ? '' : String(value)
  const safe = /^[=+@\t\r]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replace(/"/g, '""')}"`
}

export function missionRowsToCsv(rows: MissionExportRow[]): string {
  const header: (keyof MissionExportRow)[] = [
    'missionId', 'timestamp', 'timeScale', 'units', 'distanceFromEarthCenterKm', 'altitudeAboveEarthRadiusKm',
    'distanceFromMoonCenterKm', 'velocityKmPerSecond', 'accelerationKmPerSecondSquared', 'oneWayLightTimeSeconds', 'quality', 'lunarQuality',
    'stateVectorSource', 'moonEphemerisSource', 'targetObjectId', 'earthCenter', 'referenceFrame', 'sourceChecksum', 'datasetVersion',
  ]
  return [header.map((cell) => csvCell(cell)).join(','), ...rows.map((row) => header.map((key) => csvCell(typeof row[key] === 'object' && row[key] !== null ? JSON.stringify(row[key]) : row[key] as string | number | null)).join(','))].join('\r\n') + '\r\n'
}

export function missionRowsToJson(rows: MissionExportRow[]): string {
  return `${JSON.stringify({
    schemaVersion: 2,
    sourceDocumentation: [SOURCE_URLS.horizons],
    note: 'Rows contain source epochs or explicitly labeled interpolation. Acceleration is the finite-difference magnitude of the NASA velocity vector across covered OEM epochs. Outside-coverage and data-gap samples are null; no extrapolation is performed.',
    missionId: rows[0]?.missionId || null,
    rows,
  }, null, 2)}\n`
}
