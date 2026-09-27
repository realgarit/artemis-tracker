import type { DSNData, SpaceWeatherData } from '../lib/types'
import { createProvenance, SOURCE_URLS } from '../lib/provenance'

export const ARTEMIS_I_WEATHER: SpaceWeatherData = {
  kpIndex: 2,
  kpCategory: 'Quiet',
  solarWindSpeed: 410,
  solarWindDensity: 4.2,
  imfBz: -1.1,
  imfBt: 5.3,
  source: 'Illustrative Earth space-weather context',
  timestamp: '2022-11-21T12:00:00Z',
  provenance: createProvenance('illustrative', 'Bundled example values', 'Illustrative context; not a timestamp-matched Artemis I observation', {
    url: SOURCE_URLS.noaa,
    generatedAt: '2022-11-21T12:00:00Z',
    retrievedAt: '2022-11-21T12:00:00Z',
  }),
}

export const EMPTY_DSN: DSNData = {
  dishes: [],
  timestamp: '',
  source: 'NASA DSN Now (unavailable)',
  provenance: createProvenance('unavailable', 'NASA DSN Now', 'No current tracking data is available', { url: SOURCE_URLS.dsn }),
}
