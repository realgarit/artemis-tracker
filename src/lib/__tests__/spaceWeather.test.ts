import { strict as assert } from 'node:assert'
import test from 'node:test'
import { parseSpaceWeatherFeeds } from '../spaceWeather'

test('space weather parser combines current NOAA feed shapes', () => {
  const result = parseSpaceWeatherFeeds({
    kp: [
      ['time_tag', 'Kp'],
      ['2026-08-21T20:45:00Z', '2.67'],
    ],
    speed: [{ time_tag: '2026-08-21T20:51:00Z', proton_speed: 499 }],
    wind: [{ time_tag: '2026-08-21T20:51:00Z', proton_speed: '499', proton_density: '4.2' }],
    mag: [{ time_tag: '2026-08-21T20:51:00Z', bt: '3.0', bz_gse: '-1.25' }],
  })

  assert.deepEqual(result, {
    kpIndex: 2.67,
    kpCategory: 'Unsettled',
    solarWindSpeed: 499,
    solarWindDensity: 4.2,
    imfBz: -1.2,
    imfBt: 3,
    source: 'NOAA SWPC',
    timestamp: '2026-08-21T20:51:00Z',
  })
})

test('space weather parser skips invalid rows and falls back to stable values', () => {
  const result = parseSpaceWeatherFeeds({
    kp: [['time_tag', 'Kp'], ['bad', 'not-a-number']],
    speed: [{ time_tag: 'bad', proton_speed: 'bad' }],
    wind: [{ time_tag: 'bad', proton_speed: 'bad', proton_density: 'bad' }],
    mag: [{ time_tag: 'bad', bt: 'bad', bz_gse: 'bad' }],
  })

  assert.equal(result.kpIndex, 0)
  assert.equal(result.kpCategory, 'Quiet')
  assert.equal(result.solarWindSpeed, 0)
  assert.equal(result.solarWindDensity, 0)
  assert.equal(result.imfBz, 0)
  assert.equal(result.imfBt, 0)
})
