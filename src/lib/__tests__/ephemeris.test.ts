import { strict as assert } from 'node:assert'
import test from 'node:test'
import { getMissionEphemerisAtTime, getMissionTrajectory } from '../../data/trajectoryData'
import { EARTH_RADIUS_KM, MOON_RADIUS_KM } from '../../data/trajectoryData'
import { loadEphemerisFixture } from './ephemerisFixture'

await loadEphemerisFixture()

const kilometersToMiles = (kilometers: number) => kilometers / 1.609344

test('bundled flight ephemerides identify NASA target, EME2000 frame, UTC scale, and coverage', () => {
  for (const missionId of ['artemis-i', 'artemis-ii']) {
    const mission = getMissionTrajectory(missionId)
    assert.ok(mission)
    assert.equal(mission.provenance.mode, 'replay')
    assert.equal(mission.provenance.frame, 'EME2000')
    assert.equal(mission.provenance.timeScale, 'UTC')
    assert.ok(mission.samples.length > 3000)
    assert.ok(mission.trajEndDay > mission.trajStartDay)
  }
})

test('Artemis II flight vectors reproduce NASA published maximum distance and lunar closest-approach references', () => {
  const closest = getMissionEphemerisAtTime('artemis-ii', Date.parse('2026-04-06T23:00:00Z'))
  const farthest = getMissionEphemerisAtTime('artemis-ii', Date.parse('2026-04-06T23:02:00Z'))
  assert.ok(closest)
  assert.ok(farthest)
  const lunarAltitudeMiles = kilometersToMiles(closest.distanceFromMoon! - MOON_RADIUS_KM)
  const earthAltitudeMiles = kilometersToMiles(farthest.distanceFromEarth - EARTH_RADIUS_KM)
  assert.ok(Math.abs(lunarAltitudeMiles - 4067) < 2, `NASA closest-approach reference differs by ${Math.abs(lunarAltitudeMiles - 4067).toFixed(2)} miles`)
  assert.ok(Math.abs(earthAltitudeMiles - 252756) < 3, `NASA farthest-distance reference differs by ${Math.abs(earthAltitudeMiles - 252756).toFixed(2)} miles`)
})

test('Artemis I as-flown OEM reproduces NASA’s published maximum Earth distance', () => {
  const trajectory = getMissionTrajectory('artemis-i')!
  const maxEarthCenterDistance = Math.max(...trajectory.trajectory.map(([x, y, z]) => Math.hypot(x, y, z)))
  const maximumReportedAltitude = kilometersToMiles(maxEarthCenterDistance - EARTH_RADIUS_KM)
  assert.ok(Math.abs(maximumReportedAltitude - 268563) < 3, `NASA Artemis I maximum-distance reference differs by ${Math.abs(maximumReportedAltitude - 268563).toFixed(2)} miles`)
})

test('source epochs and a held-out midpoint reproduce Earth-centered distance and speed from NASA OEM vectors', () => {
  const mission = getMissionTrajectory('artemis-ii')!
  const sourceEpoch = mission.samples[1234]
  const recorded = getMissionEphemerisAtTime('artemis-ii', sourceEpoch[0])
  assert.ok(recorded)
  assert.ok(Math.abs(recorded.distanceFromEarth - Math.hypot(sourceEpoch[1], sourceEpoch[2], sourceEpoch[3])) < 0.001)
  assert.ok(Math.abs(recorded.velocity - Math.hypot(sourceEpoch[4], sourceEpoch[5], sourceEpoch[6])) < 0.00001)
  const before = mission.samples[1233]
  const after = mission.samples[1235]
  const centralSeconds = (after[0] - before[0]) / 1000
  const expectedSourceAcceleration = Math.hypot((after[4]! - before[4]!) / centralSeconds, (after[5]! - before[5]!) / centralSeconds, (after[6]! - before[6]!) / centralSeconds)
  assert.ok(recorded.acceleration !== null)
  assert.ok(Math.abs(recorded.acceleration - expectedSourceAcceleration) < 0.00001)

  const left = mission.samples[1234]
  const right = mission.samples[1235]
  const midpointEpoch = Math.floor((left[0] + right[0]) / 2)
  const midpoint = getMissionEphemerisAtTime('artemis-ii', midpointEpoch)
  assert.ok(midpoint)
  assert.equal(midpoint.stateQuality, 'interpolated state vectors')
  const expectedPosition = [1, 2, 3].map((index) => (left[index]! + right[index]!) / 2)
  const expectedVelocity = [4, 5, 6].map((index) => (left[index]! + right[index]!) / 2)
  assert.ok(Math.abs(midpoint.distanceFromEarth - Math.hypot(...expectedPosition)) < 1)
  assert.ok(Math.abs(midpoint.velocity - Math.hypot(...expectedVelocity)) < 0.01)
  const stepSeconds = (right[0] - left[0]) / 1000
  const expectedMidpointAcceleration = Math.hypot((right[4]! - left[4]!) / stepSeconds, (right[5]! - left[5]!) / stepSeconds, (right[6]! - left[6]!) / stepSeconds)
  assert.ok(midpoint.acceleration !== null)
  assert.ok(Math.abs(midpoint.acceleration - expectedMidpointAcceleration) < 0.00001)
})

test('replay does not extrapolate positions beyond source ephemeris coverage', () => {
  const mission = getMissionTrajectory('artemis-ii')!
  assert.equal(getMissionEphemerisAtTime('artemis-ii', Date.parse('2026-04-01T22:35:12Z')), null)
  assert.equal(getMissionEphemerisAtTime('artemis-ii', mission.samples[mission.samples.length - 1][0] + 31 * 60_000), null)
})
