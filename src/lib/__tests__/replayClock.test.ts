import { strict as assert } from 'node:assert'
import test from 'node:test'
import { advanceMissionDay, advanceMissionEpoch } from '../replayClock.ts'

test('2D replay clock uses elapsed fake-clock time and preserves the epoch when playback speed changes', () => {
  const launch = Date.parse('2026-04-01T22:35:12Z')
  const end = launch + 10 * 86_400_000
  const afterSlowStep = advanceMissionEpoch(launch, 250, 1, launch, end)
  assert.equal(afterSlowStep, launch + 250)
  // Changing the multiplier changes only the next elapsed-time step.
  assert.equal(afterSlowStep, launch + 250)
  assert.equal(advanceMissionEpoch(afterSlowStep, 250, 60, launch, end), launch + 15_250)
  // Hidden-tab suspension sets the speed to zero, so elapsed wall time cannot jump the replay.
  assert.equal(advanceMissionEpoch(afterSlowStep, 60_000, 0, launch, end), afterSlowStep)
  assert.equal(advanceMissionEpoch(end - 100, 250, 60, launch, end), end)
})

test('3D replay day uses frame delta, pauses deterministically, and clamps to mission bounds', () => {
  const day = 3.25
  const next = advanceMissionDay(day, 0.5, 60, 10)
  assert.ok(Math.abs(next - (day + 30 / 86_400)) < 1e-12)
  assert.equal(advanceMissionDay(next, 3_600, 0, 10), next)
  assert.equal(advanceMissionDay(9.99, 3, 600, 10), 10)
  assert.equal(advanceMissionDay(0.01, 1, -1, 10), 0.01)
})
