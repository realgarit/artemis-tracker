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

  assert.equal(result.kpIndex, 2.67)
  assert.equal(result.kpCategory, 'Unsettled')
  assert.equal(result.solarWindSpeed, 499)
  assert.equal(result.solarWindDensity, 4.2)
  assert.equal(result.imfBz, -1.2)
  assert.equal(result.imfBt, 3)
  assert.equal(result.timestamp, '2026-08-21T20:45:00Z')
  assert.equal(result.fieldTimestamps?.solarWindSpeed, '2026-08-21T20:51:00Z')
  assert.equal(result.provenance?.mode, 'observed')
})

test('space weather parser skips invalid rows and falls back to stable values', () => {
  const result = parseSpaceWeatherFeeds({
    kp: [['time_tag', 'Kp'], ['bad', 'not-a-number']],
    speed: [{ time_tag: 'bad', proton_speed: 'bad' }],
    wind: [{ time_tag: 'bad', proton_speed: 'bad', proton_density: 'bad' }],
    mag: [{ time_tag: 'bad', bt: 'bad', bz_gse: 'bad' }],
  })

  assert.equal(result.kpIndex, null)
  assert.equal(result.kpCategory, 'Unavailable')
  assert.equal(result.solarWindSpeed, null)
  assert.equal(result.solarWindDensity, null)
  assert.equal(result.imfBz, null)
  assert.equal(result.imfBt, null)
  assert.equal(result.provenance?.mode, 'unavailable')
})
