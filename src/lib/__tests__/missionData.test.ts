import { strict as assert } from 'node:assert'
import test from 'node:test'
import { ARTEMIS_II, getMissionStatus } from '../../data/missionData'

test('mission status is deterministic for a completed Artemis II mission', () => {
  const status = getMissionStatus(ARTEMIS_II, new Date('2026-08-21T12:00:00Z'))

  assert.equal(status.name, 'Artemis II')
  assert.equal(status.currentPhase, 'Recovery')
  assert.equal(status.missionDay, 10)
  assert.equal(status.progress, 100)
  assert.equal(status.crew.length, 4)
  assert.equal(status.nextMilestone.name, 'Splashdown')
  assert.ok(status.phases.every((phase) => phase.status === 'completed'))
})

test('mission status marks a phase active before splashdown', () => {
  const status = getMissionStatus(ARTEMIS_II, new Date('2026-04-06T12:00:00Z'))

  assert.equal(status.currentPhase, 'Trans-Lunar')
  assert.equal(status.missionDay, 4.6)
  assert.ok(status.progress > 40 && status.progress < 60)
  assert.equal(status.nextMilestone.name, 'Lunar Close Approach')
})
