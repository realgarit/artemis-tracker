import { strict as assert } from 'node:assert'
import test from 'node:test'
import { effectiveMediaStatus, MEDIA_ARCHIVE, validateMediaArchive } from '../../data/mediaArchive.ts'

test('media archive has sufficient NASA records and complete rights/source/event metadata', () => {
  assert.deepEqual(validateMediaArchive(), [])
  assert.ok(MEDIA_ARCHIVE.filter((item) => item.missionId === 'artemis-i').length >= 4)
  assert.ok(MEDIA_ARCHIVE.filter((item) => item.missionId === 'artemis-ii').length >= 4)
  assert.ok(MEDIA_ARCHIVE.every((item) => item.status === 'archive' && item.eventIds.length > 0 && item.credit && item.reuseStatus && item.captionStatus))
})

test('editorial validator flags duplicate, unapproved, and cross-mission media references', () => {
  const first = MEDIA_ARCHIVE[0]
  const invalid = [{ ...first }, { ...first, url: 'https://example.com/media', eventIds: ['a2-launch'] }]
  const issues = validateMediaArchive(invalid)
  assert.ok(issues.some((issue) => issue.includes('duplicate stable media ID')))
  assert.ok(issues.some((issue) => issue.includes('approved NASA host')))
  assert.ok(issues.some((issue) => issue.includes('cross-mission')))
})

test('a live label expires without a recent time-bounded NASA confirmation', () => {
  const live = { ...MEDIA_ARCHIVE[0], status: 'live-confirmed' as const, liveConfirmedAt: '2026-09-27T10:00:00Z', liveUntil: '2026-09-27T10:30:00Z' }
  assert.equal(effectiveMediaStatus(live, Date.parse('2026-09-27T10:05:00Z')), 'live-confirmed')
  assert.equal(effectiveMediaStatus(live, Date.parse('2026-09-27T10:16:00Z')), 'unavailable')
  assert.equal(effectiveMediaStatus(live, Date.parse('2026-09-27T10:31:00Z')), 'ended')
})
