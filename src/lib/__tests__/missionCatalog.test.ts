import { strict as assert } from 'node:assert'
import test from 'node:test'
import { MISSIONS, getMission } from '../../data/missionData'
import { MISSION_EVENTS } from '../../data/missionEvents'
import { validateMissionCatalog } from '../../data/validateMissionCatalog'
import { buildMissionProfiles } from '../../data/trajectoryData'
import { loadEphemerisFixture } from './ephemerisFixture'

await loadEphemerisFixture()

test('catalog has valid route IDs and known mission lifecycle entries', () => {
  assert.deepEqual(validateMissionCatalog(), [])
  assert.equal(getMission('artemis-ii')?.status, 'completed')
  assert.equal(getMission('artemis-iii')?.status, 'planned')
  assert.equal(getMission('unknown'), null)
  assert.equal(MISSIONS['artemis-iii'].launchDate, '')
  assert.equal(MISSIONS['artemis-iii'].crew.length, 4)
})

test('catalog validator catches duplicate IDs, invalid phase order, and missing sources', () => {
  const malformed = { ...MISSIONS['artemis-i'], id: 'artemis-i', sourceUrl: 'javascript:alert(1)', phases: [
    { name: 'Later', startTime: '2022-11-17T00:00:00Z', endTime: '2022-11-18T00:00:00Z' },
    { name: 'Earlier', startTime: '2022-11-16T00:00:00Z', endTime: '2022-11-17T01:00:00Z' },
  ] }
  const issues = validateMissionCatalog([MISSIONS['artemis-i'], malformed])
  assert.ok(issues.some((issue) => issue.message.includes('duplicated')))
  assert.ok(issues.some((issue) => issue.message.includes('HTTPS')))
  assert.ok(issues.some((issue) => issue.message.includes('overlaps or is out of order')))
})

test('guided events have unique, dated source links for both flown missions', () => {
  assert.equal(new Set(MISSION_EVENTS.map((event) => event.id)).size, MISSION_EVENTS.length)
  for (const missionId of ['artemis-i', 'artemis-ii']) {
    const events = MISSION_EVENTS.filter((event) => event.missionId === missionId)
    assert.ok(events.length >= 6)
    assert.ok(events.every((event) => event.sourceUrl.startsWith('https://') && Number.isFinite(Date.parse(event.occurredAt))))
  }
})

test('mission profiles can be compared without changing global mission selection', () => {
  const first = buildMissionProfiles('artemis-i')
  const second = buildMissionProfiles('artemis-i')
  assert.deepEqual(first, second)
  assert.notEqual(first.velocity[0].timestamp, buildMissionProfiles('artemis-ii').velocity[0].timestamp)
  assert.ok(first.coverageEndDay > first.coverageStartDay)
})

test('content-only planned mission with no crew or ephemeris uses generic catalog routing', () => {
  const fixture = {
    id: 'artemis-v', name: 'Artemis V', spacecraft: 'Orion', status: 'planned' as const,
    launchDate: '', splashdownDate: '', totalDays: 0, crew: [], phases: [], milestones: [],
    objective: 'A new catalog-only fixture.', sourceUrl: 'https://www.nasa.gov/missions/artemis/',
    launchWindow: 'TBD', verifiedAt: '2026-09-26', calendarSequence: 0,
  }
  try {
    MISSIONS[fixture.id] = fixture
    assert.equal(getMission(fixture.id), fixture)
    assert.equal(validateMissionCatalog().some((issue) => issue.missionId === fixture.id), false)
  } finally {
    delete MISSIONS[fixture.id]
  }
})
