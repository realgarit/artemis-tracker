import type { DSNData, SpaceWeatherData } from '../lib/types'

export const ARTEMIS_I_WEATHER: SpaceWeatherData = {
  kpIndex: 2,
  kpCategory: 'Quiet',
  solarWindSpeed: 410,
  solarWindDensity: 4.2,
  imfBz: -1.1,
  imfBt: 5.3,
  source: 'NOAA SWPC (historical archive)',
  timestamp: '2022-11-21T12:00:00Z',
}

export const EMPTY_DSN: DSNData = {
  dishes: [],
  timestamp: '',
  source: 'NASA DSN Now (unavailable)',
}
