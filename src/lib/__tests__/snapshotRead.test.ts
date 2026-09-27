import { strict as assert } from 'node:assert'
import test from 'node:test'
import { readDsnSnapshot, readTrajectorySnapshot, readWeatherSnapshot } from '../api'

const timestamp = '2026-09-26T10:00:00.000Z'
const provenance = { mode: 'observed', provider: 'test', retrievedAt: timestamp, observedAt: timestamp, summary: 'fixture' }

test('versioned trajectory snapshots validate metrics and cannot cross mission IDs', () => {
  const trajectory = { timestamp, missionId: 'artemis-ii', distanceFromEarth: 7000, distanceFromMoon: null, velocity: 2, acceleration: 0, altitude: 629, commsDelay: 0.02, latitude: null, longitude: null, phase: 'Replay', source: 'Fixture', provenance }
  assert.equal(readTrajectorySnapshot({ schemaVersion: 1, generatedAt: timestamp, data: trajectory }, 'artemis-ii')?.provenance?.mode, 'snapshot')
  assert.equal(readTrajectorySnapshot({ schemaVersion: 2, data: trajectory }, 'artemis-ii'), null)
  assert.equal(readTrajectorySnapshot(trajectory, 'artemis-i'), null)
  assert.equal(readTrajectorySnapshot({ ...trajectory, velocity: Number.NaN }, 'artemis-ii'), null)
})

test('weather snapshots preserve partial nulls and reject string metrics', () => {
  const weather = { timestamp, source: 'NOAA', kpIndex: 2, kpCategory: 'Quiet', solarWindSpeed: 400, solarWindDensity: null, imfBz: -1, imfBt: null }
  assert.equal(readWeatherSnapshot({ schemaVersion: 1, generatedAt: timestamp, data: weather })?.solarWindDensity, null)
  assert.equal(readWeatherSnapshot({ schemaVersion: 9, data: weather }), null)
  assert.equal(readWeatherSnapshot({ ...weather, kpIndex: '2' }), null)
})

test('DSN snapshots reject malformed dish coordinates and retain valid empty feed records', () => {
  const empty = { dishes: [], timestamp, source: 'NASA DSN Now' }
  assert.equal(readDsnSnapshot(empty)?.dishes.length, 0)
  assert.equal(readDsnSnapshot({ ...empty, dishes: [{ name: 'DSS', site: 'Earth', azimuth: '0', elevation: 5, targets: [] }] }), null)
})
