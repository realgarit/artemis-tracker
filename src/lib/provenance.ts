export type DataMode = 'observed' | 'ephemeris' | 'replay' | 'illustrative' | 'snapshot' | 'unavailable'

export interface DataProvenance {
  mode: DataMode
  provider: string
  url?: string
  observedAt?: string
  retrievedAt: string
  generatedAt?: string
  summary: string
  frame?: string
  timeScale?: string
  units?: string
  maxAgeSeconds?: number
  targetId?: string
  target?: string
  center?: string
  checksum?: string
  sampling?: string
}

export const SOURCE_URLS = {
  nasaArtemis: 'https://www.nasa.gov/missions/artemis/',
  nasaArtemisI: 'https://www.nasa.gov/reference/artemis-i-mission-timeline/',
  nasaArtemisII: 'https://www.nasa.gov/mission/artemis-ii/',
  nasaArtemisIII: 'https://www.nasa.gov/mission/artemis-iii/',
  nasaArtemisIV: 'https://www.nasa.gov/mission/artemis-iv/',
  horizons: 'https://ssd-api.jpl.nasa.gov/doc/horizons.html',
  noaa: 'https://www.swpc.noaa.gov/products/real-time-solar-wind',
  dsn: 'https://eyes.nasa.gov/dsn/dsn.html',
} as const

export function provenanceLabel(provenance: DataProvenance, now = Date.now()): string {
  const mode = {
    observed: 'Observed',
    ephemeris: 'JPL ephemeris',
    replay: 'Historical replay',
    illustrative: 'Illustrative model',
    snapshot: 'Cached snapshot',
    unavailable: 'Unavailable',
  }[provenance.mode]
  const timestamp = provenance.observedAt || provenance.generatedAt || provenance.retrievedAt
  if (provenance.mode === 'illustrative' || provenance.mode === 'replay') {
    return `${mode} · ${provenance.provider} · ${provenance.summary}`
  }
  if (!timestamp) return `${mode} · ${provenance.provider} · ${provenance.summary}`
  const observed = Date.parse(timestamp)
  if (!Number.isFinite(observed)) return `${mode} · ${provenance.summary}`
  const difference = now - observed
  if (difference < -300_000) return `Clock mismatch · ${provenance.provider} · source time is ${Math.ceil(Math.abs(difference) / 60_000)} min ahead · ${provenance.summary}`
  const elapsed = Math.max(0, difference)
  const age = elapsed < 60_000
    ? 'under 1 min old'
    : elapsed < 3_600_000
      ? `${Math.floor(elapsed / 60_000)} min old`
      : elapsed < 86_400_000
        ? `${Math.floor(elapsed / 3_600_000)} hr old`
        : `${Math.floor(elapsed / 86_400_000)} days old`
  const stale = provenance.maxAgeSeconds !== undefined && elapsed > provenance.maxAgeSeconds * 1000
  const ageLabel = provenance.observedAt || provenance.generatedAt ? age : `retrieved ${age}`
  return `${stale ? `Stale ${mode.toLowerCase()}` : mode} · ${provenance.provider} · ${ageLabel} · ${provenance.summary}`
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function hasValidProvenance(value: unknown): value is DataProvenance {
  if (!value || typeof value !== 'object') return false
  const provenance = value as Partial<DataProvenance>
  return typeof provenance.mode === 'string'
    && ['observed', 'ephemeris', 'replay', 'illustrative', 'snapshot', 'unavailable'].includes(provenance.mode)
    && typeof provenance.provider === 'string'
    && typeof provenance.retrievedAt === 'string'
    && Number.isFinite(Date.parse(provenance.retrievedAt))
    && typeof provenance.summary === 'string'
}

export function createProvenance(
  mode: DataMode,
  provider: string,
  summary: string,
  options: Partial<Omit<DataProvenance, 'mode' | 'provider' | 'summary' | 'retrievedAt'>> & { retrievedAt?: string } = {},
): DataProvenance {
  return { mode, provider, summary, retrievedAt: options.retrievedAt || new Date().toISOString(), ...options }
}
