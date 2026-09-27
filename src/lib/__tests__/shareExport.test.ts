import { strict as assert } from 'node:assert'
import test from 'node:test'
import { getMissionTrajectory } from '../../data/trajectoryData'
import { buildMissionExportRows, EXPORT_ROW_LIMIT, missionRowsToCsv, missionRowsToJson } from '../shareExport'
import { loadEphemerisFixture } from './ephemerisFixture'

await loadEphemerisFixture()

const artemisI = getMissionTrajectory('artemis-i')!

test('profile export samples recorded vectors and includes frame, time scale, source, and units', () => {
  const first = artemisI.samples[0][0]
  const rows = buildMissionExportRows({ missionId: 'artemis-i', start: new Date(first).toISOString(), end: new Date(first + 60 * 60_000).toISOString(), intervalMinutes: 60 })
  assert.equal(rows.length, 2)
  assert.equal(rows[0].timestamp, new Date(first).toISOString())
  assert.equal(rows[0].quality, 'source epoch')
  assert.equal(rows[0].units.distance, 'km')
  assert.equal(rows[0].units.acceleration, 'km/s²')
  assert.equal(typeof rows[0].accelerationKmPerSecondSquared, 'number')
  assert.equal(rows[0].referenceFrame, 'EME2000')
  assert.equal(rows[0].timeScale, 'UTC')
  assert.equal(rows[0].stateVectorSource, 'NASA/JSC flight ephemeris + JPL Horizons Moon ephemeris')
  assert.equal(rows[0].targetObjectId, '23')
})

test('source gaps stay null and malformed ranges are rejected', () => {
  const rows = buildMissionExportRows({ missionId: 'artemis-ii', start: '2026-04-01T22:35:12Z', end: '2026-04-01T23:35:12Z', intervalMinutes: 60 })
  assert.ok(rows.every((row) => row.distanceFromEarthCenterKm === null && row.velocityKmPerSecond === null && row.accelerationKmPerSecondSquared === null && row.quality === 'outside coverage or data gap'))
  assert.throws(() => buildMissionExportRows({ missionId: 'artemis-i', start: 'bad', end: '2026-01-01T02:00:00Z', intervalMinutes: 60 }), /valid UTC start and end/)
  assert.throws(() => buildMissionExportRows({ missionId: 'artemis-i', start: '2026-01-01T00:00:00Z', end: '2026-01-01T02:00:00Z', intervalMinutes: 25 }), /supported sampling interval/)
})

test('source-frequency exports have a documented hard row limit, and CSV protects formula cells', () => {
  assert.throws(() => buildMissionExportRows({ missionId: 'artemis-i', start: new Date(artemisI.samples[0][0]).toISOString(), end: new Date(artemisI.samples[artemisI.samples.length - 1][0]).toISOString(), intervalMinutes: 0 }), /row limit/)
  const rows = buildMissionExportRows({ missionId: 'artemis-i', start: new Date(artemisI.samples[0][0]).toISOString(), end: new Date(artemisI.samples[0][0]).toISOString(), intervalMinutes: 60 })
  const malicious = { ...rows[0], stateVectorSource: '=HYPERLINK("x")' }
  assert.match(missionRowsToCsv([malicious]), /"'=HYPERLINK\(""x""\)"/)
  assert.equal(JSON.parse(missionRowsToJson(rows)).schemaVersion, 2)
  assert.equal(EXPORT_ROW_LIMIT, 2000)
})
