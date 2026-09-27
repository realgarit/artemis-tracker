import { strict as assert } from 'node:assert'
import test from 'node:test'
import { MISSIONS } from '../../data/missionData'
import { createMissionCalendar } from '../calendar'

test('future mission calendar keeps a stable date-free follow-up task', () => {
  const mission = MISSIONS['artemis-iii']
  const first = createMissionCalendar(mission)
  const second = createMissionCalendar(mission)
  assert.equal(first, second)
  assert.match(first, /UID:follow-artemis-iii@artemis\.realgar\.ch/)
  assert.match(first, /SEQUENCE:0/)
  assert.match(first, /BEGIN:VTODO/)
  assert.doesNotMatch(first, /DTSTART|DUE:/)
  assert.match(first, /2027/)
})

test('calendar reschedules preserve UID while versioning the update', () => {
  const mission = { ...MISSIONS['artemis-iv'], launchWindow: 'September 2028', calendarSequence: 1 }
  const updated = createMissionCalendar(mission)
  assert.match(updated, /UID:follow-artemis-iv@artemis\.realgar\.ch/)
  assert.match(updated, /SEQUENCE:1/)
  assert.match(updated, /September 2028/)
})

test('cancelling a planned mission preserves its UID and increments the cancellation sequence', () => {
  const mission = { ...MISSIONS['artemis-iv'], status: 'cancelled' as const, calendarSequence: 2 }
  const calendar = createMissionCalendar(mission)
  assert.match(calendar, /UID:follow-artemis-iv@artemis\.realgar\.ch/)
  assert.match(calendar, /SEQUENCE:2/)
  assert.match(calendar, /STATUS:CANCELLED/)
  assert.doesNotMatch(calendar, /DTSTART|DUE:/)
})
