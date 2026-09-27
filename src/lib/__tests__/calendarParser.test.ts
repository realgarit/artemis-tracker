import { strict as assert } from 'node:assert'
import test from 'node:test'
import ICAL from 'ical.js'
import { MISSIONS } from '../../data/missionData.ts'
import { createMissionCalendar } from '../calendar.ts'

function parseTodo(text: string) {
  const calendar = new ICAL.Component(ICAL.parse(text))
  const task = calendar.getFirstSubcomponent('vtodo')
  assert.ok(task)
  return task
}

test('generated follow-up feed parses as RFC 5545 with stable identity and no invented event time', () => {
  const task = parseTodo(createMissionCalendar(MISSIONS['artemis-iii']))
  assert.equal(task.getFirstPropertyValue('uid'), 'follow-artemis-iii@artemis.realgar.ch')
  assert.equal(task.getFirstPropertyValue('sequence'), 0)
  assert.equal(task.getFirstPropertyValue('status'), 'NEEDS-ACTION')
  assert.equal(task.getFirstPropertyValue('url'), MISSIONS['artemis-iii'].sourceUrl)
  assert.match(String(task.getFirstPropertyValue('summary')), /Check the Artemis III schedule/)
  assert.match(String(task.getFirstPropertyValue('description')), /No event time is confirmed/)
  const stamp = task.getFirstProperty('dtstamp')
  assert.ok(stamp)
  const stampValue = stamp.getFirstValue()
  assert.ok(stampValue instanceof ICAL.Time)
  if (stampValue instanceof ICAL.Time) assert.ok(Number.isFinite(stampValue.toJSDate().getTime()))
  assert.equal(task.getFirstProperty('dtstart'), null)
  assert.equal(task.getFirstProperty('due'), null)
})

test('calendar rescheduling and cancellation parse with stable UID and increasing sequence', () => {
  const rescheduled = { ...MISSIONS['artemis-iv'], launchWindow: 'September 2028', calendarSequence: 1 }
  const cancelled = { ...rescheduled, status: 'cancelled' as const, calendarSequence: 2 }
  const task1 = parseTodo(createMissionCalendar(rescheduled))
  const task2 = parseTodo(createMissionCalendar(cancelled))
  assert.equal(task1.getFirstPropertyValue('uid'), task2.getFirstPropertyValue('uid'))
  assert.equal(task1.getFirstPropertyValue('sequence'), 1)
  assert.equal(task2.getFirstPropertyValue('sequence'), 2)
  assert.equal(task2.getFirstPropertyValue('status'), 'CANCELLED')
  assert.equal(task2.getFirstProperty('dtstart'), null)
})
